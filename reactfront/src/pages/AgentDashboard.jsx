import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AgentDashboard.css";
import api from "../api/axios";

import {
  FiUsers,
  FiHome,
  FiCalendar,
  FiTrendingUp,
  FiPlus,
  FiArrowRight,
  FiRefreshCw,
} from "react-icons/fi";

import KpiCard from "../components/KpiCard";
import QuickCard from "../components/QuickCard";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

function fmtShortDate(d) {
  if (!d) return "";
  return String(d).slice(5, 10); // MM-DD
}
function fmtMonthLabel(ym) {
  // "2026-02" -> "02/26"
  if (!ym) return "";
  const [y, m] = String(ym).split("-");
  return `${m}/${String(y).slice(2)}`;
}

const STATUS_LABEL = {
  na_cekanju: "Na čekanju",
  u_toku: "U toku",
  prihvacena: "Prihvaćena",
  odbijena: "Odbijena",
};

export default function AgentDashboard() {
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");
  const fullName = user ? `${user.ime} ${user.prezime}` : "Agent";

  const [kpi, setKpi] = useState({
    activeCustomers: 0,
    availableProperties: 0,
    scheduledViewings7d: 0,
    dealsInProgress: 0,
  });

  const [charts, setCharts] = useState({
    offersByStatus: [],
    offersByMonth: [],
    viewingsByDay: [],
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function fetchDashboard() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/agent/dashboard");
      const data = res.data || {};

      setKpi({
        activeCustomers: data?.kpi?.activeCustomers ?? 0,
        availableProperties: data?.kpi?.availableProperties ?? 0,
        scheduledViewings7d: data?.kpi?.scheduledViewings7d ?? 0,
        dealsInProgress: data?.kpi?.dealsInProgress ?? 0,
      });

      setCharts({
        offersByStatus: data?.charts?.offersByStatus ?? [],
        offersByMonth: data?.charts?.offersByMonth ?? [],
        viewingsByDay: data?.charts?.viewingsByDay ?? [],
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 401 ? "Nisi ulogovan. Uloguj se ponovo." : "Greška pri učitavanju dashboard-a.");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard(); 
  }, []);

  // --------- CHART DATA (preformat) ----------
  const offersByStatusData = useMemo(() => {
    return (charts.offersByStatus || []).map((x) => ({
      name: STATUS_LABEL[x.status] || String(x.status),
      value: Number(x.count || 0),
      raw: x.status,
    }));
  }, [charts.offersByStatus]);

  const offersByMonthData = useMemo(() => {
    return (charts.offersByMonth || []).map((x) => ({
      month: fmtMonthLabel(x.month),
      count: Number(x.count || 0),
      sum: Number(x.sum || 0),
    }));
  }, [charts.offersByMonth]);

  const viewingsByDayData = useMemo(() => {
    return (charts.viewingsByDay || []).map((x) => ({
      day: fmtShortDate(x.date),
      count: Number(x.count || 0),
      full: x.date,
    }));
  }, [charts.viewingsByDay]);

 
  const PIE_COLORS = ["#6D9EEB", "#93C47D", "#F6B26B", "#E06666", "#8E7CC3"];

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
            <p className="agentdash-subtitle">
              KPI pregled + statistike ponuda i pregleda. {loading ? "Učitavanje..." : ""}
            </p>

            {err ? <div className="agentdash-error">{err}</div> : null}
          </div>

          <div className="agentdash-actions">
            <button className="crm-btn crm-btn-ghost" onClick={fetchDashboard} disabled={loading} type="button">
              Osveži <FiRefreshCw />
            </button>

            <Link to="/kupci" className="crm-btn crm-btn-primary">
              Kupci <FiArrowRight />
            </Link>
            <Link to="/nekretnine" className="crm-btn crm-btn-ghost">
              Nekretnine <FiArrowRight />
            </Link>
          </div>
        </div>

        <div className="crm-container agentdash-kpis">
          <KpiCard icon={<FiUsers />} title="Aktivni kupci" value={kpi.activeCustomers} hint="Ukupno u sistemu" />
          <KpiCard icon={<FiHome />} title="Dostupne nekretnine" value={kpi.availableProperties} hint="Status: dostupna" />
          <KpiCard icon={<FiCalendar />} title="Zakazani pregledi" value={kpi.scheduledViewings7d} hint="U narednih 7 dana" />
          <KpiCard icon={<FiTrendingUp />} title="Ponude u toku" value={kpi.dealsInProgress} hint="Na čekanju / u toku" />
        </div>
      </section>

      {/* STATISTIKA / GRAFICI */}
      <section className="crm-section agentdash-section">
        <div className="crm-container">
          <div className="crm-section-head">
            <h2>Statistika</h2>
            <p>Brz uvid u pipeline ponuda i raspored pregleda.</p>
          </div>

          <div className="agentdash-charts">
            {/* Ponude po statusu */}
            <div className="agentdash-chartcard crm-glass">
              <div className="agentdash-charthead">
                <div className="agentdash-charttitle">Ponude po statusu</div>
                <div className="agentdash-charthint">Trenutno stanje</div>
              </div>

              <div className="agentdash-chartbody">
                {offersByStatusData.length === 0 ? (
                  <div className="agentdash-empty">Nema podataka za ponude.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={offersByStatusData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {offersByStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Ponude poslednjih 6 meseci */}
            <div className="agentdash-chartcard crm-glass">
              <div className="agentdash-charthead">
                <div className="agentdash-charttitle">Ponude (poslednjih 6 meseci)</div>
                <div className="agentdash-charthint">Broj ponuda po mesecu</div>
              </div>

              <div className="agentdash-chartbody">
                {offersByMonthData.length === 0 ? (
                  <div className="agentdash-empty">Nema podataka za poslednjih 6 meseci.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={offersByMonthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Broj ponuda" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pregledi narednih 7 dana */}
            <div className="agentdash-chartcard crm-glass">
              <div className="agentdash-charthead">
                <div className="agentdash-charttitle">Pregledi (narednih 7 dana)</div>
                <div className="agentdash-charthint">Koliko pregleda po danu</div>
              </div>

              <div className="agentdash-chartbody">
                {viewingsByDayData.length === 0 ? (
                  <div className="agentdash-empty">Nema zakazanih pregleda.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={viewingsByDayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Pregledi" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRZE AKCIJE */}
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