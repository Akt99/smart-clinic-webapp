from django.core.management.base import BaseCommand

from accounts.models import User
from doctors.models import Department, DoctorProfile


DEPARTMENTS = [
    {
        "name": "Psychiatry",
        "slug": "psychiatry",
        "icon": "brain",
        "description": "Mental wellness, stress, anxiety, and behavioral support.",
    },
    {
        "name": "Gynaecology",
        "slug": "gynaecology",
        "icon": "care",
        "description": "Women's health, hormonal care, fertility, and pregnancy support.",
    },
    {
        "name": "Orthopaedics",
        "slug": "orthopaedics",
        "icon": "bone",
        "description": "Bone, joint, muscle, and posture-related treatment.",
    },
    {
        "name": "Ophthalmology",
        "slug": "ophthalmology",
        "icon": "eye",
        "description": "Vision testing, eye irritation, and specialist eye care.",
    },
]


DOCTORS = [
    ("Dr. Sam Michael", "sam.michael@clinic.local", "psychiatry", "Clinical Psychiatry", 11, 900, ["Mon", "Wed", "Fri"]),
    ("Dr. Robin Ahmed", "robin.ahmed@clinic.local", "psychiatry", "Behavioral Health", 8, 800, ["Tue", "Thu"]),
    ("Dr. Tom Alter", "tom.alter@clinic.local", "gynaecology", "Maternal & Reproductive Care", 14, 1000, ["Mon", "Tue", "Thu"]),
    ("Dr. Vikash Parekh", "vikash.parekh@clinic.local", "gynaecology", "Women's Wellness", 10, 950, ["Wed", "Fri", "Sat"]),
    ("Dr. Ram Vilas", "ram.vilas@clinic.local", "orthopaedics", "Sports Injury & Bone Care", 12, 850, ["Mon", "Wed", "Fri"]),
    ("Dr. Amar Govind", "amar.govind@clinic.local", "orthopaedics", "Joint & Spine Care", 9, 800, ["Tue", "Thu"]),
    ("Dr. Arjun Maitra", "arjun.maitra@clinic.local", "ophthalmology", "Cataract & Vision Care", 13, 950, ["Mon", "Wed", "Sat"]),
    ("Dr. Chinmaya Bhardwaj", "chinmaya.bhardwaj@clinic.local", "ophthalmology", "General Ophthalmology", 7, 800, ["Tue", "Thu"]),
    ("Dr. Ravi Jaiswal", "ravi.jaiswal@clinic.local", "ophthalmology", "Cornea Specialist", 10, 900, ["Fri", "Sat"]),
]


class Command(BaseCommand):
    help = "Seed default healthcare departments, doctors, and demo users."

    def handle(self, *args, **options):
        departments = {}
        for department_data in DEPARTMENTS:
            department, _ = Department.objects.update_or_create(
                slug=department_data["slug"],
                defaults=department_data,
            )
            departments[department.slug] = department

        admin_user, _ = User.objects.update_or_create(
            email="admin@clinic.local",
            defaults={
                "name": "Clinic Admin",
                "role": User.Role.ADMIN,
                "phone": "9999999999",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("Admin@12345")
        admin_user.save()

        patient_user, _ = User.objects.update_or_create(
            email="patient@clinic.local",
            defaults={
                "name": "Aarav Patient",
                "role": User.Role.PATIENT,
                "phone": "9000000001",
            },
        )
        patient_user.set_password("Patient@123")
        patient_user.save()

        for name, email, department_slug, specialization, experience, fee, available_days in DOCTORS:
            user, _ = User.objects.update_or_create(
                email=email,
                defaults={
                    "name": name,
                    "role": User.Role.DOCTOR,
                    "phone": f"98{abs(hash(email)) % 10**8:08d}",
                },
            )
            user.set_password("Doctor@123")
            user.save()

            DoctorProfile.objects.update_or_create(
                user=user,
                defaults={
                    "department": departments[department_slug],
                    "specialization": specialization,
                    "experience": experience,
                    "fee": fee,
                    "available_days": available_days,
                    "slot_duration": 30,
                    "bio": f"{name} brings {experience} years of expertise in {specialization.lower()}.",
                },
            )

        self.stdout.write(self.style.SUCCESS("Seeded healthcare demo data successfully."))
