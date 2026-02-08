import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "./Login.css";

import { FiLock, FiMail, FiArrowRight, FiShield } from "react-icons/fi";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("agent@test.com");
  const [password, setPassword] = useState("123456");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});  

  function normalizeErrors(payload) { 
    const errs = {};
    if (payload?.errors) {
      for (const key of Object.keys(payload.errors)) {
        const msg = Array.isArray(payload.errors[key])
          ? payload.errors[key][0]
          : String(payload.errors[key]);
        errs[key] = msg;
      }
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    // mini frontend validacija
    if (!email.trim() || !password.trim()) {
      setFormError("Unesi email i lozinku.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/login", { email, password });

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (!token || !user) {
        setFormError("Neispravan odgovor servera (nema token/user).");
        setLoading(false);
        return;
      }

      localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        window.dispatchEvent(new Event("auth:changed")); 
        /* REDIRECT PO ULOZI */
        if (user.uloga === "administrator") {
        navigate("/admin");
        } else if (user.uloga === "menadzer") {
        navigate("/menadzer");
        } else if (user.uloga === "agent") {
        navigate("/agent");
        } else {
        navigate("/");
        }

     
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422) {
        const errs = normalizeErrors(data);
        setFieldErrors(errs);
        setFormError(data?.message || "Validacija nije prošla.");
      } else if (status === 401) {
        setFormError(data?.message || "Pogrešan email ili lozinka.");
        const errs = normalizeErrors(data);
        setFieldErrors(errs);
      } else {
        setFormError("Greška pri prijavi. Proveri server i pokušaj ponovo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="crm login-page">
      <section className="login-wrap">
        <div className="login-bg" aria-hidden="true" />

        <div className="crm-container login-grid">
          {/* LEVO: tekst */}
          <div className="login-left">
            <div className="login-badge">
              <FiShield />
              <span>Siguran pristup sistemu</span>
            </div>

            <h1 className="login-title">
              Prijavi se u <span className="crm-grad">CRM</span>
            </h1>

            <p className="login-subtitle">
              Unesi kredencijale i nastavi na dashboard.  
            </p>

           
          </div>

          {/* DESNO: forma */}
          <div className="login-right">
            <div className="login-card crm-glass">
              <div className="login-card-top">
                <div className="login-dot red" />
                <div className="login-dot yellow" />
                <div className="login-dot green" />
                <div className="login-card-title">Login • CRM</div>
              </div>

              <div className="login-card-body">
                {formError ? (
                  <div className="login-alert" role="alert">
                    {formError}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="login-form">
                  <label className="login-label">
                    Email
                    <div className={`login-input ${fieldErrors.email ? "is-error" : ""}`}>
                      <FiMail className="login-ic" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="npr. agent@crm.rs"
                        autoComplete="email"
                      />
                    </div>
                    {fieldErrors.email ? (
                      <div className="login-field-error">{fieldErrors.email}</div>
                    ) : null}
                  </label>

                  <label className="login-label">
                    Lozinka
                    <div className={`login-input ${fieldErrors.password ? "is-error" : ""}`}>
                      <FiLock className="login-ic" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                    {fieldErrors.password ? (
                      <div className="login-field-error">{fieldErrors.password}</div>
                    ) : null}
                  </label>

                  <button className="login-btn" type="submit" disabled={loading}>
                    {loading ? "Prijava..." : <>Prijavi se <FiArrowRight /></>}
                  </button>

                  <div className="login-foot">
                    <span className="login-muted">
                      Nemaš nalog?
                    </span>{" "}
                    <Link to="/register" className="login-link">
                      Registracija
                    </Link>
                  </div>
                </form>
              </div>
            </div>

             
          </div>
        </div>
      </section>
    </div>
  );
}
