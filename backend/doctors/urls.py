from django.urls import path

from doctors.views import DepartmentListView, DoctorListView

urlpatterns = [
    path("departments", DepartmentListView.as_view(), name="department-list"),
    path("", DoctorListView.as_view(), name="doctor-list"),
]
