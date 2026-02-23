import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./NavBar.css";
import { LuBuilding2 } from "react-icons/lu";
import {
  FiHome,
  FiLogIn,
  FiLogOut,
  FiGrid,
  FiUsers,
  FiMap,
  FiCalendar,
  FiSettings,
} from "react-icons/fi";
 
export default function NavBar() {
  const navigate = useNavigate();

  const [isAuthed, setIsAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem("auth_token");
      const u = localStorage.getItem("auth_user");
      setIsAuthed(Boolean(token));
      setUser(u ? safeJson(u) : null);
    };

    sync();

    const onStorage = (e) => {
      if (e.key === "auth_token" || e.key === "auth_user") sync();
    };
    window.addEventListener("storage", onStorage);

    const onAuthChanged = () => sync();
    window.addEventListener("auth:changed", onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:changed", onAuthChanged);
    };
  }, []);

  const role = (user?.uloga || user?.role || "").toLowerCase();

  const links = useMemo(() => {
    // GOST
    if (!isAuthed) {
      return [
        { to: "/", label: "Početna", icon: <FiHome /> },
        { to: "/ponuda-nekretnina", label: "Ponuda nekretnina", icon: <FiGrid /> },
        // ako hoćeš da i gost može listu nekretnina da vidi:
        { to: "/nekretnine", label: "Nekretnine", icon: <FiMap /> },
        { to: "/login", label: "Login", icon: <FiLogIn /> },
      ];
    }

    // ADMIN
    if (role === "administrator" || role === "admin") {
      return [
        { to: "/admin", label: "Admin dashboard", icon: <FiSettings /> },
        { to: "/kupci", label: "Kupci", icon: <FiUsers /> },
        { to: "/nekretnine", label: "Nekretnine", icon: <FiMap /> },
        { to: "/ponude", label: "Ponude", icon: <FiGrid /> },
      ];
    }

    // AGENT
    if (role === "agent") {
      return [
        { to: "/agent", label: "Agent dashboard", icon: <FiGrid /> },
        { to: "/kupci", label: "Kupci", icon: <FiUsers /> },
        { to: "/nekretnine", label: "Nekretnine", icon: <FiMap /> },
        { to: "/ponude", label: "Ponude", icon: <FiGrid /> },
        { to: "/pregledi", label: "Pregledi", icon: <FiCalendar /> },
      ];
    }

    // fallback za ostale role (ako se pojavi menadzer npr.)
    return [
      { to: "/", label: "Početna", icon: <FiHome /> },
      { to: "/nekretnine", label: "Nekretnine", icon: <FiMap /> },
      { to: "/ponude", label: "Ponude", icon: <FiGrid /> },
    ];
  }, [isAuthed, role]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await api.post("/logout");
    } catch {
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.dispatchEvent(new Event("auth:changed"));
      setLoggingOut(false);
      navigate("/login");
    }
  }

  return (
    <header className="crm-nav">
      <div className="crm-container crm-nav-inner">
        <Link to="/" className="crm-nav-brand" aria-label="CRM Home">
          <span className="crm-nav-logo" aria-hidden="true">
            <LuBuilding2 />
          </span>
          <span className="crm-nav-title">CRM</span>
        </Link>

        <nav className="crm-nav-links" aria-label="Primary">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                "crm-nav-link" + (isActive ? " is-active" : "")
              }
              end={l.to === "/"}
            >
              <span className="crm-nav-ic">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="crm-nav-right">
          {isAuthed ? (
            remindUser(user, loggingOut, handleLogout)
          ) : (
            <span className="crm-nav-hint">Nisi prijavljen/a</span>
          )}
        </div>
      </div>
    </header>
  );
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function remindUser(user, loggingOut, handleLogout) {
  const name = user?.ime || user?.name || user?.email || "Korisnik";

  return (
    <>
      <span className="crm-nav-user" title={name}>
        {name}
      </span>
      <button
        className="crm-nav-logout"
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        title="Logout"
      >
        <FiLogOut />
        <span>{loggingOut ? "Odjava..." : "Logout"}</span>
      </button>
    </>
  );
}