from django.urls import path

from appointments.views import (
    AppointmentListView,
    AppointmentStatusUpdateView,
    BookAppointmentView,
)

urlpatterns = [
    path("", AppointmentListView.as_view(), name="appointment-list"),
    path("book", BookAppointmentView.as_view(), name="appointment-book"),
    path("<int:pk>/status", AppointmentStatusUpdateView.as_view(), name="appointment-status"),
]
