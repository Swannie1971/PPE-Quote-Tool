/* Quote Builder — full implementation */

// ── Copper size / price lookup ────────────────────────────────────────────────
// Standard bare copper busbar prices (R/m). Update via Settings → copper_price_per_m
// for the default, or pick a size here to auto-fill cost.
const COPPER_SIZES = [
  { w:30,  h:10, price:687.50   },
  { w:40,  h:10, price:937.50   },
  { w:50,  h:10, price:1125.00  },
  { w:60,  h:10, price:1375.00  },
  { w:80,  h:10, price:1812.50  },
  { w:100, h:10, price:2250.00  },
  { w:120, h:10, price:2687.50  },
];

function parseCopperSizes(settings) {
  try {
    const p = JSON.parse(settings.copper_size_prices || '');
    if (Array.isArray(p) && p.length > 0) return p;
  } catch {}
  return COPPER_SIZES;
}

function copperPriceLookup(w, h, sizes) {
  const match = (sizes || COPPER_SIZES).find(s => s.w === +w && s.h === +h);
  return match ? match.price : null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeTotals(bom, labour, copper, vatRate, labourMarkup) {
  vatRate      = +vatRate      || 15;
  labourMarkup = +labourMarkup || 45;

  const bomCost = bom.reduce((s,i) => s + (+i.qty||0) * (+i.cost_price||0), 0);
  const bomSell = bom.reduce((s,i) => s + (+i.qty||0) * (+i.cost_price||0) * (1 + (+i.markup_pct||0)/100), 0);

  const labourSell = labour.reduce((s,i) => s + (+i.hours||0) * (+i.rate||0), 0);
  const labourCost = labourSell / (1 + labourMarkup/100);

  let copperCost = 0, copperSell = 0;
  for (const r of copper) {
    const mat  = (+r.qty||1) * (+r.length_m||0) * (+r.price_per_m||0) * (1 + (+r.waste_pct||0)/100);
    const fab  = (+r.fab_hours||0) * (+r.fab_rate||0);
    const cost = mat + fab;
    copperCost += cost;
    copperSell += cost * (1 + (+r.markup_pct||0)/100);
  }

  const totalCost = bomCost + labourCost + copperCost;
  const totalSell = bomSell + labourSell + copperSell;
  const vat       = totalSell * vatRate / 100;
  const totalIncl = totalSell + vat;
  const gpRand    = totalSell - totalCost;
  const gpPct     = totalSell > 0 ? gpRand / totalSell * 100 : 0;

  return { bomCost, bomSell, labourCost, labourSell, copperCost, copperSell,
           totalCost, totalSell, vat, totalIncl, gpRand, gpPct };
}

const fmtR = (n, d=0) =>
  'R ' + Number(+n||0).toLocaleString('en-ZA', { minimumFractionDigits:d, maximumFractionDigits:d });

const uid = () => '_' + Math.random().toString(36).slice(2,9);

function parseSettings(data) {
  const s = {};
  if (Array.isArray(data)) data.forEach(r => { s[r.key] = r.value; });
  else if (data && typeof data === 'object') Object.assign(s, data);
  return s;
}

// ── Right-hand summary sidebar ────────────────────────────────────────────────

const QuoteSummary = ({ draft, t, settings }) => {
  const vatRate = +draft.vat_rate || +settings.default_vat_rate || 15;
  const target  = +settings.margin_target || 25;
  const gpColor = t.gpPct >= target ? 'var(--success)' : 'var(--warning)';
  const tot     = t.totalSell || 1;

  return (
    <aside style={{ width:296, borderLeft:'1px solid var(--border)', background:'var(--bg-elev)', overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column' }}>
      <div className="sum-section">
        <div className="sum-title">Quote Totals</div>
        {t.bomSell     > 0 && <div className="sum-row"><span className="sk">Materials</span><span>{fmtR(t.bomSell)}</span></div>}
        {t.labourSell  > 0 && <div className="sum-row"><span className="sk">Labour</span><span>{fmtR(t.labourSell)}</span></div>}
        {t.copperSell  > 0 && <div className="sum-row"><span className="sk">Copper</span><span>{fmtR(t.copperSell)}</span></div>}
        <div className="sum-row total"><span className="sk">Subtotal</span><span>{fmtR(t.totalSell)}</span></div>
        <div className="sum-row"><span className="sk">VAT ({vatRate}%)</span><span>{fmtR(t.vat)}</span></div>
        <div className="sum-row total" style={{ borderTop:'1px solid var(--border-strong)', paddingTop:8, marginTop:4 }}>
          <span className="sk" style={{ fontWeight:600, color:'var(--text)' }}>Total incl. VAT</span>
          <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:15, fontWeight:600 }}>{fmtR(t.totalIncl)}</span>
        </div>
      </div>

      <div className="sum-section">
        <div className="sum-title">Gross Profit</div>
        <div className="sum-row"><span className="sk">GP (rand)</span><span style={{ color:gpColor }}>{fmtR(t.gpRand)}</span></div>
        <div className="sum-row"><span className="sk">GP%</span><span style={{ color:gpColor, fontWeight:600 }}>{t.gpPct.toFixed(1)}%</span></div>
        <div className="margin-meter" style={{ marginTop:10 }}>
          <div className="meter" style={{ flex:1 }}>
            <div className="meter-fill" style={{ width:Math.min(t.gpPct/60*100,100)+'%', background:gpColor }}/>
            <div className="meter-tick" style={{ left:target/60*100+'%' }}/>
          </div>
          <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10, color:'var(--text-dim)' }}>tgt {target}%</span>
        </div>
      </div>

      <div className="sum-section">
        <div className="sum-title">Breakdown</div>
        <div style={{ height:8, background:'var(--surface-2)', borderRadius:999, overflow:'hidden', border:'1px solid var(--border)', display:'flex', marginBottom:10 }}>
          <div style={{ width:t.bomSell/tot*100+'%',    background:'var(--primary)', transition:'width .3s' }}/>
          <div style={{ width:t.labourSell/tot*100+'%', background:'var(--success)', transition:'width .3s' }}/>
          <div style={{ width:t.copperSell/tot*100+'%', background:'var(--warning)', transition:'width .3s' }}/>
        </div>
        {[['Materials', t.bomSell, 'var(--primary)'], ['Labour', t.labourSell, 'var(--success)'], ['Copper', t.copperSell, 'var(--warning)']].filter(([,v]) => v > 0).map(([lbl,sell,col]) => (
          <div key={lbl} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:col, flexShrink:0 }}/>
            <span style={{ flex:1, color:'var(--text-muted)' }}>{lbl}</span>
            <span style={{ color:'var(--text-dim)' }}>{tot > 0 ? (sell/tot*100).toFixed(0) : 0}%</span>
            <span>{fmtR(sell)}</span>
          </div>
        ))}
      </div>

      <div className="sum-section">
        <div className="sum-title">Analysis</div>
        <div className="sum-row"><span className="sk">Total cost</span><span>{fmtR(t.totalCost)}</span></div>
        <div className="sum-row"><span className="sk">Mat. markup</span>
          <span>{t.bomCost > 0 ? ((t.bomSell/t.bomCost - 1)*100).toFixed(0)+'%' : '—'}</span></div>
        <div className="sum-row"><span className="sk">BOM lines</span><span>{(draft.bom||[]).length}</span></div>
        <div className="sum-row"><span className="sk">Labour hours</span>
          <span className="mono">{(draft.labour||[]).reduce((s,i) => s+(+i.hours||0),0).toFixed(1)}</span></div>
      </div>
    </aside>
  );
};

// ── Customer Tab ──────────────────────────────────────────────────────────────

const CustomerTab = ({ draft, update, user }) => {
  const [suggestions,  setSuggestions]  = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const searchTimer = React.useRef(null);

  const fld = (field) => ({
    value: draft[field] || '',
    onChange: e => update({ [field]: e.target.value }),
  });

  const handleCustomerNameChange = (e) => {
    const val = e.target.value;
    update({ customer_name: val });
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    searchTimer.current = setTimeout(() => {
      api.get(`customers.php?q=${encodeURIComponent(val)}`)
        .then(res => { setSuggestions(res); setShowDropdown(res.length > 0); })
        .catch(() => {});
    }, 280);
  };

  const selectCustomer = (c) => {
    update({
      customer_name:  c.name,
      contact_person: c.contact_person || '',
      phone:          c.phone          || '',
      email:          c.email          || '',
      address:        c.address        || '',
    });
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>
      <div style={{ maxWidth:860 }}>
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-head"><div className="card-title">Customer Details</div></div>
          <div className="card-body">
            <div className="form-grid cols-2" style={{ gap:14 }}>
              <div className="field col-span-2" style={{ position:'relative' }}>
                <label className="label">Company / Customer Name</label>
                <input className="input" placeholder="e.g. Acme Industries (Pty) Ltd"
                  value={draft.customer_name || ''}
                  onChange={handleCustomerNameChange}
                  onBlur={() => setShowDropdown(false)}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                />
                {showDropdown && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:5, boxShadow:'0 4px 16px rgba(0,0,0,0.25)', zIndex:50, maxHeight:220, overflowY:'auto', marginTop:2 }}>
                    {suggestions.map(c => (
                      <div key={c.id}
                        onMouseDown={e => { e.preventDefault(); selectCustomer(c); }}
                        style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                      >
                        <div style={{ fontWeight:500, fontSize:13 }}>{c.name}</div>
                        {c.contact_person && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{c.contact_person}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="field">
                <label className="label">Contact Person</label>
                <input className="input" placeholder="Full name" {...fld('contact_person')}/>
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input className="input" type="tel" placeholder="+27 …" {...fld('phone')}/>
              </div>
              <div className="field">
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="name@company.co.za" {...fld('email')}/>
              </div>
              <div className="field">
                <label className="label">Physical Address</label>
                <input className="input" placeholder="Address" {...fld('address')}/>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Project Details</div></div>
          <div className="card-body">
            <div className="form-grid cols-2" style={{ gap:14 }}>
              <div className="field col-span-2">
                <label className="label">Project Name</label>
                <input className="input" placeholder="e.g. MCC Panel — Building 3, Phase 2" {...fld('project_name')}/>
              </div>
              <div className="field">
                <label className="label">Site / Location</label>
                <input className="input" placeholder="Site name or address" {...fld('site_location')}/>
              </div>
              <div className="field">
                <label className="label">Estimator</label>
                <input className="input" placeholder={user?.full_name || ''} {...fld('estimator_name')}/>
              </div>
              <div className="field">
                <label className="label">Quote Date</label>
                <input className="input mono" type="date" {...fld('quote_date')}/>
              </div>
              <div className="field">
                <label className="label">Validity (days)</label>
                <input className="input num" type="number" min="1" max="365" {...fld('validity_days')}/>
              </div>
              <div className="field">
                <label className="label">VAT Rate (%)</label>
                <input className="input num" type="number" min="0" max="30" step="0.5" {...fld('vat_rate')}/>
              </div>
              <div className="field">
                <label className="label">Status</label>
                <select className="select" {...fld('status')}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent to Client</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Panels Tab ────────────────────────────────────────────────────────────────

const PanelsTab = ({ panels, onChange }) => {
  const addPanel = () => onChange([...panels, { id: uid(), name: '', description: '', qty: 1 }]);
  const upd = (id, f, v) => onChange(panels.map(p => p.id === id ? { ...p, [f]: v } : p));
  const rem = (id) => onChange(panels.filter(p => p.id !== id));

  return (
    <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>
      <div style={{ maxWidth:860 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:16 }}>Panels</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>
              Define each board / panel in this project · assign items on the BOM, Labour & Copper tabs
            </div>
          </div>
          <button className="btn btn-sm" onClick={addPanel}><Icon name="plus" size={12}/>Add Panel</button>
        </div>

        {panels.length === 0 ? (
          <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-dim)' }}>
            <Icon name="panels" size={26} style={{ display:'block', margin:'0 auto 10px' }}/>
            <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, marginBottom:8 }}>No panels defined</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
              Add a panel for each distribution board, MCC, or control panel in this project
            </div>
            <button className="btn btn-sm" onClick={addPanel}><Icon name="plus" size={12}/>Add Panel</button>
          </div>
        ) : (
          <>
            {panels.map((panel) => (
              <div key={panel.id} className="card" style={{ marginBottom:12 }}>
                <div className="card-body">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px auto', gap:12, alignItems:'flex-end' }}>
                    <div className="field" style={{ marginBottom:0 }}>
                      <label className="label">Panel Name</label>
                      <input className="input" value={panel.name||''}
                        onChange={e => upd(panel.id, 'name', e.target.value)}
                        placeholder="e.g. Main Distribution Board"/>
                    </div>
                    <div className="field" style={{ marginBottom:0 }}>
                      <label className="label">Description</label>
                      <input className="input" value={panel.description||''}
                        onChange={e => upd(panel.id, 'description', e.target.value)}
                        placeholder="e.g. 400A MCC, IP55, 18-way"/>
                    </div>
                    <div className="field" style={{ marginBottom:0 }}>
                      <label className="label">Qty</label>
                      <input className="input num" type="number" min="1" value={panel.qty||1}
                        onChange={e => upd(panel.id, 'qty', e.target.value)}/>
                    </div>
                    <button className="btn btn-sm btn-ghost btn-danger btn-icon"
                      onClick={() => { if (confirm('Remove this panel? Assigned items will become unassigned.')) rem(panel.id); }}>
                      <Icon name="trash" size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:5, padding:'10px 14px', fontSize:12, color:'var(--text-muted)' }}>
              <Icon name="info" size={14} style={{ flexShrink:0, marginTop:1 }}/>
              <span>Go to the <strong>BOM</strong>, <strong>Labour</strong>, and <strong>Copper</strong> tabs to assign items to these panels. Unassigned items appear as "General / Common" on the Price per Panel PDF.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── BOM Item Editor ───────────────────────────────────────────────────────────

const BomItemEditor = ({ item, onChange, onRemove, settings, panels }) => {
  const cost  = +item.cost_price || 0;
  const mkup  = +item.markup_pct || 0;
  const qty   = +item.qty || 0;
  const sell  = cost * (1 + mkup/100);
  const total = qty * sell;
  const gp    = total - qty * cost;
  const gpPct = total > 0 ? gp/total*100 : 0;
  const target = +settings.margin_target || 25;
  const gpCls  = gpPct >= target ? 'accent' : 'warn';

  return (
    <div>
      <div className="detail-head">
        <div className="detail-icon"><CategoryIcon cat={item.category} size={20}/></div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="detail-title">{item.description || 'New Item'}</div>
          <div className="detail-sub">
            {item.item_code && <span className="mono">{item.item_code}</span>}
            {item.supplier  && <span>{item.supplier}</span>}
            {item.category  && <span className="cat-chip"><CategoryIcon cat={item.category} size={10}/> {item.category}</span>}
          </div>
        </div>
        <button className="btn btn-sm btn-ghost btn-danger btn-icon" title="Remove item"
          onClick={() => { if (confirm('Remove this line item?')) onRemove(); }}>
          <Icon name="trash" size={13}/>
        </button>
      </div>

      <div className="calc-card" style={{ marginBottom:20 }}>
        <div className="calc-grid">
          <div className="calc-cell"><div className="lab">Unit Cost</div><div className="val">{fmtR(cost,2)}</div></div>
          <div className="calc-cell"><div className="lab">Unit Sell</div><div className="val">{fmtR(sell,2)}</div></div>
          <div className={`calc-cell ${gpCls}`}><div className="lab">Line Total</div><div className="val">{fmtR(total)}</div></div>
          <div className={`calc-cell ${gpCls}`}><div className="lab">GP%</div><div className="val">{gpPct.toFixed(1)}%</div></div>
        </div>
      </div>

      {panels.length > 0 && (
        <div className="field" style={{ marginBottom:16 }}>
          <label className="label">Assign to Panel</label>
          <select className="select" value={String(item.panel_id||'')} onChange={e => onChange('panel_id', e.target.value || null)}>
            <option value="">— Unassigned (General / Common) —</option>
            {panels.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
        </div>
      )}

      <div className="form-grid cols-2" style={{ gap:14, marginBottom:16 }}>
        <div className="field col-span-2">
          <label className="label">Description</label>
          <input className="input" value={item.description||''} onChange={e => onChange('description', e.target.value)} placeholder="Item description"/>
        </div>
        <div className="field">
          <label className="label">Item Code</label>
          <input className="input mono" value={item.item_code||''} onChange={e => onChange('item_code', e.target.value)} placeholder="—"/>
        </div>
        <div className="field">
          <label className="label">Supplier</label>
          <input className="input" value={item.supplier||''} onChange={e => onChange('supplier', e.target.value)} placeholder="—"/>
        </div>
        <div className="field">
          <label className="label">Category</label>
          <select className="select" value={item.category||''} onChange={e => onChange('category', e.target.value)}>
            {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'labour').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Unit</label>
          <select className="select" value={item.unit||'ea'} onChange={e => onChange('unit', e.target.value)}>
            {['ea','m','kg','set','lot','hr'].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div className="form-grid" style={{ gap:14, marginBottom:16 }}>
        <div className="field">
          <label className="label">Quantity</label>
          <input className="input num" type="number" min="0" step="1"
            value={item.qty||0} onChange={e => onChange('qty', e.target.value)}/>
        </div>
        <div className="field">
          <label className="label">Cost Price (R)</label>
          <input className="input num" type="number" min="0" step="0.01"
            value={item.cost_price||0} onChange={e => onChange('cost_price', e.target.value)}/>
        </div>
        <div className="field">
          <label className="label">Markup (%)</label>
          <div className="input-group">
            <input className="input num" type="number" min="0" max="500" step="0.5"
              value={item.markup_pct||0} onChange={e => onChange('markup_pct', e.target.value)}/>
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="field">
          <label className="label">Sell Price (R)</label>
          <input className="input num mono" readOnly value={fmtR(sell,2)} style={{ color:'var(--text-muted)' }}/>
        </div>
      </div>

      <div className="field">
        <label className="label">Notes (internal)</label>
        <input className="input" value={item.notes||''} onChange={e => onChange('notes', e.target.value)}
          placeholder="Internal notes — not shown on client quote"/>
      </div>
    </div>
  );
};

// ── BOM Builder ───────────────────────────────────────────────────────────────

const BomBuilder = ({ bom, onChange, settings, panels }) => {
  const [selectedId, setSelectedId] = React.useState(null);
  const [search,     setSearch]     = React.useState('');
  const [catFilter,  setCatFilter]  = React.useState('all');
  const [results,    setResults]    = React.useState([]);
  const [searching,  setSearching]  = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (!selectedId && bom.length > 0) setSelectedId(bom[0].id);
  }, []);

  React.useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      const cat = catFilter !== 'all' ? `&cat=${catFilter}` : '';
      api.get(`pricing.php?q=${encodeURIComponent(search)}${cat}`)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 280);
    return () => clearTimeout(t);
  }, [search, catFilter]);

  const addItem = (p) => {
    const item = {
      id: uid(),
      item_code:  p.item_code,
      description: p.description,
      category:   p.category,
      supplier:   p.supplier,
      unit:       p.unit,
      qty:        1,
      cost_price: +p.cost_price,
      markup_pct: +p.default_markup || +settings.default_markup || 30,
      notes:      '',
      price_overridden: 0,
    };
    onChange([...bom, item]);
    setSelectedId(item.id);
    setSearch('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const updateItem = (id, field, val) =>
    onChange(bom.map(i => i.id === id ? { ...i, [field]: val } : i));

  const removeItem = (id) => {
    const next = bom.filter(i => i.id !== id);
    onChange(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
  };

  const inSearch    = search.trim().length > 0;
  const filtered    = catFilter === 'all' ? bom : bom.filter(i => i.category === catFilter);
  const selectedItem = bom.find(i => i.id === selectedId);

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>
      {/* Left: list panel */}
      <div className="qb-list" style={{ width:360, flexShrink:0 }}>
        <div className="qb-list-head">
          <div className="search" style={{ position:'relative' }}>
            <Icon name="search" size={13} className="search-icon"/>
            <input ref={inputRef} className="input"
              placeholder="Search pricing DB to add…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:30, paddingRight: search ? 28 : 10 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:2 }}>
                <Icon name="x" size={12}/>
              </button>
            )}
          </div>
          <div className="qb-filters">
            {CATEGORIES.slice(1).filter(c => c.id !== 'labour').map(c => (
              <span key={c.id}
                className={`filter-chip ${catFilter === c.id ? 'active' : ''}`}
                onClick={() => setCatFilter(catFilter === c.id ? 'all' : c.id)}
                style={{ fontSize:10, padding:'2px 6px' }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {inSearch ? (
          <>
            {searching && (
              <div style={{ padding:'10px 14px', color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>Searching…</div>
            )}
            {!searching && results.length === 0 && (
              <div style={{ padding:'10px 14px', color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:11 }}>No items found.</div>
            )}
            {results.map(item => {
              const sellPrice = +item.cost_price * (1 + (+item.default_markup||0)/100);
              return (
                <div key={item.id} className="line-row" onClick={() => addItem(item)} style={{ cursor:'pointer' }}>
                  <div style={{ minWidth:0 }}>
                    <div className="line-code">{item.item_code}</div>
                    <div className="line-desc">{item.description}</div>
                    <div className="line-meta"><span>{item.supplier}</span><span>/{item.unit}</span></div>
                  </div>
                  <div className="line-price" style={{ flexShrink:0 }}>
                    <div className="line-total">{fmtR(sellPrice)}</div>
                    <div style={{ fontSize:9.5, color:'var(--success)', marginTop:2, textAlign:'right' }}>+ Add</div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="qb-toolbar">
              <button className="btn btn-sm" onClick={() => inputRef.current?.focus()}>
                <Icon name="plus" size={12}/>Add Item
              </button>
              <span style={{ marginLeft:'auto', fontFamily:'IBM Plex Mono,monospace', fontSize:10.5, color:'var(--text-dim)' }}>
                {bom.length} line{bom.length !== 1 ? 's' : ''} · {fmtR(bom.reduce((s,i) => s + (+i.qty||0)*(+i.cost_price||0)*(1+(+i.markup_pct||0)/100),0))}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty">
                <div style={{ textAlign:'center' }}>
                  <Icon name="bom" size={22} style={{ display:'block', margin:'0 auto 8px', color:'var(--text-dim)' }}/>
                  <div>No items yet</div>
                  <div style={{ fontSize:10, marginTop:4 }}>Search the pricing DB above to add</div>
                </div>
              </div>
            ) : (
              filtered.map(item => {
                const sellTotal = (+item.qty||0) * (+item.cost_price||0) * (1 + (+item.markup_pct||0)/100);
                return (
                  <div key={item.id}
                    className={`line-row ${selectedId === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div style={{ minWidth:0 }}>
                      <div className="line-code">{item.item_code || '—'}</div>
                      <div className="line-desc">{item.description}</div>
                      <div className="line-meta">
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <CategoryIcon cat={item.category} size={10}/>{item.category}
                        </span>
                      </div>
                    </div>
                    <div className="line-price" style={{ flexShrink:0 }}>
                      <div className="line-total">{fmtR(sellTotal)}</div>
                      <div className="line-qty">×{item.qty} {item.unit}</div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Right: detail editor */}
      <div className="qb-detail" style={{ flex:1, overflowY:'auto', padding:'24px 28px', minWidth:0 }}>
        {!selectedItem ? (
          <div className="empty" style={{ height:'100%' }}>
            <div style={{ textAlign:'center' }}>
              <Icon name="edit" size={22} style={{ display:'block', margin:'0 auto 8px', color:'var(--text-dim)' }}/>
              <div>Select an item to edit</div>
            </div>
          </div>
        ) : (
          <BomItemEditor
            key={selectedItem.id}
            item={selectedItem}
            onChange={(field, val) => updateItem(selectedItem.id, field, val)}
            onRemove={() => removeItem(selectedItem.id)}
            settings={settings}
            panels={panels}
          />
        )}
      </div>
    </div>
  );
};

// ── Labour Tab ────────────────────────────────────────────────────────────────

const SKILL_LEVELS = ['junior','intermediate','senior','artisan','specialist'];

const LabourTab = ({ labour, onChange, settings, panels }) => {
  const labourMarkup = +settings.labour_markup || 45;
  const target       = +settings.margin_target  || 25;

  const addRow = () => onChange([...labour, { id:uid(), category:'', skill_level:'artisan', hours:0, rate:0 }]);
  const upd    = (id, f, v) => onChange(labour.map(r => r.id === id ? { ...r, [f]: v } : r));
  const rem    = (id) => onChange(labour.filter(r => r.id !== id));

  const totalSell = labour.reduce((s,r) => s + (+r.hours||0)*(+r.rate||0), 0);
  const totalCost = totalSell / (1 + labourMarkup/100);
  const totalHrs  = labour.reduce((s,r) => s + (+r.hours||0), 0);
  const gp        = totalSell - totalCost;
  const gpPct     = totalSell > 0 ? gp/totalSell*100 : 0;

  return (
    <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>
      <div style={{ maxWidth:860 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:16 }}>Labour</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>
              Enter sell rate per hour · {labourMarkup}% markup applied for cost derivation
            </div>
          </div>
          <button className="btn btn-sm" onClick={addRow}><Icon name="plus" size={12}/>Add Row</button>
        </div>

        <div className="calc-card" style={{ marginBottom:16 }}>
          <div className="calc-grid">
            <div className="calc-cell"><div className="lab">Total Hours</div><div className="val">{totalHrs.toFixed(1)}</div></div>
            <div className="calc-cell"><div className="lab">Labour Sell</div><div className="val">{fmtR(totalSell)}</div></div>
            <div className="calc-cell"><div className="lab">Labour Cost</div><div className="val">{fmtR(totalCost)}</div></div>
            <div className={`calc-cell ${gpPct >= target ? 'accent' : 'warn'}`}>
              <div className="lab">GP%</div>
              <div className="val">{gpPct.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Labour Allocation</div></div>
          <table className="data">
            <thead>
              <tr>
                <th>Category</th>
                {panels.length > 0 && <th style={{ width:150 }}>Panel</th>}
                <th style={{ width:140 }}>Skill Level</th>
                <th className="t-right" style={{ width:100 }}>Hours</th>
                <th className="t-right" style={{ width:120 }}>Rate (R/hr)</th>
                <th className="t-right" style={{ width:130 }}>Total</th>
                <th style={{ width:44 }}></th>
              </tr>
            </thead>
            <tbody>
              {labour.length === 0 && (
                <tr>
                  <td colSpan={panels.length > 0 ? 7 : 6} style={{ textAlign:'center', color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', fontSize:12, padding:'24px 0' }}>
                    No labour rows — click "Add Row"
                  </td>
                </tr>
              )}
              {labour.map(row => (
                <tr key={row.id}>
                  <td>
                    <input className="input" value={row.category||''} placeholder="e.g. Electrician"
                      onChange={e => upd(row.id,'category',e.target.value)}/>
                  </td>
                  {panels.length > 0 && (
                    <td>
                      <select className="select" value={String(row.panel_id||'')} onChange={e => upd(row.id,'panel_id', e.target.value||null)}>
                        <option value="">— General —</option>
                        {panels.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                      </select>
                    </td>
                  )}
                  <td>
                    <select className="select" value={row.skill_level||'artisan'} onChange={e => upd(row.id,'skill_level',e.target.value)}>
                      {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <input className="input num" type="number" min="0" step="0.5"
                      value={row.hours||0} onChange={e => upd(row.id,'hours',e.target.value)}
                      style={{ textAlign:'right' }}/>
                  </td>
                  <td>
                    <input className="input num" type="number" min="0" step="50"
                      value={row.rate||0} onChange={e => upd(row.id,'rate',e.target.value)}
                      style={{ textAlign:'right' }}/>
                  </td>
                  <td className="t-right t-num">{fmtR((+row.hours||0)*(+row.rate||0))}</td>
                  <td>
                    <button className="btn btn-sm btn-ghost btn-danger btn-icon" onClick={() => rem(row.id)}>
                      <Icon name="trash" size={12}/>
                    </button>
                  </td>
                </tr>
              ))}
              {labour.length > 0 && (
                <tr>
                  <td colSpan={panels.length > 0 ? 5 : 4} style={{ textAlign:'right', fontWeight:600, color:'var(--text-muted)', fontFamily:'IBM Plex Mono,monospace', fontSize:11, padding:'10px 12px' }}>TOTAL</td>
                  <td className="t-right t-num" style={{ fontWeight:600 }}>{fmtR(totalSell)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Copper Tab ────────────────────────────────────────────────────────────────

const CopperTab = ({ copper, onChange, settings, panels }) => {
  const copperSizes = React.useMemo(() => parseCopperSizes(settings), [settings.copper_size_prices]);
  const defWastePct = +settings.copper_waste_pct || 12;
  const defFabRate  = +settings.copper_fab_rate  || 520;
  const defMarkup   = +settings.default_markup   || 30;

  const addRun = () => {
    const sz = copperSizes[1] || copperSizes[0] || { w:40, h:10, price:0 };
    onChange([...copper, {
      id: uid(), name:'Main Busbar', width_mm:sz.w, height_mm:sz.h,
      length_m:1, qty:1, price_per_m:sz.price, waste_pct:defWastePct,
      fab_hours:2, fab_rate:defFabRate, tinned:0, markup_pct:defMarkup,
    }]);
  };

  const upd    = (id, f, v)     => onChange(copper.map(r => r.id === id ? { ...r, [f]: v } : r));
  const updMany = (id, patch)   => onChange(copper.map(r => r.id === id ? { ...r, ...patch } : r));
  const rem    = (id)           => onChange(copper.filter(r => r.id !== id));

  const calc = (r) => {
    const mat  = (+r.qty||1) * (+r.length_m||0) * (+r.price_per_m||0) * (1 + (+r.waste_pct||0)/100);
    const fab  = (+r.fab_hours||0) * (+r.fab_rate||0);
    const cost = mat + fab;
    return { mat, fab, cost, sell: cost * (1 + (+r.markup_pct||0)/100) };
  };

  const totals = copper.reduce((t,r) => { const c = calc(r); return { cost:t.cost+c.cost, sell:t.sell+c.sell }; }, { cost:0, sell:0 });

  return (
    <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>
      <div style={{ maxWidth:900 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:16 }}>Copper Fabrication</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>
              Busbar runs · material + fabrication · waste allowance included
            </div>
          </div>
          <button className="btn btn-sm" onClick={addRun}><Icon name="plus" size={12}/>Add Run</button>
        </div>

        {copper.length === 0 ? (
          <div className="card" style={{ padding:48, textAlign:'center', color:'var(--text-dim)' }}>
            <Icon name="copper" size={24} style={{ display:'block', margin:'0 auto 10px' }}/>
            <div style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, marginBottom:16 }}>No copper runs yet</div>
            <button className="btn btn-sm" onClick={addRun}><Icon name="plus" size={12}/>Add Run</button>
          </div>
        ) : (
          <>
            <div className="calc-card" style={{ marginBottom:16 }}>
              <div className="calc-grid">
                <div className="calc-cell"><div className="lab">Runs</div><div className="val">{copper.length}</div></div>
                <div className="calc-cell"><div className="lab">Total Cost</div><div className="val">{fmtR(totals.cost)}</div></div>
                <div className="calc-cell accent"><div className="lab">Total Sell</div><div className="val">{fmtR(totals.sell)}</div></div>
                <div className="calc-cell"><div className="lab">Margin</div>
                  <div className="val">{totals.sell > 0 ? ((totals.sell-totals.cost)/totals.sell*100).toFixed(1) : 0}%</div>
                </div>
              </div>
            </div>

            {copper.map(r => {
              const { mat, fab, cost, sell } = calc(r);
              return (
                <div key={r.id} className="card" style={{ marginBottom:12 }}>
                  <div className="card-head" style={{ justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <Icon name="copper" size={14} style={{ color:'var(--primary)', flexShrink:0 }}/>
                      <input className="input" value={r.name||''} onChange={e => upd(r.id,'name',e.target.value)}
                        placeholder="Run name" style={{ width:200, padding:'3px 8px', fontSize:13, fontWeight:500 }}/>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'var(--text-muted)', userSelect:'none' }}>
                        <input type="checkbox" checked={!!+r.tinned} onChange={e => upd(r.id,'tinned', e.target.checked?1:0)}/>
                        Tinned
                      </label>
                      {panels.length > 0 && (
                        <select className="select" value={String(r.panel_id||'')}
                          onChange={e => upd(r.id,'panel_id', e.target.value||null)}
                          style={{ fontSize:11, padding:'3px 8px', width:180 }}>
                          <option value="">— General / Common —</option>
                          {panels.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                        </select>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:12, color:'var(--text-muted)' }}>
                        {fmtR(cost)} cost · <span style={{ color:'var(--success)' }}>{fmtR(sell)} sell</span>
                      </span>
                      <button className="btn btn-sm btn-ghost btn-danger btn-icon" onClick={() => rem(r.id)}>
                        <Icon name="trash" size={12}/>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {/* Size quick-select */}
                    <div style={{ marginBottom:14 }}>
                      <div className="label" style={{ marginBottom:6 }}>Size (W×H mm)</div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {copperSizes.map(sz => {
                          const active = +r.width_mm === sz.w && +r.height_mm === sz.h;
                          return (
                            <span key={`${sz.w}x${sz.h}`}
                              className={`filter-chip ${active ? 'active' : ''}`}
                              onClick={() => updMany(r.id, { width_mm:sz.w, height_mm:sz.h, price_per_m:sz.price })}
                              style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, cursor:'pointer' }}
                            >
                              {sz.w}×{sz.h}
                            </span>
                          );
                        })}
                        <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10.5, color:'var(--text-dim)', alignSelf:'center', marginLeft:2 }}>
                          — auto-fills price/m
                        </span>
                      </div>
                    </div>

                    <div className="form-grid" style={{ gap:12 }}>
                      <div className="field">
                        <label className="label">Width (mm)</label>
                        <input className="input num" type="number" min="0" value={r.width_mm||0}
                          onChange={e => {
                            const p = copperPriceLookup(e.target.value, r.height_mm, copperSizes);
                            upd(r.id, 'width_mm', e.target.value);
                            if (p) upd(r.id, 'price_per_m', p);
                          }}/>
                      </div>
                      <div className="field">
                        <label className="label">Height (mm)</label>
                        <input className="input num" type="number" min="0" value={r.height_mm||0}
                          onChange={e => {
                            const p = copperPriceLookup(r.width_mm, e.target.value, copperSizes);
                            upd(r.id, 'height_mm', e.target.value);
                            if (p) upd(r.id, 'price_per_m', p);
                          }}/>
                      </div>
                      <div className="field">
                        <label className="label">Length (m)</label>
                        <input className="input num" type="number" min="0" step="0.1" value={r.length_m||0} onChange={e => upd(r.id,'length_m',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Qty (runs)</label>
                        <input className="input num" type="number" min="1" value={r.qty||1} onChange={e => upd(r.id,'qty',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Price / m (R)</label>
                        <input className="input num" type="number" min="0" step="10" value={r.price_per_m||0} onChange={e => upd(r.id,'price_per_m',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Waste (%)</label>
                        <div className="input-group">
                          <input className="input num" type="number" min="0" max="50" value={r.waste_pct||0} onChange={e => upd(r.id,'waste_pct',e.target.value)}/>
                          <span className="input-suffix">%</span>
                        </div>
                      </div>
                      <div className="field">
                        <label className="label">Fab Hours</label>
                        <input className="input num" type="number" min="0" step="0.5" value={r.fab_hours||0} onChange={e => upd(r.id,'fab_hours',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Fab Rate (R/hr)</label>
                        <input className="input num" type="number" min="0" step="50" value={r.fab_rate||0} onChange={e => upd(r.id,'fab_rate',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Markup (%)</label>
                        <div className="input-group">
                          <input className="input num" type="number" min="0" step="1" value={r.markup_pct||0} onChange={e => upd(r.id,'markup_pct',e.target.value)}/>
                          <span className="input-suffix">%</span>
                        </div>
                      </div>
                      <div className="field">
                        <label className="label">Material Cost</label>
                        <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:4, padding:'7px 10px', fontFamily:'IBM Plex Mono,monospace', fontSize:13, color:'var(--text-muted)' }}>{fmtR(mat,2)}</div>
                      </div>
                      <div className="field">
                        <label className="label">Fab Cost</label>
                        <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:4, padding:'7px 10px', fontFamily:'IBM Plex Mono,monospace', fontSize:13, color:'var(--text-muted)' }}>{fmtR(fab,2)}</div>
                      </div>
                      <div className="field">
                        <label className="label">Sell Price</label>
                        <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:4, padding:'7px 10px', fontFamily:'IBM Plex Mono,monospace', fontSize:13, color:'var(--success)', fontWeight:600 }}>{fmtR(sell,2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// ── Summary Tab ───────────────────────────────────────────────────────────────

const SummaryTab = ({ draft, update, totals: t, settings }) => {
  const vatRate = +draft.vat_rate || +settings.default_vat_rate || 15;
  const target  = +settings.margin_target || 25;
  const rows    = [
    ['Materials', t.bomCost,    t.bomSell,    'var(--primary)'],
    ['Labour',    t.labourCost, t.labourSell,  'var(--success)'],
    ['Copper',    t.copperCost, t.copperSell,  'var(--warning)'],
  ].filter(([,c]) => c > 0 || t.totalCost === 0);

  return (
    <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>
      <div style={{ maxWidth:860 }}>
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-head"><div className="card-title">Cost vs Sell Summary</div></div>
          <table className="data">
            <thead>
              <tr>
                <th>Category</th>
                <th className="t-right" style={{ width:160 }}>Cost</th>
                <th className="t-right" style={{ width:160 }}>Sell (excl. VAT)</th>
                <th className="t-right" style={{ width:110 }}>GP%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([lbl, cost, sell, col]) => {
                const gp = sell > 0 ? (sell-cost)/sell*100 : 0;
                return (
                  <tr key={lbl}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:col }}/>
                        {lbl}
                      </div>
                    </td>
                    <td className="t-right t-num">{fmtR(cost)}</td>
                    <td className="t-right t-num">{fmtR(sell)}</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', color: gp >= target ? 'var(--success)' : 'var(--warning)' }}>
                      {gp.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background:'var(--surface-2)' }}>
                <td style={{ fontWeight:600 }}>Subtotal</td>
                <td className="t-right t-num" style={{ fontWeight:600 }}>{fmtR(t.totalCost)}</td>
                <td className="t-right t-num" style={{ fontWeight:600 }}>{fmtR(t.totalSell)}</td>
                <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:600, color: t.gpPct >= target ? 'var(--success)' : 'var(--warning)' }}>
                  {t.gpPct.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ color:'var(--text-muted)' }}>VAT ({vatRate}%)</td>
                <td></td>
                <td className="t-right t-num" style={{ color:'var(--text-muted)' }}>{fmtR(t.vat)}</td>
                <td></td>
              </tr>
              <tr>
                <td style={{ fontWeight:700, fontSize:14 }}>Total incl. VAT</td>
                <td></td>
                <td className="t-right t-num" style={{ fontWeight:700, fontSize:14 }}>{fmtR(t.totalIncl)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-head"><div className="card-title">Quote Text</div></div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div className="field">
              <label className="label">Notes (shown on quote)</label>
              <textarea className="input" rows={3}
                value={draft.notes||''} onChange={e => update({ notes: e.target.value })}
                placeholder="e.g. Includes installation, wiring, termination, testing and commissioning…"/>
            </div>
            <div className="field">
              <label className="label">Exclusions</label>
              <textarea className="input" rows={3}
                value={draft.exclusions||''} onChange={e => update({ exclusions: e.target.value })}
                placeholder="e.g. Civil works, cable trays, MV works, permits…"/>
            </div>
            <div className="field">
              <label className="label">Terms &amp; Conditions</label>
              <textarea className="input" rows={3}
                value={draft.terms||''} onChange={e => update({ terms: e.target.value })}
                placeholder="e.g. 50% deposit required. Balance on delivery. Quote valid for 30 days…"/>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Quote Options</div></div>
          <div className="card-body">
            <div className="form-grid cols-2" style={{ gap:14 }}>
              <div className="field">
                <label className="label">Status</label>
                <select className="select" value={draft.status||'draft'} onChange={e => update({ status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent to Client</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="field">
                <label className="label">PDF Format</label>
                <select className="select" value={draft.pdf_format||'grouped'} onChange={e => update({ pdf_format: e.target.value })}>
                  <option value="grouped">Grouped by category</option>
                  <option value="itemised">Itemised — full BOM</option>
                  <option value="summary">Summary lines only</option>
                  <option value="per_panel">Price per Panel</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Quote Builder (main) ──────────────────────────────────────────────────────

const QuoteBuilder = ({ quote, user, onBack, onPDF, onSaved }) => {
  const [tab,      setTab]      = React.useState('customer');
  const [draft,    setDraft]    = React.useState(null);
  const [settings, setSettings] = React.useState({});
  const [saving,   setSaving]   = React.useState(false);
  const [dirty,    setDirty]    = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    const labour = (quote.labour && quote.labour.length > 0) ? quote.labour : [
      { id:uid(), category:'Electrical Engineer', skill_level:'senior',  hours:0, rate:850  },
      { id:uid(), category:'Electrician',         skill_level:'artisan', hours:0, rate:550  },
      { id:uid(), category:'Wireman',             skill_level:'junior',  hours:0, rate:380  },
      { id:uid(), category:'Project Management',  skill_level:'senior',  hours:0, rate:950  },
    ];
    setDraft({
      ...quote,
      panels:         quote.panels || [],
      bom:            quote.bom    || [],
      labour,
      copper:         quote.copper || [],
      estimator_name: quote.estimator_name || user?.full_name || '',
    });
    setDirty(false);
  }, [quote.id]);

  React.useEffect(() => {
    api.get('settings.php')
      .then(data => setSettings(parseSettings(data)))
      .catch(() => {});
  }, []);

  const update = (patch) => {
    setDraft(d => ({ ...d, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api.post(`quotes.php?id=${draft.id}&action=save_full`, {
        project_name:   draft.project_name   || '',
        site_location:  draft.site_location  || '',
        quote_date:     draft.quote_date     || '',
        validity_days:  draft.validity_days  || 30,
        vat_rate:       draft.vat_rate       || 15,
        notes:          draft.notes          || '',
        exclusions:     draft.exclusions     || '',
        terms:          draft.terms          || '',
        status:         draft.status         || 'draft',
        pdf_format:     draft.pdf_format     || 'grouped',
        customer_name:  draft.customer_name  || '',
        contact_person: draft.contact_person || '',
        phone:          draft.phone          || '',
        email:          draft.email          || '',
        address:        draft.address        || '',
        estimator_name: draft.estimator_name || user?.full_name || '',
        panels: draft.panels,
        bom:    draft.bom,
        labour: draft.labour,
        copper: draft.copper,
      });
      setDraft({
        ...saved,
        panels: saved.panels || [],
        bom:    saved.bom    || [],
        labour: saved.labour || draft.labour,
        copper: saved.copper || [],
      });
      onSaved(saved);
      setDirty(false);
      toast('Quote saved.', 'success');
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!draft) return <Spinner label="Loading quote…"/>;

  const vatRate      = +draft.vat_rate || +settings.default_vat_rate || 15;
  const labourMarkup = +settings.labour_markup || 45;
  const t = computeTotals(draft.bom, draft.labour, draft.copper, vatRate, labourMarkup);

  const TABS = [
    { id:'customer', label:'Customer', icon:'user'   },
    { id:'panels',   label:'Panels',   icon:'panels', count:(draft.panels||[]).length || null },
    { id:'bom',      label:'BOM',      icon:'bom',   count:(draft.bom||[]).length },
    { id:'labour',   label:'Labour',   icon:'labour' },
    { id:'copper',   label:'Copper',   icon:'copper' },
    { id:'summary',  label:'Summary',  icon:'doc'    },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', minHeight:0, overflow:'hidden' }}>
      {/* Tab bar + action buttons */}
      <div style={{ display:'flex', alignItems:'center', background:'var(--bg-elev)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', flex:1, paddingLeft:8 }}>
          {TABS.map(tb => (
            <div key={tb.id}
              className={`tab ${tab === tb.id ? 'active' : ''}`}
              onClick={() => setTab(tb.id)}
              style={{ padding:'12px 16px' }}
            >
              <Icon name={tb.icon} size={13}/>
              {tb.label}
              {tb.count != null && <span className="tab-num">{tb.count}</span>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:6, padding:'0 16px', alignItems:'center', borderLeft:'1px solid var(--border)' }}>
          {dirty && (
            <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10.5, color:'var(--warning)', background:'var(--warning-soft)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:3, padding:'2px 6px' }}>
              UNSAVED
            </span>
          )}
          {!dirty && draft.updated_at && (
            <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10.5, color:'var(--text-dim)' }}>
              Saved {draft.updated_at.slice(0,10)}{draft.updated_by_name ? ` by ${draft.updated_by_name}` : ''}
            </span>
          )}
          <button className="btn btn-sm btn-ghost" onClick={onBack}><Icon name="chevL" size={12}/>Back</button>
          <button className="btn btn-sm" onClick={onPDF}><Icon name="printer" size={12}/>Preview PDF</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
              : <><Icon name="check" size={12}/>Save Quote</>}
          </button>
        </div>
      </div>

      {/* Content + right sidebar */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        {tab === 'customer' && <CustomerTab draft={draft} update={update} user={user}/>}
        {tab === 'panels'   && <PanelsTab   panels={draft.panels||[]} onChange={p => update({ panels:p })}/>}
        {tab === 'bom'      && <BomBuilder  bom={draft.bom} onChange={b => update({ bom:b })} settings={settings} panels={draft.panels||[]}/>}
        {tab === 'labour'   && <LabourTab   labour={draft.labour} onChange={l => update({ labour:l })} settings={settings} panels={draft.panels||[]}/>}
        {tab === 'copper'   && <CopperTab   copper={draft.copper} onChange={c => update({ copper:c })} settings={settings} panels={draft.panels||[]}/>}
        {tab === 'summary'  && <SummaryTab  draft={draft} update={update} totals={t} settings={settings}/>}

        <QuoteSummary draft={draft} t={t} settings={settings}/>
      </div>
    </div>
  );
};

window.QuoteBuilder = QuoteBuilder;
