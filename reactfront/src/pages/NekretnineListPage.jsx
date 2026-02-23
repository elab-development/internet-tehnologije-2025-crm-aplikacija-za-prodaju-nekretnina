import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";  
import "./Nekretnine.css"; 
import api from "../api/axios";
import { toImageUrl } from "../utils/media";

const money = (v) =>
  new Intl.NumberFormat("sr-RS", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v || 0));

function pickCover(slke = []) {
  if (!Array.isArray(slke) || slke.length === 0) return "";
  const featured = slke.find((s) => s.istaknuta);
  return toImageUrl((featured || slke[0]).putanja);
}

export default function NekretnineListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new"); // new | price_asc | price_desc | addr

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get("/nekretnine");
        if (!alive) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Greška pri učitavanju nekretnina.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = [...items];

    if (qq) {
      arr = arr.filter((n) => {
        const adresa = (n.adresa || "").toLowerCase();
        const tip = (n.tip || "").toLowerCase();
        const status = (n.status || "").toLowerCase();
        return adresa.includes(qq) || tip.includes(qq) || status.includes(qq);
      });
    }

    arr.sort((a, b) => {
      if (sort === "price_asc") return Number(a.cena || 0) - Number(b.cena || 0);
      if (sort === "price_desc") return Number(b.cena || 0) - Number(a.cena || 0);
      if (sort === "addr") return String(a.adresa || "").localeCompare(String(b.adresa || ""));
      // "new" -> created_at desc ako postoji, inače id desc
      const da = a.created_at ? new Date(a.created_at).getTime() : Number(a.id || 0);
      const db = b.created_at ? new Date(b.created_at).getTime() : Number(b.id || 0);
      return db - da;
    });

    return arr;
  }, [items, q, sort]);

  return (
    <div className="nek-outer">
      <section className="nek-hero">
        <div className="nek-bg" />
        <div className="container">
          <div className="nek-head">
            <div>
              <div className="nek-badge">
                <span className="nek-dot" />
                Pregled nekretnina
              </div>
              <h1 className="nek-title">Nekretnine</h1>
              <p className="nek-subtitle">
                Pretraži i otvori detalje svake nekretnine. Kartice prikazuju osnovne informacije i istaknutu sliku.
              </p>
            </div>

            <div className="nek-actions">
              <div className="nek-search">
                <span className="nek-search-ic"></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga (adresa, tip, status)..." />
              </div>

              <div className="nek-select">
                <span className="nek-select-ic">↕</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="new">Najnovije</option>
                  <option value="price_asc">Cena ↑</option>
                  <option value="price_desc">Cena ↓</option>
                  <option value="addr">Adresa A–Z</option>
                </select>
              </div>
            </div>
          </div>

          {err ? <div className="nek-error">{err}</div> : null}
        </div>
      </section>

      <section className="container nek-section">
        {loading ? (
          <div className="nek-loading">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="nek-empty">Nema rezultata.</div>
        ) : (
          <div className="nek-grid">
            {filtered.map((n) => {
              const cover = pickCover(n.slike);
              return (
                <Link key={n.id} className="nek-card" to={`/ponuda-nekretnina/${n.id}`}>
                  <div className="nek-media">
                    {cover ? <img src={cover} alt={n.adresa || "Nekretnina"} /> : <div className="nek-media-ph">Bez slike</div>}
                    <div className="nek-pillrow">
                      <span className="nek-pill">{n.tip || "tip"}</span>
                      <span className={`nek-pill ${String(n.status || "").toLowerCase() === "dostupna" ? "ok" : ""}`}>
                        {n.status || "status"}
                      </span>
                    </div>
                  </div>

                  <div className="nek-body">
                    <div className="nek-addr">{n.adresa || "—"}</div>
                    <div className="nek-price">{money(n.cena)}</div>

                    <div className="nek-mini">
                      <span className="nek-mini-pill subtle">ID: {n.id}</span>
                      {n.slike?.length ? <span className="nek-mini-pill">{n.slike.length} slika</span> : <span className="nek-mini-pill subtle">0 slika</span>}
                    </div>

                    <div className="nek-cta">
                      <span>Detalji</span>
                      <span aria-hidden>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}