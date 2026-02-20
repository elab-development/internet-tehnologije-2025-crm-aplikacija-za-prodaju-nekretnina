import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./PonudeTable.css";

import { FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw, FiTrendingUp, FiTrash2 } from "react-icons/fi";

const SORTABLE = [
  { key: "created_at", label: "Kreirano" },
  { key: "datum", label: "Datum" },
  { key: "iznos", label: "Iznos" },
  { key: "status", label: "Status" },
  { key: "kupac_id", label: "KupacID" },
  { key: "nekretnina_id", label: "NekretninaID" },
];

function money(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("sr-RS").format(num) + " €";
}

function fmtDate(d) {
  if (!d) return "—";
  // "2026-02-08" ili ISO -> uzmi prvih 10
  return String(d).slice(0, 10);
}

function useDebouncedValue(value, delay = 350) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function PonudeTable() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const [status, setStatus] = useState("");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // brisanje
  const [deletingId, setDeletingId] = useState(null);

  const sortLabel = useMemo(() => {
    const f = SORTABLE.find((x) => x.key === sortBy);
    return f ? f.label : sortBy;
  }, [sortBy]);

  useEffect(() => {
    setPage(1);
  }, [dq, perPage, sortBy, sortDir, status]);

  async function fetchData() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/ponude/search", {
        params: {
          q: dq || undefined,
          page,
          per_page: perPage,
          sort_by: sortBy,
          sort_dir: sortDir,
          status: status || undefined,
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
        (e?.response?.status === 422 ? "Neispravni parametri pretrage." : "Greška pri učitavanju ponuda.");
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
  }, [dq, page, perPage, sortBy, sortDir, status]);

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

  async function handleDelete(id) {
    const ok = window.confirm("Da li sigurno želiš da obrišeš ovu ponudu?");
    if (!ok) return;

    setDeletingId(id);
    setErr("");
    try {
      await api.delete(`/ponude/${id}`);

      const willBeEmpty = rows.length === 1 && (meta?.current_page ?? page) > 1;
      if (willBeEmpty) setPage((p) => Math.max(1, p - 1));
      else await fetchData();
    } catch (e3) {
      setErr("Greška pri brisanju ponude.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="crm ponude-page">
      <section className="ponude-hero">
        <div className="ponude-bg" aria-hidden="true" />

        <div className="crm-container ponude-head">
          <div>
            <div className="ponude-badge">
              <span className="ponude-dot" />
              Ponude
            </div>
            <h1 className="ponude-title">Pregled ponuda</h1>
            <p className="ponude-subtitle">
              Pretraži po kupcu/nekretnini/statusu (ako backend pokriva), filtriraj po statusu i sortiraj klikom na kolonu.
            </p>
          </div>

          <div className="ponude-actions">
            <button className="ponude-btn" type="button" onClick={fetchData} disabled={loading}>
              <FiRefreshCw /> Osveži
            </button>
          </div>
        </div>

        <div className="crm-container ponude-toolbar">
          <div className="ponude-search">
            <FiSearch className="ponude-search-ic" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga ponuda..." aria-label="Pretraga" />
          </div>

          <div className="ponude-filters">
            <div className="ponude-select">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Svi</option>
                <option value="na_cekanju">Na čekanju</option>
                <option value="prihvacena">Prihvaćena</option>
                <option value="odbijena">Odbijena</option>
              </select>
            </div>

            <div className="ponude-select">
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

            <div className="ponude-select">
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
          <div className="ponude-card crm-glass">
            <div className="ponude-card-top">
              <div className="ponude-card-title">
                Lista ponuda{" "}
                {meta ? <span className="ponude-meta">({meta.from}-{meta.to} od {meta.total})</span> : null}
              </div>

              <div className="ponude-mini">
                <span className="ponude-mini-pill">
                  Sort: {sortLabel} • {sortDir.toUpperCase()}
                </span>
                {loading ? <span className="ponude-mini-pill subtle">Učitavanje...</span> : null}
              </div>
            </div>

            {err ? <div className="ponude-error">{err}</div> : null}

            <div className="ponude-table-wrap">
              <table className="ponude-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("kupac_id")} className="is-sort">
                      Kupac {sortBy === "kupac_id" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("nekretnina_id")} className="is-sort">
                      Nekretnina {sortBy === "nekretnina_id" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-md" onClick={() => toggleSort("datum")} style={{ cursor: "pointer" }}>
                      Datum {sortBy === "datum" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("iznos")} className="is-sort">
                      Iznos {sortBy === "iznos" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("status")} className="is-sort">
                      Status {sortBy === "status" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-md">Agent</th>
                    <th className="hide-md" onClick={() => toggleSort("created_at")} style={{ cursor: "pointer" }}>
                      Kreirano {sortBy === "created_at" ? <SortMark dir={sortDir} /> : null}
                    </th>

                    <th className="ponude-actions-col">Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="ponude-empty">
                        Nema rezultata za ovu pretragu.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="ponude-main">
                          <FiTrendingUp className="ponude-ic" />
                          <div className="ponude-id" title={`KupacID: ${r.kupac_id ?? "—"}`}>
                            {r.kupac_full || "—"}
                          </div>
                        </div>
                      </td>

                      <td title={`NekretninaID: ${r.nekretnina_id ?? "—"}`}>
                        <div className="ponude-nek">
                          <div className="ponude-nek-addr">{r.nekretnina_adresa || "—"}</div>
                          <div className="ponude-nek-tip">{r.nekretnina_tip ? String(r.nekretnina_tip) : ""}</div>
                        </div>
                      </td>

                      <td className="hide-md">{fmtDate(r.datum)}</td>

                      <td className="ponude-money">{money(r.iznos)}</td>

                      <td className="ponude-pillcol">
                        <span className={`ponude-pill ponude-pill-${(r.status || "").toString().toLowerCase()}`}>
                          {(r.status || "—").toString()}
                        </span>
                      </td>

                      <td className="hide-md">{r.agent_full || "—"}</td>

                      <td className="hide-md">{fmtDate(r.created_at)}</td>

                      <td className="ponude-actions-cell">
                        <button
                          type="button"
                          className="ponude-iconbtn danger"
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
                      <td colSpan={8} className="ponude-loading">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="ponude-pagination">
              <button
                className="ponude-pagebtn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
                type="button"
              >
                <FiChevronLeft /> Prethodna
              </button>

              <div className="ponude-pageinfo">
                Strana <b>{meta?.current_page ?? page}</b> / <b>{meta?.last_page ?? "—"}</b>
              </div>

              <button className="ponude-pagebtn" onClick={() => setPage((p) => p + 1)} disabled={!canNext || loading} type="button">
                Sledeća <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SortMark({ dir }) {
  return <span className="ponude-sortmark">{dir === "asc" ? "▲" : "▼"}</span>;
}