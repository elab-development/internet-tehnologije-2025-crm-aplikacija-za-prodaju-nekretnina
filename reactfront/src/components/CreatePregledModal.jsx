import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiSave } from "react-icons/fi";
import api from "../api/axios";

function useDebouncedValue(value, delay = 250) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function CreatePregledModal({ isOpen, onClose, onSubmit, loading, error, fieldErrors }) {
  const [form, setForm] = useState({
    kupac_id: "",
    nekretnina_id: "",
    datum_vreme: "",
    status: "zakazan",
    napomena: "",
  });

  const [kupci, setKupci] = useState([]);
  const [nekretnine, setNekretnine] = useState([]);

  const [kq, setKq] = useState("");
  const [nq, setNq] = useState("");
  const dkq = useDebouncedValue(kq, 250);
  const dnq = useDebouncedValue(nq, 250);

  const [loadingLists, setLoadingLists] = useState(false);
  const [listsErr, setListsErr] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // default datum_vreme = sada + 1h (za UX)
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const dt = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;

    setForm({
      kupac_id: "",
      nekretnina_id: "",
      datum_vreme: dt,
      status: "zakazan",
      napomena: "",
    });

    setKq("");
    setNq("");
    setListsErr("");
  }, [isOpen]);

  async function fetchKupci(query) {
    const res = await api.get("/kupci/search", {
      params: { q: query || undefined, page: 1, per_page: 50, sort_by: "created_at", sort_dir: "desc" },
    });
    return res.data?.data || [];
  }

  async function fetchNekretnine(query) {
    const res = await api.get("/nekretnine/search", {
      params: { q: query || undefined, page: 1, per_page: 50, sort_by: "created_at", sort_dir: "desc" },
    });
    return res.data?.data || [];
  }

  useEffect(() => {
    if (!isOpen) return;

    let alive = true;
    setLoadingLists(true);
    setListsErr("");

    (async () => {
      try {
        const [k, n] = await Promise.all([fetchKupci(dkq), fetchNekretnine(dnq)]);
        if (!alive) return;
        setKupci(k);
        setNekretnine(n);
      } catch (e) {
        if (!alive) return;
        setListsErr("Greška pri učitavanju kupaca/nekretnina (proveri auth token i rute).");
        setKupci([]);
        setNekretnine([]);
      } finally {
        if (!alive) return;
        setLoadingLists(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isOpen, dkq, dnq]);

  const selectedKupac = useMemo(
    () => kupci.find((x) => String(x.id) === String(form.kupac_id)),
    [kupci, form.kupac_id]
  );
  const selectedNek = useMemo(
    () => nekretnine.find((x) => String(x.id) === String(form.nekretnina_id)),
    [nekretnine, form.nekretnina_id]
  );

  if (!isOpen) return null;

  function closeSafe() {
    if (loading) return;
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit?.(form);
  }

  return (
    <div className="pregledi-modal-backdrop" role="dialog" aria-modal="true">
      <div className="pregledi-modal crm-glass">
        <div className="pregledi-modal-top">
          <div className="pregledi-modal-title">Novi pregled</div>
          <button className="pregledi-iconbtn" type="button" onClick={closeSafe} disabled={loading} title="Zatvori">
            <FiX />
          </button>
        </div>

        <div className="pregledi-modal-body">
          {error ? <div className="pregledi-error" style={{ borderBottom: "none" }}>{error}</div> : null}
          {listsErr ? <div className="pregledi-error" style={{ borderBottom: "none" }}>{listsErr}</div> : null}

          <form onSubmit={handleSubmit} className="pregledi-form">
            <div className="pregledi-grid2">
              <label className="pregledi-label">
                Pretraga kupaca
                <input
                  className="pregledi-input"
                  value={kq}
                  onChange={(e) => setKq(e.target.value)}
                  placeholder="npr. Ana / Jovanović / 064..."
                  disabled={loadingLists || loading}
                />
              </label>

              <label className="pregledi-label">
                Pretraga nekretnina
                <input
                  className="pregledi-input"
                  value={nq}
                  onChange={(e) => setNq(e.target.value)}
                  placeholder="npr. Ulica / stan / dostupna..."
                  disabled={loadingLists || loading}
                />
              </label>
            </div>

            <div className="pregledi-grid2">
              <label className="pregledi-label">
                Kupac *
                <select
                  className={`pregledi-input ${fieldErrors?.kupac_id ? "is-error" : ""}`}
                  value={form.kupac_id}
                  onChange={(e) => setForm((f) => ({ ...f, kupac_id: e.target.value }))}
                  disabled={loadingLists || loading}
                >
                  <option value="">{loadingLists ? "Učitavanje..." : "Izaberi kupca"}</option>
                  {kupci.map((k) => {
                    const label = `${k.ime ?? ""} ${k.prezime ?? ""}`.trim() || `Kupac #${k.id}`;
                    const phone = k.telefon ? ` • ${k.telefon}` : "";
                    return (
                      <option key={k.id} value={k.id}>
                        {label}{phone}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors?.kupac_id ? <div className="pregledi-field-error">{fieldErrors.kupac_id}</div> : null}
                {selectedKupac ? (
                  <div className="pregledi-hint">
                    Izabran: <b>{`${selectedKupac.ime ?? ""} ${selectedKupac.prezime ?? ""}`.trim()}</b>
                    {selectedKupac.lokacija ? ` • ${selectedKupac.lokacija}` : ""}
                  </div>
                ) : null}
              </label>

              <label className="pregledi-label">
                Nekretnina *
                <select
                  className={`pregledi-input ${fieldErrors?.nekretnina_id ? "is-error" : ""}`}
                  value={form.nekretnina_id}
                  onChange={(e) => setForm((f) => ({ ...f, nekretnina_id: e.target.value }))}
                  disabled={loadingLists || loading}
                >
                  <option value="">{loadingLists ? "Učitavanje..." : "Izaberi nekretninu"}</option>
                  {nekretnine.map((n) => {
                    const adresa = n.adresa || `Nekretnina #${n.id}`;
                    const tip = n.tip ? ` • ${n.tip}` : "";
                    const st = n.status ? ` • ${n.status}` : "";
                    return (
                      <option key={n.id} value={n.id}>
                        {adresa}{tip}{st}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors?.nekretnina_id ? <div className="pregledi-field-error">{fieldErrors.nekretnina_id}</div> : null}
                {selectedNek ? (
                  <div className="pregledi-hint">
                    Izabrana: <b>{selectedNek.adresa || `#${selectedNek.id}`}</b>
                    {selectedNek.tip ? ` • ${selectedNek.tip}` : ""}
                    {selectedNek.status ? ` • ${selectedNek.status}` : ""}
                  </div>
                ) : null}
              </label>
            </div>

            <div className="pregledi-grid3">
              <label className="pregledi-label">
                Datum i vreme *
                <input
                  type="datetime-local"
                  className={`pregledi-input ${fieldErrors?.datum_vreme ? "is-error" : ""}`}
                  value={form.datum_vreme}
                  onChange={(e) => setForm((f) => ({ ...f, datum_vreme: e.target.value }))}
                  disabled={loading}
                />
                {fieldErrors?.datum_vreme ? <div className="pregledi-field-error">{fieldErrors.datum_vreme}</div> : null}
              </label>

              <label className="pregledi-label">
                Status
                <select
                  className={`pregledi-input ${fieldErrors?.status ? "is-error" : ""}`}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={loading}
                >
                  <option value="zakazan">Zakazan</option>
                  <option value="odrzan">Održan</option>
                  <option value="otkazan">Otkazan</option>
                </select>
                {fieldErrors?.status ? <div className="pregledi-field-error">{fieldErrors.status}</div> : null}
              </label>

              <label className="pregledi-label">
                Napomena
                <input
                  className={`pregledi-input ${fieldErrors?.napomena ? "is-error" : ""}`}
                  value={form.napomena}
                  onChange={(e) => setForm((f) => ({ ...f, napomena: e.target.value }))}
                  placeholder="opciono"
                  disabled={loading}
                />
                {fieldErrors?.napomena ? <div className="pregledi-field-error">{fieldErrors.napomena}</div> : null}
              </label>
            </div>

            <div className="pregledi-form-actions">
              <button className="pregledi-btn" type="button" onClick={closeSafe} disabled={loading}>
                Otkaži
              </button>
              <button className="pregledi-btn primary" type="submit" disabled={loading || loadingLists}>
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