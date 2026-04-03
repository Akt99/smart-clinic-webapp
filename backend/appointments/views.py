from rest_framework import generics, permissions

from appointments.models import Appointment
from appointments.serializers import (
    AppointmentPaymentSerializer,
    AppointmentSerializer,
    BookAppointmentSerializer,
)
from common_permissions import IsDoctor, IsPatient


class AppointmentListView(generics.ListAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Appointment.objects.select_related(
            "patient",
            "doctor__user",
            "department",
        )
        if self.request.user.role == "DOCTOR":
            return queryset.filter(doctor__user=self.request.user)
        if self.request.user.role == "PATIENT":
            return queryset.filter(patient=self.request.user)
        return queryset


class BookAppointmentView(generics.CreateAPIView):
    serializer_class = BookAppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatient]


class AppointmentStatusUpdateView(generics.UpdateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctor]
    queryset = Appointment.objects.select_related("doctor__user")
    http_method_names = ["patch"]

    def get_queryset(self):
        return super().get_queryset().filter(doctor__user=self.request.user)

    def perform_update(self, serializer):
        serializer.save()


class AppointmentPaymentUpdateView(generics.UpdateAPIView):
    serializer_class = AppointmentPaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatient]
    queryset = Appointment.objects.select_related("patient")
    http_method_names = ["patch"]

    def get_queryset(self):
        return super().get_queryset().filter(patient=self.request.user)
