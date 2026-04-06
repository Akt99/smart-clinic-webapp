from django.urls import path

from appointments.views import (
    AppointmentListView,
    AppointmentPaymentUpdateView,
    AppointmentStatusUpdateView,
    BookAppointmentView,
    RazorpayOrderCreateView,
    RazorpayVerifyPaymentView,
)

urlpatterns = [
    path("", AppointmentListView.as_view(), name="appointment-list"),
    path("book", BookAppointmentView.as_view(), name="appointment-book"),
    path("<int:pk>/payment", AppointmentPaymentUpdateView.as_view(), name="appointment-payment"),
    path("razorpay/order", RazorpayOrderCreateView.as_view(), name="razorpay-order"),
    path("razorpay/verify", RazorpayVerifyPaymentView.as_view(), name="razorpay-verify"),
    path("<int:pk>/status", AppointmentStatusUpdateView.as_view(), name="appointment-status"),
]
