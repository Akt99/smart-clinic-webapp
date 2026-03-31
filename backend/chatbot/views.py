import os

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from chatbot.models import Complaint
from chatbot.serializers import ComplaintSerializer, TriageSerializer
from common_permissions import IsPatient
from doctors.models import Department

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


TRIAGE_RULES = [
    {
        "keywords": {"anxiety", "panic", "stress", "depression", "sleep"},
        "department": "psychiatry",
        "severity": "advanced",
        "advice": "Your symptoms align with mental wellness support. A Psychiatry consultation is recommended.",
    },
    {
        "keywords": {"pregnancy", "period", "pelvic", "gynaec", "pcos"},
        "department": "gynaecology",
        "severity": "advanced",
        "advice": "These symptoms should be assessed by Gynaecology. Please book a consultation soon.",
    },
    {
        "keywords": {"fracture", "joint", "bone", "knee", "back pain"},
        "department": "orthopaedics",
        "severity": "advanced",
        "advice": "This sounds musculoskeletal. Orthopaedics is the right department for an evaluation.",
    },
    {
        "keywords": {"vision", "eye", "blur", "red eye", "watering"},
        "department": "ophthalmology",
        "severity": "advanced",
        "advice": "An eye specialist should assess this. Ophthalmology is recommended.",
    },
]

SERIOUS_KEYWORDS = {"chest pain", "fainting", "suicidal", "severe bleeding", "stroke"}


def run_local_triage(message):
    lower = message.lower()
    if any(keyword in lower for keyword in SERIOUS_KEYWORDS):
        return {
            "severity": "doctor_referral",
            "department_slug": None,
            "reply": "This may be urgent. Please seek immediate medical care or emergency help right away.",
        }

    for rule in TRIAGE_RULES:
        if any(keyword in lower for keyword in rule["keywords"]):
            return {
                "severity": rule["severity"],
                "department_slug": rule["department"],
                "reply": rule["advice"],
            }

    return {
        "severity": "basic",
        "department_slug": None,
        "reply": "This appears to be a general query. Stay hydrated, rest, and book a consultation if symptoms continue.",
    }


def run_openai_triage(message):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        return None

    client = OpenAI(api_key=api_key)
    completion = client.responses.create(
        model=os.getenv("OPENAI_TRIAGE_MODEL", "gpt-4.1-mini"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are a healthcare triage assistant. Return JSON with keys "
                    "severity (basic|advanced|doctor_referral), department_slug "
                    "(psychiatry|gynaecology|orthopaedics|ophthalmology|null), and reply."
                ),
            },
            {"role": "user", "content": message},
        ],
    )
    text = completion.output_text.strip()
    if not text:
        return None
    return None


class ComplaintListCreateView(generics.ListCreateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatient]

    def get_queryset(self):
        return Complaint.objects.select_related("department").filter(patient=self.request.user)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user)


class TriageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TriageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data["message"]

        result = run_local_triage(message)
        department = None
        if result["department_slug"]:
            department = Department.objects.filter(slug=result["department_slug"]).first()

        return Response(
            {
                "severity": result["severity"],
                "department": department.name if department else None,
                "department_slug": result["department_slug"],
                "reply": result["reply"],
                "next_step": (
                    "Book a doctor appointment."
                    if result["severity"] in {"advanced", "doctor_referral"}
                    else "Continue self-care and monitor symptoms."
                ),
            },
            status=status.HTTP_200_OK,
        )
