from django.urls import path

from accounts.views import (
    GoogleLoginView,
    HealthcareTokenRefreshView,
    LoginView,
    PhoneOtpView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("google-login", GoogleLoginView.as_view(), name="google-login"),
    path("phone-otp", PhoneOtpView.as_view(), name="phone-otp"),
    path("token/refresh", HealthcareTokenRefreshView.as_view(), name="token-refresh"),
    path("me", ProfileView.as_view(), name="profile"),
]
