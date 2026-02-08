import React from "react";
import "./Pocetna.css";
import {
  FiShield,
  FiUsers,
  FiTrendingUp,
  FiHome,
  FiCalendar,
  FiImage,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";

export default function Pocetna() {
  return (
    <div className="crm"> 

      {/* HERO */}
      <section className="crm-hero">
        <div className="crm-hero-bg" aria-hidden="true" />
        <div className="crm-container crm-hero-grid">
          <div className="crm-hero-left">
            <div className="crm-badge">
              <FiShield />
              <span>Siguran CRM </span>
            </div>

            <h1 className="crm-title">
               CRM za <span className="crm-grad">prodaju nekretnina</span>
            </h1>

            <p className="crm-subtitle">
              Sve na jednom mestu: kupci, nekretnine, pregledi, ponude i galerije.
              Agentima ubrzava rad, menadžeru daje pregled prodaje, a administratoru potpunu kontrolu.
            </p>

            <div className="crm-hero-actions">
              <a className="crm-btn crm-btn-primary" href="login">
                Prijava  <FiArrowRight />
              </a>
              
            </div>

            <div className="crm-trust">
              <div className="crm-trust-item">
                <div className="crm-trust-kpi">3+</div>
                <div className="crm-trust-label">Korisničke uloge</div>
              </div>
              <div className="crm-trust-item">
                <div className="crm-trust-kpi">1</div>
                <div className="crm-trust-label">Centralna baza podataka</div>
              </div>
              <div className="crm-trust-item">
                <div className="crm-trust-kpi">∞</div>
                <div className="crm-trust-label">Galerije slika po nekretnini</div>
              </div>
            </div>
          </div>

          {/* HERO CARD MOCK */}
          <div className="crm-hero-right">
            <div className="crm-glass">
              <div className="crm-glass-top">
                <div className="crm-dot red" />
                <div className="crm-dot yellow" />
                <div className="crm-dot green" />
                <div className="crm-glass-title">Dashboard • Pregled stanja</div>
              </div>

              <div className="crm-glass-body">
                <div className="crm-mini-grid">
                  <KpiCard icon={<FiUsers />} title="Aktivni kupci" value="128" hint="+12 ove nedelje" />
                  <KpiCard icon={<FiHome />} title="Dostupne nekretnine" value="54" hint="9 novih oglasa" />
                  <KpiCard icon={<FiCalendar />} title="Zakazani pregledi" value="17" hint="sledećih 7 dana" />
                  <KpiCard icon={<FiTrendingUp />} title="Ponude u toku" value="23" hint="5 na čekanju" />
                </div>

                <div className="crm-divider" />

                <div className="crm-row">
                  <div className="crm-row-title">Istaknute aktivnosti</div>
                  <div className="crm-activity">
                    <span className="crm-pill-soft">Agent</span>
                    <span>Zakazan pregled: “Stan, Vračar”</span>
                    <span className="crm-muted">12:30</span>
                  </div>
                  <div className="crm-activity">
                    <span className="crm-pill-soft">Menadžer</span>
                    <span>Pregled ponuda: “Kuća, Zemun”</span>
                    <span className="crm-muted">11:05</span>
                  </div>
                  <div className="crm-activity">
                    <span className="crm-pill-soft">Admin</span>
                    <span>Dodao korisnika: “Novi agent”</span>
                    <span className="crm-muted">09:18</span>
                  </div>
                </div>

                <div className="crm-divider" />

                <div className="crm-gallery-preview">
                  <div className="crm-row-title">Galerija nekretnine</div>
                  <div className="crm-thumbs">
                    <div className="crm-thumb a" />
                    <div className="crm-thumb b" />
                    <div className="crm-thumb c" />
                    <div className="crm-thumb d" />
                  </div>
                 
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefiti" className="crm-section">
        <div className="crm-container">
          <div className="crm-section-head">
            <h2>Zašto ova aplikacija?</h2>
            <p>
              Kada su podaci u porukama i fajlovima — kupci ispadnu iz toka, a menadžment nema uvid.
              Ovde je sve objedinjeno, jasno i merljivo.
            </p>
          </div>

          <div className="crm-cards">
            <FeatureCard
              icon={<FiUsers />}
              title="Praćenje kupaca od prvog kontakta"
              desc="Centralizovani profil kupca: budžet, lokacija, istorija pregleda i ponuda — ništa se ne gubi."
            />
            <FeatureCard
              icon={<FiHome />}
              title="Upravljanje nekretninama + statusi"
              desc="Nekretnina ima status, cenu, tip i  atribute (kvadratura, grejanje, spratnost...), plus galeriju slika."
            />
            <FeatureCard
              icon={<FiCalendar />}
              title="Brzo zakazivanje pregleda"
              desc="Termini pregleda, agent koji vodi, statusi i evidencija — spremno za workflow."
            />
            <FeatureCard
              icon={<FiTrendingUp />}
              title="Ponude i tok prodaje"
              desc="Ponude vezane za kupca i nekretninu, statusi i pregled procesa — idealno za prodajni funnel."
            />
            <FeatureCard
              icon={<FiShield />}
              title="3 uloge + kontrola pristupa"
              desc="Agent, Menadžer i Administrator — svako vidi samo ono što treba, uz API zaštitu."
            />
            <FeatureCard
              icon={<FiImage />}
              title="Luksuzna prezentacija oglasa"
              desc="Galerije slika sa istaknutom slikom i redosledom — izgled kao realna platforma."
            />
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="uloge" className="crm-section crm-section-alt">
        <div className="crm-container">
          <div className="crm-section-head">
            <h2>Korisničke uloge</h2>
            <p>CRM je namenjen zaposlenima.  </p>
          </div>

          <div className="crm-roles">
            <RoleCard
              title="Agent"
              points={[
                "Unos kupaca i zahteva",
                "Zakazivanje pregleda nekretnina",
                "Kreiranje/obrada ponuda",
                "Upravljanje nekretninama",
              ]}
              tag="Operativni rad"
            />
            <RoleCard
              title="Menadžer"
              points={[
                "Uvid u ponude i tok prodaje",
                "Praćenje učinka agenata",
                "Analitika i pregled statusa",
                "Upravljanje ponudama i pregovorima",
               
              ]}
              tag="Nadzor prodaje"
            />
            <RoleCard
              title="Administrator"
              points={[
                "Korisnički nalozi i ovlašćenja",
                "Uvid u razne statistike",
                "Pregled aktivnosti zaposlenih", 
              ]}
              tag="Kontrola sistema"
            />
          </div>
        </div>
      </section>
 
 
    </div>
  );
}

function KpiCard({ icon, title, value, hint }) {
  return (
    <div className="crm-kpi">
      <div className="crm-kpi-ic">{icon}</div>
      <div className="crm-kpi-main">
        <div className="crm-kpi-title">{title}</div>
        <div className="crm-kpi-value">{value}</div>
        <div className="crm-kpi-hint">{hint}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="crm-card">
      <div className="crm-card-ic">{icon}</div>
      <div className="crm-card-title">{title}</div>
      <div className="crm-card-desc">{desc}</div>
    </div>
  );
}

function RoleCard({ title, points, tag }) {
  return (
    <div className="crm-role">
      <div className="crm-role-top">
        <div className="crm-role-title">{title}</div>
        <div className="crm-role-tag">{tag}</div>
      </div>
      <ul className="crm-role-list">
        {points.map((p) => (
          <li key={p}>
            <FiCheckCircle className="crm-check" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModuleRow({ title, desc }) {
  return (
    <div className="crm-module">
      <div className="crm-module-title">{title}</div>
      <div className="crm-module-desc">{desc}</div>
      <div className="crm-module-line" />
    </div>
  );
}
