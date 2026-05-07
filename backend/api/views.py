import json
import os
import tempfile
from typing import Any

from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from openai import OpenAI
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientRecord
from .serializers import VitalsExtractRequestSerializer


def _to_client_payload(record: ClientRecord) -> dict[str, Any]:
    return record.payload


class ClientsCollectionView(APIView):
    def get(self, request):
        data = [_to_client_payload(c) for c in ClientRecord.objects.all()]
        return Response(data)

    @transaction.atomic
    def post(self, request):
        payload = request.data
        client_id = payload.get("id")
        if not client_id:
            return Response({"detail": "Client id is required."}, status=status.HTTP_400_BAD_REQUEST)
        if ClientRecord.objects.filter(id=client_id).exists():
            return Response({"detail": "Client already exists."}, status=status.HTTP_400_BAD_REQUEST)
        record = ClientRecord.objects.create(id=client_id, payload=payload)
        return Response(_to_client_payload(record), status=status.HTTP_201_CREATED)


class ClientDetailView(APIView):
    @transaction.atomic
    def patch(self, request, client_id: str):
        try:
            record = ClientRecord.objects.get(id=client_id)
        except ClientRecord.DoesNotExist:
            return Response({"detail": "Client not found."}, status=status.HTTP_404_NOT_FOUND)

        patch = request.data
        updated = {**record.payload, **patch}
        record.payload = updated
        record.save(update_fields=["payload", "updated_at"])
        return Response(_to_client_payload(record))

    @transaction.atomic
    def delete(self, request, client_id: str):
        try:
            record = ClientRecord.objects.get(id=client_id)
        except ClientRecord.DoesNotExist:
            return Response({"detail": "Client not found."}, status=status.HTTP_404_NOT_FOUND)
        record.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VitalsExtractView(APIView):
    def post(self, request):
        serializer = VitalsExtractRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_base64 = serializer.validated_data["imageBase64"].strip()
        client_context = serializer.validated_data.get("clientContext") or {}
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return Response(
                {"detail": "OPENAI_API_KEY is missing in environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "vitals_extraction",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "points": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "heartRate": {"type": ["number", "null"]},
                                        "systolic": {"type": ["number", "null"]},
                                        "diastolic": {"type": ["number", "null"]},
                                        "capturedAt": {"type": ["string", "null"]},
                                    },
                                    "required": ["heartRate", "systolic", "diastolic", "capturedAt"],
                                    "additionalProperties": False,
                                },
                            },
                            "overview": {"type": "string"},
                        },
                        "required": ["points", "overview"],
                        "additionalProperties": False,
                    },
                },
            },
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You extract all visible vitals rows from wearable screenshot images. "
                        "Return every single visible row as one object in points[]. "
                        "Each row should include numeric blood pressure and heart rate if present. "
                        "For capturedAt, convert visible date/time into ISO-8601 when possible; "
                        "otherwise return null. If a value is uncertain, use null. "
                        "Also write a personalized overview in exactly two concise sentences. "
                        "Use the provided client context and extracted values. "
                        "Sentence 1: current interpretation/progress trend. "
                        "Sentence 2: practical exercise guidance including what to prioritize and avoid for now. "
                        "Keep it brief, plain language, and non-alarmist."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Extract every visible data row from this screenshot. "
                                "For each row return heartRate, systolic, diastolic, and capturedAt. "
                                "Include all rows that are visible on screen, not just the latest one."
                            ),
                        },
                        {
                            "type": "text",
                            "text": f"Client context JSON: {json.dumps(client_context, ensure_ascii=True)}",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{image_base64}"},
                        },
                    ],
                },
            ],
        )
        content = completion.choices[0].message.content if completion.choices else None
        if not content:
            return Response(
                {"detail": "No extraction output returned."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(content if isinstance(content, dict) else json.loads(content))


@method_decorator(csrf_exempt, name="dispatch")
class OnboardingVoiceTestsView(APIView):
    """Transcribe clinician voice notes and map to oculomotor + sensory dominance fields."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        audio = request.FILES.get("audio")
        if not audio:
            return Response({"detail": "Missing audio file."}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return Response(
                {"detail": "OPENAI_API_KEY is missing in environment."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        client = OpenAI(api_key=api_key)
        suffix = ".webm"
        name = getattr(audio, "name", "") or ""
        if name.lower().endswith(".mp4"):
            suffix = ".mp4"
        elif name.lower().endswith(".wav"):
            suffix = ".wav"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            with open(tmp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="gpt-4o-transcribe",
                    file=audio_file,
                )
        except Exception:
            with open(tmp_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

        transcript_text = getattr(transcription, "text", None) or str(transcription)
        if not transcript_text.strip():
            return Response(
                {"detail": "Transcription was empty.", "transcript": ""},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY,
            )

        completion = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "onboarding_binocular_tests",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "oculomotor": {
                                "type": "object",
                                "properties": {
                                    "dominantEye": {"type": "string", "enum": ["left", "right"]},
                                    "fixationStability": {"type": "string"},
                                },
                                "required": ["dominantEye", "fixationStability"],
                                "additionalProperties": False,
                            },
                            "sensory": {
                                "type": "object",
                                "properties": {
                                    "dominantEye": {"type": "string", "enum": ["left", "right"]},
                                    "suppression": {"type": "string", "enum": ["present", "absent"]},
                                    "rivalryResponse": {
                                        "type": "string",
                                        "enum": ["stable", "alternating"],
                                    },
                                },
                                "required": ["dominantEye", "suppression", "rivalryResponse"],
                                "additionalProperties": False,
                            },
                        },
                        "required": ["oculomotor", "sensory"],
                        "additionalProperties": False,
                    },
                },
            },
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You map a clinician's spoken notes into structured binocular vision test results. "
                        "Infer oculomotor dominance (motor): dominant eye left or right, and fixation stability "
                        "as a short qualitative phrase. Infer sensory dominance: dominant eye, suppression present "
                        "or absent, rivalry response stable or alternating. If not stated, choose the most likely "
                        "from context; prefer conservative clinical wording in fixationStability."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Transcript:\n{transcript_text}",
                },
            ],
        )
        content = completion.choices[0].message.content if completion.choices else None
        if not content:
            return Response(
                {"detail": "No structured output.", "transcript": transcript_text},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        parsed = content if isinstance(content, dict) else json.loads(content)
        return Response(
            {
                "transcript": transcript_text,
                "oculomotor": parsed.get("oculomotor"),
                "sensory": parsed.get("sensory"),
            }
        )
