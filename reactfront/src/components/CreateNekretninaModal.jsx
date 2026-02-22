import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiSave, FiPlus, FiTrash2, FiImage } from "react-icons/fi";
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

  // da addAttr ne puca + postoji u select-u
  { type: "tip_objekta", label: "Tip objekta", iconKey: "FiHome", Comp: FiHome },
];

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParseArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

function fileToPreviewUrl(file) {
  try {
    return URL.createObjectURL(file);
  } catch {
    return "";
  }
}

export default function CreateNekretninaModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  fieldErrors,
  mode = "create", // "create" | "edit"
  initialData = null, // row from table for edit
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

  /**
   * images (NEW to upload):
   * [{ id, file, previewUrl, istaknuta, redosled }]
   */
  const [images, setImages] = useState([]);

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

    // RESET + init for create/edit
    if (mode === "edit" && initialData) {
      setForm({
        adresa: initialData?.adresa ?? "",
        tip: initialData?.tip ?? "stan",
        cena: initialData?.cena ?? "",
        status: initialData?.status ?? "dostupna",
      });

      const rawAttrs = safeParseArray(initialData?.atributi ?? initialData?.atributi_json);
      const mappedAttrs =
        rawAttrs.length > 0
          ? rawAttrs.map((a) => {
              const naziv = (a?.naziv ?? "").toString();
              // pokušaj da prepoznaš tip po nazivu (nije 100% potrebno)
              const lower = naziv.toLowerCase();
              const guessed =
                ATTR_TYPES.find((t) => t.type !== "tip_objekta" && t.label.toLowerCase() === lower) ||
                ATTR_TYPES.find((t) => t.type !== "tip_objekta" && t.type === lower) ||
                ATTR_TYPES[0];

              return {
                id: uid(),
                type: guessed?.type ?? "kvadratura",
                icon: (a?.icon ?? guessed?.iconKey ?? "FiHome").toString(),
                naziv: (a?.naziv ?? guessed?.label ?? "").toString(),
                vrednost: (a?.vrednost ?? "").toString(),
              };
            })
          : [{ id: uid(), type: "kvadratura", icon: "FiMaximize2", naziv: "Kvadratura", vrednost: "" }];

      setAttrs(mappedAttrs);
      setImages([]); // u edit-u dodaješ samo NOVE slike ovde
    } else {
      setForm({ adresa: "", tip: "stan", cena: "", status: "dostupna" });
      setAttrs([{ id: uid(), type: "kvadratura", icon: "FiMaximize2", naziv: "Kvadratura", vrednost: "" }]);
      setImages([]);
    }

    // cleanup preview urls kad zatvoriš modal
    return () => {
      setImages((prev) => {
        prev.forEach((im) => {
          try {
            if (im.previewUrl) URL.revokeObjectURL(im.previewUrl);
          } catch {}
        });
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const shouldAutofillName = !a.naziv?.trim() || a.naziv.trim() === currentTypeLabel;

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
    const picked = typeMap["tip_objekta"] || typeMap["kvadratura"];
    setAttrs((prev) => [
      ...prev,
      { id: uid(), type: picked.type, icon: picked.iconKey, naziv: picked.label, vrednost: "" },
    ]);
  }

  function removeAttr(id) {
    setAttrs((prev) => prev.filter((a) => a.id !== id));
  }

  function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImages((prev) => {
      const baseRedosled = prev.length ? Math.max(...prev.map((p) => Number(p.redosled || 0))) + 1 : 0;
      const next = files.map((f, idx) => ({
        id: uid(),
        file: f,
        previewUrl: fileToPreviewUrl(f),
        istaknuta: false,
        redosled: baseRedosled + idx,
      }));

      // ako još nemamo istaknutu među NOVIM slikama, prva nova može biti istaknuta
      const hasFeatured = prev.some((p) => p.istaknuta) || next.some((p) => p.istaknuta);
      if (!hasFeatured && next.length) next[0].istaknuta = true;

      return [...prev, ...next];
    });

    // reset input da može ponovo isti fajl
    e.target.value = "";
  }

  function setFeatured(id) {
    setImages((prev) => prev.map((im) => ({ ...im, istaknuta: im.id === id })));
  }

  function updateImage(id, patch) {
    setImages((prev) => prev.map((im) => (im.id === id ? { ...im, ...patch } : im)));
  }

  function removeImage(id) {
    setImages((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      const rest = prev.filter((x) => x.id !== id);

      // ako si obrisala istaknutu, postavi prvu kao istaknutu (ako postoji)
      const hasFeatured = rest.some((x) => x.istaknuta);
      if (!hasFeatured && rest.length) rest[0].istaknuta = true;

      return [...rest];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanAttrs = attrs
      .map((a) => ({
        icon: (a.icon || "FiHome").toString(),
        naziv: (a.naziv || "").trim(),
        vrednost: (a.vrednost || "").trim(),
        // type: (a.type || "").toString(),
      }))
      .filter((a) => a.naziv !== "" || a.vrednost !== "");

    const cleanImages = images
      .filter((im) => im?.file instanceof File)
      .map((im) => ({
        file: im.file,
        istaknuta: !!im.istaknuta,
        redosled: Number.isFinite(Number(im.redosled)) ? Number(im.redosled) : 0,
      }));

    await onSubmit({
      adresa: form.adresa.trim(),
      tip: form.tip,
      status: form.status,
      cena: form.cena,
      atributi: cleanAttrs.length ? cleanAttrs : null,

      // ✅ NOVO: slike za upload
      slike: cleanImages,
    });
  }

  return (
    <div className="nek-modal-backdrop" role="dialog" aria-modal="true">
      <div className="nek-modal crm-glass">
        <div className="nek-modal-top">
          <div className="nek-modal-title">{mode === "edit" ? "Izmena nekretnine" : "Nova nekretnina"}</div>

          <button className="nek-iconbtn" type="button" onClick={onClose} disabled={loading} title="Zatvori">
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
              {fieldErrors?.adresa ? <div className="nek-field-error">{fieldErrors.adresa}</div> : null}
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
              {fieldErrors?.cena ? <div className="nek-field-error">{fieldErrors.cena}</div> : null}
            </label>

            {/* ✅ SLIKE */}
            <div className="nek-attrs">
              <div className="nek-attrs-top">
                <div className="nek-attrs-title">Slike</div>

                <label className="nek-btn" style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  <FiImage /> Dodaj slike
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    onChange={onPickFiles}
                    disabled={loading}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {mode === "edit" ? (
                <div className="nek-attrs-hint" style={{ marginTop: 6 }}>
                  U izmeni ovde dodaješ samo <b>nove</b> slike (postojeće ne diramo u ovom modalu).
                </div>
              ) : null}

              {images.length ? (
                <div className="nek-img-grid">
                  {images
                    .slice()
                    .sort((a, b) => Number(a.redosled || 0) - Number(b.redosled || 0))
                    .map((im) => (
                      <div className="nek-img-card" key={im.id}>
                        <div className="nek-img-thumb">
                          {im.previewUrl ? <img src={im.previewUrl} alt="preview" /> : null}
                          {im.istaknuta ? <span className="nek-img-badge">Istaknuta</span> : null}
                        </div>

                        <div className="nek-img-controls">
                          <button
                            type="button"
                            className="nek-btn"
                            onClick={() => setFeatured(im.id)}
                            disabled={loading}
                            style={{ padding: "10px 12px" }}
                          >
                            Istakni
                          </button>

                          <label className="nek-label" style={{ margin: 0, flex: 1 }}>
                            Redosled
                            <input
                              className="nek-input"
                              value={im.redosled}
                              onChange={(e) => updateImage(im.id, { redosled: e.target.value })}
                              inputMode="numeric"
                            />
                          </label>

                          <button
                            type="button"
                            className="nek-iconbtn danger"
                            onClick={() => removeImage(im.id)}
                            disabled={loading}
                            title="Ukloni sliku"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="nek-attrs-hint" style={{ marginTop: 6 }}>
                  Nema dodatih slika. Dodaj jednu ili više slika (JPG/PNG/WEBP).
                </div>
              )}
            </div>

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
                      <div className="nek-attr-col">
                        <span className="nek-attr-label">Atribut</span>

                        <div className="nek-icselect">
                          <span className="nek-icpill" title="Ikonica">
                            <IconComp />
                          </span>

                          <select className="nek-input" value={a.type} onChange={(e) => changeAttrType(a.id, e.target.value)}>
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

              <div className="nek-attrs-hint">Unesi npr. kvadraturu, sprat, grejanje… Prazne stavke se ne čuvaju.</div>
            </div>

            <div className="nek-form-actions">
              <button className="nek-btn" type="button" onClick={onClose} disabled={loading}>
                Otkaži
              </button>
              <button className="nek-btn primary" type="submit" disabled={loading}>
                {loading ? "Čuvanje..." : (
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