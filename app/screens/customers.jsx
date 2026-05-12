/* Customer Database — list, create, edit, delete (admin writes, all users view) */

const CustomerEditor = ({ item, onSave, onDelete, onClose, saving, canDelete }) => {
  const isNew = !item?.id;
  const [form, setForm] = React.useState({ name:'', contact_person:'', phone:'', email:'', address:'' });
  const toast = useToast();

  React.useEffect(() => {
    setForm(item
      ? { name: item.name||'', contact_person: item.contact_person||'', phone: item.phone||'', email: item.email||'', address: item.address||'' }
      : { name:'', contact_person:'', phone:'', email:'', address:'' }
    );
  }, [item?.id]);

  const fld = (key) => ({
    value: form[key] ?? '',
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = () => {
    if (!form.name.trim()) { toast('Company name is required.', 'error'); return; }
    onSave({ ...form, id: item?.id });
  };

  return (
    <div className="card" style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column', height:'100%', overflowY:'auto' }}>
      <div className="card-head" style={{ justifyContent:'space-between' }}>
        <div className="card-title">{isNew ? 'New Customer' : 'Edit Customer'}</div>
        <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={13}/></button>
      </div>

      <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
        <div className="field">
          <label className="label">Company Name *</label>
          <input className="input" placeholder="e.g. Acme Industries (Pty) Ltd" {...fld('name')}/>
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
          <textarea className="input" rows={3} placeholder="Street address" style={{ resize:'vertical' }} {...fld('address')}/>
        </div>
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
        {!isNew && canDelete && (
          <button className="btn btn-sm btn-ghost btn-danger" disabled={saving} onClick={() => {
            if (confirm(`Delete ${item.name}? This cannot be undone.`)) onDelete(item.id);
          }}>
            <Icon name="trash" size={12}/>Delete
          </button>
        )}
        <button className="btn btn-sm btn-primary" style={{ marginLeft:'auto' }} disabled={saving} onClick={handleSave}>
          {saving
            ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
            : <><Icon name="check" size={12}/>{isNew ? 'Create Customer' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  );
};

const CustomersScreen = ({ user }) => {
  const [customers, setCustomers] = React.useState([]);
  const [loading,   setLoading]   = React.useState(true);
  const [selected,  setSelected]  = React.useState(null);
  const [saving,    setSaving]    = React.useState(false);
  const [q,         setQ]         = React.useState('');
  const isAdmin = user?.role === 'admin';
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get('customers.php')
      .then(setCustomers)
      .catch(() => toast('Failed to load customers.', 'error'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (c.name||'').toLowerCase().includes(t)
        || (c.contact_person||'').toLowerCase().includes(t)
        || (c.email||'').toLowerCase().includes(t);
  });

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (!form.id) {
        await api.post('customers.php', form);
        toast('Customer created.', 'success');
        setSelected(null);
        load();
      } else {
        await api.put(`customers.php?id=${form.id}`, form);
        setCustomers(cs => cs.map(c => c.id === form.id ? { ...c, ...form } : c));
        setSelected(s => s && s !== 'new' && s.id === form.id ? { ...s, ...form } : s);
        toast('Customer updated.', 'success');
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await api.delete(`customers.php?id=${id}`);
      setCustomers(cs => cs.filter(c => c.id !== id));
      setSelected(null);
      toast('Customer deleted.', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', padding:0 }}>
      {/* Top bar */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize:18 }}>Customers</h1>
          <div className="page-sub" style={{ marginTop:2 }}>{customers.length} customer{customers.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="search" style={{ width:240, marginLeft:'auto' }}>
          <Icon name="search" size={13} className="search-icon"/>
          <input className="input" placeholder="Search customers…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setSelected('new')}>
            <Icon name="plus" size={14}/>Add Customer
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Table */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? <Spinner label="Loading…"/> : (
            <table className="data">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th style={{ width:160 }}>Contact Person</th>
                  <th style={{ width:190 }}>Email</th>
                  <th style={{ width:130 }}>Phone</th>
                  <th className="t-right" style={{ width:80 }}>Quotes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>
                      {q ? 'No customers match your search.' : 'No customers yet.'}
                    </td>
                  </tr>
                )}
                {filtered.map(c => {
                  const sel = selected && selected !== 'new' && selected.id === c.id;
                  return (
                    <tr key={c.id} className={sel ? 'selected' : ''} onClick={() => isAdmin && setSelected(c)} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                      <td>
                        <div style={{ fontWeight:500 }}>{c.name}</div>
                        {c.address && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{(c.address||'').split('\n')[0]}</div>}
                      </td>
                      <td style={{ color:'var(--text-muted)', fontSize:12.5 }}>{c.contact_person || '—'}</td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{c.email || '—'}</td>
                      <td className="mono" style={{ fontSize:12, color:'var(--text-muted)' }}>{c.phone || '—'}</td>
                      <td className="t-right">
                        <span className="badge">{c.quote_count || 0}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Editor panel — admin only */}
        {selected && isAdmin && (
          <div style={{ padding:16, borderLeft:'1px solid var(--border)', background:'var(--bg-elev)', overflowY:'auto', width:376, flexShrink:0 }}>
            <CustomerEditor
              item={selected === 'new' ? null : selected}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={() => setSelected(null)}
              saving={saving}
              canDelete={selected !== 'new' && +(selected?.quote_count || 0) === 0}
            />
          </div>
        )}
      </div>
    </div>
  );
};

window.CustomersScreen = CustomersScreen;
