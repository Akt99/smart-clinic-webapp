import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const DEMO_GOOGLE = {
  name: "Mira Google",
  email: "mira.google@clinic.local",
  role: "PATIENT",
};

function saveSession(data) {
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [authTab, setAuthTab] = useState("email");
  const [form, setForm] = useState({
    name: "",
    email: "patient@clinic.local",
    phone: "9000000001",
    password: "Patient@123",
    role: "PATIENT",
    otp: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleEmailAuth = async () => {
    const endpoint = mode === "register" ? "accounts/register" : "accounts/login";
    const payload =
      mode === "register"
        ? {
            name: form.name || "New Patient",
            email: form.email,
            phone: form.phone,
            password: form.password,
            role: form.role,
            auth_provider: "EMAIL",
          }
        : { email: form.email, password: form.password };

    const { data } = await API.post(endpoint, payload);
    saveSession(data);
    navigate("/dashboard");
  };

  const handleGoogleAuth = async () => {
    const { data } = await API.post("accounts/google-login", DEMO_GOOGLE);
    saveSession(data);
    navigate("/dashboard");
  };

  const requestOtp = async () => {
    const { data } = await API.post("accounts/phone-otp", {
      phone: form.phone,
      name: form.name || "OTP Patient",
      role: form.role,
    });
    setStatus(data.otp_hint || data.detail);
  };

  const verifyOtp = async () => {
    const { data } = await API.post("accounts/phone-otp", {
      phone: form.phone,
      name: form.name || "OTP Patient",
      otp: form.otp,
      role: form.role,
    });
    saveSession(data);
    navigate("/dashboard");
  };

  const submit = async () => {
    setError("");
    setStatus("");
    try {
      if (authTab === "email") {
        await handleEmailAuth();
        return;
      }
      if (authTab === "google") {
        await handleGoogleAuth();
        return;
      }
      await verifyOtp();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Authentication failed.");
    }
  };

  return (
    <main className="login-shell">
      <section className="hero-panel">
        <p className="eyebrow">Full-stack healthcare platform</p>
        <h1>Smart appointments, doctor workflows, and AI triage in one system.</h1>
        <p className="hero-copy">
          Patients can sign in, explore departments, book appointments, and get routed by an
          intelligent triage assistant. Doctors can manage schedules and see their patients in a
          role-aware dashboard.
        </p>

        <div className="hero-grid">
          <article>
            <strong>Multi-auth</strong>
            <span>Email/password, Google demo auth, and phone OTP flow.</span>
          </article>
          <article>
            <strong>Scalable backend</strong>
            <span>Django REST + JWT with modular apps and PostgreSQL-ready design.</span>
          </article>
          <article>
            <strong>Care pathways</strong>
            <span>Basic support, advanced triage, and doctor referral escalation.</span>
          </article>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h2>{mode === "login" ? "Sign in to the clinic" : "Create an account"}</h2>
          </div>

          <button className="ghost-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account?" : "Already registered?"}
          </button>
        </div>

        <div className="tab-row">
          {["email", "google", "phone"].map((tab) => (
            <button
              key={tab}
              className={authTab === tab ? "tab active" : "tab"}
              onClick={() => setAuthTab(tab)}
            >
              {tab === "email" ? "Email" : tab === "google" ? "Google" : "Phone OTP"}
            </button>
          ))}
        </div>

        <div className="form-grid">
          {mode === "register" || authTab === "phone" ? (
            <label>
              Full name
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </label>
          ) : null}

          {authTab !== "google" ? (
            <label>
              {authTab === "phone" ? "Phone number" : "Email"}
              <input
                type={authTab === "phone" ? "tel" : "email"}
                value={authTab === "phone" ? form.phone : form.email}
                onChange={(event) =>
                  updateField(authTab === "phone" ? "phone" : "email", event.target.value)
                }
              />
            </label>
          ) : null}

          {authTab === "email" ? (
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
              />
            </label>
          ) : null}

          {authTab === "phone" ? (
            <label>
              OTP
              <input value={form.otp} onChange={(event) => updateField("otp", event.target.value)} />
            </label>
          ) : null}

          <label>
            Role
            <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>

        <div className="action-row">
          {authTab === "phone" ? (
            <button className="ghost-button" onClick={requestOtp}>
              Request demo OTP
            </button>
          ) : null}
          <button className="primary-button" onClick={submit}>
            {authTab === "google"
              ? "Continue with Google"
              : authTab === "phone"
                ? "Verify and continue"
                : mode === "login"
                  ? "Login"
                  : "Register"}
          </button>
        </div>

        {status ? <p className="status-text">{status}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <div className="demo-box">
          <strong>Demo patient login</strong>
          <span>Email: `patient@clinic.local`</span>
          <span>Password: `Patient@123`</span>
        </div>
      </section>
    </main>
  );
}
