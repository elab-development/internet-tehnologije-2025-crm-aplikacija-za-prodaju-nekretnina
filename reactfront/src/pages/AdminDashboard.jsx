import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";
import api from "../api/axios";

import {
  FiUsers,
  FiUserPlus,
  FiTrash2,
  FiRotateCcw,
  FiSearch,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import KpiCard from "../components/KpiCard";

const ROLE_LABEL = {
  agent: "Agent", 
  administrator: "Administrator",
};

function safeStr(v) {
  return v == null ? "" : String(v);
}

export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");
  const fullName = user ? `${user.ime} ${user.prezime}` : "Administrator";

  const [stats, setStats] = useState({
    total: 0,
    deleted: 0,
    by_role: [],
  });

  const [list, setList] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  const [q, setQ] = useState("");
  const [uloga, setUloga] = useState("");
  const [withDeleted, setWithDeleted] = useState(true);

  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // create user form
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [createOk, setCreateOk] = useState("");

  const [newUser, setNewUser] = useState({
    ime: "",
    prezime: "",
    email: "",
    uloga: "agent",
    password: "",
    password_confirmation: "",
  });

  async function fetchStats() {
    const res = await api.get("/admin/users/stats");
    setStats(res.data || { total: 0, deleted: 0, by_role: [] });
  }
 
    useEffect(() => {
        if (!createOpen) return;

        const onKey = (e) => {
        if (e.key === "Escape") setCreateOpen(false);
        };

        document.addEventListener("keydown", onKey);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow;
        };
    }, [createOpen]);
  async function fetchUsers(page = 1) {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/admin/users/search", {
        params: {
          q: q || null,
          uloga: uloga || null,
          with_deleted: withDeleted ? 1 : 0,
          page,
          per_page: list.per_page || 10,
          sort_by: sortBy,
          sort_dir: sortDir,
        },
      });

      const data = res.data || {};
      setList({
        data: data.data || [],
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Greška pri učitavanju korisnika.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAll() {
    setLoading(true);
    setErr("");
    try {
      await Promise.all([fetchStats(), fetchUsers(list.current_page || 1)]);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withDeleted, uloga, sortBy, sortDir]);

  const byRoleMap = useMemo(() => {
    const m = { agent: 0, menadzer: 0, administrator: 0 };
    (stats.by_role || []).forEach((r) => {
      const key = safeStr(r.uloga);
      m[key] = Number(r.cnt || 0);
    });
    return m;
  }, [stats.by_role]);

  async function softDeleteUser(id) {
    if (!id) return;
    setErr("");
    try {
      await api.delete(`/admin/users/${id}`);
      await refreshAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Greška pri brisanju korisnika.");
    }
  }

  async function restoreUser(id) {
    if (!id) return;
    setErr("");
    try {
      await api.post(`/admin/users/${id}/restore`);
      await refreshAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Greška pri vraćanju korisnika.");
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setCreateErr("");
    setCreateOk("");

    try {
      setCreating(true);
      await api.post("/admin/users", newUser);
      setCreateOk("Korisnik je dodat.");
      setNewUser({
        ime: "",
        prezime: "",
        email: "",
        uloga: "agent",
        password: "",
        password_confirmation: "",
      });
      await refreshAll();
    } catch (e2) {
      const data = e2?.response?.data;
      if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        const firstMsg = data.errors[firstKey]?.[0];
        setCreateErr(firstMsg || "Validacija nije prošla.");
      } else {
        setCreateErr(data?.message || "Greška pri dodavanju korisnika.");
      }
    } finally {
      setCreating(false);
    }
  }

  function toggleSort(col) {
    if (sortBy !== col) {
      setSortBy(col);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  return (
    <div className="crm admindash">
      <section className="admindash-hero">
        <div className="admindash-bg" aria-hidden="true" />

        <div className="crm-container admindash-head">
          <div>
            <div className="admindash-badge">
              <span className="admindash-dot" />
              Dobrodošao, {fullName}
            </div>

            <h1 className="admindash-title">Admin Dashboard</h1>

            <p className="admindash-subtitle">
              Statistike korisnika i administracija naloga. {loading ? "Učitavanje..." : ""}
            </p>

            {err ? <div className="admindash-error">{err}</div> : null}
          </div>

          <div className="admindash-actions">
            <button className="crm-btn crm-btn-ghost" onClick={refreshAll} disabled={loading} type="button">
              Osveži <FiRefreshCw />
            </button>

            <button className="crm-btn crm-btn-primary" onClick={() => setCreateOpen((p) => !p)} type="button">
              Dodaj korisnika <FiUserPlus />
            </button>

            <Link to="/agent/dashboard" className="crm-btn crm-btn-ghost">
              Agent deo
            </Link>
          </div>
        </div>

        <div className="crm-container admindash-kpis">
          <KpiCard icon={<FiUsers />} title="Ukupno korisnika" value={stats.total} hint="Svi (aktivni + obrisani)" />
          <KpiCard icon={<FiTrash2 />} title="Obrisani (soft)" value={stats.deleted} hint="U korpi (deleted_at)" />
          <KpiCard icon={<FiUsers />} title="Agenti" value={byRoleMap.agent || 0} hint="uloga: agent" /> 
        </div>
      </section>

      <section className="crm-section admindash-section">
        <div className="crm-container">
            {createOpen ? (
                    <div
                        className="admindash-modal-backdrop"
                        role="presentation"
                        onMouseDown={() => setCreateOpen(false)}
                    >
                        <div
                        className="admindash-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admindash-create-title"
                        onMouseDown={(e) => e.stopPropagation()}
                        >
                        <div className="admindash-modal-top">
                            <div>
                            <div className="admindash-cardtitle" id="admindash-create-title">
                                Dodavanje korisnika
                            </div>
                            <div className="admindash-cardhint">
                                Admin dodaje korisnika sa bilo kojom ulogom
                            </div>
                            </div>

                            <button
                            className="admindash-modal-x"
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            aria-label="Zatvori"
                            title="Zatvori"
                            >
                            ✕
                            </button>
                        </div>

                        <form className="admindash-form admindash-modal-body" onSubmit={createUser}>
                            <div className="admindash-formgrid">
                            <label className="admindash-field">
                                <div className="admindash-label">Ime</div>
                                <input
                                value={newUser.ime}
                                onChange={(e) => setNewUser((p) => ({ ...p, ime: e.target.value }))}
                                required
                                maxLength={100}
                                autoFocus
                                />
                            </label>

                            <label className="admindash-field">
                                <div className="admindash-label">Prezime</div>
                                <input
                                value={newUser.prezime}
                                onChange={(e) => setNewUser((p) => ({ ...p, prezime: e.target.value }))}
                                required
                                maxLength={100}
                                />
                            </label>

                            <label className="admindash-field admindash-span2">
                                <div className="admindash-label">Email</div>
                                <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                                required
                                maxLength={255}
                                />
                            </label>

                            <label className="admindash-field">
                                <div className="admindash-label">Uloga</div>
                                <select
                                value={newUser.uloga}
                                onChange={(e) => setNewUser((p) => ({ ...p, uloga: e.target.value }))}
                                >
                                <option value="agent">agent</option>
                                <option value="administrator">administrator</option>
                                </select>
                            </label>

                            <label className="admindash-field">
                                <div className="admindash-label">Lozinka</div>
                                <input
                                type="password"
                                value={newUser.password}
                                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                                required
                                minLength={6}
                                />
                            </label>

                            <label className="admindash-field">
                                <div className="admindash-label">Potvrda lozinke</div>
                                <input
                                type="password"
                                value={newUser.password_confirmation}
                                onChange={(e) => setNewUser((p) => ({ ...p, password_confirmation: e.target.value }))}
                                required
                                minLength={6}
                                />
                            </label>
                            </div>

                            {createErr ? <div className="admindash-error">{createErr}</div> : null}
                            {createOk ? <div className="admindash-ok">{createOk}</div> : null}

                            <div className="admindash-modal-actions">
                            <button className="crm-btn crm-btn-primary" disabled={creating} type="submit">
                                Sačuvaj
                            </button>
                            <button className="crm-btn crm-btn-ghost" onClick={() => setCreateOpen(false)} type="button">
                                Zatvori
                            </button>
                            </div>
                        </form>
                        </div>
                    </div>
                    ) : null}

          <div className="admindash-card crm-glass" style={{ marginTop: 14 }}>
            <div className="admindash-cardhead">
              <div className="admindash-cardtitle">Korisnici</div>
              <div className="admindash-cardhint">Pretraga, filtriranje, soft delete i restore</div>
            </div>

            <div className="admindash-toolbar">
              <div className="admindash-search">
                <FiSearch />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Pretraga: ime, prezime, email..."
                />
              </div>

              <select className="admindash-select" value={uloga} onChange={(e) => setUloga(e.target.value)}>
                <option value="">Sve uloge</option>
                <option value="agent">agent</option>
              
                <option value="administrator">administrator</option>
              </select>

              <label className="admindash-check">
                <input
                  type="checkbox"
                  checked={withDeleted}
                  onChange={(e) => setWithDeleted(e.target.checked)}
                />
                Prikaži obrisane
              </label>

              <button className="crm-btn crm-btn-ghost" onClick={() => fetchUsers(1)} disabled={loading} type="button">
                Primeni <FiRefreshCw />
              </button>
            </div>

            <div className="admindash-tablewrap">
              <table className="admindash-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("ime")} role="button">Ime</th>
                    <th onClick={() => toggleSort("prezime")} role="button">Prezime</th>
                    <th onClick={() => toggleSort("email")} role="button">Email</th>
                    <th onClick={() => toggleSort("uloga")} role="button">Uloga</th>
                    <th onClick={() => toggleSort("created_at")} role="button">Kreiran</th>
                    <th>Status</th>
                    <th style={{ width: 180 }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="admindash-tdmuted">Učitavanje...</td>
                    </tr>
                  ) : (list.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admindash-tdmuted">Nema rezultata.</td>
                    </tr>
                  ) : (
                    list.data.map((u) => {
                      const deleted = !!u.deleted_at;
                      return (
                        <tr key={u.id} className={deleted ? "is-deleted" : ""}>
                          <td>{safeStr(u.ime)}</td>
                          <td>{safeStr(u.prezime)}</td>
                          <td>{safeStr(u.email)}</td>
                          <td>{ROLE_LABEL[u.uloga] || safeStr(u.uloga)}</td>
                          <td>{safeStr(u.created_at).slice(0, 10)}</td>
                          <td>
                            {deleted ? <span className="admindash-pill danger">Obrisan</span> : <span className="admindash-pill ok">Aktivan</span>}
                          </td>
                          <td>
                            <div className="admindash-rowactions">
                              {!deleted ? (
                                <button className="admindash-iconbtn" onClick={() => softDeleteUser(u.id)} type="button" title="Soft delete">
                                  <FiTrash2 />
                                </button>
                              ) : (
                                <button className="admindash-iconbtn" onClick={() => restoreUser(u.id)} type="button" title="Restore">
                                  <FiRotateCcw />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="admindash-pager">
              <div className="admindash-tdmuted">
                Ukupno: {list.total} | Strana {list.current_page}/{list.last_page}
              </div>

              <div className="admindash-pagerbtns">
                <button
                  className="admindash-iconbtn"
                  disabled={list.current_page <= 1 || loading}
                  onClick={() => fetchUsers((list.current_page || 1) - 1)}
                  type="button"
                  title="Prethodna"
                >
                  <FiChevronLeft />
                </button>

                <button
                  className="admindash-iconbtn"
                  disabled={list.current_page >= list.last_page || loading}
                  onClick={() => fetchUsers((list.current_page || 1) + 1)}
                  type="button"
                  title="Sledeća"
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}