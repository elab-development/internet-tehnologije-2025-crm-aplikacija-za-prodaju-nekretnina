import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom"; 
import "./Nekretnine.css";
import api from "../api/axios";
import { toImageUrl } from "../utils/media";

const money = (v) =>
  new Intl.NumberFormat("sr-RS", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v || 0));

function normalizeImages(slke = []) {
  if (!Array.isArray(slke)) return [];
  return [...slke]
    .sort((a, b) => (b.istaknuta ? 1 : 0) - (a.istaknuta ? 1 : 0) || Number(a.redosled || 0) - Number(b.redosled || 0))
    .map((s) => ({
      id: s.id,
      istaknuta: !!s.istaknuta,
      redosled: s.redosled ?? 0,
      url: toImageUrl(s.putanja),
    }));
}

export default function NekretninaDetailsPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const images = useMemo(() => normalizeImages(item?.slike || []), [item]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await api.get(`/nekretnine/${id}`);
        if (!alive) return;
        setItem(res.data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Greška pri učitavanju detalja nekretnine.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    // kad se item učita, postavi aktivnu sliku na istaknutu (ako postoji)
    const idx = images.findIndex((x) => x.istaknuta);
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [images.length]); // namerno samo kad se promeni broj slika

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setActiveIdx((p) => Math.min(p + 1, images.length - 1));
      if (e.key === "ArrowLeft") setActiveIdx((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  const attrs = item?.atributi && typeof item.atributi === "object" ? item.atributi : null;

  return (
    <div className="nek-outer">
      <section className="nek-hero">
        <div className="nek-bg" />
        <div className="container">
          <div className="nek-head">
            <div>
              <div className="nek-badge">
                <span className="nek-dot" />
                Detalji nekretnine
              </div>
              <h1 className="nek-title">{item?.adresa || "Nekretnina"}</h1>
              <p className="nek-subtitle">
                <span className="nek-inline-pill">{item?.tip || "tip"}</span>
                <span className="nek-inline-pill">{item?.status || "status"}</span>
                <span className="nek-inline-pill strong">{money(item?.cena)}</span>
              </p>
            </div>

            <div className="nek-actions"> 
              {images.length ? (
                <button className="nek-btn primary" onClick={() => setLightboxOpen(true)}>
                  Otvori galeriju
                </button>
              ) : null}
            </div>
          </div>

          {err ? <div className="nek-error">{err}</div> : null}
        </div>
      </section>

      <section className="container nek-section">
        {loading ? (
          <div className="nek-loading">Učitavanje...</div>
        ) : !item ? (
          <div className="nek-empty">Nekretnina nije pronađena.</div>
        ) : (
          <div className="nek-details">
            {/* GALERIJA */}
            <div className="nek-gallery">
              <div className="nek-mainimg" onClick={() => images.length && setLightboxOpen(true)} role="button" tabIndex={0}>
                {images[activeIdx]?.url ? (
                  <img src={images[activeIdx].url} alt="Nekretnina" />
                ) : (
                  <div className="nek-media-ph big">Bez slike</div>
                )}
              </div>

              {images.length ? (
                <div className="nek-thumbs">
                  {images.map((im, idx) => (
                    <button
                      key={im.id || idx}
                      className={`nek-thumb ${idx === activeIdx ? "is-active" : ""}`}
                      onClick={() => setActiveIdx(idx)}
                      title={im.istaknuta ? "Istaknuta slika" : "Slika"}
                    >
                      <img src={im.url} alt="" />
                      {im.istaknuta ? <span className="nek-thumb-star">★</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* DETALJI */}
            <div className="nek-panel">
              <div className="nek-panel-top">
                <div className="nek-panel-title">Detalji</div>
                <div className="nek-mini">
                  <span className="nek-mini-pill subtle">ID: {item.id}</span>
                  {images.length ? <span className="nek-mini-pill">{images.length} slika</span> : <span className="nek-mini-pill subtle">0 slika</span>}
                </div>
              </div>

              <div className="nek-info">
                <div className="nek-row">
                  <div className="nek-k">Adresa</div>
                  <div className="nek-v">{item.adresa || "—"}</div>
                </div>
                <div className="nek-row">
                  <div className="nek-k">Tip</div>
                  <div className="nek-v">{item.tip || "—"}</div>
                </div>
                <div className="nek-row">
                  <div className="nek-k">Status</div>
                  <div className="nek-v">{item.status || "—"}</div>
                </div>
                <div className="nek-row">
                  <div className="nek-k">Cena</div>
                  <div className="nek-v strong">{money(item.cena)}</div>
                </div>

                {attrs ? (
                  <div className="nek-attrs">
                    <div className="nek-attrs-title">Atributi</div>
                    <div className="nek-attrs-grid">
                      {Object.entries(attrs).map(([k, v]) => (
                        <div key={k} className="nek-attr">
                          <div className="nek-attr-k">{k}</div>
                          <div className="nek-attr-v">{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="nek-hint">Nema dodatnih atributa.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen ? (
        <div className="nek-lightbox" onMouseDown={() => setLightboxOpen(false)}>
          <div className="nek-lightbox-inner" onMouseDown={(e) => e.stopPropagation()}>
            <button className="nek-x" onClick={() => setLightboxOpen(false)} aria-label="Zatvori">
              ✕
            </button>

            <button className="nek-nav left" onClick={() => setActiveIdx((p) => Math.max(p - 1, 0))} disabled={activeIdx === 0}>
              ←
            </button>

            <div className="nek-lightbox-img">
              {images[activeIdx]?.url ? <img src={images[activeIdx].url} alt="Nekretnina" /> : null}
            </div>

            <button
              className="nek-nav right"
              onClick={() => setActiveIdx((p) => Math.min(p + 1, images.length - 1))}
              disabled={activeIdx === images.length - 1}
            >
              →
            </button>

            <div className="nek-lightbox-meta">
              <span className="nek-mini-pill">{activeIdx + 1}/{images.length}</span>
              {images[activeIdx]?.istaknuta ? <span className="nek-mini-pill">Istaknuta</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}