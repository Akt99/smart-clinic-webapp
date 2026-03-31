from rest_framework import serializers

from chatbot.models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "patient",
            "description",
            "department",
            "department_name",
            "severity",
            "created_at",
        ]
        read_only_fields = ["patient", "created_at"]


class TriageSerializer(serializers.Serializer):
    message = serializers.CharField()
