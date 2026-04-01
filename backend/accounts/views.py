from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.serializers import (
    DemoGoogleLoginSerializer,
    EmailLoginSerializer,
    PhoneOtpSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


def build_auth_payload(user):
    refresh = RefreshToken.for_user(user)
    refresh["name"] = user.name
    refresh["role"] = user.role
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user).data,
    }


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(id=response.data["id"])
        return Response(build_auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(build_auth_payload(serializer.validated_data["user"]))


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = DemoGoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user, created = User.objects.get_or_create(
            email=data["email"],
            defaults={
                "name": data["name"],
                "role": data["role"],
                "auth_provider": User.AuthProvider.GOOGLE,
                "password": "",
            },
        )
        if created:
            user.set_unusable_password()
            user.save(update_fields=["password"])
        return Response(build_auth_payload(user))


class PhoneOtpView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PhoneOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if not data.get("otp"):
            return Response(
                {
                    "detail": "Demo OTP sent successfully.",
                    "otp_hint": "Use 123456 to verify in local development.",
                }
            )

        if data["otp"] != "123456":
            return Response({"detail": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        phone = data["phone"]
        name = data.get("name") or f"Patient {phone[-4:]}"
        email = f"{phone}@otp.local"
        user, _ = User.objects.get_or_create(
            phone=phone,
            defaults={
                "name": name,
                "email": email,
                "role": data["role"],
                "auth_provider": User.AuthProvider.PHONE_OTP,
            },
        )
        return Response(build_auth_payload(user))


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class HealthcareTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
