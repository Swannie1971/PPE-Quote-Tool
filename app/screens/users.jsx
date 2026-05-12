/* User Management — list, create, edit, reset password (admin only) */

// ── User editor (right panel) ─────────────────────────────────────────────────

const UserEditor = ({ item, onSave, onResetPassword, onClose, saving, currentUserId }) => {
  const isNew = !item?.id;

  const [form,      setForm]      = React.useState({ full_name:'', username:'', role:'estimator', active:1 });
  const [pwForm,    setPwForm]    = React.useState({ password:'', confirm:'' });
  const [pwSection, setPwSection] = React.useState(false);
  const toast = useToast();

  React.useEffect(() => {
    setForm(item
      ? { full_name: item.full_name||'', username: item.username||'', role: item.role||'estimator', active: +item.active }
      : { full_name:'', username:'', role:'estimator', active:1 }
    );
    setPwForm({ password:'', confirm:'' });
    setPwSection(false);
  }, [item?.id]);

  const fld = (key, obj, setter) => ({
    value: obj[key] ?? '',
    onChange: e => setter(f => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = () => {
    if (!form.full_name.trim()) { toast('Full name is required.', 'error'); return; }
    if (!form.username.trim())  { toast('Username is required.', 'error'); return; }
    if (isNew) {
      if (!pwForm.password)            { toast('Password is required.', 'error'); return; }
      if (pwForm.password.length < 8)  { toast('Password must be at least 8 characters.', 'error'); return; }
      if (pwForm.password !== pwForm.confirm) { toast('Passwords do not match.', 'error'); return; }
    }
    onSave({ ...form, id: item?.id, ...(isNew ? { password: pwForm.password } : {}) });
  };

  const handleResetPw = () => {
    if (!pwForm.password)            { toast('New password is required.', 'error'); return; }
    if (pwForm.password.length < 8)  { toast('Minimum 8 characters.', 'error'); return; }
    if (pwForm.password !== pwForm.confirm) { toast('Passwords do not match.', 'error'); return; }
    onResetPassword(item.id, pwForm.password, () => {
      setPwForm({ password:'', confirm:'' });
      setPwSection(false);
    });
  };

  const isSelf = item?.id === currentUserId;

  return (
    <div className="card" style={{ width:360, flexShrink:0, display:'flex', flexDirection:'column', height:'100%', overflowY:'auto' }}>
      <div className="card-head" style={{ justifyContent:'space-between' }}>
        <div className="card-title">{isNew ? 'New User' : 'Edit User'}</div>
        <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={13}/></button>
      </div>

      <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14, flex:1 }}>
        <div className="field">
          <label className="label">Full Name</label>
          <input className="input" placeholder="e.g. John Smith" {...fld('full_name', form, setForm)}/>
        </div>
        <div className="field">
          <label className="label">Username</label>
          <input className="input mono" placeholder="e.g. john.smith" {...fld('username', form, setForm)}/>
        </div>
        <div className="field">
          <label className="label">Role</label>
          <select className="select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="estimator">Estimator</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {!isNew && (
          <div className="field">
            <label className="label">Status</label>
            <div style={{ display:'flex', gap:16 }}>
              {[['1','Active'],['0','Inactive']].map(([val, label]) => (
                <label key={val} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf && val === '0' ? 0.4 : 1 }}>
                  <input type="radio" value={val}
                    checked={String(form.active) === val}
                    onChange={() => !isSelf && setForm(f => ({ ...f, active: +val }))}
                    disabled={isSelf}
                  />
                  {label}
                </label>
              ))}
            </div>
            {isSelf && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:4 }}>You cannot deactivate your own account.</div>}
          </div>
        )}

        {/* Password */}
        {isNew ? (
          <>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...fld('password', pwForm, setPwForm)}/>
            </div>
            <div className="field">
              <label className="label">Confirm Password</label>
              <input className="input" type="password" autoComplete="new-password" placeholder="Repeat password" {...fld('confirm', pwForm, setPwForm)}/>
            </div>
          </>
        ) : (
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
            {!pwSection ? (
              <button className="btn btn-sm btn-ghost" onClick={() => setPwSection(true)}>
                <Icon name="lock" size={12}/>Reset Password
              </button>
            ) : (
              <>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:12, color:'var(--text)' }}>Reset Password</div>
                <div className="field" style={{ marginBottom:10 }}>
                  <label className="label">New Password</label>
                  <input className="input" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...fld('password', pwForm, setPwForm)}/>
                </div>
                <div className="field" style={{ marginBottom:12 }}>
                  <label className="label">Confirm Password</label>
                  <input className="input" type="password" autoComplete="new-password" placeholder="Repeat password" {...fld('confirm', pwForm, setPwForm)}/>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setPwSection(false); setPwForm({ password:'', confirm:'' }); }}>Cancel</button>
                  <button className="btn btn-sm btn-primary" onClick={handleResetPw} disabled={saving}>Set Password</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex' }}>
        <button className="btn btn-sm btn-primary" style={{ marginLeft:'auto' }} disabled={saving} onClick={handleSave}>
          {saving
            ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
            : <><Icon name="check" size={12}/>{isNew ? 'Create User' : 'Save Changes'}</>}
        </button>
      </div>
    </div>
  );
};

// ── Users screen ──────────────────────────────────────────────────────────────

const UsersScreen = ({ user }) => {
  const [users,    setUsers]    = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const [saving,   setSaving]   = React.useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    api.get('users.php')
      .then(setUsers)
      .catch(() => toast('Failed to load users.', 'error'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (!form.id) {
        await api.post('users.php', form);
        toast('User created.', 'success');
        setSelected(null);
        load();
      } else {
        await api.put(`users.php?id=${form.id}`, form);
        setUsers(us => us.map(u => u.id === form.id ? { ...u, ...form } : u));
        setSelected(s => s && s !== 'new' && s.id === form.id ? { ...s, ...form } : s);
        toast('User updated.', 'success');
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (id, password, onDone) => {
    setSaving(true);
    try {
      await api.post(`users.php?action=set_password&id=${id}`, { password });
      toast('Password updated.', 'success');
      onDone();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="content" style={{ maxWidth:600 }}>
        <div className="page-head"><h1 className="page-title">Users</h1></div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--warning-soft)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:5, padding:'10px 14px', fontSize:12.5, color:'var(--warning)' }}>
          <Icon name="lock" size={14}/>Admin access required to manage users.
        </div>
      </div>
    );
  }

  return (
    <div className="content" style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 56px)', padding:0 }}>
      {/* Top bar */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div>
          <h1 className="page-title" style={{ fontSize:18 }}>Users</h1>
          <div className="page-sub" style={{ marginTop:2 }}>{users.length} user{users.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" style={{ marginLeft:'auto' }} onClick={() => setSelected('new')}>
          <Icon name="plus" size={14}/>Add User
        </button>
      </div>

      {/* Content */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Table */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? <Spinner label="Loading…"/> : (
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width:160 }}>Username</th>
                  <th style={{ width:110 }}>Role</th>
                  <th style={{ width:90 }}>Status</th>
                  <th style={{ width:150 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-dim)', padding:'32px 0', fontFamily:'IBM Plex Mono,monospace', fontSize:12 }}>No users found.</td></tr>
                )}
                {users.map(u => {
                  const sel    = selected && selected !== 'new' && selected.id === u.id;
                  const isSelf = u.id === user.id;
                  const initials = (u.full_name||'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <tr key={u.id} className={sel ? 'selected' : ''} style={{ opacity: +u.active ? 1 : 0.5 }} onClick={() => setSelected(u)}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background: u.role === 'admin' ? 'var(--primary)' : 'var(--surface-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: u.role === 'admin' ? 'white' : 'var(--text-muted)', flexShrink:0 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight:500 }}>{u.full_name}</div>
                            {isSelf && <div style={{ fontSize:10, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', letterSpacing:'0.05em' }}>YOU</div>}
                          </div>
                        </div>
                      </td>
                      <td className="mono" style={{ fontSize:12, color:'var(--text-muted)' }}>{u.username}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : ''}`}>{u.role}</span>
                      </td>
                      <td>
                        <span className={`badge ${+u.active ? 'badge-success' : ''}`}>{+u.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ fontSize:11.5, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace' }}>
                        {(u.created_at||'').slice(0, 10) || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Editor */}
        {selected && (
          <div style={{ padding:16, borderLeft:'1px solid var(--border)', background:'var(--bg-elev)', overflowY:'auto', width:376, flexShrink:0 }}>
            <UserEditor
              item={selected === 'new' ? null : selected}
              onSave={handleSave}
              onResetPassword={handleResetPassword}
              onClose={() => setSelected(null)}
              saving={saving}
              currentUserId={user.id}
            />
          </div>
        )}
      </div>
    </div>
  );
};

window.UsersScreen = UsersScreen;
