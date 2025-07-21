'use client';

import React, { useState } from "react";

const CATEGORII_OLX = [
  { id: "imobiliare", label: "Imobiliare" },
  { id: "telefoane", label: "Telefoane" },
  { id: "electronice", label: "Electronice" },
  { id: "auto", label: "Auto" },
  { id: "moda", label: "Modă" },
  { id: "servicii", label: "Servicii" },
  // ... alte categorii OLX ...
];

const anunturiMock = [
  {
    id: 1,
    titlu: "Casă individuală, 4 camere, zona Turnișor",
    pret: 120000,
    locatie: "Sibiu",
    tip: "Casă",
    categorie: "imobiliare",
    selectat: false,
    coordonate: { lat: 45.793, lng: 24.143 },
  },
  {
    id: 2,
    titlu: "Vilă modernă, 5 camere, Calea Cisnădiei",
    pret: 185000,
    locatie: "Sibiu",
    tip: "Vilă",
    categorie: "imobiliare",
    selectat: false,
    coordonate: { lat: 45.773, lng: 24.151 },
  },
  {
    id: 3,
    titlu: "Casă de vânzare, 3 camere, Șelimbăr",
    pret: 95000,
    locatie: "Sibiu",
    tip: "Casă",
    categorie: "imobiliare",
    selectat: false,
    coordonate: { lat: 45.765, lng: 24.180 },
  },
  {
    id: 4,
    titlu: "iPhone 13 Pro Max, 256GB, ca nou",
    pret: 4200,
    locatie: "Sibiu",
    tip: "Telefon",
    categorie: "telefoane",
    selectat: false,
    coordonate: null,
  },
];

const TABURI = [
  { id: "monitorizare", label: "Monitorizare" },
  { id: "toate", label: "Toate anunțurile" },
  { id: "harta", label: "Hartă" },
];

function BaraTaburi({ tab, setTab }: any) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
      {TABURI.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          style={{
            padding: '10px 28px',
            borderRadius: 8,
            border: 'none',
            background: tab === t.id ? '#007bff' : '#e9ecef',
            color: tab === t.id ? '#fff' : '#222',
            fontWeight: 500,
            fontSize: '1em',
            cursor: 'pointer',
            boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FiltreMonitorizare({ filtre, setFiltre }: any) {
  return (
    <div className="filtre-card">
      <select
        value={filtre.categorie}
        onChange={e => setFiltre((f: any) => ({ ...f, categorie: e.target.value }))}
      >
        <option value="">Toate categoriile</option>
        {CATEGORII_OLX.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.label}</option>
        ))}
      </select>
      {/* Filtre detaliate pentru imobiliare */}
      {filtre.categorie === "imobiliare" && (
        <>
          <input
            type="text"
            placeholder="Caută după titlu..."
            value={filtre.titlu}
            onChange={e => setFiltre((f: any) => ({ ...f, titlu: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Preț maxim (€)"
            value={filtre.pretMax}
            onChange={e => setFiltre((f: any) => ({ ...f, pretMax: e.target.value }))}
          />
          <select
            value={filtre.tip}
            onChange={e => setFiltre((f: any) => ({ ...f, tip: e.target.value }))}
          >
            <option value="">Toate tipurile</option>
            <option value="Casă">Casă</option>
            <option value="Vilă">Vilă</option>
          </select>
        </>
      )}
      {/* Alte filtre pentru alte categorii pot fi adăugate aici */}
    </div>
  );
}

function Filtre({ filtre, setFiltre }: any) {
  return (
    <div className="filtre-card">
      <input
        type="text"
        placeholder="Caută după titlu..."
        value={filtre.titlu}
        onChange={e => setFiltre((f: any) => ({ ...f, titlu: e.target.value }))}
      />
      <input
        type="number"
        placeholder="Preț maxim (€)"
        value={filtre.pretMax}
        onChange={e => setFiltre((f: any) => ({ ...f, pretMax: e.target.value }))}
      />
      <select
        value={filtre.tip}
        onChange={e => setFiltre((f: any) => ({ ...f, tip: e.target.value }))}
      >
        <option value="">Toate tipurile</option>
        <option value="Casă">Casă</option>
        <option value="Vilă">Vilă</option>
      </select>
    </div>
  );
}

function ListaAnunturi({ anunturi, toggleMonitorizare }: any) {
  return (
    <div>
      <div className="anunturi-grid">
        {anunturi.map((anunt: any) => (
          <div className="anunt-card" key={anunt.id}>
            <strong>{anunt.titlu}</strong>
            <span>{anunt.pret} EUR</span>
            <span>{anunt.locatie}</span>
            <span>{anunt.tip}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{CATEGORII_OLX.find(c => c.id === anunt.categorie)?.label}</span>
            <button
              className={`btn-monitorizeaza${anunt.selectat ? " selected" : ""}`}
              onClick={() => toggleMonitorizare(anunt.id)}
            >
              {anunt.selectat ? "Monitorizat" : "Monitorizează"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectiuneMonitorizate({ anunturi, toggleMonitorizare, filtre, setFiltre }: any) {
  // Filtrare după categorie și detalii pentru monitorizare
  const anunturiFiltrate = anunturi.filter(a =>
    (!filtre.categorie || a.categorie === filtre.categorie) &&
    (!filtre.titlu || a.titlu.toLowerCase().includes(filtre.titlu.toLowerCase())) &&
    (!filtre.pretMax || a.pret <= parseInt(filtre.pretMax)) &&
    (!filtre.tip || a.tip === filtre.tip)
  );
  return (
    <>
      <FiltreMonitorizare filtre={filtre} setFiltre={setFiltre} />
      <div className="selected-section">
        <h3>Anunțuri monitorizate</h3>
        {anunturiFiltrate.length === 0 ? (
          <div style={{ color: '#888', marginTop: 24 }}>Nu ai anunțuri monitorizate pentru aceste filtre.</div>
        ) : (
          <div className="anunturi-grid">
            {anunturiFiltrate.map((anunt: any) => (
              <div className="anunt-card" key={anunt.id}>
                <strong>{anunt.titlu}</strong>
                <span>{anunt.pret} EUR</span>
                <span>{anunt.locatie}</span>
                <span>{anunt.tip}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{CATEGORII_OLX.find(c => c.id === anunt.categorie)?.label}</span>
                <button
                  className={`btn-monitorizeaza selected`}
                  onClick={() => toggleMonitorizare(anunt.id)}
                >
                  Elimină monitorizarea
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Harta2D({ anunturi }: any) {
  return (
    <div className="harta-section">
      <span>Harta 2D (placeholder) – {anunturi.length} anunțuri afișate</span>
    </div>
  );
}

export default function Home() {
  const [filtre, setFiltre] = useState({ titlu: "", pretMax: "", tip: "" });
  const [filtreMonitorizare, setFiltreMonitorizare] = useState({ categorie: "", titlu: "", pretMax: "", tip: "" });
  const [anunturi, setAnunturi] = useState(anunturiMock);
  const [tab, setTab] = useState("monitorizare");

  const anunturiFiltrate = anunturi.filter(a =>
    (!filtre.titlu || a.titlu.toLowerCase().includes(filtre.titlu.toLowerCase())) &&
    (!filtre.pretMax || a.pret <= parseInt(filtre.pretMax)) &&
    (!filtre.tip || a.tip === filtre.tip)
  );

  const toggleMonitorizare = (id: number) => {
    setAnunturi(anunturi =>
      anunturi.map(a =>
        a.id === id ? { ...a, selectat: !a.selectat } : a
      )
    );
  };

  const anunturiMonitorizate = anunturi.filter(a => a.selectat);

  return (
    <div className="main-container">
      <h1 style={{ marginBottom: 8 }}>Monitorizare anunțuri OLX</h1>
      <p style={{ marginTop: 0, marginBottom: 32, color: '#666' }}>
        Selectează anunțurile pe care vrei să le monitorizezi. În viitor vei putea primi notificări când apar oferte noi la prețuri mici.
      </p>
      <BaraTaburi tab={tab} setTab={setTab} />
      {tab === "monitorizare" && (
        <SectiuneMonitorizate anunturi={anunturiMonitorizate} toggleMonitorizare={toggleMonitorizare} filtre={filtreMonitorizare} setFiltre={setFiltreMonitorizare} />
      )}
      {tab === "toate" && (
        <>
          <Filtre filtre={filtre} setFiltre={setFiltre} />
          <ListaAnunturi anunturi={anunturiFiltrate} toggleMonitorizare={toggleMonitorizare} />
        </>
      )}
      {tab === "harta" && (
        <>
          <Filtre filtre={filtre} setFiltre={setFiltre} />
          <Harta2D anunturi={anunturiFiltrate} />
        </>
      )}
    </div>
  );
}
