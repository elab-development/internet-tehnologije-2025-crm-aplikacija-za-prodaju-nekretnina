import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  FiMaximize2,
  FiHome,
  FiLayers,
  FiWind,
  FiDroplet,
  FiTruck,
  FiSun,
  FiMoon,
  FiMapPin,
  FiKey,
} from "react-icons/fi";

/**
 * Korisnik bira "atribut tip" (Kvadratura, Spratnost...)
 * Ikonica se automatski postavi na osnovu tog izbora.
 */
const ATTR_TYPES = [
  { type: "kvadratura", label: "Kvadratura", iconKey: "FiMaximize2", Comp: FiMaximize2 },
  { type: "spratnost", label: "Spratnost", iconKey: "FiLayers", Comp: FiLayers },
  { type: "grejanje", label: "Grejanje/Vent.", iconKey: "FiWind", Comp: FiWind },
  { type: "kupatilo", label: "Kupatilo", iconKey: "FiDroplet", Comp: FiDroplet },
  { type: "parking", label: "Parking/Garaža", iconKey: "FiTruck", Comp: FiTruck },
  { type: "osuncanost", label: "Osunčanost", iconKey: "FiSun", Comp: FiSun },
  { type: "mirnoca", label: "Mirnoća", iconKey: "FiMoon", Comp: FiMoon },
  { type: "lokacija", label: "Lokacija", iconKey: "FiMapPin", Comp: FiMapPin },
  { type: "uselivo", label: "Useljivo", iconKey: "FiKey", Comp: FiKey },

  // ✅ DODATO: da addAttr ne puca + da postoji u select-u
  { type: "tip_objekta", label: "Tip objekta", iconKey: "FiHome", Comp: FiHome },
];

function uid() {
  // dovoljno za key u UI
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function CreateNekretninaModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  fieldErrors,
}) {
  const [form, setForm] = useState({
    adresa: "",
    tip: "stan",
    cena: "",
    status: "dostupna",
  });

  /**
   * attrs item:
   * - id: unique (za stabilan key)
   * - type: "kvadratura" | ...
   * - icon: "FiMaximize2" (auto by type)
   * - naziv: user editable
   * - vrednost: user input
   */
  const [attrs, setAttrs] = useState([
    { id: uid(), type: "kvadratura", icon: "FiMaximize2", naziv: "Kvadratura", vrednost: "" },
  ]);

  const iconMap = useMemo(() => {
    const m = {};
    ATTR_TYPES.forEach((x) => (m[x.iconKey] = x.Comp));
    return m;
  }, []);

  const typeMap = useMemo(() => {
    const m = {};
    ATTR_TYPES.forEach((x) => (m[x.type] = x));
    return m;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setForm({ adresa: "", tip: "stan", cena: "", status: "dostupna" });
    setAttrs([
      { id: uid(), type: "kvadratura", icon: "FiMaximize2", naziv: "Kvadratura", vrednost: "" },
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  function updateAttr(id, patch) {
    setAttrs((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function changeAttrType(id, newType) {
    const picked = typeMap[newType] || typeMap["kvadratura"];

    setAttrs((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;

        const currentTypeLabel = typeMap[a.type]?.label || "";
        const shouldAutofillName =
          !a.naziv?.trim() || a.naziv.trim() === currentTypeLabel;

        return {
          ...a,
          type: picked.type,
          icon: picked.iconKey,
          naziv: shouldAutofillName ? picked.label : a.naziv,
        };
      })
    );
  }

  function addAttr() {
    // ✅ FIX: "tip_objekta" sada postoji, plus fallback za svaki slučaj
    const picked = typeMap["tip_objekta"] || typeMap["kvadratura"];

    setAttrs((prev) => [
      ...prev,
      {
        id: uid(),
        type: picked.type,
        icon: picked.iconKey,
        naziv: picked.label, // default naziv da ne ostane prazno
        vrednost: "",
      },
    ]);
  }

  function removeAttr(id) {
    setAttrs((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanAttrs = attrs
      .map((a) => ({
        icon: (a.icon || "FiHome").toString(),
        naziv: (a.naziv || "").trim(),
        vrednost: (a.vrednost || "").trim(),
        // ako ti treba i tip na backendu, otkomentariši:
        // type: (a.type || "").toString(),
      }))
      .filter((a) => a.naziv !== "" || a.vrednost !== "");

    await onSubmit({
      adresa: form.adresa.trim(),
      tip: form.tip,
      status: form.status,
      cena: form.cena,
      atributi: cleanAttrs.length ? cleanAttrs : null,
    });
  }

  return (
    <div className="nek-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nek-modal crm-glass">
        <div className="nek-modal-top">
          <div className="nek-modal-title">Nova nekretnina</div>

          <button
            className="nek-iconbtn"
            type="button"
            onClick={onClose}
            disabled={loading}
            title="Zatvori"
          >
            <FiX />
          </button>
        </div>

        <div className="nek-modal-body">
          {error ? (
            <div className="nek-error" style={{ borderBottom: "none" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="nek-form">
            <label className="nek-label">
              Adresa
              <input
                className={`nek-input ${fieldErrors?.adresa ? "is-error" : ""}`}
                value={form.adresa}
                onChange={(e) => setForm((f) => ({ ...f, adresa: e.target.value }))}
                placeholder="npr. Bulevar kralja Aleksandra 12"
              />
              {fieldErrors?.adresa ? (
                <div className="nek-field-error">{fieldErrors.adresa}</div>
              ) : null}
            </label>

            <div className="nek-grid2">
              <label className="nek-label">
                Tip
                <select
                  className={`nek-input ${fieldErrors?.tip ? "is-error" : ""}`}
                  value={form.tip}
                  onChange={(e) => setForm((f) => ({ ...f, tip: e.target.value }))}
                >
                  <option value="stan">Stan</option>
                  <option value="kuca">Kuća</option>
                  <option value="lokal">Lokal</option>
                  <option value="plac">Plac</option>
                </select>
              </label>

              <label className="nek-label">
                Status
                <select
                  className={`nek-input ${fieldErrors?.status ? "is-error" : ""}`}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="dostupna">Dostupna</option>
                  <option value="rezervisana">Rezervisana</option>
                  <option value="prodata">Prodata</option>
                </select>
              </label>
            </div>

            <label className="nek-label">
              Cena (€)
              <input
                className={`nek-input ${fieldErrors?.cena ? "is-error" : ""}`}
                value={form.cena}
                onChange={(e) => setForm((f) => ({ ...f, cena: e.target.value }))}
                placeholder="npr. 125000"
                inputMode="numeric"
              />
              {fieldErrors?.cena ? (
                <div className="nek-field-error">{fieldErrors.cena}</div>
              ) : null}
            </label>

            {/* ATRIBUTI */}
            <div className="nek-attrs">
              <div className="nek-attrs-top">
                <div className="nek-attrs-title">Atributi</div>
                <button className="nek-btn" type="button" onClick={addAttr} disabled={loading}>
                  <FiPlus /> Dodaj atribut
                </button>
              </div>

              <div className="nek-attrs-list">
                {attrs.map((a) => {
                  const IconComp = iconMap[a.icon] || FiHome;

                  return (
                    <div className="nek-attr-row" key={a.id}>
                      {/* TIP (izbor) + ikonica (auto) */}
                      <div className="nek-attr-col">
                        <span className="nek-attr-label">Atribut</span>

                        <div className="nek-icselect">
                          <span className="nek-icpill" title="Ikonica">
                            <IconComp />
                          </span>

                          <select
                            className="nek-input"
                            value={a.type}
                            onChange={(e) => changeAttrType(a.id, e.target.value)}
                          >
                            {ATTR_TYPES.map((opt) => (
                              <option key={opt.type} value={opt.type}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="nek-attr-col">
                        <span className="nek-attr-label">Naziv</span>
                        <input
                          className="nek-input"
                          value={a.naziv}
                          onChange={(e) => updateAttr(a.id, { naziv: e.target.value })}
                          placeholder="npr. Kvadratura"
                        />
                      </div>

                      <div className="nek-attr-col">
                        <span className="nek-attr-label">Vrednost</span>
                        <input
                          className="nek-input"
                          value={a.vrednost}
                          onChange={(e) => updateAttr(a.id, { vrednost: e.target.value })}
                          placeholder="npr. 62 m²"
                        />
                      </div>

                      <button
                        type="button"
                        className="nek-iconbtn danger"
                        title="Ukloni"
                        onClick={() => removeAttr(a.id)}
                        disabled={loading || attrs.length === 1}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="nek-attrs-hint">
                Unesi npr. kvadraturu, sprat, grejanje… Prazne stavke se ne čuvaju.
              </div>
            </div>

            <div className="nek-form-actions">
              <button className="nek-btn" type="button" onClick={onClose} disabled={loading}>
                Otkaži
              </button>
              <button className="nek-btn primary" type="submit" disabled={loading}>
                {loading ? (
                  "Čuvanje..."
                ) : (
                  <>
                    Sačuvaj <FiSave />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
