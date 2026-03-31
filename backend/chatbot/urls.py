from django.urls import path

from chatbot.views import ComplaintListCreateView, TriageView

urlpatterns = [
    path("", TriageView.as_view(), name="chat-triage"),
    path("complaints", ComplaintListCreateView.as_view(), name="complaints"),
]
