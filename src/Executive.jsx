import { useState, useEffect } from 'react';

// ── Shared config (copied so this file is standalone) ──────────────────────
const TOTAL_PALLETS = 508;
const PALLETS_PER_TRUCK = 22.5;
const TOTAL_TRUCKS_NEEDED = Math.ceil(TOTAL_PALLETS / PALLETS_PER_TRUCK);

const STATUS_CONFIG = {
  scheduled:    { label: 'Ожидает подачи',            emoji: '🕐', color: '#64748B', badge: '#F1F5F9', badgeBorder: '#CBD5E1', badgeText: '#475569' },
  at_warehouse: { label: 'На складе',                 emoji: '🏭', color: '#D97706', badge: '#FEF3C7', badgeBorder: '#FCD34D', badgeText: '#92400E' },
  loading:      { label: 'Идёт загрузка',             emoji: '📦', color: '#EA580C', badge: '#FFF7ED', badgeBorder: '#FB923C', badgeText: '#9A3412' },
  sealing:      { label: 'Пломбирование / E-транзит', emoji: '🔒', color: '#7C3AED', badge: '#F5F3FF', badgeBorder: '#A78BFA', badgeText: '#4C1D95' },
  transit:      { label: 'В пути',                    emoji: '🚛', color: '#1D4ED8', badge: '#EFF6FF', badgeBorder: '#93C5FD', badgeText: '#1E3A8A' },
  arrived:      { label: 'Прибыл в Термез',           emoji: '✅', color: '#059669', badge: '#ECFDF5', badgeBorder: '#6EE7B7', badgeText: '#064E3B' },
  delayed:      { label: 'Задержка',                  emoji: '⚠️', color: '#DC2626', badge: '#FEF2F2', badgeBorder: '#FCA5A5', badgeText: '#7F1D1D' },
};

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function addH(dateStr, hours) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setTime(d.getTime() + hours * 3600000);
  return d.toISOString();
}

function getETA(truck) {
  if (!truck.loadingStart) return null;
  return {
    mid: addH(addH(truck.loadingStart, 2 + 1.5), 20),
    min: addH(addH(truck.loadingStart, 2 + 1), 20),
    max: addH(addH(truck.loadingStart, 2 + 2), 20),
  };
}

function loadTrucks() {
  try { const s = localStorage.getItem('tz_v5'); if (s) return JSON.parse(s); } catch {}
  return [];
}

// ── Auto-refresh every 30 sec ──────────────────────────────────────────────
function useAutoRefresh(fn, ms = 30000) {
  useEffect(() => {
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
  }, []);
}

export default function Executive() {
  const [trucks, setTrucks] = useState(loadTrucks);
  const [now, setNow] = useState(new Date());

  function refresh() { setTrucks(loadTrucks()); setNow(new Date()); }
  useAutoRefresh(refresh, 15000);

  const totalPalletsLoaded = trucks.reduce((s, t) => s + (Number(t.pallets) || 0), 0);
  const totalCost = trucks.reduce((s, t) => s + (parseFloat(t.rate) || 0), 0);
  const remaining = Math.max(0, TOTAL_PALLETS - totalPalletsLoaded);
  const progress = Math.min(100, (totalPalletsLoaded / TOTAL_PALLETS) * 100);

  const byStatus = Object.keys(STATUS_CONFIG).reduce((a, k) => {
    a[k] = trucks.filter(t => t.status === k).length; return a;
  }, {});

  const arriving = trucks
    .filter(t => t.status === 'transit' && t.loadingStart)
    .map(t => ({ ...t, eta: getETA(t) }))
    .filter(t => t.eta)
    .sort((a, b) => new Date(a.eta.mid) - new Date(b.eta.mid));

  const active = trucks.filter(t => !['scheduled'].includes(t.status));
  const arrived = trucks.filter(t => t.status === 'arrived');
  const inTransit = trucks.filter(t => t.status === 'transit').length;
  const hasIssues = trucks.filter(t => t.status === 'delayed').length;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F0F4F8; font-family: 'Inter', sans-serif; color: #1E293B; min-height: 100vh; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #E2E8F0; } ::-webkit-scrollbar-thumb { background: #94A3B8; border-radius: 3px; }

    .page { max-width: 1200px; margin: 0 auto; padding: 0 24px 48px; }

    /* KPI Cards */
    .kpi { background: #fff; border-radius: 16px; padding: 24px 28px; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04); border: 1px solid #E2E8F0; position: relative; overflow: hidden; }
    .kpi-accent { position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 16px 16px 0 0; }

    /* Section card */
    .section { background: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04); border: 1px solid #E2E8F0; margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px; }

    /* Progress */
    .progress-track { background: #E2E8F0; border-radius: 12px; height: 20px; overflow: hidden; position: relative; }
    .progress-fill { height: 100%; border-radius: 12px; background: linear-gradient(90deg, #1D4ED8 0%, #0EA5E9 60%, #06B6D4 100%); transition: width .6s ease; position: relative; }
    .progress-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,.25) 0%, transparent 100%); border-radius: 12px; }

    /* Status cards */
    .status-card { border-radius: 12px; padding: 16px 18px; border: 2px solid transparent; }
    .status-card.active { box-shadow: 0 2px 8px rgba(0,0,0,.1); }

    /* Arrival rows */
    .arrival-row { display: flex; align-items: center; gap: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-bottom: 10px; transition: box-shadow .15s; }
    .arrival-row:hover { box-shadow: 0 2px 8px rgba(0,0,0,.08); }

    /* Table */
    .table-wrap { border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    thead { background: #F8FAFC; }
    th { padding: 14px 18px; text-align: left; font-size: 12px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: .06em; }
    td { padding: 16px 18px; border-top: 1px solid #F1F5F9; }
    tr:hover td { background: #F8FAFC; }

    /* Badge */
    .badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid; white-space: nowrap; }

    /* Alert */
    .alert { background: #FEF2F2; border: 2px solid #FCA5A5; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }

    /* Divider */
    hr { border: none; border-top: 1px solid #F1F5F9; margin: 20px 0; }

    /* Grids */
    .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
    .g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

    @media (max-width: 900px) { .g4 { grid-template-columns: 1fr 1fr; } .g3 { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .g4, .g3, .g2 { grid-template-columns: 1fr; } .page { padding: 0 16px 32px; } }
  `;

  return (
    <>
      <style>{css}</style>

      {/* ── HEADER ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 24px', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #1D4ED8, #0EA5E9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🚛</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Отслеживание груза</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Ташкент → Термез</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {hasIssues > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ fontSize: 14 }}>⚠️</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>{hasIssues} задержка</span>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Обновлено</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', fontFamily: "'IBM Plex Mono', monospace" }}>{now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            </div>
            <button onClick={refresh} style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ↻ Обновить
            </button>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 28 }}>

        {/* ── ALERT if delays ── */}
        {hasIssues > 0 && (
          <div className="alert">
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 15 }}>{hasIssues} рейс{hasIssues > 1 ? 'а' : ''} с задержкой</div>
              <div style={{ fontSize: 13, color: '#EF4444', marginTop: 2 }}>Требует внимания менеджера</div>
            </div>
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div className="g4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Прогресс вывоза', value: `${progress.toFixed(0)}%`, sub: `${totalPalletsLoaded} из ${TOTAL_PALLETS} паллет`, accent: '#1D4ED8', icon: '📊' },
            { label: 'Рейсов в пути', value: inTransit, sub: 'активно движутся', accent: '#0369A1', icon: '🚛' },
            { label: 'Доставлено', value: arrived.length, sub: `рейсов завершено`, accent: '#059669', icon: '✅' },
            { label: 'Осталось вывезти', value: `~${Math.ceil(remaining / PALLETS_PER_TRUCK)}`, sub: `${remaining} паллет`, accent: '#D97706', icon: '📦' },
          ].map((k, i) => (
            <div key={i} className="kpi">
              <div className="kpi-accent" style={{ background: k.accent }} />
              <div style={{ fontSize: 28, marginBottom: 12 }}>{k.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: k.accent, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>{k.value}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: 500 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── PROGRESS ── */}
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div className="section-title" style={{ marginBottom: 4 }}>Общий прогресс</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#334155' }}>Вывезено <span style={{ color: '#1D4ED8', fontSize: 18 }}>{totalPalletsLoaded}</span> из <span style={{ fontWeight: 700 }}>{TOTAL_PALLETS}</span> паллет</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#1D4ED8', lineHeight: 1, letterSpacing: '-0.03em' }}>{progress.toFixed(1)}%</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>выполнено</div>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>0 паллет</span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{TOTAL_PALLETS} паллет · ~{TOTAL_TRUCKS_NEEDED} рейсов</span>
          </div>
        </div>

        {/* ── STATUS BREAKDOWN ── */}
        <div className="section">
          <div className="section-title">Статус парка</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const count = byStatus[key] || 0;
              return (
                <div key={key} className={`status-card ${count > 0 ? 'active' : ''}`}
                  style={{ background: count > 0 ? cfg.badge : '#F8FAFC', borderColor: count > 0 ? cfg.badgeBorder : '#E2E8F0', opacity: count > 0 ? 1 : 0.5 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{cfg.emoji}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: count > 0 ? cfg.color : '#CBD5E1', lineHeight: 1, letterSpacing: '-0.02em' }}>{count}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: count > 0 ? cfg.badgeText : '#94A3B8', marginTop: 6, lineHeight: 1.4 }}>{cfg.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COSTS ── */}
        <div className="g2" style={{ marginBottom: 24 }}>
          <div className="kpi">
            <div className="kpi-accent" style={{ background: '#059669' }} />
            <div style={{ fontSize: 28, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Потрачено (факт)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'IBM Plex Mono', monospace" }}>
              {(totalCost / 1_000_000).toFixed(2)}<span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 500 }}> M UZS</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>≈ {(totalCost / 12500).toFixed(0)} USD · {trucks.length} рейсов · {totalPalletsLoaded} паллет</div>
          </div>
          <div className="kpi">
            <div className="kpi-accent" style={{ background: '#D97706' }} />
            <div style={{ fontSize: 28, marginBottom: 12 }}>📈</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Прогноз итого (~{TOTAL_TRUCKS_NEEDED} рейсов)</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#D97706', lineHeight: 1, letterSpacing: '-0.02em', fontFamily: "'IBM Plex Mono', monospace" }}>
              {trucks.length > 0 ? (Math.round((totalCost / trucks.length) * TOTAL_TRUCKS_NEEDED) / 1_000_000).toFixed(2) : '—'}<span style={{ fontSize: 18, color: '#94A3B8', fontWeight: 500 }}> M UZS</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 8 }}>Средняя ставка: {trucks.length > 0 ? Math.round(totalCost / trucks.length).toLocaleString('ru-RU') : '—'} UZS/рейс</div>
          </div>
        </div>

        {/* ── NEXT ARRIVALS ── */}
        {arriving.length > 0 && (
          <div className="section">
            <div className="section-title">🏁 Ближайшие прибытия в Термез</div>
            {arriving.slice(0, 6).map((truck, i) => (
              <div key={truck.id} className="arrival-row">
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: i === 0 ? '#EFF6FF' : '#F1F5F9', border: `2px solid ${i === 0 ? '#93C5FD' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: i === 0 ? '#1D4ED8' : '#64748B', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>{truck.plateNumber || <span style={{ color: '#94A3B8', fontWeight: 400 }}>Номер не указан</span>}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{truck.driver || '—'} · {truck.contractor || '—'} · <strong style={{ color: '#475569' }}>{truck.pallets} палл.</strong></div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#059669', fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(truck.eta.mid)}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{fmt(truck.eta.min)} — {fmt(truck.eta.max)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ALL ACTIVE TRUCKS ── */}
        {active.length > 0 && (
          <div className="section">
            <div className="section-title">🚛 Все активные рейсы ({active.length})</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {['№', 'Машина', 'Водитель', 'Подрядчик', 'Палл.', 'Статус', 'ETA Термез'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.map((t, i) => {
                    const cfg = STATUS_CONFIG[t.status];
                    const eta = getETA(t);
                    return (
                      <tr key={t.id}>
                        <td style={{ color: '#94A3B8', fontWeight: 600, width: 40 }}>{i + 1}</td>
                        <td><span style={{ fontWeight: 700, color: '#0F172A', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }}>{t.plateNumber || <span style={{ color: '#CBD5E1', fontWeight: 400, fontFamily: 'inherit' }}>—</span>}</span></td>
                        <td style={{ color: '#334155', fontWeight: 500 }}>{t.driver || <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                        <td style={{ color: '#475569' }}>{t.contractor || <span style={{ color: '#CBD5E1' }}>—</span>}</td>
                        <td style={{ fontWeight: 700, color: '#334155' }}>{t.pallets}</td>
                        <td>
                          <span className="badge" style={{ background: cfg.badge, borderColor: cfg.badgeBorder, color: cfg.badgeText }}>
                            {cfg.emoji} {cfg.label}
                          </span>
                        </td>
                        <td>
                          {eta
                            ? <span style={{ fontWeight: 700, color: '#059669', fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(eta.mid)}</span>
                            : <span style={{ color: '#CBD5E1' }}>—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ARRIVED ── */}
        {arrived.length > 0 && (
          <div className="section">
            <div className="section-title">✅ Доставлено в Термез ({arrived.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {arrived.map(t => (
                <div key={t.id} style={{ background: '#ECFDF5', border: '2px solid #6EE7B7', borderRadius: 10, padding: '12px 16px', minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46', fontFamily: "'IBM Plex Mono', monospace" }}>{t.plateNumber || '—'}</div>
                  <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>{t.driver || '—'}</div>
                  <div style={{ fontSize: 12, color: '#6EE7B7', marginTop: 2 }}>{t.pallets} паллет · {t.contractor || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {trucks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, background: '#fff', borderRadius: 16, border: '2px dashed #E2E8F0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚛</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Нет данных</div>
            <div style={{ fontSize: 14, color: '#94A3B8' }}>Менеджер ещё не добавил рейсы</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0 0', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Только просмотр · Ташкент → Термез · Обновляется каждые 15 сек</div>
          <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>{now.toLocaleString('ru-RU')}</div>
        </div>
      </div>
    </>
  );
}