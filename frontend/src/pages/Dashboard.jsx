import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import ChatWidget from "../components/ChatWidget";
import DepartmentScene from "../components/DepartmentScene";

const INITIAL_BOOKING = {
  departmentSlug: "",
  doctorId: "",
  date: "",
  time: "",
  reason: "",
};

function buildTimes() {
  return ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00"];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [booking, setBooking] = useState(INITIAL_BOOKING);
  const [bookingMessage, setBookingMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileResponse, departmentResponse, doctorResponse, appointmentResponse] = await Promise.all([
          API.get("accounts/me"),
          API.get("doctors/departments"),
          API.get("doctors/"),
          API.get("appointments/"),
        ]);
        setProfile(profileResponse.data);
        localStorage.setItem("user", JSON.stringify(profileResponse.data));
        setDepartments(departmentResponse.data);
        setDoctors(doctorResponse.data);
        setAppointments(appointmentResponse.data);
      } catch (error) {
        localStorage.clear();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const selectedDepartmentDoctors = useMemo(() => {
    if (!booking.departmentSlug) {
      return doctors;
    }
    return doctors.filter((doctor) => doctor.department.slug === booking.departmentSlug);
  }, [booking.departmentSlug, doctors]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === String(booking.doctorId)),
    [booking.doctorId, doctors],
  );

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const createAppointment = async () => {
    if (!booking.doctorId || !booking.date || !booking.time) {
      setBookingMessage("Please choose a doctor, date, and time.");
      return;
    }

    try {
      await API.post("appointments/book", {
        doctor: booking.doctorId,
        date: booking.date,
        time: booking.time,
        reason: booking.reason,
      });
      const { data } = await API.get("appointments/");
      setAppointments(data);
      setBookingMessage("Appointment booked successfully.");
      setBooking(INITIAL_BOOKING);
    } catch (error) {
      setBookingMessage(error.response?.data?.non_field_errors?.[0] || "Booking failed.");
    }
  };

  const markAppointment = async (id, status) => {
    await API.patch(`appointments/${id}/status`, { status });
    const { data } = await API.get("appointments/");
    setAppointments(data);
  };

  if (loading || !profile) {
    return <div className="loading-screen">Loading clinic workspace...</div>;
  }

  const isPatient = profile.role === "PATIENT";
  const isDoctor = profile.role === "DOCTOR";

  return (
    <main className="dashboard-shell">
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />
      <div className="ambient-grid" aria-hidden="true" />
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Role-aware care hub</p>
          <h1>{isDoctor ? `Welcome, ${profile.name}` : "Healthcare made calm and clear."}</h1>
          <p className="hero-copy">
            {isDoctor
              ? "Review your schedule, monitor appointments, and manage patient flow across departments."
              : "Browse departments, meet specialists, reserve a time slot, and use AI triage before you book."}
          </p>
        </div>

        <div className="hero-actions">
          <button
            className={`theme-toggle ${theme === "dark" ? "dark" : "light"}`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
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
          <button className="primary-button" onClick={logout}>
            Logout
          </button>
        </div>
      </section>

      <section className="stats-grid">
        <article>
          <strong>{departments.length}</strong>
          <span>Departments</span>
        </article>
        <article>
          <strong>{doctors.length}</strong>
          <span>Doctors</span>
        </article>
        <article>
          <strong>{appointments.length}</strong>
          <span>{isDoctor ? "Managed appointments" : "My appointments"}</span>
        </article>
      </section>

      <section className="panel-section">
        <div className="section-heading">
          <h2>Our Departments</h2>
          <p>Specialist care pathways with scalable department routing.</p>
        </div>

        <div className="department-grid">
          {departments.map((department) => (
            <article
              key={department.id}
              className={`department-card ${
                booking.departmentSlug === department.slug ? "selected" : ""
              }`}
            >
              <DepartmentScene slug={department.slug} />
              <h3>{department.name}</h3>
              <p>{department.description}</p>
              <div className="meta-row">
                <span>{department.doctor_count} doctors</span>
                <button
                  className="ghost-button"
                  onClick={() => navigate(`/departments/${department.slug}`)}
                >
                  Explore
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-grid">
        {isPatient ? (
          <article className="panel-card booking-panel">
            <div className="section-heading">
              <h2>Book Slots</h2>
              <p>Select a department, doctor, date, and slot to confirm your visit.</p>
            </div>

            <div className="form-grid compact">
              <label>
                Department
                <select
                  value={booking.departmentSlug}
                  onChange={(event) =>
                    setBooking((current) => ({
                      ...current,
                      departmentSlug: event.target.value,
                      doctorId: "",
                    }))
                  }
                >
                  <option value="">Choose department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.slug}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Doctor
                <select
                  value={booking.doctorId}
                  onChange={(event) =>
                    setBooking((current) => ({ ...current, doctorId: event.target.value }))
                  }
                >
                  <option value="">Choose doctor</option>
                  {selectedDepartmentDoctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input
                  type="date"
                  value={booking.date}
                  onChange={(event) => setBooking((current) => ({ ...current, date: event.target.value }))}
                />
              </label>

              <label>
                Time
                <select
                  value={booking.time}
                  onChange={(event) => setBooking((current) => ({ ...current, time: event.target.value }))}
                >
                  <option value="">Choose slot</option>
                  {buildTimes().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Reason for visit
                <textarea
                  rows="4"
                  value={booking.reason}
                  onChange={(event) => setBooking((current) => ({ ...current, reason: event.target.value }))}
                />
              </label>
            </div>

            {selectedDoctor ? (
              <div className="doctor-spotlight">
                <h3>{selectedDoctor.name}</h3>
                <p>
                  {selectedDoctor.specialization} • {selectedDoctor.experience} years • ₹{" "}
                  {selectedDoctor.fee}
                </p>
                <p>Available: {selectedDoctor.available_days.join(", ")}</p>
              </div>
            ) : null}

            <button className="primary-button full-width" onClick={createAppointment}>
              Confirm appointment
            </button>
            {bookingMessage ? <p className="status-text">{bookingMessage}</p> : null}
          </article>
        ) : (
          <article className="panel-card booking-panel">
            <div className="section-heading">
              <h2>Doctor Workspace</h2>
              <p>Track active patient appointments and update visit progress.</p>
            </div>
            <div className="doctor-spotlight">
              <h3>{profile.name}</h3>
              <p>{appointments.length} assigned appointments</p>
              <p>Use the schedule panel to complete or cancel visits.</p>
            </div>
          </article>
        )}

        <article className="panel-card appointments-panel">
          <div className="section-heading">
            <h2>{isDoctor ? "Patient Schedule" : "My Appointments"}</h2>
            <p>{isDoctor ? "Manage live patient flow." : "Track your booked consultations."}</p>
          </div>

          <div className="appointment-list">
            {appointments.length ? (
              appointments.map((appointment) => (
                <article key={appointment.id} className="appointment-card">
                  <div>
                    <strong>{appointment.doctor_name || appointment.patient_name}</strong>
                    <p>{appointment.department_name}</p>
                    <p>
                      {appointment.date} at {appointment.time.slice(0, 5)}
                    </p>
                    <span className={`status-pill ${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </div>

                  {isDoctor && appointment.status === "BOOKED" ? (
                    <div className="inline-actions">
                      <button className="ghost-button" onClick={() => markAppointment(appointment.id, "COMPLETED")}>
                        Complete
                      </button>
                      <button className="ghost-button" onClick={() => markAppointment(appointment.id, "CANCELLED")}>
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="empty-state">No appointments yet.</p>
            )}
          </div>
        </article>
      </section>

      <ChatWidget
        onDepartmentSuggestion={(departmentSlug) =>
          setBooking((current) => ({ ...current, departmentSlug, doctorId: "" }))
        }
      />
    </main>
  );
}
