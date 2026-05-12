/* Login screen — wired to /api/auth.php?action=login */

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pending,  setPending]  = React.useState(false);
  const [error,    setError]    = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const user = await api.post('auth.php?action=login', { username, password });
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setPending(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Left art panel */}
      <div className="login-art">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark">PP</div>
          <div>
            <div className="brand-name">Power Panels</div>
            <div className="brand-sub">& Electrical</div>
          </div>
        </div>
        <div className="login-art-content">
          <div className="login-tag">▎ Estimator Workspace</div>
          <h1 className="login-h">Quote complete distribution boards in minutes, not days.</h1>
          <p className="login-sub">
            Live BOM pricing, copper fabrication estimates, and labour breakdowns —
            wired into a single audit-ready document.
          </p>
          <div className="login-meta">
            <div><div>Platform</div><b>PPE Quote Tool</b></div>
            <div><div>Region</div><b>ZA · Gauteng</b></div>
            <div><div>Status</div><b style={{ color: 'var(--success)' }}>● Operational</b></div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <Brand small/>

          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '24px 0 4px', letterSpacing: '-0.01em' }}>
            Sign in
          </h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace', marginBottom: 24 }}>
            Enter your credentials to continue
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-soft)', border: '1px solid var(--danger)',
              borderRadius: 4, padding: '8px 12px', fontSize: 12.5,
              color: 'var(--danger)', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Icon name="warn" size={13}/>{error}
            </div>
          )}

          <div className="field" style={{ marginBottom: 12 }}>
            <label className="label">Username</label>
            <input
              className="input mono"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              required
            />
          </div>

          <div className="field" style={{ marginBottom: 18 }}>
            <label className="label">Password</label>
            <input
              className="input mono"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            type="submit"
            disabled={pending}
          >
            {pending ? 'Authenticating…' : <><span>Sign in</span> <Icon name="arrow" size={14}/></>}
          </button>

          <div style={{
            marginTop: 28, paddingTop: 18,
            borderTop: '1px solid var(--border)',
            fontSize: 10.5, color: 'var(--text-dim)',
            fontFamily: 'IBM Plex Mono, monospace',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>SESSION · TLS 1.3</span>
            <span>SECURE COOKIE AUTH</span>
          </div>
        </form>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
