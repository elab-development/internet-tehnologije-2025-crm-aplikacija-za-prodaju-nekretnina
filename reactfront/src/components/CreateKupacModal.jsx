
import React, { useEffect, useState } from "react";
import { FiX, FiSave } from "react-icons/fi";

export default function CreateKupacModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  error,
  fieldErrors,
}) {
  const [form, setForm] = useState({
    ime: "",
    prezime: "",
    telefon: "",
    email: "",
    budzet: "",
    lokacija: "",
    napomena: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      ime: "",
      prezime: "",
      telefon: "",
      email: "",
      budzet: "",
      lokacija: "",
      napomena: "",
    });
  }, [isOpen]);

  if (!isOpen) return null;

  function closeSafe() {
    if (loading) return;
    onClose?.();
  }

  function onNumInput(e) {
    // dozvoli samo cifre (i tacku/zarez ako korisnik unosi decimalno)
    const v = e.target.value;
    setForm((f) => ({ ...f, budzet: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit?.(form);
  }

  return (
    <div className="kupci-modal-backdrop" role="dialog" aria-modal="true">
      <div className="kupci-modal crm-glass">
        <div className="kupci-modal-top">
          <div className="kupci-modal-title">Novi kupac</div>
          <button
            className="kupci-iconbtn"
            type="button"
            onClick={closeSafe}
            disabled={loading}
            title="Zatvori"
          >
            <FiX />
          </button>
        </div>

        <div className="kupci-modal-body">
          {error ? (
            <div className="kupci-error" style={{ borderBottom: "none" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="kupci-form">
            <div className="kupci-grid2">
              <label className="kupci-label">
                Ime *
                <input
                  className={`kupci-input ${fieldErrors?.ime ? "is-error" : ""}`}
                  value={form.ime}
                  onChange={(e) => setForm((f) => ({ ...f, ime: e.target.value }))}
                  placeholder="npr. Ana"
                />
                {fieldErrors?.ime ? (
                  <div className="kupci-field-error">{fieldErrors.ime}</div>
                ) : null}
              </label>

              <label className="kupci-label">
                Prezime *
                <input
                  className={`kupci-input ${fieldErrors?.prezime ? "is-error" : ""}`}
                  value={form.prezime}
                  onChange={(e) => setForm((f) => ({ ...f, prezime: e.target.value }))}
                  placeholder="npr. Jovanović"
                />
                {fieldErrors?.prezime ? (
                  <div className="kupci-field-error">{fieldErrors.prezime}</div>
                ) : null}
              </label>
            </div>

            <div className="kupci-grid2">
              <label className="kupci-label">
                Telefon
                <input
                  className={`kupci-input ${fieldErrors?.telefon ? "is-error" : ""}`}
                  value={form.telefon}
                  onChange={(e) => setForm((f) => ({ ...f, telefon: e.target.value }))}
                  placeholder="npr. +381 64 123 456"
                />
                {fieldErrors?.telefon ? (
                  <div className="kupci-field-error">{fieldErrors.telefon}</div>
                ) : null}
              </label>

              <label className="kupci-label">
                Email
                <input
                  className={`kupci-input ${fieldErrors?.email ? "is-error" : ""}`}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="npr. ana@email.com"
                  inputMode="email"
                />
                {fieldErrors?.email ? (
                  <div className="kupci-field-error">{fieldErrors.email}</div>
                ) : null}
              </label>
            </div>

            <div className="kupci-grid2">
              <label className="kupci-label">
                Budžet (€)
                <input
                  className={`kupci-input ${fieldErrors?.budzet ? "is-error" : ""}`}
                  value={form.budzet}
                  onChange={onNumInput}
                  placeholder="npr. 100000"
                  inputMode="numeric"
                />
                {fieldErrors?.budzet ? (
                  <div className="kupci-field-error">{fieldErrors.budzet}</div>
                ) : null}
              </label>

              <label className="kupci-label">
                Lokacija
                <input
                  className={`kupci-input ${fieldErrors?.lokacija ? "is-error" : ""}`}
                  value={form.lokacija}
                  onChange={(e) => setForm((f) => ({ ...f, lokacija: e.target.value }))}
                  placeholder="npr. Novi Beograd"
                />
                {fieldErrors?.lokacija ? (
                  <div className="kupci-field-error">{fieldErrors.lokacija}</div>
                ) : null}
              </label>
            </div>

            <label className="kupci-label">
              Napomena
              <textarea
                className={`kupci-input kupci-textarea ${fieldErrors?.napomena ? "is-error" : ""}`}
                value={form.napomena}
                onChange={(e) => setForm((f) => ({ ...f, napomena: e.target.value }))}
                placeholder="Dodatne informacije..."
                rows={3}
              />
              {fieldErrors?.napomena ? (
                <div className="kupci-field-error">{fieldErrors.napomena}</div>
              ) : null}
            </label>

            <div className="kupci-form-actions">
              <button className="kupci-btn" type="button" onClick={closeSafe} disabled={loading}>
                Otkaži
              </button>
              <button className="kupci-btn primary" type="submit" disabled={loading}>
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
