import { useState, useEffect } from 'react';

const TOTAL_PALLETS = 508;
const PALLETS_PER_TRUCK = 22.5;
const TOTAL_TRUCKS_NEEDED = Math.ceil(TOTAL_PALLETS / PALLETS_PER_TRUCK);

export const STATUS_CONFIG = {
  scheduled:    { label: 'Ожидает подачи',            emoji: '🕐', color: '#CBD5E1', bg: '#1E293B', border: '#334155', dot: '#94A3B8' },
  at_warehouse: { label: 'На складе',                 emoji: '🏭', color: '#FCD34D', bg: '#292100', border: '#453600', dot: '#FCD34D' },
  loading:      { label: 'Идёт загрузка',             emoji: '📦', color: '#FB923C', bg: '#2C1400', border: '#4A2100', dot: '#FB923C' },
  sealing:      { label: 'Пломбирование / E-транзит', emoji: '🔒', color: '#C4B5FD', bg: '#1E1040', border: '#3B2080', dot: '#A78BFA' },
  transit:      { label: 'В пути',                    emoji: '🚛', color: '#60A5FA', bg: '#0C1A3A', border: '#1E3A6E', dot: '#3B82F6' },
  arrived:      { label: 'Прибыл в Термез',           emoji: '✅', color: '#34D399', bg: '#052E16', border: '#065F46', dot: '#10B981' },
  delayed:      { label: 'Задержка',                  emoji: '⚠️', color: '#F87171', bg: '#2A0A0A', border: '#7F1D1D', dot: '#EF4444' },
};

export function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function addH(dateStr, hours) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setTime(d.getTime() + hours * 3600000);
  return d.toISOString();
}

export function getETA(truck) {
  if (!truck.loadingStart) return null;
  return {
    mid: addH(addH(truck.loadingStart, 2 + 1.5), 20),
    min: addH(addH(truck.loadingStart, 2 + 1), 20),
    max: addH(addH(truck.loadingStart, 2 + 2), 20),
  };
}

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(8, 0, 0, 0);

const DEFAULT_TRUCKS = [
  { id: 1, plateNumber: '', contractor: '', rate: '', currency: 'UZS', pallets: 22, status: 'transit', loadingStart: new Date(yesterday).toISOString(), notes: '', driver: '', phone: '' },
  { id: 2, plateNumber: '', contractor: '', rate: '', currency: 'UZS', pallets: 22, status: 'transit', loadingStart: new Date(yesterday).toISOString(), notes: '', driver: '', phone: '' },
  { id: 3, plateNumber: '', contractor: '', rate: '', currency: 'UZS', pallets: 22, status: 'transit', loadingStart: new Date(yesterday).toISOString(), notes: '', driver: '', phone: '' },
];

const EMPTY = { plateNumber: '', contractor: '', rate: '', currency: 'UZS', pallets: 22, status: 'scheduled', loadingStart: '', notes: '', driver: '', phone: '' };

export function loadTrucks() {
  try { const s = localStorage.getItem('tz_v5'); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_TRUCKS;
}

export function saveTrucks(trucks) {
  try { localStorage.setItem('tz_v5', JSON.stringify(trucks)); } catch {}
}

export default function App() {
  const [trucks, setTrucks] = useState(loadTrucks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [activeTab, setActiveTab] = useState('fleet');

  useEffect(() => { saveTrucks(trucks); }, [trucks]);

  const totalPalletsLoaded = trucks.reduce((s, t) => s + (Number(t.pallets) || 0), 0);
  const totalCost = trucks.reduce((s, t) => s + (parseFloat(t.rate) || 0), 0);
  const remaining = Math.max(0, TOTAL_PALLETS - totalPalletsLoaded);
  const remainingTrucks = Math.ceil(remaining / PALLETS_PER_TRUCK);
  const progress = Math.min(100, (totalPalletsLoaded / TOTAL_PALLETS) * 100);

  function openAdd() {
    const d = new Date(); d.setHours(8, 0, 0, 0);
    setForm({ ...EMPTY, id: Date.now(), loadingStart: d.toISOString().slice(0, 16) });
    setEditingId(null); setShowForm(true);
  }
  function openEdit(t) { setForm({ ...t, loadingStart: t.loadingStart ? t.loadingStart.slice(0, 16) : '' }); setEditingId(t.id); setShowForm(true); }
  function saveForm() {
    const t = { ...form, id: editingId || form.id || Date.now() };
    if (editingId) setTrucks(p => p.map(x => x.id === editingId ? t : x));
    else setTrucks(p => [...p, t]);
    setShowForm(false);
  }
  function del(id) { if (window.confirm('Удалить машину?')) setTrucks(p => p.filter(t => t.id !== id)); }
  function updStatus(id, status) { setTrucks(p => p.map(t => t.id === id ? { ...t, status } : t)); }

  const costByContractor = trucks.reduce((acc, t) => {
    if (!t.contractor) return acc;
    acc[t.contractor] = (acc[t.contractor] || 0) + (parseFloat(t.rate) || 0);
    return acc;
  }, {});

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060C18; font-family: 'IBM Plex Mono', monospace; color: #CBD5E1; min-height: 100vh; }
    ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #060C18; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    .card { background: #0F1828; border: 1px solid #1E293B; border-radius: 10px; padding: 20px; }
    .btn { cursor: pointer; border: none; border-radius: 7px; padding: 9px 18px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #1D4ED8; color: #fff; } .btn-primary:hover { background: #2563EB; }
    .btn-danger  { background: transparent; color: #F87171; border: 1px solid #7F1D1D; } .btn-danger:hover { background: #7F1D1D; color: #fff; }
    .btn-ghost   { background: transparent; color: #94A3B8; border: 1px solid #1E293B; } .btn-ghost:hover { border-color: #334155; color: #CBD5E1; }
    .btn-sm { padding: 5px 11px; font-size: 12px; }
    .input, .select { background: #0A0F1A; border: 1px solid #334155; border-radius: 7px; padding: 10px 14px; color: #E2E8F0; font-family: 'IBM Plex Mono', monospace; font-size: 13px; width: 100%; transition: border .15s; }
    .input:focus, .select:focus { outline: none; border-color: #3B82F6; background: #0F1828; }
    .input::placeholder { color: #334155; }
    .label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: .07em; margin-bottom: 6px; display: block; font-weight: 500; }
    .tabs { display: flex; gap: 2px; background: #0A0F1A; padding: 4px; border-radius: 10px; border: 1px solid #1E293B; width: fit-content; margin-bottom: 20px; flex-wrap: wrap; }
    .tab { cursor: pointer; padding: 9px 20px; border-radius: 7px; font-size: 13px; font-weight: 500; transition: all .15s; border: none; background: transparent; color: #475569; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; }
    .tab.active { background: #1E293B; color: #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,.5); }
    .tab:hover:not(.active) { color: #94A3B8; }
    .truck-row { background: #0F1828; border: 1px solid #1E293B; border-radius: 10px; padding: 18px 20px; margin-bottom: 10px; transition: border-color .15s; }
    .truck-row:hover { border-color: #334155; }
    .status-sel { border-radius: 6px; padding: 5px 10px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 500; cursor: pointer; outline: none; border-width: 1px; border-style: solid; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.8); z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
    .modal { background: #0F1828; border: 1px solid #334155; border-radius: 14px; padding: 28px; width: 580px; max-width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 25px 60px rgba(0,0,0,.6); }
    .pbar { background: #1E293B; border-radius: 6px; height: 10px; overflow: hidden; }
    .pfill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #1D4ED8, #0EA5E9); transition: width .5s ease; }
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .eta-box { background: #060C18; border: 1px solid #1E3A5F; border-radius: 7px; padding: 10px 14px; margin-top: 10px; }
    @media (max-width: 640px) { .g2, .g3 { grid-template-columns: 1fr; } .tab { padding: 8px 12px; font-size: 12px; } }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ borderBottom: '1px solid #1E293B', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#0A0F1A', position: 'sticky', top: 0, zIndex: 40 }}>
        <div>
          <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>Менеджер · Управление перевозками</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'IBM Plex Sans', sans-serif", color: '#F1F5F9' }}>Ташкент → Термез</div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[
            { v: trucks.filter(t => t.status === 'transit').length, l: 'в пути', c: '#60A5FA' },
            { v: trucks.filter(t => t.status === 'arrived').length, l: 'прибыло', c: '#34D399' },
            { v: trucks.length, l: 'всего', c: '#94A3B8' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
          <div style={{ width: 1, height: 32, background: '#1E293B' }} />
          <div>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
              <span style={{ color: '#60A5FA', fontWeight: 600 }}>{progress.toFixed(1)}%</span> · {totalPalletsLoaded}/{TOTAL_PALLETS}
            </div>
            <div className="pbar" style={{ width: 120 }}><div className="pfill" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="tabs">
          {[['fleet', '🚛 Машины'], ['timeline', '⏱ ETA'], ['costs', '💰 Косты']].map(([k, l]) => (
            <button key={k} className={`tab ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
          ))}
        </div>

        {activeTab === 'fleet' && (
          <div>
            <div className="g3" style={{ marginBottom: 20 }}>
              {[
                { label: 'Всего паллет', value: TOTAL_PALLETS, sub: `≈ ${TOTAL_TRUCKS_NEEDED} рейсов`, accent: '#3B82F6' },
                { label: 'Осталось', value: remaining, sub: `≈ ${remainingTrucks} машин`, accent: remaining > 0 ? '#F59E0B' : '#10B981' },
                { label: 'Сумма факт', value: (totalCost / 1_000_000).toFixed(2) + 'M', sub: `UZS · ${trucks.length} маш`, accent: '#10B981' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ borderTop: `2px solid ${s.accent}` }}>
                  <div className="label">{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', marginTop: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = trucks.filter(t => t.status === key).length;
                if (!count) return null;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '7px 13px' }}>
                    <span>{cfg.emoji}</span>
                    <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginLeft: 2 }}>{count}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#475569' }}>Всего: <strong style={{ color: '#CBD5E1' }}>{trucks.length}</strong></div>
              <button className="btn btn-primary" onClick={openAdd}>+ Добавить машину</button>
            </div>

            {trucks.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#334155', border: '1px dashed #1E293B', borderRadius: 10 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🚛</div>Нет машин
              </div>
            )}

            {trucks.map(truck => {
              const cfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.scheduled;
              const eta = getETA(truck);
              return (
                <div key={truck.id} className="truck-row">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{truck.plateNumber || <span style={{ color: '#334155', fontWeight: 400 }}>Номер не указан</span>}</span>
                        <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '4px 11px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{cfg.emoji} {cfg.label}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 16px', fontSize: 13 }}>
                        {[
                          ['Водитель', truck.driver],
                          ['Телефон', truck.phone],
                          ['Подрядчик', truck.contractor],
                          ['Паллет', truck.pallets],
                          truck.loadingStart ? ['Загрузка', fmt(truck.loadingStart)] : null,
                        ].filter(Boolean).map(([k, v]) => [
                          <span key={k+'k'} style={{ color: '#475569' }}>{k}</span>,
                          <span key={k+'v'} style={{ color: v ? '#CBD5E1' : '#334155', fontWeight: v ? 500 : 400 }}>{v || '—'}</span>
                        ])}
                      </div>
                      {truck.notes && <div style={{ marginTop: 10, background: '#060C18', border: '1px solid #1E293B', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#94A3B8' }}>📝 {truck.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#34D399', textAlign: 'right' }}>
                        {truck.rate ? <>{Number(truck.rate).toLocaleString('ru-RU')} <span style={{ fontSize: 12, color: '#475569', fontWeight: 400 }}>UZS</span></> : <span style={{ color: '#334155', fontSize: 14 }}>Ставка не указана</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select className="status-sel" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }} value={truck.status} onChange={e => updStatus(truck.id, e.target.value)}>
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                        </select>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(truck)}>✎</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(truck.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                  {eta && (
                    <div className="eta-box">
                      <span style={{ fontSize: 12, color: '#475569' }}>🏁 ETA Термез: </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#34D399' }}>{fmt(eta.mid)}</span>
                      <span style={{ fontSize: 12, color: '#334155', marginLeft: 8 }}>({fmt(eta.min)} — {fmt(eta.max)})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <div style={{ background: '#0A0F1A', border: '1px solid #1E293B', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#64748B' }}>
              📦 Загрузка <span style={{ color: '#FCD34D' }}>≈2ч</span> → 🔒 Пломба <span style={{ color: '#C4B5FD' }}>1–2ч</span> → 🚛 Маршрут <span style={{ color: '#60A5FA' }}>≈20ч</span>
            </div>
            {trucks.filter(t => t.loadingStart).map(truck => {
              const cfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.scheduled;
              const loadEnd = addH(truck.loadingStart, 2);
              const depMin = addH(loadEnd, 1), depMax = addH(loadEnd, 2);
              const etaMid = addH(addH(loadEnd, 1.5), 20), etaMin = addH(depMin, 20), etaMax = addH(depMax, 20);
              return (
                <div key={truck.id} style={{ background: '#0F1828', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9' }}>{truck.plateNumber || <span style={{ color: '#334155' }}>—</span>}</span>
                    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>{cfg.emoji} {cfg.label}</span>
                    <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{truck.contractor || '—'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {[
                      { icon: '📦', label: 'Старт загрузки', val: fmt(truck.loadingStart), color: '#FCD34D' },
                      { icon: '✔️', label: 'Конец загрузки', val: fmt(loadEnd), color: '#FCD34D' },
                      { icon: '🔒', label: 'Выезд', val: fmt(depMin), sub: `до ${fmt(depMax)}`, color: '#C4B5FD' },
                      { icon: '🏁', label: 'ETA Термез', val: fmt(etaMid), sub: `${fmt(etaMin)} — ${fmt(etaMax)}`, color: '#34D399' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: '#060C18', border: '1px solid #1E293B', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</div>
                        {s.sub && <div style={{ fontSize: 11, color: '#334155', marginTop: 4 }}>{s.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'costs' && (
          <div>
            <div className="card" style={{ marginBottom: 16, borderTop: '2px solid #10B981' }}>
              <div className="label">Итого потрачено</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#34D399', fontFamily: "'IBM Plex Sans', sans-serif", marginTop: 4 }}>{totalCost.toLocaleString('ru-RU')} <span style={{ fontSize: 18, color: '#475569' }}>UZS</span></div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>≈ {(totalCost / 12500).toFixed(0)} USD · {trucks.length} машин · {totalPalletsLoaded} паллет</div>
            </div>
            <div className="g2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="label">На паллет</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginTop: 4 }}>{totalPalletsLoaded > 0 ? Math.round(totalCost / totalPalletsLoaded).toLocaleString('ru-RU') : '—'} <span style={{ fontSize: 14, color: '#475569' }}>UZS</span></div>
              </div>
              <div className="card">
                <div className="label">Прогноз ({TOTAL_TRUCKS_NEEDED} рейсов)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#FCD34D', marginTop: 4 }}>{trucks.length > 0 ? Math.round((totalCost / trucks.length) * TOTAL_TRUCKS_NEEDED).toLocaleString('ru-RU') : '—'} <span style={{ fontSize: 14, color: '#475569' }}>UZS</span></div>
              </div>
            </div>
            <div className="label" style={{ marginBottom: 10 }}>По подрядчикам</div>
            {Object.keys(costByContractor).length === 0 && <div style={{ padding: 24, color: '#334155', border: '1px dashed #1E293B', borderRadius: 10, textAlign: 'center', fontSize: 13 }}>Заполните подрядчиков в карточках машин</div>}
            {Object.entries(costByContractor).sort(([,a],[,b]) => b - a).map(([name, cost]) => {
              const cnt = trucks.filter(t => t.contractor === name).length;
              const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0;
              return (
                <div key={name} style={{ background: '#0F1828', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0' }}>{name}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#34D399' }}>{cost.toLocaleString('ru-RU')} UZS</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ background: '#1E293B', borderRadius: 6, height: 10, flex: 1, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 6, background: 'linear-gradient(90deg,#059669,#0EA5E9)', width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{cnt} маш · {pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>Ср. ставка: <strong style={{ color: '#94A3B8' }}>{Math.round(cost / cnt).toLocaleString('ru-RU')} UZS</strong></div>
                </div>
              );
            })}
            <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>Детализация</div>
            <div style={{ overflowX: 'auto', background: '#0F1828', border: '1px solid #1E293B', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '1px solid #1E293B' }}>
                  {['#', 'Номер', 'Подрядчик', 'Водитель', 'Палл.', 'Ставка UZS', 'Статус'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#475569', fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {trucks.map((t, i) => {
                    const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.scheduled;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #0A0F1A' }}>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>{i + 1}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#E2E8F0' }}>{t.plateNumber || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#94A3B8' }}>{t.contractor || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#94A3B8' }}>{t.driver || '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#CBD5E1' }}>{t.pallets}</td>
                        <td style={{ padding: '12px 14px', color: '#34D399', fontWeight: 600 }}>{t.rate ? Number(t.rate).toLocaleString('ru-RU') : '—'}</td>
                        <td style={{ padding: '12px 14px' }}><span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, padding: '4px 10px', borderRadius: 6, fontSize: 11 }}>{cfg.emoji} {cfg.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'IBM Plex Sans', sans-serif", color: '#F1F5F9' }}>{editingId ? '✎ Редактировать' : '+ Новый рейс'}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="g2">
              {[
                { key: 'plateNumber', label: 'Гос. номер', ph: '01 A 123 AA' },
                { key: 'driver', label: 'Водитель', ph: 'Фамилия Имя' },
                { key: 'phone', label: 'Телефон', ph: '+998 90 000 00 00' },
                { key: 'contractor', label: 'Подрядчик', ph: 'ООО / ИП' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input className="input" placeholder={f.ph} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div><label className="label">Ставка (UZS)</label><input className="input" type="number" placeholder="850000" value={form.rate || ''} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} /></div>
              <div><label className="label">Паллет</label><input className="input" type="number" min="1" max="30" value={form.pallets || 22} onChange={e => setForm(p => ({ ...p, pallets: parseInt(e.target.value) }))} /></div>
              <div>
                <label className="label">Статус</label>
                <select className="select" value={form.status || 'scheduled'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
              <div><label className="label">Начало загрузки</label><input className="input" type="datetime-local" value={form.loadingStart || ''} onChange={e => setForm(p => ({ ...p, loadingStart: e.target.value }))} /></div>
              <div style={{ gridColumn: 'span 2' }}><label className="label">Примечание</label><input className="input" placeholder="Доп. информация…" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={saveForm}>{editingId ? 'Сохранить' : 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}