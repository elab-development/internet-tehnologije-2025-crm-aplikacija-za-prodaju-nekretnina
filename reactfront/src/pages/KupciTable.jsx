import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./KupciTable.css";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

const SORTABLE = [
  { key: "ime", label: "Ime" },
  { key: "prezime", label: "Prezime" },
  { key: "email", label: "Email" },
  { key: "budzet", label: "Budžet" },
  { key: "created_at", label: "Kreiran" },
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

export default function KupciTable() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

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
  }, [dq, perPage, sortBy, sortDir]);

  async function fetchData() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/kupci/search", {
        params: {
          q: dq || undefined,
          page,
          per_page: perPage,
          sort_by: sortBy,
          sort_dir: sortDir,
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
          : "Greška pri učitavanju kupaca.");
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
  }, [dq, page, perPage, sortBy, sortDir]);

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
    const ok = window.confirm("Da li sigurno želiš da obrišeš ovog kupca?");
    if (!ok) return;

    setDeletingId(id);
    setErr("");
    try {
      await api.delete(`/kupci/${id}`);

      // ako obrišeš poslednji na strani, vrati stranu unazad
      const willBeEmpty = rows.length === 1 && (meta?.current_page ?? page) > 1;
      if (willBeEmpty) setPage((p) => Math.max(1, p - 1));
      else await fetchData();
    } catch (e) {
      setErr("Greška pri brisanju kupca.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="crm kupci-page">
      <section className="kupci-hero">
        <div className="kupci-bg" aria-hidden="true" />

        <div className="crm-container kupci-head">
          <div>
            <div className="kupci-badge">
              <span className="kupci-dot" />
              Kupci
            </div>
            <h1 className="kupci-title">Pregled kupaca</h1>
            <p className="kupci-subtitle">
              Pretraži po imenu, prezimenu, telefonu, email-u, lokaciji ili napomeni. Sortiraj klikom na kolonu.
            </p>
          </div>

          <div className="kupci-actions">
            <button className="kupci-btn" type="button" onClick={fetchData} disabled={loading}>
              <FiRefreshCw /> Osveži
            </button>
          </div>
        </div>

        <div className="crm-container kupci-toolbar">
          <div className="kupci-search">
            <FiSearch className="kupci-search-ic" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pretraga kupaca..."
              aria-label="Pretraga"
            />
          </div>

          <div className="kupci-selects">
            <div className="kupci-select">
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

            <div className="kupci-select">
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
          <div className="kupci-card crm-glass">
            <div className="kupci-card-top">
              <div className="kupci-card-title">
                Lista kupaca
                {meta ? (
                  <span className="kupci-meta">
                    ({meta.from}-{meta.to} od {meta.total})
                  </span>
                ) : null}
              </div>

              <div className="kupci-mini">
                <span className="kupci-mini-pill">
                  Sort: {sortLabel} • {sortDir.toUpperCase()}
                </span>
                {loading ? <span className="kupci-mini-pill subtle">Učitavanje...</span> : null}
              </div>
            </div>

            {err ? <div className="kupci-error">{err}</div> : null}

            <div className="kupci-table-wrap">
              <table className="kupci-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("ime")} className="is-sort">
                      Ime {sortBy === "ime" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("prezime")} className="is-sort">
                      Prezime {sortBy === "prezime" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-md" onClick={() => toggleSort("telefon")} style={{ cursor: "pointer" }}>
                      Telefon {sortBy === "telefon" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-lg" onClick={() => toggleSort("email")} style={{ cursor: "pointer" }}>
                      Email {sortBy === "email" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-sm" onClick={() => toggleSort("lokacija")} style={{ cursor: "pointer" }}>
                      Lokacija {sortBy === "lokacija" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("budzet")} className="is-sort">
                      Budžet {sortBy === "budzet" ? <SortMark dir={sortDir} /> : null}
                    </th>

                    {/* ✅ NOVO: Akcije kolona */}
                    <th className="kupci-actions-col">Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="kupci-empty">
                        Nema rezultata za ovu pretragu.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="kupci-main">
                          <div className="kupci-name">{r.ime || "—"}</div>
                        </div>
                      </td>
                      <td>
                        <div className="kupci-main">
                          <div className="kupci-name">{r.prezime || "—"}</div>
                        </div>
                      </td>
                      <td className="hide-md">{r.telefon || "—"}</td>
                      <td className="hide-lg">{r.email || "—"}</td>
                      <td className="hide-sm">{r.lokacija || "—"}</td>
                      <td className="kupci-money">{money(r.budzet)}</td>

                      {/* ✅ NOVO: dugme za brisanje */}
                      <td className="kupci-actions-cell">
                        <button
                          type="button"
                          className="kupci-iconbtn danger"
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
                      <td colSpan={7} className="kupci-loading">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="kupci-pagination">
              <button
                className="kupci-pagebtn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev || loading}
                type="button"
              >
                <FiChevronLeft /> Prethodna
              </button>

              <div className="kupci-pageinfo">
                Strana <b>{meta?.current_page ?? page}</b> / <b>{meta?.last_page ?? "—"}</b>
              </div>

              <button
                className="kupci-pagebtn"
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
    </div>
  );
}

function SortMark({ dir }) {
  return <span className="kupci-sortmark">{dir === "asc" ? "▲" : "▼"}</span>;
}
