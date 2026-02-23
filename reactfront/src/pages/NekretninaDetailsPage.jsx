import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./Nekretnine.css";
import api from "../api/axios";
import { toImageUrl } from "../utils/media";

import {
  FiTag,
  FiInfo,
  FiWind,
  FiTruck,
  FiHome,
  FiGrid,
  FiDroplet,
  FiSun,
  FiZap,
  FiMapPin,
  FiLayers,
  FiUsers,
  FiKey,
} from "react-icons/fi";

const FX_API = "https://api.frankfurter.app";
const BASE_CCY = "EUR";

/*
  Geocoding (adresa -> lat/lon) bez backend-a:
  Koristimo OpenStreetMap Nominatim. Vraća koordinate, a mapu prikazujemo kao OSM iframe.
*/
const GEOCODE_API = "https://nominatim.openstreetmap.org/search";

function normalizeImages(slke = []) {
  if (!Array.isArray(slke)) return [];
  return [...slke]
    .sort(
      (a, b) =>
        (b.istaknuta ? 1 : 0) - (a.istaknuta ? 1 : 0) ||
        Number(a.redosled || 0) - Number(b.redosled || 0)
    )
    .map((s) => ({
      id: s.id,
      istaknuta: !!s.istaknuta,
      redosled: s.redosled ?? 0,
      url: toImageUrl(s.putanja),
    }));
}

function moneyFmt(amount, currency) {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${Math.round(n)} ${currency}`;
  }
}

const ICONS = {
  FiTag,
  FiInfo,
  FiWind,
  FiTruck,
  FiHome,
  FiGrid,
  FiDroplet,
  FiSun,
  FiZap,
  FiMapPin,
  FiLayers,
  FiUsers,
  FiKey,
};

function AttrIcon({ name }) {
  const Comp = ICONS[name] || FiTag;
  return <Comp aria-hidden="true" />;
}

export default function NekretninaDetailsPage() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const images = useMemo(() => normalizeImages(item?.slike || []), [item]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem("nek_currency") || BASE_CCY;
    } catch {
      return BASE_CCY;
    }
  });

  const [currencyList, setCurrencyList] = useState([
    { code: "EUR", name: "Euro" },
    { code: "RSD", name: "Srpski dinar" },
    { code: "USD", name: "US Dollar" },
    { code: "CHF", name: "Swiss Franc" },
    { code: "GBP", name: "British Pound" },
  ]);

  const [fxRate, setFxRate] = useState(1);
  const [fxLoading, setFxLoading] = useState(false);
  const [fxErr, setFxErr] = useState("");

  // MAPA (lat/lon)
  const [geo, setGeo] = useState(null); // { lat, lon, displayName }
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("nek_currency", currency || BASE_CCY);
    } catch {}
  }, [currency]);

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
    const idx = images.findIndex((x) => x.istaknuta);
    setActiveIdx(idx >= 0 ? idx : 0);
  }, [images.length]);

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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(`${FX_API}/currencies`);
        if (!res.ok) return;
        const data = await res.json();
        if (!alive) return;

        const arr = Object.entries(data || {})
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.code.localeCompare(b.code));

        if (arr.length) setCurrencyList(arr);
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!currency || currency === BASE_CCY) {
        setFxRate(1);
        setFxErr("");
        return;
      }

      try {
        setFxLoading(true);
        setFxErr("");

        const url = `${FX_API}/latest?from=${encodeURIComponent(BASE_CCY)}&to=${encodeURIComponent(currency)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("FX fetch failed");

        const data = await res.json();
        const rate = Number(data?.rates?.[currency]);

        if (!alive) return;

        if (!rate || Number.isNaN(rate)) {
          setFxErr("Nije moguće dobiti kurs za izabranu valutu. Prikazujem EUR.");
          setFxRate(1);
          return;
        }

        setFxRate(rate);
      } catch {
        if (!alive) return;
        setFxErr("Greška pri preuzimanju kursa. Prikazujem EUR.");
        setFxRate(1);
      } finally {
        if (alive) setFxLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [currency]);

  // Geocode kad se promeni adresa
  useEffect(() => {
    let alive = true;

    (async () => {
      const address = String(item?.adresa || "").trim();
      if (!address) {
        setGeo(null);
        setGeoErr("");
        return;
      }

      try {
        setGeoLoading(true);
        setGeoErr("");
        setGeo(null);

        const url = `${GEOCODE_API}?format=json&limit=1&q=${encodeURIComponent(address)}`;

        const res = await fetch(url, {
          headers: {
            "Accept-Language": "sr,en;q=0.8",
          },
        });

        if (!res.ok) throw new Error("Geocode failed");

        const data = await res.json();
        if (!alive) return;

        const first = Array.isArray(data) ? data[0] : null;
        const lat = first?.lat ? Number(first.lat) : null;
        const lon = first?.lon ? Number(first.lon) : null;

        if (!lat || !lon || Number.isNaN(lat) || Number.isNaN(lon)) {
          setGeoErr("Nije moguće pronaći lokaciju za unetu adresu.");
          setGeo(null);
          return;
        }

        setGeo({
          lat,
          lon,
          displayName: first?.display_name || address,
        });
      } catch {
        if (!alive) return;
        setGeoErr("Greška pri preuzimanju lokacije (mapa nije dostupna).");
        setGeo(null);
      } finally {
        if (alive) setGeoLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [item?.adresa]);

  const attrsArray = useMemo(() => {
    const a = item?.atributi;
    if (!a) return [];
    if (Array.isArray(a)) return a;
    if (typeof a === "object") return Object.entries(a).map(([k, v]) => ({ naziv: k, vrednost: v, icon: "FiTag" }));
    return [];
  }, [item]);

  const priceEUR = Number(item?.cena || 0);

  const convertedPrice = useMemo(() => {
    if (!currency || currency === BASE_CCY) return priceEUR;
    return priceEUR * Number(fxRate || 1);
  }, [priceEUR, currency, fxRate]);

  const subtitlePrice = fxLoading ? "Učitavam kurs..." : moneyFmt(convertedPrice, currency);

  const osmEmbedUrl = useMemo(() => {
    if (!geo?.lat || !geo?.lon) return "";
    const lat = geo.lat;
    const lon = geo.lon;

    // mali bbox oko tacke da se lepo vidi pin
    const d = 0.01;
    const left = lon - d;
    const right = lon + d;
    const top = lat + d;
    const bottom = lat - d;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      `${left},${bottom},${right},${top}`
    )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lon}`)}`;
  }, [geo?.lat, geo?.lon]);

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
                <span className="nek-inline-pill strong">{subtitlePrice}</span>

                <span className="nek-inline-pill" style={{ padding: 0 }}>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    aria-label="Valuta"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      padding: "6px 10px",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {currencyList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </span>
              </p>

              {fxErr ? <div className="nek-error">{fxErr}</div> : null}
            </div>

            <div className="nek-actions" />
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
                      type="button"
                    >
                      <img src={im.url} alt="" />
                      {im.istaknuta ? <span className="nek-thumb-star">★</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

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
                  <div className="nek-v strong">{moneyFmt(convertedPrice, currency)}</div>
                </div>

                {currency !== BASE_CCY ? (
                  <div className="nek-hint">
                    Kurs: 1 {BASE_CCY} = {Number(fxRate || 1).toFixed(4)} {currency}
                  </div>
                ) : null}

                {attrsArray.length ? (
                  <div className="nek-attrs">
                    <div className="nek-attrs-title">Atributi</div>

                    <div className="nek-attrs-grid">
                      {attrsArray.map((a, i) => (
                        <div key={`${a?.naziv || "attr"}-${i}`} className="nek-attr">
                          <div className="nek-attr-k" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                              <AttrIcon name={a?.icon} />
                            </span>
                            <span>{a?.naziv ?? "Atribut"}</span>
                          </div>

                          <div className="nek-attr-v">{String(a?.vrednost ?? "")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="nek-hint">Nema dodatnih atributa.</div>
                )}

                {/* MAPA */}
                <div className="nek-mapwrap">
                  <div className="nek-attrs-title" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                    <FiMapPin /> Lokacija
                  </div>

                  {geoLoading ? <div className="nek-hint">Učitavam lokaciju...</div> : null}
                  {geoErr ? <div className="nek-hint">{geoErr}</div> : null}

                  {!geoLoading && geo && osmEmbedUrl ? (
                    <div className="nek-map">
                      <iframe
                        title="Mapa"
                        src={osmEmbedUrl}
                        style={{ width: "100%", height: 260, border: 0, borderRadius: 16 }}
                        loading="lazy"
                      />
                      <div className="nek-hint" style={{ marginTop: 8 }}>
                        {geo.displayName}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {lightboxOpen ? (
        <div className="nek-lightbox" onMouseDown={() => setLightboxOpen(false)}>
          <div className="nek-lightbox-inner" onMouseDown={(e) => e.stopPropagation()}>
            <button className="nek-x" onClick={() => setLightboxOpen(false)} aria-label="Zatvori" type="button">
              ✕
            </button>

            <button
              className="nek-nav left"
              onClick={() => setActiveIdx((p) => Math.max(p - 1, 0))}
              disabled={activeIdx === 0}
              type="button"
            >
              ←
            </button>

            <div className="nek-lightbox-img">
              {images[activeIdx]?.url ? <img src={images[activeIdx].url} alt="Nekretnina" /> : null}
            </div>

            <button
              className="nek-nav right"
              onClick={() => setActiveIdx((p) => Math.min(p + 1, images.length - 1))}
              disabled={activeIdx === images.length - 1}
              type="button"
            >
              →
            </button>

            <div className="nek-lightbox-meta">
              <span className="nek-mini-pill">
                {activeIdx + 1}/{images.length}
              </span>
              {images[activeIdx]?.istaknuta ? <span className="nek-mini-pill">Istaknuta</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}