import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./NekretnineTable.css";

import { FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw, FiHome, FiPlus, FiTrash2 } from "react-icons/fi";
import CreateNekretninaModal from "../components/CreateNekretninaModal";

 
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
      const msg = Array.isArray(payload.errors[key]) ? payload.errors[key][0] : String(payload.errors[key]);
      errs[key] = msg;
    }
  }
  return errs;
}

/**
 * Formatiranje atributa za prikaz u 1 koloni
 * Podržava:
 * - r.atributi: array
 * - r.atributi: JSON string
 * - r.atributi_json: JSON string (fallback)
 */
function getAtributiLines(r) {
  const raw = r?.atributi ?? r?.atributi_json ?? null;
  if (!raw) return [];

  let arr = raw;

  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      const s = raw.trim();
      return s ? [s] : [];
    }
  }

  if (!Array.isArray(arr) || arr.length === 0) return [];

  return arr
    .map((a) => {
      const naziv = (a?.naziv ?? a?.name ?? "").toString().trim();
      const vred = (a?.vrednost ?? a?.value ?? "").toString().trim();
      if (!naziv && !vred) return "";
      if (naziv && vred) return `${naziv}: ${vred}`;
      return naziv || vred;
    })
    .filter(Boolean);
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

  // modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // brisanje
  const [deletingId, setDeletingId] = useState(null);

  const sortLabel = useMemo(() => {
    const f = SORTABLE.find((x) => x.key === sortBy);
    return f ? f.label : sortBy;
  }, [sortBy]);

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
        (e?.response?.status === 422 ? "Neispravni parametri pretrage." : "Greška pri učitavanju nekretnina.");
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
    setIsCreateOpen(true);
  }

  function closeCreate() {
    if (createLoading) return;
    setIsCreateOpen(false);
  }

 
  async function handleCreate(payloadFromModal) {
    setCreateError("");
    setFieldErrors({});

    // minimalna FE validacija (backend validira detaljno)
    if (!payloadFromModal?.adresa?.trim()) {
      setFieldErrors({ adresa: "Unesi adresu." });
      return;
    }
    if (payloadFromModal?.cena === "" || Number.isNaN(Number(payloadFromModal?.cena)) || Number(payloadFromModal?.cena) < 0) {
      setFieldErrors({ cena: "Unesi ispravnu cenu." });
      return;
    }

    setCreateLoading(true);
    try {
      const finalPayload = {
        adresa: payloadFromModal.adresa.trim(),
        tip: payloadFromModal.tip,
        status: payloadFromModal.status,
        cena: Number(payloadFromModal.cena),
        atributi: payloadFromModal.atributi ?? null, // ✅ šaljemo atribute
      };

      await api.post("/nekretnine", finalPayload);

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
            <p className="nek-subtitle">Pretraži po adresi, tipu ili statusu. Dodatno filtriraj po tipu i statusu.</p>
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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga nekretnina..." aria-label="Pretraga" />
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
                Lista nekretnina{" "}
                {meta ? <span className="nek-meta">({meta.from}-{meta.to} od {meta.total})</span> : null}
              </div>

              <div className="nek-mini">
                <span className="nek-mini-pill">Sort: {sortLabel} • {sortDir.toUpperCase()}</span>
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

                    <th className="hide-md">Atributi</th>

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
                      <td colSpan={7} className="nek-empty">Nema rezultata za ovu pretragu.</td>
                    </tr>
                  ) : null}

                  {rows.map((r) => {
                    const attrLines = getAtributiLines(r);

                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="nek-main">
                            <FiHome className="nek-homeic" />
                            <div className="nek-addr">{r.adresa || "—"}</div>
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

                        <td className="hide-md">
                          {attrLines.length ? (
                            <div className="nek-attrs-cell">
                              {attrLines.map((line, idx) => (
                                <div className="nek-attrs-line" key={idx} title={line}>
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
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
                    );
                  })}

                  {loading ? (
                    <tr>
                      <td colSpan={7} className="nek-loading">Učitavanje...</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="nek-pagination">
              <button className="nek-pagebtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || loading} type="button">
                <FiChevronLeft /> Prethodna
              </button>

              <div className="nek-pageinfo">
                Strana <b>{meta?.current_page ?? page}</b> / <b>{meta?.last_page ?? "—"}</b>
              </div>

              <button className="nek-pagebtn" onClick={() => setPage((p) => p + 1)} disabled={!canNext || loading} type="button">
                Sledeća <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </section>
 
      <CreateNekretninaModal
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
  return <span className="nek-sortmark">{dir === "asc" ? "▲" : "▼"}</span>;
}
