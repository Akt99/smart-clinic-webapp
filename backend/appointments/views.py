import base64
import hashlib
import hmac
import json
import ssl
from urllib import error, request

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from appointments.serializers import (
    AppointmentPaymentSerializer,
    AppointmentSerializer,
    BookAppointmentSerializer,
    RazorpayOrderSerializer,
    RazorpayVerifySerializer,
)
from common_permissions import IsDoctor, IsPatient

try:
    import certifi
except ImportError:
    certifi = None


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


def razorpay_request(path, payload):
    credentials = f"{settings.RAZORPAY_KEY_ID}:{settings.RAZORPAY_KEY_SECRET}".encode()
    headers = {
        "Authorization": f"Basic {base64.b64encode(credentials).decode()}",
        "Content-Type": "application/json",
    }
    req = request.Request(
        f"https://api.razorpay.com/v1/{path}",
        data=json.dumps(payload).encode(),
        headers=headers,
        method="POST",
    )
    cafile = settings.RAZORPAY_CA_BUNDLE or (certifi.where() if certifi else None)
    context = ssl.create_default_context(cafile=cafile) if cafile else ssl.create_default_context()
    with request.urlopen(req, context=context) as response:
        return json.loads(response.read().decode())


class RazorpayOrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def post(self, request):
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            return Response(
                {"detail": "Razorpay keys are not configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        serializer = RazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        appointment = Appointment.objects.select_related("doctor__user").filter(
            id=serializer.validated_data["appointment_id"],
            patient=request.user,
        ).first()
        if not appointment:
            return Response({"detail": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status != Appointment.Status.BOOKED:
            return Response(
                {"detail": "Only booked appointments can be paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_paise = appointment.amount_paise or appointment.doctor.fee * 100
        try:
          order = razorpay_request(
              "orders",
              {
                  "amount": amount_paise,
                  "currency": "INR",
                  "receipt": f"appointment_{appointment.id}",
                  "notes": {
                      "appointment_id": str(appointment.id),
                      "doctor_name": appointment.doctor.user.name,
                  },
              },
          )
        except error.HTTPError as exc:
            message = exc.read().decode() if exc.fp else "Unable to create Razorpay order."
            return Response({"detail": message}, status=status.HTTP_502_BAD_GATEWAY)
        except error.URLError as exc:
            return Response(
                {
                    "detail": (
                        "Could not reach Razorpay securely from the server. "
                        f"SSL/network error: {exc.reason}"
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        appointment.payment_method = Appointment.PaymentMethod.PAY_NOW
        appointment.payment_status = Appointment.PaymentStatus.PENDING_ONLINE
        appointment.amount_paise = amount_paise
        appointment.razorpay_order_id = order["id"]
        appointment.save(
            update_fields=["payment_method", "payment_status", "amount_paise", "razorpay_order_id"]
        )

        return Response(
            {
                "appointment_id": appointment.id,
                "key": settings.RAZORPAY_KEY_ID,
                "amount": amount_paise,
                "currency": "INR",
                "order_id": order["id"],
                "name": "Smart Clinic",
                "description": f"Appointment with {appointment.doctor.user.name}",
                "prefill": {
                    "name": request.user.name,
                    "email": request.user.email,
                    "contact": request.user.phone,
                },
            }
        )


class RazorpayVerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def post(self, request):
        serializer = RazorpayVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        appointment = Appointment.objects.filter(
            id=data["appointment_id"],
            patient=request.user,
        ).first()
        if not appointment:
            return Response({"detail": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

        if not settings.RAZORPAY_KEY_SECRET:
            return Response(
                {"detail": "Razorpay keys are not configured on the server."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if appointment.razorpay_order_id != data["razorpay_order_id"]:
            return Response({"detail": "Order mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        body = f"{appointment.razorpay_order_id}|{data['razorpay_payment_id']}".encode()
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(generated_signature, data["razorpay_signature"]):
            return Response({"detail": "Payment signature verification failed."}, status=status.HTTP_400_BAD_REQUEST)

        appointment.payment_method = Appointment.PaymentMethod.PAY_NOW
        appointment.payment_status = Appointment.PaymentStatus.PAID
        appointment.razorpay_payment_id = data["razorpay_payment_id"]
        appointment.razorpay_signature = data["razorpay_signature"]
        appointment.save(
            update_fields=[
                "payment_method",
                "payment_status",
                "razorpay_payment_id",
                "razorpay_signature",
            ]
        )

        return Response({"detail": "Payment verified successfully.", "payment_status": appointment.payment_status})
