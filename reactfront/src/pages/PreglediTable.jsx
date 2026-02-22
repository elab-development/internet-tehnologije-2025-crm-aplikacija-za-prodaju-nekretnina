import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./PreglediTable.css";

import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiCalendar,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";

import CreatePregledModal from "../components/CreatePregledModal";

const SORTABLE = [
  { key: "datum_vreme", label: "Datum/Vreme" },
  { key: "status", label: "Status" },
  { key: "kupac_id", label: "KupacID" },
  { key: "nekretnina_id", label: "NekretninaID" },
  { key: "created_at", label: "Kreirano" },
];

function fmtDateTime(v) {
  if (!v) return "—";
  const s = String(v);
  // ISO "2026-02-08T17:57:13.000000Z" -> "2026-02-08 17:57"
  if (s.includes("T")) return s.replace("T", " ").slice(0, 16);
  // "2026-02-08 17:57:00" -> "2026-02-08 17:57"
  return s.slice(0, 16);
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
      const msg = Array.isArray(payload.errors[key]) ? payload.errors[key][0] : String(payload.errors[key]);
      errs[key] = msg;
    }
  }
  return errs;
}

export default function PreglediTable() {
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [sortBy, setSortBy] = useState("datum_vreme");
  const [sortDir, setSortDir] = useState("desc");

  const [status, setStatus] = useState("");

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // brisanje
  const [deletingId, setDeletingId] = useState(null);

  // create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

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
      const res = await api.get("/pregledi/search", {
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
        (e?.response?.status === 422 ? "Neispravni parametri pretrage." : "Greška pri učitavanju pregleda.");
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
    const ok = window.confirm("Da li sigurno želiš da obrišeš ovaj pregled?");
    if (!ok) return;

    setDeletingId(id);
    setErr("");
    try {
      await api.delete(`/pregledi/${id}`);

      const willBeEmpty = rows.length === 1 && (meta?.current_page ?? page) > 1;
      if (willBeEmpty) setPage((p) => Math.max(1, p - 1));
      else await fetchData();
    } catch (e3) {
      setErr("Greška pri brisanju pregleda.");
    } finally {
      setDeletingId(null);
    }
  }

  function openCreate() {
    setCreateError("");
    setFieldErrors({});
    setIsCreateOpen(true);
  }

  function closeCreate() {
    if (createLoading) return;
    setIsCreateOpen(false);
  }

  async function handleCreate(payloadFromModal) {
    setCreateError("");
    setFieldErrors({});

    // FE validacija
    const fe = {};
    if (!payloadFromModal?.kupac_id) fe.kupac_id = "Izaberi kupca.";
    if (!payloadFromModal?.nekretnina_id) fe.nekretnina_id = "Izaberi nekretninu.";
    if (!payloadFromModal?.datum_vreme) fe.datum_vreme = "Izaberi datum i vreme.";

    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }

    setCreateLoading(true);
    try {
      const finalPayload = {
        kupac_id: Number(payloadFromModal.kupac_id),
        nekretnina_id: Number(payloadFromModal.nekretnina_id),
        datum_vreme: payloadFromModal.datum_vreme, // "YYYY-MM-DDTHH:mm"
        status: payloadFromModal.status || "zakazan",
        napomena: payloadFromModal.napomena || null,
        // ako želiš da upišeš ko je zakazao:
        // korisnik_id: (JSON.parse(localStorage.getItem("auth_user")||"null")?.id)  // samo ako backend očekuje
      };

      await api.post("/pregledi", finalPayload);

      setIsCreateOpen(false);
      setPage(1);
      await fetchData();
    } catch (e2) {
      const statusCode = e2?.response?.status;
      const data = e2?.response?.data;

      if (statusCode === 422) {
        setFieldErrors(normalizeErrors(data));
        setCreateError("Proveri unete podatke.");
      } else {
        setCreateError("Greška pri kreiranju pregleda. Pokušaj ponovo.");
      }
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="crm pregledi-page">
      <section className="pregledi-hero">
        <div className="pregledi-bg" aria-hidden="true" />

        <div className="crm-container pregledi-head">
          <div>
            <div className="pregledi-badge">
              <span className="pregledi-dot" />
              Pregledi
            </div>
            <h1 className="pregledi-title">Upravljanje pregledima nekretnina</h1>
            <p className="pregledi-subtitle">Pretraga, filtriranje, sortiranje i kreiranje pregleda.</p>
          </div>

          <div className="pregledi-actions">
            <button className="pregledi-btn" type="button" onClick={openCreate} disabled={loading}>
              <FiPlus /> Novi pregled
            </button>
            <button className="pregledi-btn" type="button" onClick={fetchData} disabled={loading}>
              <FiRefreshCw /> Osveži
            </button>
          </div>
        </div>

        <div className="crm-container pregledi-toolbar">
          <div className="pregledi-search">
            <FiSearch className="pregledi-search-ic" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga pregleda..." aria-label="Pretraga" />
          </div>

          <div className="pregledi-filters">
            <div className="pregledi-select">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Svi</option>
                <option value="zakazan">Zakazan</option>
                <option value="odrzan">Održan</option>
                <option value="otkazan">Otkazan</option>
              </select>
            </div>

            <div className="pregledi-select">
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

            <div className="pregledi-select">
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
          <div className="pregledi-card crm-glass">
            <div className="pregledi-card-top">
              <div className="pregledi-card-title">
                Lista pregleda {meta ? <span className="pregledi-meta">({meta.from}-{meta.to} od {meta.total})</span> : null}
              </div>

              <div className="pregledi-mini">
                <span className="pregledi-mini-pill">
                  Sort: {sortLabel} • {sortDir.toUpperCase()}
                </span>
                {loading ? <span className="pregledi-mini-pill subtle">Učitavanje...</span> : null}
              </div>
            </div>

            {err ? <div className="pregledi-error">{err}</div> : null}

            <div className="pregledi-table-wrap">
              <table className="pregledi-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("kupac_id")} className="is-sort">
                      Kupac {sortBy === "kupac_id" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("nekretnina_id")} className="is-sort">
                      Nekretnina {sortBy === "nekretnina_id" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("datum_vreme")} className="is-sort">
                      Datum/Vreme {sortBy === "datum_vreme" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th onClick={() => toggleSort("status")} className="is-sort">
                      Status {sortBy === "status" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="hide-md">Napomena</th>
                    <th className="hide-md" onClick={() => toggleSort("created_at")} style={{ cursor: "pointer" }}>
                      Kreirano {sortBy === "created_at" ? <SortMark dir={sortDir} /> : null}
                    </th>
                    <th className="pregledi-actions-col">Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="pregledi-empty">
                        Nema rezultata za ovu pretragu.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="pregledi-main">
                          <FiCalendar className="pregledi-ic" />
                          <div className="pregledi-id" title={`KupacID: ${r.kupac_id ?? "—"}`}>
                            {r.kupac_full || r.kupac_ime_prezime || r.kupac_id || "—"}
                          </div>
                        </div>
                      </td>

                      <td title={`NekretninaID: ${r.nekretnina_id ?? "—"}`}>
                        <div className="pregledi-nek">
                          <div className="pregledi-nek-addr">{r.nekretnina_adresa || r.nekretnina_naziv || r.nekretnina_id || "—"}</div>
                          <div className="pregledi-nek-tip">{r.nekretnina_tip ? String(r.nekretnina_tip) : ""}</div>
                        </div>
                      </td>

                      <td className="pregledi-dt">{fmtDateTime(r.datum_vreme)}</td>

                      <td className="pregledi-pillcol">
                        <span className={`pregledi-pill pregledi-pill-${(r.status || "").toString().toLowerCase()}`}>
                          {(r.status || "—").toString()}
                        </span>
                      </td>

                      <td className="hide-md">{r.napomena || "—"}</td>

                      <td className="hide-md">{r.created_at ? fmtDateTime(r.created_at) : "—"}</td>

                      <td className="pregledi-actions-cell">
                        <button
                          type="button"
                          className="pregledi-iconbtn danger"
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
                      <td colSpan={7} className="pregledi-loading">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="pregledi-pagination">
              <button className="pregledi-pagebtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || loading} type="button">
                <FiChevronLeft /> Prethodna
              </button>

              <div className="pregledi-pageinfo">
                Strana <b>{meta?.current_page ?? page}</b> / <b>{meta?.last_page ?? "—"}</b>
              </div>

              <button className="pregledi-pagebtn" onClick={() => setPage((p) => p + 1)} disabled={!canNext || loading} type="button">
                Sledeća <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      <CreatePregledModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        onSubmit={handleCreate}
        loading={createLoading}
        error={createError}
        fieldErrors={fieldErrors}
      />
    </div>
  );
}

function SortMark({ dir }) {
  return <span className="pregledi-sortmark">{dir === "asc" ? "▲" : "▼"}</span>;
}