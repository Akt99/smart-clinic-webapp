from django.conf import settings
from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=32, default="plus")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class DoctorProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="doctor_profile",
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="doctors",
    )
    specialization = models.CharField(max_length=255)
    experience = models.PositiveIntegerField()
    fee = models.PositiveIntegerField()
    available_days = models.JSONField(default=list)
    slot_duration = models.PositiveIntegerField(default=30)
    bio = models.TextField(blank=True)

    class Meta:
        ordering = ["department__name", "user__name"]

    def __str__(self):
        return self.user.name
