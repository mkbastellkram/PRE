(() => {
'use strict';

const PRX = {
  version: 'V4.0.1 Governance',
  data: null,
  map: null,
  pinRenderer: null,
  layers: { pins: null, gpx: null, kml: null },
  active: null,
  view: 'journal',
  filter: { q: '', region: '', status: '' },
  baseLayers: {},
  currentBase: null,
  settings: { sheetTransparency: .86, home: null },
  audit: {
    enabled: false,
    labels: false,
    noteMode: false,
    sessionId: '',
    tickets: [],
    nextTicket: 1,
    locked: false
  }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, attrs = {}) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'onclick') n.addEventListener('click', v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  });
  return n;
};
const cid = (node, id, name, context = '') => {
  node.dataset.prxId = id;
  node.dataset.prxName = name || id;
  if (context) node.dataset.prxContext = context;
  return node;
};

const Registry = {
  'APP-00': 'App Shell',
  'TOP-00': 'Top Controls',
  'TOP-01': 'Filter Button',
  'TOP-02': 'Kartenmodus Button',
  'TOP-03': 'Einstellungen Button',
  'TOP-04': 'Audit Button',
  'NAV-00': 'Bottom Navigation',
  'NAV-01': 'Journal Tab',
  'NAV-02': 'Karte Tab',
  'NAV-03': 'Reise Tab',
  'NAV-04': 'Dashboard Tab',
  'J-00': 'Journal Ansicht',
  'J-01': 'Journal Suche',
  'J-02': 'Journal Filter Chip',
  'J-03': 'PR-Zeile',
  'M-00': 'Leaflet Karte',
  'M-01': 'Basiskarten Umschaltung',
  'M-02': 'PR-Pins',
  'M-03': 'GPX Track Layer',
  'M-04': 'KML Anfahrt Layer',
  'M-05': 'Alle Pins Button',
  'PD-00': 'PR Detailseite',
  'PD-01': 'Detail Schließen',
  'PD-02': 'Detail Kennwerte',
  'PD-03': 'Detail Links',
  'PD-04': 'GPX/KML Datenstatus',
  'F-00': 'Filter Panel',
  'S-00': 'Einstellungen Panel',
  'S-01': 'Transparenz Regler',
  'R-00': 'Reise Ansicht',
  'D-00': 'Dashboard Ansicht',
  'A-00': 'Audit Center',
  'A-01': 'Audit Modus',
  'A-02': 'Audit ID Labels',
  'A-03': 'Notizmodus',
  'A-04': 'Ticket Liste',
  'A-05': 'CSV Export',
  'A-06': 'JSON Export',
  'A-07': 'CSV Import',
  'A-08': 'Audit Notiz Popup'
};

const Components = {
  iconButton(icon, label, onClick, id) {
    return cid(el('button', 'icon-btn', { type: 'button', 'aria-label': label, title: label, html: icon, onclick: onClick }), id || 'BTN-00', label);
  },
  closeButton(onClick, id = 'PD-01') { return Components.iconButton('×', 'Schließen', onClick, id); },
  panel(title, body, onClose, id = 'P-00') {
    const p = cid(el('section', 'panel'), id, Registry[id] || title);
    const h = el('header', 'panel-header');
    h.append(el('div', 'panel-title', { text: title }), Components.closeButton(onClose, `${id}-CLOSE`));
    p.append(h, el('div', 'panel-body'));
    p.lastChild.append(body);
    return p;
  },
  navItem(id, icon, label, cidValue) {
    return cid(el('button', 'nav-item', { type: 'button', 'data-view': id, html: `<span class="nav-ico">${icon}</span><span>${label}</span>` }), cidValue, label);
  },
  kv(label, value) {
    const k = el('div', 'kv');
    k.append(el('div', 'kv-label', { text: label }), el('div', 'kv-val', { text: value ?? 'Nicht in den bereitgestellten Daten vorhanden.' }));
    return k;
  },
  link(href, icon, label) {
    const a = el('a', 'link-btn', { href, target: '_blank', rel: 'noopener' });
    a.innerHTML = `<span>${icon}</span><span>${label}</span>`;
    return a;
  },
  toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(Components._toast);
    Components._toast = setTimeout(() => t.hidden = true, 2400);
  },
  toggleRow(label, checked, onChange, id) {
    const row = cid(el('label', 'settings-row audit-toggle'), id, Registry[id] || label);
    const text = el('div');
    text.append(el('div', 'kv-val', { text: label }));
    const input = el('input', '', { type: 'checkbox' });
    input.checked = !!checked;
    input.addEventListener('change', () => onChange(input.checked));
    row.append(text, input);
    return row;
  }
};

function fmt(v, s = '') { return v === null || v === undefined || v === '' ? '–' : `${v}${s}`; }
function statusIcon(s) { const x = (s || '').toLowerCase(); if (x.includes('offen')) return '●'; if (x.includes('geschlossen')) return '×'; if (x.includes('eingesch')) return '◐'; return '○'; }
function nowIso() { return new Date().toISOString(); }
function todayStamp() { return new Date().toISOString().slice(0, 10); }
function csvEscape(v) { const s = String(v ?? '').replace(/\r?\n/g, ' ').trim(); return `"${s.replace(/"/g, '""')}"`; }
function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function ticketNo(n) { return `#${String(n).padStart(4, '0')}`; }

async function init() {
  cid($('#app'), 'APP-00', Registry['APP-00']);
  cid($('#map'), 'M-00', Registry['M-00']);
  loadAudit();
  renderChrome();
  await loadData();
  initMap();
  renderView('journal');
  renderPins();
  bindAuditCapture();
  applyAuditState();
}

async function loadData() {
  try {
    const res = await fetch('data/prs.json', { cache: 'no-store' });
    PRX.data = await res.json();
    PRX.settings.home = PRX.data.meta.home;
    document.documentElement.style.setProperty('--sheetAlpha', PRX.settings.sheetTransparency);
  } catch (e) {
    PRX.data = { meta: { counts: {}, home: { name: 'Nicht geladen' }, sourceFiles: [] }, prs: [] };
    Components.toast('Daten konnten nicht geladen werden.');
    console.error(e);
  }
}

function loadAudit() {
  const saved = readJSON('PRX_AUDIT_V2', null);
  if (saved) {
    Object.assign(PRX.audit, saved);
  }
  if (!PRX.audit.sessionId) PRX.audit.sessionId = `TS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  if (!PRX.audit.nextTicket) PRX.audit.nextTicket = (PRX.audit.tickets.reduce((m, t) => Math.max(m, Number(t.ticketNum || 0)), 0) || 0) + 1;
}
function saveAudit() {
  writeJSON('PRX_AUDIT_V2', {
    enabled: PRX.audit.enabled,
    labels: PRX.audit.labels,
    noteMode: PRX.audit.noteMode,
    sessionId: PRX.audit.sessionId,
    tickets: PRX.audit.tickets,
    nextTicket: PRX.audit.nextTicket
  });
}

function renderChrome() {
  const top = cid($('#topbar'), 'TOP-00', Registry['TOP-00']);
  top.innerHTML = '';
  top.append(el('div', 'brand-pill', { html: '<span class="brand-dot"></span><span>PR-Explorer</span>' }));
  const actions = el('div', 'top-actions');
  actions.append(
    Components.iconButton('⌕', 'Filter', openFilter, 'TOP-01'),
    Components.iconButton('▣', 'Kartenmodus', () => renderView('map'), 'TOP-02'),
    Components.iconButton('⚑', 'Audit', openAuditCenter, 'TOP-04'),
    Components.iconButton('⚙︎', 'Einstellungen', openSettings, 'TOP-03')
  );
  top.append(actions);
  const nav = cid($('#bottomNav'), 'NAV-00', Registry['NAV-00']);
  nav.innerHTML = '';
  [['journal', '☰', 'Journal', 'NAV-01'], ['map', '⌖', 'Karte', 'NAV-02'], ['trip', '◇', 'Reise', 'NAV-03'], ['dashboard', '▥', 'Dashboard', 'NAV-04']].forEach(n => nav.append(Components.navItem(...n)));
  nav.addEventListener('click', e => { const b = e.target.closest('.nav-item'); if (b) renderView(b.dataset.view); });
}

function setNav() { $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === PRX.view)); }
function host(html = '') { const h = $('#viewHost'); h.innerHTML = html; return h; }
function renderView(v) {
  PRX.view = v;
  setNav();
  host();
  if (v === 'journal') renderJournal();
  if (v === 'map') renderMapView();
  if (v === 'trip') renderTrip();
  if (v === 'dashboard') renderDashboard();
  setTimeout(() => PRX.map && PRX.map.invalidateSize({ animate: false }), 160);
  applyAuditState();
}
function filtered() {
  let a = PRX.data.prs.slice();
  const q = PRX.filter.q.toLowerCase();
  if (q) a = a.filter(p => `${p.id} ${p.name} ${p.region}`.toLowerCase().includes(q));
  if (PRX.filter.region) a = a.filter(p => p.region === PRX.filter.region);
  if (PRX.filter.status) a = a.filter(p => (p.status || 'prüfen') === PRX.filter.status);
  return a;
}

function renderJournal() {
  const h = host();
  const v = cid(el('section', 'view active list-shell'), 'J-00', Registry['J-00']);
  const sp = el('div', 'scroll-pane');
  sp.append(el('div', 'section-head', { html: `<h1 class="title">Journal</h1><div class="sub">${PRX.data.prs.length} PR-/PS-PR-Wege aus PR – V1.xlsx · V4.0.1 Governance</div>` }));
  const tb = el('div', 'toolbar-row');
  const inp = cid(el('input', 'search', { placeholder: 'Suche PR, Name, Region', 'aria-label': 'Suche' }), 'J-01', Registry['J-01']);
  inp.value = PRX.filter.q;
  inp.addEventListener('input', () => { PRX.filter.q = inp.value; drawRows(list); renderPins(); applyAuditState(); });
  tb.append(inp, cid(el('button', 'chip', { type: 'button', text: 'Filter', onclick: openFilter }), 'J-02', Registry['J-02']));
  sp.append(tb);
  const list = el('div', 'flat-list');
  sp.append(list); v.append(sp); h.append(v); drawRows(list);
}
function drawRows(list) {
  list.innerHTML = '';
  const rows = filtered();
  if (!rows.length) { list.append(el('div', 'empty', { text: 'Keine PRs im aktuellen Filter.' })); return; }
  rows.forEach(p => {
    const b = cid(el('button', 'pr-row', { type: 'button', onclick: () => openDetail(p.id) }), 'J-03', Registry['J-03'], p.id);
    b.innerHTML = `<div class="status-dot">${statusIcon(p.status)}</div><div><div class="pr-title">${p.sourceNumber || p.id} · ${p.name}</div><div class="pr-meta"><span>${p.region}</span><span>${fmt(p.trail.distanceKm, ' km')}</span><span>${fmt(p.trail.duration)}</span><span>${fmt(p.trail.elevGain, ' hm')}</span></div></div><div class="pr-facts"><div>${fmt(p.drive.km, ' km')}</div><div>${fmt(p.drive.min, ' min')}</div></div>`;
    list.append(b);
  });
}
function renderMapView() {
  const h = host();
  const v = cid(el('section', 'view active map-view'), 'M-00', Registry['M-00']);
  const tools = cid(el('div', 'map-tools'), 'M-01', Registry['M-01']);
  ['OSM', 'Topo', 'Sat', 'Hybrid'].forEach(name => tools.append(el('button', 'seg-btn', { type: 'button', text: name, onclick: () => setBase(name) })));
  tools.append(cid(el('button', 'seg-btn', { type: 'button', text: 'Alle Pins', onclick: () => { PRX.active = null; clearActiveLines(); fitMadeira(); } }), 'M-05', Registry['M-05']));
  v.append(tools); h.append(v);
}
function renderTrip() {
  const h = host();
  const v = cid(el('section', 'view active list-shell'), 'R-00', Registry['R-00']);
  const sp = el('div', 'scroll-pane');
  sp.append(el('div', 'section-head', { html: '<h1 class="title">Reise</h1><div class="sub">V4.0.1 enthält bewusst nur die stabile Hülle. Tagesplanung folgt in V4.3.</div>' }));
  sp.append(el('div', 'dashboard-grid', { html: '<div class="metric"><div class="metric-num">14</div><div class="metric-label">Reisetage vorbereitet</div></div><div class="metric"><div class="metric-num">Home</div><div class="metric-label">Pestana Promenade Funchal</div></div>' }));
  sp.append(el('div', 'section-head', { html: '<div class="empty">Keine defekte Kalenderlogik. Später: einspaltige Tagesliste, Tagesdetail per Slide, PRs/POIs Heute/Später.</div>' }));
  v.append(sp); h.append(v);
}
function renderDashboard() {
  const c = PRX.data.meta.counts || {};
  const openCount = PRX.audit.tickets.filter(t => t.status !== 'erledigt').length;
  const h = host();
  const v = cid(el('section', 'view active list-shell'), 'D-00', Registry['D-00']);
  const sp = el('div', 'scroll-pane');
  sp.append(el('div', 'section-head', { html: `<h1 class="title">Dashboard</h1><div class="sub">Datenstatus · ${PRX.data.meta.version}</div>` }));
  sp.append(el('div', 'dashboard-grid', { html: `<div class="metric"><div class="metric-num">${c.prs || 0}</div><div class="metric-label">PR-Stammdaten</div></div><div class="metric"><div class="metric-num">${c.gpxMatched || 0}</div><div class="metric-label">GPX zugeordnet</div></div><div class="metric"><div class="metric-num">${c.kmlMatched || 0}</div><div class="metric-label">KML zugeordnet</div></div><div class="metric"><div class="metric-num">${openCount}</div><div class="metric-label">offene Audit-Tickets</div></div>` }));
  sp.append(el('div', 'section-head', { html: `<div class="empty">Quellen: ${PRX.data.meta.sourceFiles.join(' · ')}<br>Service Worker: nicht aktiv in V4.0.1.<br>Homezone: ${PRX.data.meta.home.name}<br>Audit-Session: ${PRX.audit.sessionId}</div>` }));
  v.append(sp); h.append(v);
}

function initMap() {
  if (!window.L) { Components.toast('Leaflet konnte nicht geladen werden.'); return; }
  PRX.pinRenderer = L.canvas({ padding: 0.5 });
  PRX.map = L.map('map', { zoomControl: false, attributionControl: true, preferCanvas: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, wheelDebounceTime: 80 }).setView([32.75, -16.95], 10);
  PRX.baseLayers.OSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2, attribution: '© OpenStreetMap' });
  PRX.baseLayers.Topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2, attribution: '© OpenTopoMap' });
  PRX.baseLayers.Sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2, attribution: 'Tiles © Esri' });
  PRX.baseLayers.Hybrid = L.layerGroup([PRX.baseLayers.Sat, L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { opacity: .34, maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 2 })]);
  setBase('OSM');
  PRX.layers.pins = L.layerGroup().addTo(PRX.map);
  PRX.layers.gpx = L.layerGroup().addTo(PRX.map);
  PRX.layers.kml = L.layerGroup().addTo(PRX.map);
  L.control.zoom({ position: 'bottomright' }).addTo(PRX.map);
  PRX.map.on('baselayerchange zoomend moveend', () => scheduleMapSize());
  setTimeout(() => PRX.map.invalidateSize({ animate: false }), 300);
}
let mapSizeTimer = null;
function scheduleMapSize() { clearTimeout(mapSizeTimer); mapSizeTimer = setTimeout(() => PRX.map && PRX.map.invalidateSize({ animate: false }), 120); }
function setBase(name) {
  if (!PRX.map || !PRX.baseLayers[name]) return;
  if (PRX.currentBase === PRX.baseLayers[name]) return;
  if (PRX.currentBase) PRX.map.removeLayer(PRX.currentBase);
  PRX.currentBase = PRX.baseLayers[name];
  PRX.currentBase.addTo(PRX.map);
  $$('.seg-btn').forEach(b => b.classList.toggle('active', b.textContent === name));
  scheduleMapSize();
}
function renderPins() {
  if (!PRX.map || !PRX.layers.pins) return;
  PRX.layers.pins.clearLayers();
  filtered().forEach(p => {
    if (!p.lat || !p.lon) return;
    const m = L.circleMarker([p.lat, p.lon], { renderer: PRX.pinRenderer, radius: 7, color: '#ffffff', weight: 1, fillColor: '#38d5bd', fillOpacity: .9 });
    m.bindTooltip(`${p.sourceNumber || p.id} · ${p.name}`);
    m.on('click', () => openDetail(p.id));
    m.addTo(PRX.layers.pins);
  });
}
function fitMadeira() { if (PRX.map) PRX.map.setView([32.75, -16.95], 10); }
async function openDetail(id) {
  const p = PRX.data.prs.find(x => x.id === id); if (!p) return;
  PRX.active = p; renderView('map'); await showActiveLines(p);
  if (PRX.map && p.lat && p.lon) PRX.map.setView([p.lat, p.lon], 12);
  const host = $('#detailHost'); host.innerHTML = ''; host.hidden = false;
  const sheet = cid(el('section', 'detail-sheet'), 'PD-00', Registry['PD-00'], p.id);
  const head = el('header', 'detail-header');
  head.append(el('div', 'detail-title', { text: `${p.sourceNumber || p.id} · ${p.name}` }), Components.closeButton(() => { host.hidden = true; clearActiveLines(); }, 'PD-01'));
  const body = el('div', 'detail-body');
  const grid = cid(el('div', 'kv-grid'), 'PD-02', Registry['PD-02'], p.id);
  [['Region', p.region], ['Status', p.status], ['Distanz', p.trail.distanceKm ? `${p.trail.distanceKm} km` : null], ['Dauer', p.trail.duration], ['Höhenmeter', p.trail.elevGain ? `${p.trail.elevGain} hm` : null], ['Anfahrt', p.drive.min ? `${p.drive.min} min · ${fmt(p.drive.km, ' km')}` : null], ['Höchster Punkt', p.trail.elevHigh ? `${p.trail.elevHigh} m` : null], ['Tiefster Punkt', p.trail.elevLow ? `${p.trail.elevLow} m` : null]].forEach(x => grid.append(Components.kv(x[0], x[1])));
  body.append(grid, el('div', 'divider'));
  const links = cid(el('div', 'link-grid'), 'PD-03', Registry['PD-03'], p.id);
  if (p.googleMapsFromHome) links.append(Components.link(p.googleMapsFromHome, '⌖', 'Anfahrt'));
  if (p.links.visitMadeira) links.append(Components.link(`https://www.visitmadeira.com/de/resultate?Search=${encodeURIComponent(p.links.visitMadeira)}`, '↗', 'Visit'));
  if (p.lat && p.lon) links.append(Components.link(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`, '◎', 'Google'));
  body.append(links, el('div', 'divider'));
  body.append(cid(el('div', 'empty', { html: `GPX: ${p.dataStatus.gpx ? 'vorhanden' : 'Nicht in den bereitgestellten Daten vorhanden.'}<br>KML: ${p.dataStatus.kml ? 'vorhanden' : 'Nicht in den bereitgestellten Daten vorhanden.'}<br>Parken/Gebühr: ${p.parking.info || p.parking.fee || 'Nicht in den bereitgestellten Daten vorhanden.'}` }), 'PD-04', Registry['PD-04'], p.id));
  sheet.append(head, body); host.append(sheet); applyAuditState();
}
function decimate(points, max = 1600) { if (!Array.isArray(points) || points.length <= max) return points || []; const step = Math.ceil(points.length / max); return points.filter((_, i) => i % step === 0 || i === points.length - 1); }
async function showActiveLines(p) {
  clearActiveLines();
  const bounds = [];
  if (p.routeFile) {
    try { const r = await (await fetch(p.routeFile, { cache: 'force-cache' })).json(); const pts = decimate(r.points, 1800); L.polyline(pts, { color: '#0a84ff', weight: 5, opacity: .82, renderer: PRX.pinRenderer, smoothFactor: 1.2, interactive: false }).addTo(PRX.layers.kml); bounds.push(...pts); }
    catch (e) { console.warn(e); }
  }
  if (p.trackFile) {
    try { const g = await (await fetch(p.trackFile, { cache: 'force-cache' })).json(); const pts = decimate(g.points, 1800); L.polyline(pts, { color: '#ff453a', weight: 5, opacity: .88, renderer: PRX.pinRenderer, smoothFactor: 1.2, interactive: false }).addTo(PRX.layers.gpx); bounds.push(...pts); }
    catch (e) { console.warn(e); }
  }
  if (bounds.length && PRX.map) PRX.map.fitBounds(bounds, { padding: [30, 90], maxZoom: 13, animate: false });
}
function clearActiveLines() { if (PRX.layers.gpx) PRX.layers.gpx.clearLayers(); if (PRX.layers.kml) PRX.layers.kml.clearLayers(); }

function openFilter() {
  const body = el('div');
  const regions = [...new Set(PRX.data.prs.map(p => p.region).filter(Boolean))].sort();
  const statuses = [...new Set(PRX.data.prs.map(p => p.status || 'prüfen'))].sort();
  body.append(selectRow('Region', regions, PRX.filter.region, v => { PRX.filter.region = v; renderPins(); if (PRX.view === 'journal') renderJournal(); }), selectRow('Status', statuses, PRX.filter.status, v => { PRX.filter.status = v; renderPins(); if (PRX.view === 'journal') renderJournal(); }), el('button', 'chip', { type: 'button', text: 'Filter zurücksetzen', onclick: () => { PRX.filter = { q: '', region: '', status: '' }; closePanel(); renderView('journal'); renderPins(); } }));
  openPanel('Filter', body, 'F-00');
}
function selectRow(label, items, value, onChange) {
  const row = el('div', 'settings-row'); row.append(el('div', 'kv-label', { text: label }));
  const s = el('select', 'search'); s.innerHTML = '<option value="">Alle</option>' + items.map(i => `<option ${i === value ? 'selected' : ''}>${i}</option>`).join('');
  s.addEventListener('change', () => onChange(s.value)); row.append(s); return row;
}
function openSettings() {
  const body = el('div');
  body.append(el('div', 'empty', { html: `Version: ${PRX.version}<br>Homezone: ${PRX.settings.home.name}<br>${PRX.settings.home.lat}, ${PRX.settings.home.lon}` }));
  const row = cid(el('div', 'settings-row'), 'S-01', Registry['S-01']);
  row.append(el('div', 'kv-label', { text: 'Transparenz' }));
  const range = el('input', '', { type: 'range', min: '60', max: '96', value: String(Math.round(PRX.settings.sheetTransparency * 100)) });
  range.addEventListener('input', () => { PRX.settings.sheetTransparency = Number(range.value) / 100; document.documentElement.style.setProperty('--sheetAlpha', PRX.settings.sheetTransparency); });
  row.append(range); body.append(row); openPanel('Einstellungen', body, 'S-00');
}
function openPanel(title, body, id = 'P-00') { const host = $('#panelHost'); host.innerHTML = ''; host.hidden = false; host.append(Components.panel(title, body, closePanel, id)); applyAuditState(); }
function closePanel() { const host = $('#panelHost'); host.hidden = true; host.innerHTML = ''; }

function openAuditCenter() {
  const body = el('div');
  body.append(el('div', 'empty', { html: `Session: <b>${PRX.audit.sessionId}</b><br>Tickets gesamt: ${PRX.audit.tickets.length}<br>Offen: ${PRX.audit.tickets.filter(t => t.status !== 'erledigt').length}` }));
  body.append(
    Components.toggleRow('Audit-Modus aktiv', PRX.audit.enabled, v => { PRX.audit.enabled = v; if (!v) PRX.audit.noteMode = false; saveAudit(); applyAuditState(); openAuditCenter(); }, 'A-01'),
    Components.toggleRow('Element-IDs anzeigen', PRX.audit.labels, v => { PRX.audit.labels = v; saveAudit(); applyAuditState(); }, 'A-02'),
    Components.toggleRow('Notizmodus: nächster Tap erzeugt Ticket', PRX.audit.noteMode, v => { PRX.audit.enabled = true; PRX.audit.noteMode = v; saveAudit(); applyAuditState(); openAuditCenter(); }, 'A-03')
  );
  const actions = el('div', 'audit-actions');
  actions.append(
    cid(el('button', 'chip', { type: 'button', text: 'CSV exportieren', onclick: exportCSV }), 'A-05', Registry['A-05']),
    cid(el('button', 'chip', { type: 'button', text: 'JSON exportieren', onclick: exportJSON }), 'A-06', Registry['A-06']),
    cid(el('button', 'chip', { type: 'button', text: 'CSV importieren', onclick: importCSV }), 'A-07', Registry['A-07']),
    el('button', 'chip danger', { type: 'button', text: 'Neue Session', onclick: newAuditSession })
  );
  body.append(actions);
  const list = cid(el('div', 'ticket-list'), 'A-04', Registry['A-04']);
  const tickets = PRX.audit.tickets.filter(t => t.sessionId === PRX.audit.sessionId).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  if (!tickets.length) list.append(el('div', 'empty', { text: 'Noch keine Tickets in dieser Session.' }));
  tickets.forEach(t => list.append(ticketRow(t)));
  body.append(list);
  openPanel('Audit Center', body, 'A-00');
}
function ticketRow(t) {
  const row = el('div', `ticket-row ${t.status === 'erledigt' ? 'done' : ''}`);
  const cb = el('input', '', { type: 'checkbox' }); cb.checked = t.status === 'erledigt';
  cb.addEventListener('change', () => { t.status = cb.checked ? 'erledigt' : 'offen'; t.updatedAt = nowIso(); saveAudit(); openAuditCenter(); });
  const main = el('div', 'ticket-main', { html: `<b>${t.ticketId}</b> · ${t.componentId} · ${t.view}${t.prId ? ' · ' + t.prId : ''}<br><span>${t.note || 'Keine Notiz'}</span>` });
  const del = el('button', 'mini-danger', { type: 'button', text: 'Löschen', onclick: () => { if (confirm(`${t.ticketId} wirklich löschen?`)) { PRX.audit.tickets = PRX.audit.tickets.filter(x => x.ticketId !== t.ticketId); saveAudit(); openAuditCenter(); } } });
  row.append(cb, main, del);
  return row;
}
function newAuditSession() {
  PRX.audit.sessionId = `TS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  PRX.audit.noteMode = false;
  saveAudit(); openAuditCenter();
}

function bindAuditCapture() {
  document.addEventListener('click', e => {
    if (!PRX.audit.enabled || !PRX.audit.noteMode || PRX.audit.locked) return;
    const target = e.target.closest('[data-prx-id]');
    if (!target || target.closest('.audit-modal') || target.closest('#panelHost')) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    openNotePopup(target);
  }, true);
}
function applyAuditState() {
  document.documentElement.classList.toggle('audit-on', PRX.audit.enabled && PRX.audit.labels);
  document.documentElement.classList.toggle('audit-note-mode', PRX.audit.enabled && PRX.audit.noteMode);
}
function openNotePopup(target) {
  if ($('.audit-modal')) return;
  PRX.audit.locked = true;
  const componentId = target.dataset.prxId || 'UNKNOWN';
  const componentName = target.dataset.prxName || Registry[componentId] || componentId;
  const prId = target.dataset.prxContext || (PRX.active && PRX.active.id) || '';
  const overlay = el('div', 'audit-modal');
  const box = cid(el('section', 'audit-note-box'), 'A-08', Registry['A-08']);
  box.style.left = '18px'; box.style.top = '110px';
  const header = el('header', 'audit-note-head', { html: `<b>${componentId}</b><span>${componentName}</span>` });
  const close = el('button', 'icon-btn', { type: 'button', html: '×', onclick: closeNotePopup });
  header.append(close);
  const body = el('div', 'audit-note-body');
  body.append(el('div', 'sub', { text: `Ticket ${ticketNo(PRX.audit.nextTicket)} · Ansicht: ${PRX.view}${prId ? ' · Kontext: ' + prId : ''}` }));
  const ta = el('textarea', 'audit-note-input', { placeholder: 'Notiz diktieren oder eintippen …' });
  const priority = el('select', 'search');
  priority.innerHTML = '<option>normal</option><option>hoch</option><option>kritisch</option><option>niedrig</option>';
  const actions = el('div', 'audit-note-actions');
  actions.append(priority, el('button', 'chip', { type: 'button', text: 'Speichern', onclick: () => saveNoteTicket(componentId, componentName, prId, ta.value, priority.value) }), el('button', 'chip', { type: 'button', text: 'Abbrechen', onclick: closeNotePopup }));
  body.append(ta, actions);
  box.append(header, body); overlay.append(box); document.body.append(overlay);
  makeDraggable(box, header); setTimeout(() => ta.focus(), 100);
}
function closeNotePopup() { const m = $('.audit-modal'); if (m) m.remove(); PRX.audit.locked = false; }
function saveNoteTicket(componentId, componentName, prId, note, priority) {
  const num = PRX.audit.nextTicket++;
  const t = { sessionId: PRX.audit.sessionId, ticketNum: num, ticketId: ticketNo(num), status: 'offen', priority, createdAt: nowIso(), updatedAt: nowIso(), componentId, componentName, view: PRX.view, prId, action: 'note', note: (note || '').trim(), resolution: '', changeRequestId: '' };
  PRX.audit.tickets.push(t); PRX.audit.noteMode = false; saveAudit(); closeNotePopup(); applyAuditState(); Components.toast(`${t.ticketId} gespeichert`);
}
function makeDraggable(box, handle) {
  let sx = 0, sy = 0, ox = 0, oy = 0, active = false;
  handle.addEventListener('pointerdown', e => { active = true; sx = e.clientX; sy = e.clientY; const r = box.getBoundingClientRect(); ox = r.left; oy = r.top; handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', e => {
    if (!active) return;
    const w = box.offsetWidth, h = box.offsetHeight;
    const x = Math.min(Math.max(8, ox + e.clientX - sx), window.innerWidth - w - 8);
    const y = Math.min(Math.max(8, oy + e.clientY - sy), window.innerHeight - h - 8);
    box.style.left = `${x}px`; box.style.top = `${y}px`;
  });
  handle.addEventListener('pointerup', () => active = false);
}

function csvForSession() {
  const cols = ['sessionId', 'ticketId', 'status', 'priority', 'createdAt', 'updatedAt', 'componentId', 'componentName', 'view', 'prId', 'action', 'note', 'resolution', 'changeRequestId'];
  const rows = PRX.audit.tickets.filter(t => t.sessionId === PRX.audit.sessionId).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  return '\ufeff' + [cols.join(';'), ...rows.map(t => cols.map(c => csvEscape(t[c])).join(';'))].join('\n');
}
async function shareBlob(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: filename }); return; }
  const url = URL.createObjectURL(blob); const a = el('a', '', { href: url, download: filename }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCSV() { const name = `PRX_Audit_${PRX.audit.sessionId}_${todayStamp()}.csv`; shareBlob(new Blob([csvForSession()], { type: 'text/csv;charset=utf-8' }), name).catch(err => console.warn(err)); }
function exportJSON() { const name = `PRX_Audit_${PRX.audit.sessionId}_${todayStamp()}.json`; const rows = PRX.audit.tickets.filter(t => t.sessionId === PRX.audit.sessionId); shareBlob(new Blob([JSON.stringify({ sessionId: PRX.audit.sessionId, exportedAt: nowIso(), tickets: rows }, null, 2)], { type: 'application/json;charset=utf-8' }), name).catch(err => console.warn(err)); }
function importCSV() {
  const input = el('input', '', { type: 'file', accept: '.csv,text/csv' });
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0]; if (!file) return;
    const text = await file.text(); const rows = parseCSV(text);
    rows.forEach(r => { if (r.ticketId && !PRX.audit.tickets.some(t => t.ticketId === r.ticketId && t.sessionId === r.sessionId)) PRX.audit.tickets.push(r); });
    saveAudit(); openAuditCenter(); Components.toast('CSV importiert');
  });
  input.click();
}
function parseCSV(text) {
  const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).filter(Boolean); if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ','; const cols = splitCSVLine(lines[0], sep);
  return lines.slice(1).map(line => { const values = splitCSVLine(line, sep); const o = {}; cols.forEach((c, i) => o[c] = values[i] || ''); return o; });
}
function splitCSVLine(line, sep) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ''; } else cur += ch; }
  out.push(cur); return out;
}

window.addEventListener('resize', scheduleMapSize);
document.addEventListener('DOMContentLoaded', init);
})();
