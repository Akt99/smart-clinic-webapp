from django.urls import path

from appointments.views import (
    AppointmentListView,
    AppointmentPaymentUpdateView,
    AppointmentStatusUpdateView,
    BookAppointmentView,
)

urlpatterns = [
    path("", AppointmentListView.as_view(), name="appointment-list"),
    path("book", BookAppointmentView.as_view(), name="appointment-book"),
    path("<int:pk>/payment", AppointmentPaymentUpdateView.as_view(), name="appointment-payment"),
    path("<int:pk>/status", AppointmentStatusUpdateView.as_view(), name="appointment-status"),
]
