
import React, { useEffect, useMemo, useState } from "react";
import { FiX, FiSave } from "react-icons/fi";
import api from "../api/axios"; 

function moneyLabel(n) {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("sr-RS").format(num) + " €";
}

function useDebouncedValue(value, delay = 250) {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
}

export default function CreatePonudaModal({ isOpen, onClose, onSubmit, loading, error, fieldErrors }) {
  const [form, setForm] = useState({
    kupac_id: "",
    nekretnina_id: "",
    iznos: "",
    datum: "",
    status: "na_cekanju",
  });

  // lookup data
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

    // reset forme kad se otvori
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;

    setForm({
      kupac_id: "",
      nekretnina_id: "",
      iznos: "",
      datum: iso,
      status: "na_cekanju",
    });

    setKq("");
    setNq("");
  }, [isOpen]);

  async function fetchKupci(query) { 
    const res = await api.get("/kupci/search", { params: { q: query || undefined, page: 1, per_page: 50, sort_by: "created_at", sort_dir: "desc" } });
    return res.data?.data || [];
  }

  async function fetchNekretnine(query) { 
    const res = await api.get("/nekretnine/search", { params: { q: query || undefined, page: 1, per_page: 50, sort_by: "created_at", sort_dir: "desc" } });
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
        setListsErr("Greška pri učitavanju kupaca/nekretnina.");
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

  const selectedKupac = useMemo(() => kupci.find((x) => String(x.id) === String(form.kupac_id)), [kupci, form.kupac_id]);
  const selectedNek = useMemo(() => nekretnine.find((x) => String(x.id) === String(form.nekretnina_id)), [nekretnine, form.nekretnina_id]);

  if (!isOpen) return null;

  function closeSafe() {
    if (loading) return;
    onClose?.();
  }

  function handleNumInput(e) {
    setForm((f) => ({ ...f, iznos: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit?.(form);
  }

  return (
    <div className="ponude-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ponude-modal crm-glass">
        <div className="ponude-modal-top">
          <div className="ponude-modal-title">Nova ponuda</div>
          <button className="ponude-iconbtn" type="button" onClick={closeSafe} disabled={loading} title="Zatvori">
            <FiX />
          </button>
        </div>

        <div className="ponude-modal-body">
          {error ? <div className="ponude-error" style={{ borderBottom: "none" }}>{error}</div> : null}
          {listsErr ? <div className="ponude-error" style={{ borderBottom: "none" }}>{listsErr}</div> : null}

          <form onSubmit={handleSubmit} className="ponude-form">
            <div className="ponude-grid2">
              <label className="ponude-label">
                Pretraga kupaca
                <input
                  className="ponude-input"
                  value={kq}
                  onChange={(e) => setKq(e.target.value)}
                  placeholder="npr. Ana / Jovanović / 064..."
                  disabled={loadingLists || loading}
                />
              </label>

              <label className="ponude-label">
                Pretraga nekretnina
                <input
                  className="ponude-input"
                  value={nq}
                  onChange={(e) => setNq(e.target.value)}
                  placeholder="npr. Ulica / stan / dostupna..."
                  disabled={loadingLists || loading}
                />
              </label>
            </div>

            <div className="ponude-grid2">
              <label className="ponude-label">
                Kupac *
                <select
                  className={`ponude-input ${fieldErrors?.kupac_id ? "is-error" : ""}`}
                  value={form.kupac_id}
                  onChange={(e) => setForm((f) => ({ ...f, kupac_id: e.target.value }))}
                  disabled={loadingLists || loading}
                >
                  <option value="">{loadingLists ? "Učitavanje..." : "Izaberi kupca"}</option>
                  {kupci.map((k) => {
                    const label = `${k.ime ?? ""} ${k.prezime ?? ""}`.trim() || `Kupac #${k.id}`;
                    const budzet = k.budzet !== undefined && k.budzet !== null ? ` • budžet ${moneyLabel(k.budzet)}` : "";
                    return (
                      <option key={k.id} value={k.id}>
                        {label}{budzet}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors?.kupac_id ? <div className="ponude-field-error">{fieldErrors.kupac_id}</div> : null}
                {selectedKupac ? (
                  <div className="ponude-hint">
                    Izabran: <b>{`${selectedKupac.ime ?? ""} ${selectedKupac.prezime ?? ""}`.trim()}</b>
                    {selectedKupac.lokacija ? ` • ${selectedKupac.lokacija}` : ""}
                  </div>
                ) : null}
              </label>

              <label className="ponude-label">
                Nekretnina *
                <select
                  className={`ponude-input ${fieldErrors?.nekretnina_id ? "is-error" : ""}`}
                  value={form.nekretnina_id}
                  onChange={(e) => setForm((f) => ({ ...f, nekretnina_id: e.target.value }))}
                  disabled={loadingLists || loading}
                >
                  <option value="">{loadingLists ? "Učitavanje..." : "Izaberi nekretninu"}</option>
                  {nekretnine.map((n) => {
                    const adresa = n.adresa || `Nekretnina #${n.id}`;
                    const tip = n.tip ? ` • ${n.tip}` : "";
                    const status = n.status ? ` • ${n.status}` : "";
                    const cena = n.cena !== undefined && n.cena !== null ? ` • ${moneyLabel(n.cena)}` : "";
                    return (
                      <option key={n.id} value={n.id}>
                        {adresa}{tip}{status}{cena}
                      </option>
                    );
                  })}
                </select>
                {fieldErrors?.nekretnina_id ? <div className="ponude-field-error">{fieldErrors.nekretnina_id}</div> : null}
                {selectedNek ? (
                  <div className="ponude-hint">
                    Izabrana: <b>{selectedNek.adresa || `#${selectedNek.id}`}</b>
                    {selectedNek.tip ? ` • ${selectedNek.tip}` : ""}
                    {selectedNek.status ? ` • ${selectedNek.status}` : ""}
                  </div>
                ) : null}
              </label>
            </div>

            <div className="ponude-grid3">
              <label className="ponude-label">
                Datum *
                <input
                  type="date"
                  className={`ponude-input ${fieldErrors?.datum ? "is-error" : ""}`}
                  value={form.datum}
                  onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
                  disabled={loading}
                />
                {fieldErrors?.datum ? <div className="ponude-field-error">{fieldErrors.datum}</div> : null}
              </label>

              <label className="ponude-label">
                Iznos (€) *
                <input
                  className={`ponude-input ${fieldErrors?.iznos ? "is-error" : ""}`}
                  value={form.iznos}
                  onChange={handleNumInput}
                  placeholder="npr. 120000"
                  inputMode="numeric"
                  disabled={loading}
                />
                {fieldErrors?.iznos ? <div className="ponude-field-error">{fieldErrors.iznos}</div> : null}
              </label>

              <label className="ponude-label">
                Status
                <select
                  className={`ponude-input ${fieldErrors?.status ? "is-error" : ""}`}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={loading}
                >
                  <option value="na_cekanju">Na čekanju</option>
                  <option value="prihvacena">Prihvaćena</option>
                  <option value="odbijena">Odbijena</option>
                </select>
                {fieldErrors?.status ? <div className="ponude-field-error">{fieldErrors.status}</div> : null}
              </label>
            </div>

            <div className="ponude-form-actions">
              <button className="ponude-btn" type="button" onClick={closeSafe} disabled={loading}>
                Otkaži
              </button>
              <button className="ponude-btn primary" type="submit" disabled={loading || loadingLists}>
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