from django.conf import settings
from django.db import models

from doctors.models import Department


class Complaint(models.Model):
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints",
    )
    description = models.TextField()
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="complaints",
    )
    severity = models.CharField(max_length=20, default="basic")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.patient} - {self.department.name}"
