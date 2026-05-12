/* Shared UI primitives — icons, brand, money, badges */

const ICONS = {
  dashboard: <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  quote:     <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="14 3 14 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></>,
  bom:       <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  pricing:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
  copper:    <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></>,
  labour:    <><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></>,
  reports:   <><path d="M3 3v18h18"/><path d="M7 15l4-4 4 3 5-6"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  trash:     <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
  copy:      <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  download:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 5 17 10"/><line x1="12" y1="5" x2="12" y2="15"/></>,
  send:      <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  printer:   <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  check:     <><polyline points="20 6 9 17 4 12"/></>,
  x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  chev:      <><polyline points="9 18 15 12 9 6"/></>,
  chevL:     <><polyline points="15 18 9 12 15 6"/></>,
  arrow:     <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  lock:      <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  user:      <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  building:  <><rect x="4" y="2" width="16" height="20" rx="1"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></>,
  filter:    <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  grip:      <><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></>,
  bolt:      <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  cube:      <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  warn:      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  info:      <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  edit:      <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  doc:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  dots:      <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  trend:     <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  sun:       <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></>,
  moon:      <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  spinner:   <><line x1="12" y1="2"  x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
  panels:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
};

const Icon = ({ name, size = 16, className = '', style = {} }) => {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      {paths}
    </svg>
  );
};

const Brand = ({ small = false }) => (
  <div className="brand" style={small ? { padding: 0, border: 0, height: 'auto' } : null}>
    <div className="brand-mark">PP</div>
    <div>
      <div className="brand-name">Power Panels</div>
      <div className="brand-sub">& Electrical</div>
    </div>
  </div>
);

const Money = ({ value, currency = 'R', decimals = 0 }) => {
  const n = Number(value || 0);
  const s = n.toLocaleString('en-ZA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span className="num">{currency} {s}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    draft: { cls: '',              label: 'Draft' },
    sent:  { cls: 'badge-primary', label: 'Sent'  },
    won:   { cls: 'badge-success', label: 'Won'   },
    lost:  { cls: 'badge-danger',  label: 'Lost'  },
  };
  const s = map[status] || map.draft;
  return <span className={`badge ${s.cls}`}><span className="badge-dot"/>{s.label}</span>;
};

const CategoryIcon = ({ cat, size = 18 }) => {
  const m = {
    enclosure: 'cube', protection: 'bolt', copper: 'copy',
    internal: 'cube', wiring: 'bolt', automation: 'settings',
    metering: 'trend', labour: 'user', misc: 'dots',
  };
  return <Icon name={m[cat] || 'cube'} size={size}/>;
};

// Spinner overlay for loading states
const Spinner = ({ label = 'Loading…' }) => (
  <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: 200, color: 'var(--text-dim)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <Icon name="spinner" size={22} style={{ animation: 'spin 1s linear infinite' }}/>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11.5 }}>{label}</span>
    </div>
  </div>
);

// Toast notification (simple, self-dismissing)
const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);
  const show = React.useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? 'var(--danger)' : t.type === 'success' ? 'var(--success)' : 'var(--surface-2)',
            color: t.type === 'error' || t.type === 'success' ? 'white' : 'var(--text)',
            border: '1px solid var(--border-strong)',
            borderRadius: 5,
            padding: '9px 14px',
            fontSize: 12.5,
            boxShadow: 'var(--shadow-md)',
            minWidth: 220,
            fontFamily: 'IBM Plex Sans, sans-serif',
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

// Inject spinner keyframe
const _spinStyle = document.createElement('style');
_spinStyle.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(_spinStyle);

// ── API client ────────────────────────────────────────────────────────────────
const API_BASE = 'api';

// Encode a body object as URLSearchParams.
// Nested arrays/objects are JSON-stringified as individual fields so PHP can
// decode them in body() — this avoids relying on php://input which is
// unavailable on some shared hosting setups.
function encodeBody(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj || {})) {
    params.append(k, (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v ?? ''));
  }
  return params;
}

const api = {
  async request(endpoint, options = {}) {
    const hasBody = options.body !== undefined && options.body !== null;
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': hasBody ? 'application/x-www-form-urlencoded' : 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      ...options,
      body: hasBody ? encodeBody(options.body) : undefined,
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Request failed');
    return json.data;
  },
  get:    (ep)       => api.request(ep, { method: 'GET'    }),
  post:   (ep, body) => api.request(ep, { method: 'POST',   body }),
  put:    (ep, body) => api.request(ep + (ep.includes('?') ? '&' : '?') + '_method=PUT', { method: 'POST', body }),
  delete: (ep)       => api.request(ep, { method: 'DELETE' }),
};

window.Icon        = Icon;
window.Brand       = Brand;
window.Money       = Money;
window.StatusBadge = StatusBadge;
window.CategoryIcon= CategoryIcon;
window.Spinner     = Spinner;
window.ToastProvider = ToastProvider;
window.useToast    = useToast;
window.api         = api;

window.CATEGORIES = [
  { id: 'all',        label: 'All Items'       },
  { id: 'enclosure',  label: 'Enclosures'      },
  { id: 'protection', label: 'Circuit Protection' },
  { id: 'copper',     label: 'Copper Work'     },
  { id: 'internal',   label: 'Internal Comp.'  },
  { id: 'wiring',     label: 'Wiring'          },
  { id: 'automation', label: 'Automation'      },
  { id: 'metering',   label: 'Metering'        },
  { id: 'labour',     label: 'Labour'          },
  { id: 'misc',       label: 'Misc.'           },
];
