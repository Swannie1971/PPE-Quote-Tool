/* Pricing DB — browse, add, edit, deactivate catalogue items */

const UNITS = ['ea','m','kg','set','lot','hr'];

const BLANK_ITEM = {
  item_code:'', description:'', category:'misc', supplier:'',
  unit:'ea', cost_price:0, default_markup:30, lead_time:'', stock_status:'',
};

// ── Item editor (right panel) ─────────────────────────────────────────────────

const PricingEditor = ({ item, onSave, onDelete, onClose, saving }) => {
  const [form, setForm] = React.useState({ ...BLANK_ITEM, ...item });
  const isNew = !item?.id;

  React.useEffect(() => {
    setForm({ ...BLANK_ITEM, ...item });
  }, [item?.id]);

  const fld = (key) => ({
    value: form[key] ?? '',
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const sellPreview = (+form.cost_price || 0) * (1 + (+form.default_markup || 0) / 100);

  return (
    <div className="card" style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column', height:'100%', overflowY:'auto' }}>
      <div className="card-head" style={{ justifyContent:'space-between' }}>
        <div className="card-title">{isNew ? 'New Item' : 'Edit Item'}</div>
        <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={13}/></button>
      </div>
      <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
        <div className="field col-span-2">
          <label className="label">Description</label>
          <input className="input" placeholder="Full item description" {...fld('description')}/>
        </div>
        <div className="field">
          <label className="label">Item Code</label>
          <input className="input mono" placeholder="e.g. SCH-A9F44116" {...fld('item_code')}/>
        </div>
        <div className="field">
          <label className="label">Supplier</label>
          <input className="input" placeholder="e.g. Schneider" {...fld('supplier')}/>
        </div>
        <div className="field">
          <label className="label">Category</label>
          <select className="select" {...fld('category')}>
            {CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'labour').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="label">Unit</label>
          <select className="select" {...fld('unit')}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Cost Price (R)</label>
          <input className="input num" type="number" min="0" step="0.01" {...fld('cost_price')}/>
        </div>
        <div className="field">
          <label className="label">Default Markup (%)</label>
          <div className="input-group">
            <input className="input num" type="number" min="0" max="500" step="0.5" {...fld('default_markup')}/>
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="calc-card" style={{ padding:'10px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'IBM Plex Mono,monospace', fontSize:11.5 }}>
            <span style={{ color:'var(--text-muted)' }}>Sell price preview</span>
            <span style={{ color:'var(--success)', fontWeight:600 }}>
              R {(+sellPreview||0).toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits:2 })}
            </span>
          </div>
        </div>

        <div className="field">
          <label className="label">Lead Time</label>
          <input className="input" placeholder="e.g. 2–4 weeks" {...fld('lead_time')}/>
        </div>
        <div className="field">
          <label className="label">Stock Status</label>
          <input className="input" placeholder="e.g. In stock, Ex-stock" {...fld('stock_status')}/>
        </div>
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
        {!isNew && (
          <button className="btn btn-sm btn-ghost btn-danger" onClick={() => onDelete(item.id)}>
            <Icon name="trash" size={12}/>Delete
          </button>
        )}
        <button className="btn btn-sm btn-primary" style={{ marginLeft:'auto' }} disabled={saving}
          onClick={() => onSave(form)}>
          {saving
            ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
            : <><Icon name="check" size={12}/>{isNew ? 'Add Item' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  );
};

// ── CSV helpers ───────────────────────────────────────────────────────────────

const EXPORT_COLS = ['item_code','description','category','supplier','unit','cost_price','default_markup','lead_time','stock_status'];

function splitCsvRow(line) {
  const fields = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      fields.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsvRow(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  return lines.slice(1)
    .map(line => {
      const vals = splitCsvRow(line);
      const obj  = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    })
    .filter(r => r.description);
}

// ── Pricing DB main screen ────────────────────────────────────────────────────

const PricingScreen = ({ user }) => {
  const [items,         setItems]         = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);
  const [q,             setQ]             = React.useState('');
  const [cat,           setCat]           = React.useState('all');
  const [selected,      setSelected]      = React.useState(null);
  const [saving,        setSaving]        = React.useState(false);
  const [importing,     setImporting]     = React.useState(false);
  const [importPreview, setImportPreview] = React.useState(null);
  const [checkedIds,    setCheckedIds]    = React.useState(new Set());
  const importRef = React.useRef(null);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get('pricing.php')
      .then(setItems)
      .catch(() => toast('Failed to load pricing items.', 'error'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const filtered = items.filter(i => {
    if (cat !== 'all' && i.category !== cat) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return (i.item_code   ||'').toLowerCase().includes(t)
        || (i.description ||'').toLowerCase().includes(t)
        || (i.supplier    ||'').toLowerCase().includes(t);
  });

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (!form.id) {
        const res = await api.post('pricing.php', form);
        const newItem = { ...form, id: res.id };
        setItems(it => [...it, newItem]);
        setSelected(newItem);
        toast('Item added.', 'success');
      } else {
        await api.put(`pricing.php?id=${form.id}`, form);
        setItems(it => it.map(i => i.id === form.id ? { ...i, ...form } : i));
        toast('Item saved.', 'success');
      }
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item? It will be removed from the pricing database. Existing quotes are unaffected.')) return;
    try {
      await api.delete(`pricing.php?id=${id}`);
      setItems(it => it.filter(i => i.id !== id));
      setCheckedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setSelected(null);
      toast('Item deleted.', 'success');
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...checkedIds];
    if (!confirm(`Delete ${ids.length} item${ids.length !== 1 ? 's' : ''}? They will be removed from the pricing database. Existing quotes are unaffected.`)) return;
    try {
      await api.post('pricing.php?_delete=1', { ids });
      setItems(it => it.filter(i => !checkedIds.has(i.id)));
      if (selected && selected !== 'new' && checkedIds.has(selected.id)) setSelected(null);
      setCheckedIds(new Set());
      toast(`${ids.length} item${ids.length !== 1 ? 's' : ''} deleted.`, 'success');
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    }
  };

  const handleExport = () => {
    const rows = items.map(i => EXPORT_COLS.map(c => {
      const s = String(i[c] ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','));
    const csv = [EXPORT_COLS.join(','), ...rows].join('\n');
    const a   = Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
      download: 'pricing-db.csv',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      if (!rows.length) { toast('No valid rows found in CSV.', 'error'); return; }
      setImportPreview({ rows });
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const res = await api.post('pricing.php?_bulk=1', { items: importPreview.rows });
      setImportPreview(null);
      toast(`Import complete: ${res.inserted} added, ${res.updated} updated.`, 'success');
      load();
    } catch (e) {
      toast('Import failed: ' + e.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  // Category counts
  const counts = items.reduce((m, i) => { m[i.category] = (m[i.category]||0)+1; return m; }, {});

  return (
    <div className="content" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', padding:0 }}>
      {/* Top bar */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize:18 }}>Pricing Database</h1>
          <div className="page-sub" style={{ marginTop:2 }}>{items.length} active items</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn btn-sm btn-ghost" onClick={handleExport} disabled={!items.length}>
            <Icon name="download" size={13}/>Export CSV
          </button>
          {isAdmin && (
            <>
              <input ref={importRef} type="file" accept=".csv,text/csv" style={{ display:'none' }} onChange={handleImportFile}/>
              <button className="btn btn-sm btn-ghost" onClick={() => importRef.current.click()} disabled={importing}>
                <Icon name="upload" size={13}/>{importing ? 'Importing…' : 'Import CSV'}
              </button>
              <button className="btn btn-primary" onClick={() => setSelected('new')}>
                <Icon name="plus" size={14}/>Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Import preview banner */}
      {importPreview && (
        <div style={{ padding:'10px 24px', background:'var(--warning-soft)', borderBottom:'1px solid rgba(245,158,11,0.3)', display:'flex', alignItems:'center', gap:12, fontSize:12.5, color:'var(--warning)', flexShrink:0 }}>
          <Icon name="info" size={13}/>
          <span>
            <strong>{importPreview.rows.length}</strong> rows ready to import.
            Items with a matching item code will be updated; the rest added as new.
          </span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setImportPreview(null)} disabled={importing}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={confirmImport} disabled={importing}>
              {importing
                ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Importing…</>
                : `Import ${importPreview.rows.length} rows`}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Left: table */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Filters */}
          <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
            <div className="search" style={{ width:280 }}>
              <Icon name="search" size={13} className="search-icon"/>
              <input className="input" placeholder="Search code, description, supplier…"
                value={q} onChange={e => setQ(e.target.value)} style={{ paddingLeft:30 }}/>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CATEGORIES.filter(c => c.id !== 'labour').map(c => (
                <span key={c.id}
                  className={`filter-chip ${cat === c.id ? 'active' : ''}`}
                  onClick={() => setCat(c.id)}
                >
                  {c.label}
                  <span style={{ marginLeft:4, color:'var(--text-dim)' }}>
                    {c.id === 'all' ? items.length : (counts[c.id]||0)}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {isAdmin && checkedIds.size > 0 && (
            <div style={{ padding:'8px 24px', background:'var(--surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <span style={{ fontSize:12.5, fontFamily:'IBM Plex Mono,monospace', color:'var(--text-muted)' }}>
                {checkedIds.size} selected
              </span>
              <button className="btn btn-sm btn-ghost btn-danger" onClick={handleBulkDelete}>
                <Icon name="trash" size={12}/>Delete {checkedIds.size} item{checkedIds.size !== 1 ? 's' : ''}
              </button>
              <button className="btn btn-sm btn-ghost" style={{ marginLeft:'auto' }} onClick={() => setCheckedIds(new Set())}>
                Clear selection
              </button>
            </div>
          )}

          {/* Table */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <Spinner label="Loading…"/> : (
              <table className="data">
                <thead>
                  <tr>
                    {isAdmin && (
                      <th style={{ width:36, padding:'0 0 0 16px' }}>
                        <input type="checkbox"
                          checked={filtered.length > 0 && filtered.every(i => checkedIds.has(i.id))}
                          onChange={e => setCheckedIds(e.target.checked ? new Set(filtered.map(i => i.id)) : new Set())}
                        />
                      </th>
                    )}
                    <th style={{ width:140 }}>Item Code</th>
                    <th>Description</th>
                    <th style={{ width:130 }}>Supplier</th>
                    <th style={{ width:110 }}>Category</th>
                    <th style={{ width:50 }}>Unit</th>
                    <th className="t-right" style={{ width:110 }}>Cost (R)</th>
                    <th className="t-right" style={{ width:80 }}>Markup</th>
                    <th className="t-right" style={{ width:110 }}>Sell (R)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>
                        No items found.
                      </td>
                    </tr>
                  )}
                  {filtered.map(item => {
                    const sell    = (+item.cost_price||0) * (1 + (+item.default_markup||0)/100);
                    const sel     = selected && selected !== 'new' && selected.id === item.id;
                    const checked = checkedIds.has(item.id);
                    return (
                      <tr key={item.id} className={sel ? 'selected' : ''} onClick={() => setSelected(item)}>
                        {isAdmin && (
                          <td style={{ width:36, padding:'0 0 0 16px' }} onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={checked}
                              onChange={e => {
                                const next = new Set(checkedIds);
                                e.target.checked ? next.add(item.id) : next.delete(item.id);
                                setCheckedIds(next);
                              }}
                            />
                          </td>
                        )}
                        <td className="mono" style={{ fontSize:11, color: sel ? 'var(--primary)' : 'var(--text-dim)' }}>
                          {item.item_code || '—'}
                        </td>
                        <td style={{ fontWeight: sel ? 500 : 400 }}>{item.description}</td>
                        <td style={{ color:'var(--text-muted)', fontSize:12 }}>{item.supplier || '—'}</td>
                        <td>
                          <span className="cat-chip">
                            <CategoryIcon cat={item.category} size={10}/>{item.category}
                          </span>
                        </td>
                        <td className="mono" style={{ color:'var(--text-dim)', fontSize:11 }}>{item.unit}</td>
                        <td className="t-right t-num">{(+item.cost_price||0).toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits:2 })}</td>
                        <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', color:'var(--text-muted)', fontSize:11 }}>
                          {item.default_markup}%
                        </td>
                        <td className="t-right t-num" style={{ color:'var(--success)' }}>
                          {sell.toLocaleString('en-ZA', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: editor panel */}
        {selected && (
          <div style={{ padding:16, borderLeft:'1px solid var(--border)', background:'var(--bg-elev)', overflowY:'auto', width:376, flexShrink:0 }}>
            <PricingEditor
              item={selected === 'new' ? null : selected}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={() => setSelected(null)}
              saving={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
};

window.PricingScreen = PricingScreen;
