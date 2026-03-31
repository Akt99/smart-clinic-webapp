import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api";
import DepartmentScene from "../components/DepartmentScene";

export default function DepartmentDoctors() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [department, setDepartment] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadDepartment = async () => {
      try {
        const [profileResponse, departmentResponse, doctorResponse] = await Promise.all([
          API.get("accounts/me"),
          API.get("doctors/departments"),
          API.get(`doctors/?department=${slug}`),
        ]);

        const currentDepartment = departmentResponse.data.find((entry) => entry.slug === slug);
        if (!currentDepartment) {
          navigate("/dashboard");
          return;
        }

        setProfile(profileResponse.data);
        localStorage.setItem("user", JSON.stringify(profileResponse.data));
        setDepartment(currentDepartment);
        setDoctors(doctorResponse.data);
      } catch (error) {
        localStorage.clear();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
  }, [navigate, slug]);

  if (loading) {
    return <div className="loading-screen">Loading department specialists...</div>;
  }

  if (!department) {
    return <div className="loading-screen">Department not found.</div>;
  }

  return (
    <main className="dashboard-shell">
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />
      <div className="ambient-grid" aria-hidden="true" />

      <section className="dashboard-hero department-hero">
        <div className="department-hero-copy">
          <p className="eyebrow">Department specialists</p>
          <h1>{department.name}</h1>
          <p className="hero-copy">{department.description}</p>
          <p className="hero-copy">
            {profile?.role === "DOCTOR"
              ? "Review the specialists in this department and return to your schedule when ready."
              : "Explore the doctors in this department, then head back to the dashboard to book your slot."}
          </p>
        </div>

        <div className="department-hero-side">
          <DepartmentScene slug={department.slug} />
          <div className="hero-actions">
            <button
              className={`theme-toggle ${theme === "dark" ? "dark" : "light"}`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              type="button"
            >
              <span className="theme-track">
                <span className="theme-icon sun" aria-hidden="true">
                  <span className="sun-core" />
                </span>
                <span className="theme-thumb">
                  <span className="thumb-glow" />
                </span>
                <span className="theme-icon moon" aria-hidden="true">
                  <span className="moon-core" />
                </span>
              </span>
            </button>
            <button className="ghost-button" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </button>
          </div>
        </div>
      </section>

      <section className="panel-card department-summary">
        <div className="stats-grid detail-stats">
          <article>
            <strong>{doctors.length}</strong>
            <span>Specialists</span>
          </article>
          <article>
            <strong>{department.doctor_count}</strong>
            <span>Active profiles</span>
          </article>
          <article>
            <strong>{profile?.role || "PATIENT"}</strong>
            <span>Current access</span>
          </article>
        </div>
      </section>

      <section className="directory-grid department-directory">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="directory-card department-doctor-card">
            <p className="eyebrow">Consultant</p>
            <h3>{doctor.name}</h3>
            <p>{doctor.specialization}</p>
            <span>{doctor.experience} yrs experience</span>
            <span>Fee: ₹ {doctor.fee}</span>
            <span>Available: {doctor.available_days.join(", ")}</span>
            <p>{doctor.bio}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
