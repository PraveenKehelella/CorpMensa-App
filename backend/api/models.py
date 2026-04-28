from django.db import models


class ClientRecord(models.Model):
    id = models.CharField(max_length=128, primary_key=True)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
