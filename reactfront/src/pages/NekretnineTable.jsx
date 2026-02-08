import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./NekretnineTable.css";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiHome,
  FiPlus,
  FiTrash2,
  FiX,
  FiSave,
} from "react-icons/fi";

const SORTABLE = [
  { key: "adresa", label: "Adresa" },
  { key: "tip", label: "Tip" },
  { key: "status", label: "Status" },
  { key: "cena", label: "Cena" },
  { key: "created_at", label: "Kreirano" },
];

function money(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("sr-RS").format(num) + " €";
}

function useDebouncedValue(value, delay = 350) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

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

export default function NekretnineTable() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [status, setStatus] = useState("");
  const [tip, setTip] = useState("");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // modal + forma
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    adresa: "",
    tip: "stan",
    cena: "",
    status: "dostupna",
  });

  // brisanje
  const [deletingId, setDeletingId] = useState(null);

  const sortLabel = useMemo(() => {
    const f = SORTABLE.find((x) => x.key === sortBy);
    return f ? f.label : sortBy;
  }, [sortBy]);

  // reset na page 1 kada se menja filter/search/perPage/sort
  useEffect(() => {
    setPage(1);
  }, [dq, perPage, sortBy, sortDir, status, tip]);

  async function fetchData() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/nekretnine/search", {
        params: {
          q: dq || undefined,
          page,
          per_page: perPage,
          sort_by: sortBy,
          sort_dir: sortDir,
          status: status || undefined,
          tip: tip || undefined,
        },
      });

      setRows(res.data?.data || []);
      setMeta({
        current_page: res.data?.current_page ?? 1,
        last_page: res.data?.last_page ?? 1,
        per_page: res.data?.per_page ?? perPage,
        total: res.data?.total ?? 0,
        from: res.data?.from ?? 0,
        to: res.data?.to ?? 0,
      });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 422
          ? "Neispravni parametri pretrage."
          : "Greška pri učitavanju nekretnina.");
      setErr(msg);
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq, page, perPage, sortBy, sortDir, status, tip]);

  function toggleSort(colKey) {
    if (sortBy !== colKey) {
      setSortBy(colKey);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  const canPrev = meta ? meta.current_page > 1 : page > 1;
  const canNext = meta ? meta.current_page < meta.last_page : false;

  function openCreate() {
    setCreateError("");
    setFieldErrors({});
    setForm({
      adresa: "",
      tip: "stan",
      cena: "",
      status: "dostupna",
    });
    setIsCreateOpen(true);
  }

  function closeCreate() {
    if (createLoading) return;
    setIsCreateOpen(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setFieldErrors({});

    // mini FE validacija
    if (!form.adresa.trim()) {
      setFieldErrors({ adresa: "Unesi adresu." });
      return;
    }
    if (form.cena === "" || Number.isNaN(Number(form.cena)) || Number(form.cena) < 0) {
      setFieldErrors({ cena: "Unesi ispravnu cenu." });
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        adresa: form.adresa.trim(),
        tip: form.tip,
        cena: Number(form.cena),
        status: form.status,
      };

      await api.post("/nekretnine", payload);

      setIsCreateOpen(false);

      // nakon kreiranja, vratimo na prvu stranu i osvežimo
      setPage(1);
      await fetchData();
    } catch (e2) {
      const statusCode = e2?.response?.status;
      const data = e2?.response?.data;

      if (statusCode === 422) {
        setFieldErrors(normalizeErrors(data));
        setCreateError("Proveri unete podatke.");
      } else {
        setCreateError("Greška pri kreiranju nekretnine. Pokušaj ponovo.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("Da li sigurno želiš da obrišeš ovu nekretninu?");
    if (!ok) return;

    setDeletingId(id);
    setErr("");
    try {
      await api.delete(`/nekretnine/${id}`);

      // Ako obrišemo poslednji red na strani, lepo je vratiti stranu unazad kad treba
      const willBeEmpty = rows.length === 1 && (meta?.current_page ?? page) > 1;
      if (willBeEmpty) setPage((p) => Math.max(1, p - 1));
      else await fetchData();
    } catch (e3) {
      setErr("Greška pri brisanju nekretnine.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="crm nek-page">
      <section className="nek-hero">
        <div className="nek-bg" aria-hidden="true" />

        <div className="crm-container nek-head">
          <div>
            <div className="nek-badge">
              <span className="nek-dot" />
              Nekretnine
            </div>
            <h1 className="nek-title">Pregled nekretnina</h1>
            <p className="nek-subtitle">
              Pretraži po adresi, tipu ili statusu. Dodatno filtriraj po tipu i statusu.
            </p>
          </div>

          <div className="nek-actions">
            <button className="nek-btn" type="button" onClick={openCreate} disabled={loading}>
              <FiPlus /> Nova nekretnina
            </button>
            <button className="nek-btn" type="button" onClick={fetchData} disabled={loading}>
              <FiRefreshCw /> Osveži
            </button>
          </div>
        </div>

        <div className="crm-container nek-toolbar">
          <div className="nek-search">
            <FiSearch className="nek-search-ic" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pretraga nekretnina..."
              aria-label="Pretraga"
            />
          </div>

          <div className="nek-filters">
            <div className="nek-select">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Svi</option>
                <option value="dostupna">Dostupna</option>
                <option value="rezervisana">Rezervisana</option>
                <option value="prodata">Prodata</option>
              </select>
            </div>

            <div className="nek-select">
              <span>Tip</span>
              <select value={tip} onChange={(e) => setTip(e.target.value)}>
                <option value="">Svi</option>
                <option value="stan">Stan</option>
                <option value="kuca">Kuća</option>
                <option value="lokal">Lokal</option>
                <option value="plac">Plac</option>
              </select>
            </div>

            <div className="nek-select">
              <span>Sort</span>
              <select
                value={`${sortBy}:${sortDir}`}
                onChange={(e) => {
                  const [sb, sd] = e.target.value.split(":");
                  setSortBy(sb);
                  setSortDir(sd);
                }}
              >
                {SORTABLE.map((s) => (
                  <option key={s.key} value={`${s.key}:asc`}>
                    {s.label} (A→Z)
                  </option>
                ))}
                {SORTABLE.map((s) => (
                  <option key={s.key + "_d"} value={`${s.key}:desc`}>
                    {s.label} (Z→A)
                  </option>
                ))}
              </select>
            </div>

            <div className="nek-select">
              <span>Po strani</span>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="crm-section">
        <div className="crm-container">
          <div className="nek-card crm-glass">
            <div className="nek-card-top">
              <div className="nek-card-title">
                Lista nekretnina
                {meta ? (
                  <span className="nek-meta">
                    ({meta.from}-{meta.to} od {meta.total})
                  </span>
                ) : null}
              </div>

              <div className="nek-mini">
                <span className="nek-mini-pill">
                  Sort: {sortLabel} • {sortDir.toUpperCase()}
                </span>
                {loading ? <span className="nek-mini-pill subtle">Učitavanje...</span> : null}
              </div>
            </div>

            {err ? <div className="nek-error">{err}</div> : null}

            <div className="nek-table-wrap">
              <table className="nek-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("adresa")} className="is-sort">
                      Adresa {sortBy === "adresa" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("tip")} className="is-sort">
                      Tip {sortBy === "tip" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("status")} className="is-sort">
                      Status {sortBy === "status" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("cena")} className="is-sort">
                      Cena {sortBy === "cena" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-md" onClick={() => toggleSort("created_at")} style={{ cursor: "pointer" }}>
                      Kreirano {sortBy === "created_at" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="nek-actions-col">Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="nek-empty">
                        Nema rezultata za ovu pretragu.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="nek-main">
                          <FiHome className="nek-homeic" />
                          <div>
                            <div className="nek-addr">{r.adresa || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="nek-pillcol">
                        <span className="nek-pill">{(r.tip || "—").toString()}</span>
                      </td>
                      <td className="nek-pillcol">
                        <span className={`nek-pill nek-pill-${(r.status || "").toString().toLowerCase()}`}>
                          {(r.status || "—").toString()}
                        </span>
                      </td>
                      <td className="nek-money">{money(r.cena)}</td>
                      <td className="hide-md">{r.created_at ? String(r.created_at).slice(0, 10) : "—"}</td>

                      <td className="nek-actions-cell">
                        <button
                          type="button"
                          className="nek-iconbtn danger"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          title="Obriši"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {loading ? (
                    <tr>
                      <td colSpan={6} className="nek-loading">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="nek-pagination">
              <button
                className="nek-pagebtn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
                type="button"
              >
                <FiChevronLeft /> Prethodna
              </button>

              <div className="nek-pageinfo">
                Strana <b>{meta?.current_page ?? page}</b> / <b>{meta?.last_page ?? "—"}</b>
              </div>

              <button
                className="nek-pagebtn"
                onClick={() => setPage((p) => p + 1)}
                disabled={!canNext || loading}
                type="button"
              >
                Sledeća <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CREATE MODAL */}
      {isCreateOpen ? (
        <div className="nek-modal-backdrop" role="dialog" aria-modal="true">
          <div className="nek-modal crm-glass">
            <div className="nek-modal-top">
              <div className="nek-modal-title">Nova nekretnina</div>
              <button className="nek-iconbtn" type="button" onClick={closeCreate} disabled={createLoading} title="Zatvori">
                <FiX />
              </button>
            </div>

            <div className="nek-modal-body">
              {createError ? <div className="nek-error" style={{ borderBottom: "none" }}>{createError}</div> : null}

              <form onSubmit={handleCreate} className="nek-form">
                <label className="nek-label">
                  Adresa
                  <input
                    className={`nek-input ${fieldErrors.adresa ? "is-error" : ""}`}
                    value={form.adresa}
                    onChange={(e) => setForm((f) => ({ ...f, adresa: e.target.value }))}
                    placeholder="npr. Bulevar kralja Aleksandra 12"
                  />
                  {fieldErrors.adresa ? <div className="nek-field-error">{fieldErrors.adresa}</div> : null}
                </label>

                <div className="nek-grid2">
                  <label className="nek-label">
                    Tip
                    <select
                      className={`nek-input ${fieldErrors.tip ? "is-error" : ""}`}
                      value={form.tip}
                      onChange={(e) => setForm((f) => ({ ...f, tip: e.target.value }))}
                    >
                      <option value="stan">Stan</option>
                      <option value="kuca">Kuća</option>
                      <option value="lokal">Lokal</option>
                      <option value="plac">Plac</option>
                    </select>
                    {fieldErrors.tip ? <div className="nek-field-error">{fieldErrors.tip}</div> : null}
                  </label>

                  <label className="nek-label">
                    Status
                    <select
                      className={`nek-input ${fieldErrors.status ? "is-error" : ""}`}
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    >
                      <option value="dostupna">Dostupna</option>
                      <option value="rezervisana">Rezervisana</option>
                      <option value="prodata">Prodata</option>
                    </select>
                    {fieldErrors.status ? <div className="nek-field-error">{fieldErrors.status}</div> : null}
                  </label>
                </div>

                <label className="nek-label">
                  Cena (€)
                  <input
                    className={`nek-input ${fieldErrors.cena ? "is-error" : ""}`}
                    value={form.cena}
                    onChange={(e) => setForm((f) => ({ ...f, cena: e.target.value }))}
                    placeholder="npr. 125000"
                    inputMode="numeric"
                  />
                  {fieldErrors.cena ? <div className="nek-field-error">{fieldErrors.cena}</div> : null}
                </label>

                <div className="nek-form-actions">
                  <button className="nek-btn" type="button" onClick={closeCreate} disabled={createLoading}>
                    Otkaži
                  </button>
                  <button className="nek-btn primary" type="submit" disabled={createLoading}>
                    {createLoading ? "Čuvanje..." : <>Sačuvaj <FiSave /></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortMark({ dir }) {
  return <span className="nek-sortmark">{dir === "asc" ? "▲" : "▼"}</span>;
}
