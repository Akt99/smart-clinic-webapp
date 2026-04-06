from rest_framework import serializers

from appointments.models import Appointment
from doctors.models import DoctorProfile


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.user.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    patient_name = serializers.CharField(source="patient.name", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "department",
            "department_name",
            "date",
            "time",
            "status",
            "payment_method",
            "payment_status",
            "amount_paise",
            "razorpay_order_id",
            "razorpay_payment_id",
            "reason",
            "created_at",
        ]
        read_only_fields = ["patient", "department", "created_at"]


class BookAppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "doctor", "date", "time", "reason"]

    def validate(self, attrs):
        doctor = attrs["doctor"]
        if Appointment.objects.filter(
            doctor=doctor,
            date=attrs["date"],
            time=attrs["time"],
        ).exists():
            raise serializers.ValidationError("This slot has already been booked.")
        attrs["department"] = doctor.department
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["amount_paise"] = validated_data["doctor"].fee * 100
        return Appointment.objects.create(patient=request.user, **validated_data)


class DoctorScheduleSerializer(serializers.ModelSerializer):
    booked_slots = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = ["id", "available_days", "slot_duration", "booked_slots"]

    def get_booked_slots(self, obj):
        appointments = obj.appointments.filter(status=Appointment.Status.BOOKED)
        return [
            {"date": appointment.date.isoformat(), "time": appointment.time.strftime("%H:%M")}
            for appointment in appointments
        ]


class AppointmentPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["payment_method", "payment_status"]
        read_only_fields = ["payment_status"]

    def validate_payment_method(self, value):
        if value not in {
            Appointment.PaymentMethod.PAY_NOW,
            Appointment.PaymentMethod.PAY_AT_CLINIC,
        }:
            raise serializers.ValidationError("Choose either pay now or pay at clinic.")
        return value

    def update(self, instance, validated_data):
        payment_method = validated_data["payment_method"]
        instance.payment_method = payment_method
        if payment_method == Appointment.PaymentMethod.PAY_AT_CLINIC:
            instance.payment_status = Appointment.PaymentStatus.TO_BE_PAID_AT_CLINIC
        else:
            instance.payment_status = Appointment.PaymentStatus.PENDING_ONLINE
        instance.save(update_fields=["payment_method", "payment_status"])
        return instance


class RazorpayOrderSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()


class RazorpayVerifySerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
