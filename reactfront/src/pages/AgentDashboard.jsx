import React from "react";
import { Link } from "react-router-dom";
import "./AgentDashboard.css";

import {
  FiUsers,
  FiHome,
  FiCalendar,
  FiTrendingUp,
  FiPlus,
  FiArrowRight,
} from "react-icons/fi";

import KpiCard from "../components/KpiCard";
import QuickCard from "../components/QuickCard";

export default function AgentDashboard() {
  const kpi = {
    activeCustomers: 128,
    availableProperties: 54,
    scheduledViewings7d: 17,
    dealsInProgress: 23,
  };

  const user = JSON.parse(localStorage.getItem("auth_user") || "null");
  const fullName = user ? `${user.ime} ${user.prezime}` : "Agent";

  return (
    <div className="crm agentdash">
      <section className="agentdash-hero">
        <div className="agentdash-bg" aria-hidden="true" />

        <div className="crm-container agentdash-head">
          <div>
            <div className="agentdash-badge">
              <span className="agentdash-dot" />
              Dobrodošao, {fullName}
            </div>

            <h1 className="agentdash-title">Agent Dashboard</h1>
          </div>

          <div className="agentdash-actions">
            <Link to="/kupci" className="crm-btn crm-btn-primary">
              Kupci <FiArrowRight />
            </Link>
            <Link to="/nekretnine" className="crm-btn crm-btn-ghost">
              Nekretnine <FiArrowRight />
            </Link>
          </div>
        </div>

        <div className="crm-container agentdash-kpis">
          <KpiCard icon={<FiUsers />} title="Aktivni kupci" value={kpi.activeCustomers} hint="Kupci u toku" />
          <KpiCard icon={<FiHome />} title="Dostupne nekretnine" value={kpi.availableProperties} hint="Spremno za ponude" />
          <KpiCard icon={<FiCalendar />} title="Zakazani pregledi" value={kpi.scheduledViewings7d} hint="U narednih 7 dana" />
          <KpiCard icon={<FiTrendingUp />} title="Ponude u toku" value={kpi.dealsInProgress} hint="Faza pregovora" />
        </div>
      </section>

      <section className="crm-section agentdash-section">
        <div className="crm-container">
          <div className="crm-section-head">
            <h2>Brze akcije</h2>
            <p>Najčešći koraci za rad sa kupcima i nekretninama.</p>
          </div>

          <div className="agentdash-quick">
            <QuickCard
              title="Kupci"
              desc="Dodaj nove kupce, ažuriraj podatke i brzo pronađi osobu po imenu, telefonu ili statusu."
              cta="Otvori kupce"
              to="/kupci"
              icon={<FiUsers />}
            />

            <QuickCard
              title="Nekretnine"
              desc="Unesi i ažuriraj oglase, menjaj status, cenu i prateće informacije. Dodaj fotografije."
              cta="Otvori nekretnine"
              to="/nekretnine"
              icon={<FiHome />}
            />

            <QuickCard
              title="Uskoro: Brzo dodavanje"
              desc="Prečica za instant unos kupca ili nekretnine direktno sa dashboard-a."
              cta="U pripremi"
              to="/"
              icon={<FiPlus />}
              disabled
            />
          </div>
        </div>
      </section>
    </div>
  );
}
