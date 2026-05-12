/* App shell — auth state, routing, sidebar, topbar */

// ── My Account modal ──────────────────────────────────────────────────────────

const AccountModal = ({ user, onClose }) => {
  const [form,   setForm]   = React.useState({ current:'', newPw:'', confirm:'' });
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const fld = (key) => ({
    value: form[key],
    onChange: e => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!form.current)               { toast('Current password is required.', 'error'); return; }
    if (!form.newPw)                 { toast('New password is required.', 'error'); return; }
    if (form.newPw.length < 8)       { toast('Password must be at least 8 characters.', 'error'); return; }
    if (form.newPw !== form.confirm) { toast('Passwords do not match.', 'error'); return; }
    setSaving(true);
    try {
      await api.post('auth.php?action=change_password', { current_password: form.current, new_password: form.newPw });
      toast('Password changed successfully.', 'success');
      onClose();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'grid', placeItems:'center', zIndex:200 }}
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card" style={{ width:400 }}>
        <div className="card-head" style={{ justifyContent:'space-between' }}>
          <div className="card-title">My Account</div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={13}/></button>
        </div>
        <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:15 }}>{user?.full_name}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'IBM Plex Mono,monospace', marginTop:2 }}>{user?.username} · {user?.role}</div>
          </div>
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12, color:'var(--text)' }}>Change Password</div>
            <div className="field" style={{ marginBottom:10 }}>
              <label className="label">Current Password</label>
              <input className="input" type="password" autoComplete="current-password" {...fld('current')}/>
            </div>
            <div className="field" style={{ marginBottom:10 }}>
              <label className="label">New Password</label>
              <input className="input" type="password" autoComplete="new-password" placeholder="Min. 8 characters" {...fld('newPw')}/>
            </div>
            <div className="field">
              <label className="label">Confirm New Password</label>
              <input className="input" type="password" autoComplete="new-password" {...fld('confirm')}/>
            </div>
          </div>
        </div>
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" disabled={saving} onClick={handleSave}>
            {saving
              ? <><Icon name="spinner" size={12} style={{ animation:'spin 1s linear infinite' }}/>Saving…</>
              : <><Icon name="check" size={12}/>Change Password</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [authState, setAuthState] = React.useState('checking'); // checking | guest | authed
  const [user,      setUser]      = React.useState(null);
  const [view,      setView]      = React.useState('dashboard'); // dashboard | quote | pdf | pricing | settings | users
  const [theme,     setTheme]     = React.useState(() => localStorage.getItem('ppe_theme') || 'dark');
  const [activeQuote, setActiveQuote] = React.useState(null);
  const [showAccount, setShowAccount] = React.useState(false);

  // Apply theme to root element
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ppe_theme', theme);
  }, [theme]);

  // Check for existing session on load
  React.useEffect(() => {
    api.get('auth.php?action=check')
      .then(u => { setUser(u); setAuthState('authed'); })
      .catch(() => setAuthState('guest'));
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    setAuthState('authed');
    setView('dashboard');
  };

  const handleLogout = async () => {
    await api.post('auth.php?action=logout').catch(() => {});
    setUser(null);
    setAuthState('guest');
    setView('dashboard');
  };

  const openQuote = (quoteRow) => {
    // quoteRow is the summary row from the dashboard list;
    // fetch the full quote before opening the builder
    api.get(`quotes.php?id=${quoteRow.id}`)
      .then(full => { setActiveQuote(full); setView('quote'); })
      .catch(e => alert('Failed to load quote: ' + e.message));
  };

  const newQuote = (quote) => {
    setActiveQuote(quote);
    setView('quote');
  };

  // ── Loading splash ────────────────────────────────────────────────────────
  if (authState === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Brand/>
          <Spinner label="Checking session…"/>
        </div>
      </div>
    );
  }

  // ── Guest → login screen ──────────────────────────────────────────────────
  if (authState === 'guest') {
    return <LoginScreen onLogin={handleLogin}/>;
  }

  // ── PDF preview (full screen, no sidebar) ────────────────────────────────
  if (view === 'pdf') {
    return (
      <div className="main">
        <PdfPreview quote={activeQuote} onBack={() => setView('quote')}/>
      </div>
    );
  }

  // ── Main authenticated layout ─────────────────────────────────────────────
  return (
    <ToastProvider>
      <div className="app">
        <Sidebar view={view} setView={setView} user={user} activeQuote={activeQuote} onAccount={() => setShowAccount(true)}/>
        <div className="main">
          <Topbar
            view={view} user={user} activeQuote={activeQuote}
            theme={theme} setTheme={setTheme}
            onLogout={handleLogout}
          />
          {view === 'dashboard' && (
            <Dashboard user={user} onOpenQuote={openQuote} onNewQuote={newQuote}/>
          )}
          {view === 'quote' && activeQuote && (
            <QuoteBuilder
              quote={activeQuote}
              user={user}
              onBack={() => setView('dashboard')}
              onPDF={() => setView('pdf')}
              onSaved={setActiveQuote}
            />
          )}
          {view === 'pricing'   && <PricingScreen   user={user}/>}
          {view === 'settings'  && <SettingsScreen  user={user}/>}
          {view === 'users'     && <UsersScreen     user={user}/>}
          {view === 'customers' && <CustomersScreen user={user}/>}
        </div>
      </div>
      {showAccount && <AccountModal user={user} onClose={() => setShowAccount(false)}/>}
    </ToastProvider>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ view, setView, user, activeQuote, onAccount }) => {
  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <Brand/>
      <div className="nav-section">
        <div className="nav-label">Workspace</div>
        <div className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <Icon name="dashboard" className="nav-icon"/> Dashboard
        </div>
        <div className={`nav-item ${view === 'customers' ? 'active' : ''}`} onClick={() => setView('customers')}>
          <Icon name="building" className="nav-icon"/> Customers
        </div>
        {activeQuote && (
          <div className={`nav-item ${view === 'quote' ? 'active' : ''}`} onClick={() => setView('quote')}>
            <Icon name="quote" className="nav-icon"/> Current Quote
            <span className="nav-badge">{activeQuote.quote_number}</span>
          </div>
        )}
      </div>
      <div className="nav-section">
        <div className="nav-label">Admin</div>
        <div className={`nav-item ${view === 'pricing' ? 'active' : ''}`} onClick={() => setView('pricing')}>
          <Icon name="pricing" className="nav-icon"/> Pricing DB
        </div>
        {user?.role === 'admin' && (
          <div className={`nav-item ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
            <Icon name="users" className="nav-icon"/> Users
          </div>
        )}
        <div className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
          <Icon name="settings" className="nav-icon"/> Settings
        </div>
      </div>
      <div className="user-block" style={{ cursor:'pointer' }} onClick={onAccount}>
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.full_name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>
    </aside>
  );
};

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ view, user, activeQuote, theme, setTheme, onLogout }) => {
  const crumbs = {
    dashboard: [['Workspace'], ['Dashboard']],
    quote:     [['Workspace'], ['Quotes'], [activeQuote?.quote_number || '']],
    pdf:       [['Workspace'], ['Quotes'], ['PDF Preview']],
    customers: [['Workspace'], ['Customers']],
    pricing:   [['Admin'], ['Pricing Database']],
    users:     [['Admin'], ['Users']],
    settings:  [['Admin'], ['Settings']],
  }[view] || [['Workspace']];

  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'crumb-current' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="topbar-actions">
        {/* Theme toggle */}
        <div className="theme-toggle">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="Light mode">
            <Icon name="sun" size={13}/>
          </button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="Dark mode">
            <Icon name="moon" size={13}/>
          </button>
        </div>

        <button className="btn btn-sm btn-ghost" onClick={onLogout} title="Sign out">
          <Icon name="logout" size={13}/>
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
