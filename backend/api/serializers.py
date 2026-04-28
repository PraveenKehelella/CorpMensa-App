from rest_framework import serializers

from .models import ClientRecord


class ClientRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientRecord
        fields = ["id", "payload", "created_at", "updated_at"]


class VitalsExtractRequestSerializer(serializers.Serializer):
    imageBase64 = serializers.CharField()
    clientContext = serializers.JSONField(required=False)
