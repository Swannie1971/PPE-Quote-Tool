/* Login screen */

const LoginScreen = ({ onLogin }) => {
  const [user, setUser] = React.useState('d.mokoena');
  const [pass, setPass] = React.useState('••••••••••');
  const [pending, setPending] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setPending(true);
    setTimeout(() => onLogin(), 350);
  };

  return (
    <div className="login-shell">
      <div className="login-art">
        <div style={{position:'relative', display:'flex', alignItems:'center', gap:10}}>
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
            <div><div>Version</div><b>2.4.1 / r-1188</b></div>
            <div><div>Region</div><b>ZA-GP-01</b></div>
            <div><div>Status</div><b style={{color:'var(--success)'}}>● Operational</b></div>
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <Brand small/>
          <h2 style={{fontSize:20, fontWeight:600, margin:'24px 0 4px', letterSpacing:'-0.01em'}}>Sign in</h2>
          <div style={{fontSize:12, color:'var(--text-muted)', fontFamily:'IBM Plex Mono, monospace', marginBottom:24}}>
            Enter your credentials to continue
          </div>

          <div className="field" style={{marginBottom:12}}>
            <label className="label">Username</label>
            <input className="input mono" value={user} onChange={e=>setUser(e.target.value)} autoFocus/>
          </div>

          <div className="field" style={{marginBottom:8}}>
            <label className="label">Password</label>
            <input className="input mono" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18}}>
            <label style={{fontSize:11.5, color:'var(--text-muted)', display:'flex', gap:6, alignItems:'center'}}>
              <input type="checkbox" defaultChecked style={{accentColor:'var(--primary)'}}/>
              Keep me signed in
            </label>
            <a href="#" style={{fontSize:11.5, color:'var(--primary)', textDecoration:'none'}}>Forgot password</a>
          </div>

          <button className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'10px'}} type="submit" disabled={pending}>
            {pending ? 'Authenticating…' : (<>Sign in <Icon name="arrow" size={14}/></>)}
          </button>

          <div style={{marginTop:28, paddingTop:18, borderTop:'1px solid var(--border)', fontSize:10.5, color:'var(--text-dim)', fontFamily:'IBM Plex Mono, monospace', display:'flex', justifyContent:'space-between'}}>
            <span>SESSION TLS 1.3</span>
            <span>RBAC: ESTIMATOR</span>
          </div>
        </form>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
