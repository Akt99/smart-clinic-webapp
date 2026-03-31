from rest_framework import serializers

from doctors.models import Department, DoctorProfile


class DepartmentSerializer(serializers.ModelSerializer):
    doctor_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "slug", "description", "icon", "doctor_count"]


class DoctorSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        source="department",
        queryset=Department.objects.all(),
        write_only=True,
        required=False,
    )
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            "id",
            "user_id",
            "name",
            "email",
            "department",
            "department_id",
            "specialization",
            "experience",
            "fee",
            "available_days",
            "slot_duration",
            "bio",
        ]
