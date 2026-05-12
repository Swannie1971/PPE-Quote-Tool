/* Settings screen — company info + financial defaults */

const COPPER_SIZES_DEFAULT = [
  { w:30,  h:10, price:687.50  },
  { w:40,  h:10, price:937.50  },
  { w:50,  h:10, price:1125.00 },
  { w:60,  h:10, price:1375.00 },
  { w:80,  h:10, price:1812.50 },
  { w:100, h:10, price:2250.00 },
  { w:120, h:10, price:2687.50 },
];

function parseCopperSizes(json) {
  try {
    const p = JSON.parse(json || '');
    if (Array.isArray(p) && p.length > 0) return p;
  } catch {}
  return COPPER_SIZES_DEFAULT;
}

const CopperPricesEditor = ({ vals, set, isAdmin }) => {
  const sizes = parseCopperSizes(vals.copper_size_prices);

  const push = (next) => set('copper_size_prices', JSON.stringify(next));
  const updRow = (i, field, val) => push(sizes.map((s, j) => j === i ? { ...s, [field]: field === 'price' ? +val : +val } : s));
  const addRow = () => push([...sizes, { w:0, h:10, price:0 }]);
  const remRow = (i) => push(sizes.filter((_, j) => j !== i));

  return (
    <div className="card" style={{ marginBottom:16 }}>
      <div className="card-head" style={{ justifyContent:'space-between' }}>
        <div>
          <div className="card-title">Copper Busbar Prices</div>
          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>
            Price per metre by size. Auto-fills the copper calculator when a size is selected.
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-sm" onClick={addRow}><Icon name="plus" size={12}/>Add Size</button>
        )}
      </div>
      <table className="data">
        <thead>
          <tr>
            <th style={{ width:140 }}>Width (mm)</th>
            <th style={{ width:140 }}>Height (mm)</th>
            <th className="t-right" style={{ width:160 }}>Price (R/m)</th>
            <th style={{ width:44 }}></th>
          </tr>
        </thead>
        <tbody>
          {sizes.map((sz, i) => (
            <tr key={i}>
              <td>
                <input className="input num" type="number" min="0" value={sz.w}
                  onChange={e => updRow(i, 'w', e.target.value)}
                  readOnly={!isAdmin} style={!isAdmin ? { opacity:0.6 } : {}}/>
              </td>
              <td>
                <input className="input num" type="number" min="0" value={sz.h}
                  onChange={e => updRow(i, 'h', e.target.value)}
                  readOnly={!isAdmin} style={!isAdmin ? { opacity:0.6 } : {}}/>
              </td>
              <td>
                <input className="input num" type="number" min="0" step="0.50" value={sz.price}
                  onChange={e => updRow(i, 'price', e.target.value)}
                  readOnly={!isAdmin} style={{ textAlign:'right', ...(!isAdmin ? { opacity:0.6 } : {}) }}/>
              </td>
              <td>
                {isAdmin && (
                  <button className="btn btn-sm btn-ghost btn-danger btn-icon" onClick={() => remRow(i)}>
                    <Icon name="trash" size={12}/>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SETTINGS_SECTIONS = [
  {
    title: 'Company Details',
    keys: [
      { key:'company_name',    label:'Company Name',        span:2 },
      { key:'company_sub',     label:'Tagline / Sub-title', span:2 },
      { key:'company_address', label:'Physical Address',    span:2 },
      { key:'company_phone',   label:'Phone' },
      { key:'company_email',   label:'Email',    type:'email' },
      { key:'company_website', label:'Website' },
      { key:'company_reg',     label:'Reg No.' },
      { key:'company_vat',     label:'VAT No.' },
      { key:'company_cert',    label:'Certification / Accreditation', span:2 },
    ],
  },
  {
    title: 'Financial Defaults',
    desc: 'Applied to new quotes. Existing quotes are unaffected.',
    keys: [
      { key:'default_vat_rate', label:'VAT Rate (%)',          type:'number', suffix:'%' },
      { key:'default_validity', label:'Quote Validity (days)', type:'number', suffix:'days' },
      { key:'default_markup',   label:'Default Markup (%)',    type:'number', suffix:'%' },
      { key:'labour_markup',    label:'Labour Markup (%)',     type:'number', suffix:'%' },
      { key:'margin_target',    label:'GP% Target',            type:'number', suffix:'%' },
    ],
  },
  {
    title: 'Copper Fabrication Defaults',
    desc: 'Default values pre-filled when adding a new copper run.',
    keys: [
      { key:'copper_waste_pct', label:'Waste Allowance (%)',       type:'number', suffix:'%'   },
      { key:'copper_fab_rate',  label:'Fabrication Rate (R/hr)',   type:'number', suffix:'R/hr' },
    ],
  },
  {
    title: 'Quote Numbering',
    desc: 'Format: PREFIX-YEAR-NNNN. Change the prefix or reset the sequence here.',
    keys: [
      { key:'quote_prefix',      label:'Prefix (e.g. PQ)' },
      { key:'quote_next_number', label:'Next Sequence No.', type:'number' },
    ],
  },
];

const CompanyLogoEditor = ({ vals, setVals, isAdmin }) => {
  const fileRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [removing,  setRemoving]  = React.useState(false);
  const toast = useToast();

  const logoExt = vals.company_logo;
  const logoSrc = logoExt ? `assets/logo.${logoExt}` : null;

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const resp = await fetch('api/logo.php', { method:'POST', credentials:'same-origin', body:form });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.error || 'Upload failed.');
      setVals(v => ({ ...v, company_logo: json.data.ext }));
      toast('Logo uploaded.', 'success');
    } catch (err) {
      toast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      const resp = await fetch('api/logo.php', { method:'DELETE', credentials:'same-origin' });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Remove failed.');
      setVals(v => ({ ...v, company_logo: null }));
      toast('Logo removed.', 'success');
    } catch (err) {
      toast('Remove failed: ' + err.message, 'error');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom:16 }}>
      <div className="card-head">
        <div>
          <div className="card-title">Company Logo</div>
          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>
            Shown in the top-left of printed quotes. PNG, JPG, SVG or WebP — max 2 MB.
          </div>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:180, height:72, border:'1px solid var(--border)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', overflow:'hidden', flexShrink:0 }}>
            {logoSrc
              ? <img src={logoSrc} alt="Company logo" style={{ maxWidth:172, maxHeight:64, objectFit:'contain' }}/>
              : <span style={{ fontSize:11, color:'var(--text-dim)' }}>No logo</span>
            }
          </div>
          {isAdmin && (
            <div style={{ display:'flex', gap:8 }}>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display:'none' }} onChange={upload}/>
              <button className="btn btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading
                  ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Uploading…</>
                  : <><Icon name="upload" size={12}/>{logoSrc ? 'Replace Logo' : 'Upload Logo'}</>}
              </button>
              {logoSrc && (
                <button className="btn btn-sm btn-ghost btn-danger" onClick={remove} disabled={removing}>
                  {removing ? 'Removing…' : <><Icon name="trash" size={12}/>Remove</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsScreen = ({ user }) => {
  const [vals,    setVals]    = React.useState(null);
  const [saving,  setSaving]  = React.useState(false);
  const [dirty,   setDirty]   = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    api.get('settings.php')
      .then(data => setVals(typeof data === 'object' && !Array.isArray(data) ? data : {}))
      .catch(() => toast('Failed to load settings.', 'error'));
  }, []);

  const set = (key, val) => {
    setVals(v => ({ ...v, [key]: val }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('settings.php', vals);
      setDirty(false);
      toast('Settings saved.', 'success');
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!vals) return <Spinner label="Loading settings…"/>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="content" style={{ maxWidth:860 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Company info · financial defaults · quote numbering</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {dirty && (
            <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:10.5, color:'var(--warning)', background:'var(--warning-soft)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:3, padding:'2px 7px' }}>
              UNSAVED
            </span>
          )}
          {isAdmin ? (
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving
                ? <><Icon name="spinner" size={13} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
                : <><Icon name="check" size={13}/>Save Settings</>}
            </button>
          ) : (
            <span className="warn-pill"><Icon name="lock" size={11}/>Admin only</span>
          )}
        </div>
      </div>

      {!isAdmin && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--warning-soft)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:5, padding:'10px 14px', marginBottom:16, fontSize:12.5, color:'var(--warning)' }}>
          <Icon name="warn" size={14}/>
          You are viewing settings as read-only. Admin access is required to make changes.
        </div>
      )}

      {SETTINGS_SECTIONS.map(section => (
        <div key={section.title} className="card" style={{ marginBottom:16 }}>
          <div className="card-head">
            <div>
              <div className="card-title">{section.title}</div>
              {section.desc && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:2 }}>{section.desc}</div>}
            </div>
          </div>
          <div className="card-body">
            <div className="form-grid cols-2" style={{ gap:14 }}>
              {section.keys.map(f => (
                <div key={f.key} className={`field ${f.span === 2 ? 'col-span-2' : ''}`}>
                  <label className="label">{f.label}</label>
                  {f.suffix ? (
                    <div className="input-group">
                      <input
                        className="input num"
                        type={f.type || 'text'}
                        value={vals[f.key] ?? ''}
                        onChange={e => set(f.key, e.target.value)}
                        readOnly={!isAdmin}
                        style={!isAdmin ? { opacity:0.6 } : {}}
                      />
                      <span className="input-suffix">{f.suffix}</span>
                    </div>
                  ) : (
                    <input
                      className="input"
                      type={f.type || 'text'}
                      value={vals[f.key] ?? ''}
                      onChange={e => set(f.key, e.target.value)}
                      readOnly={!isAdmin}
                      style={!isAdmin ? { opacity:0.6 } : {}}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <CompanyLogoEditor vals={vals} setVals={setVals} isAdmin={isAdmin}/>

      <CopperPricesEditor vals={vals} set={set} isAdmin={isAdmin}/>

      {isAdmin && (
        <div style={{ display:'flex', justifyContent:'flex-end', paddingBottom:24 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving
              ? <><Icon name="spinner" size={13} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
              : <><Icon name="check" size={13}/>Save All Settings</>}
          </button>
        </div>
      )}
    </div>
  );
};

window.SettingsScreen = SettingsScreen;
