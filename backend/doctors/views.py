from django.db.models import Count
from rest_framework import generics, permissions

from doctors.models import Department, DoctorProfile
from doctors.serializers import DepartmentSerializer, DoctorSerializer


class DepartmentListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        return Department.objects.annotate(doctor_count=Count("doctors"))


class DoctorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = DoctorSerializer

    def get_queryset(self):
        queryset = DoctorProfile.objects.select_related("user", "department")
        department = self.request.query_params.get("department")
        if department:
            queryset = queryset.filter(department__slug=department)
        return queryset
