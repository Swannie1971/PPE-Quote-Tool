/* Main app shell */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "vatRate": 15,
  "marginTarget": 25,
  "accent": "blue"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  blue:   { dark: '#3B82F6', darkHover: '#2563EB', light: '#2563EB', lightHover: '#1D4ED8' },
  amber:  { dark: '#F59E0B', darkHover: '#D97706', light: '#D97706', lightHover: '#B45309' },
  green:  { dark: '#22C55E', darkHover: '#16A34A', light: '#16A34A', lightHover: '#15803D' },
  copper: { dark: '#EA580C', darkHover: '#C2410C', light: '#C2410C', lightHover: '#9A3412' },
};

const App = () => {
  const [view, setView] = React.useState('login'); // login | dashboard | quote | pdf
  const [project, setProject] = React.useState(window.PPE.CURRENT_PROJECT);
  const [bom, setBom] = React.useState(window.PPE.INITIAL_BOM);
  const [labour, setLabour] = React.useState(window.PPE.INITIAL_LABOUR);
  const [copper, setCopper] = React.useState({
    width: 40, height: 10, length: 1.4, qty: 3, mRate: 358, waste: 12,
    fabHours: 6.5, fabRate: 520, tinned: true, markup: 35,
  });

  const t = useTweaks(TWEAK_DEFAULTS);
  const tweak = t[0]; const setTweak = t[1];

  // apply theme + accent to root
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', tweak.theme);
    const a = ACCENT_MAP[tweak.accent] || ACCENT_MAP.blue;
    const isDark = tweak.theme === 'dark';
    document.documentElement.style.setProperty('--primary', isDark ? a.dark : a.light);
    document.documentElement.style.setProperty('--primary-hover', isDark ? a.darkHover : a.lightHover);
  }, [tweak.theme, tweak.accent]);

  // --- totals (live) ---
  const totals = React.useMemo(() => {
    const matCost = bom.reduce((s, b) => s + b.qty * b.cost, 0);
    const matSell = bom.reduce((s, b) => s + b.qty * b.cost * (1 + b.markup/100), 0);
    const labCost = labour.reduce((s, l) => s + l.hours * l.rate, 0);
    const labSell = labCost * 1.45;
    const cuTotalLength = copper.length * copper.qty;
    const cuVolume = (copper.width/1000) * (copper.height/1000) * cuTotalLength;
    const cuWeight = cuVolume * 8960;
    const cuMat = cuTotalLength * copper.mRate * (1 + copper.waste/100);
    const cuTin = copper.tinned ? cuMat * 0.18 : 0;
    const cuFab = copper.fabHours * copper.fabRate;
    const copperCost = cuMat + cuTin + cuFab;
    const copperSell = copperCost * (1 + copper.markup/100);
    const consumables = (matCost + labCost) * 0.03;
    const totalCost = matCost + labCost + copperCost + consumables;
    const subtotal = matSell + labSell + copperSell + consumables*1.2;
    const gpAmount = subtotal - totalCost;
    const gp = subtotal > 0 ? (gpAmount/subtotal) * 100 : 0;
    const vat = subtotal * (tweak.vatRate/100);
    const grand = subtotal + vat;
    return { matCost, matSell, labCost, labSell, copperCost, copperSell, consumables, totalCost, subtotal, gpAmount, gp, vat, grand };
  }, [bom, labour, copper, tweak.vatRate]);

  if (view === 'login') {
    return (
      <>
        <LoginScreen onLogin={() => setView('dashboard')}/>
        <TweaksPanelHost tweak={tweak} setTweak={setTweak}/>
      </>
    );
  }

  if (view === 'pdf') {
    return (
      <>
        <PdfPreview project={project} bom={bom} labour={labour} totals={totals}
          onBack={() => setView('quote')}/>
        <TweaksPanelHost tweak={tweak} setTweak={setTweak}/>
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView}/>
      <div className="main">
        <Topbar view={view} project={project} setView={setView} totals={totals} tweak={tweak} setTweak={setTweak}/>
        {view === 'dashboard' && (
          <Dashboard
            onOpenQuote={() => setView('quote')}
            onNewQuote={() => setView('quote')}
          />
        )}
        {view === 'quote' && (
          <QuoteBuilder
            project={project} bom={bom} setBom={setBom}
            labour={labour} setLabour={setLabour}
            copper={copper} setCopper={setCopper}
            totals={totals}
            onPDF={() => setView('pdf')}
            onBack={() => setView('dashboard')}
          />
        )}
      </div>
      <TweaksPanelHost tweak={tweak} setTweak={setTweak}/>
    </div>
  );
};

const Sidebar = ({ view, setView }) => {
  const items = [
    { id: 'dashboard', label: 'Dashboard',     icon: 'dashboard' },
    { id: 'quote',     label: 'Current Quote', icon: 'quote', badge: 'PQ-185' },
  ];
  const tools = [
    { id: 'bom',     label: 'BOM Builder',   icon: 'bom' },
    { id: 'copper',  label: 'Copper Calc',   icon: 'copper' },
    { id: 'labour',  label: 'Labour Calc',   icon: 'labour' },
  ];
  const admin = [
    { id: 'pricing', label: 'Pricing DB',    icon: 'pricing', badge: '1,284' },
    { id: 'reports', label: 'Reports',       icon: 'reports' },
    { id: 'settings',label: 'Settings',      icon: 'settings' },
  ];
  return (
    <aside className="sidebar">
      <Brand/>
      <div className="nav-section">
        <div className="nav-label">Workspace</div>
        {items.map(i => (
          <div key={i.id} className={`nav-item ${view===i.id?'active':''}`} onClick={()=>setView(i.id)}>
            <Icon name={i.icon} className="nav-icon"/> {i.label}
            {i.badge && <span className="nav-badge">{i.badge}</span>}
          </div>
        ))}
      </div>
      <div className="nav-section">
        <div className="nav-label">Tools</div>
        {tools.map(i => (
          <div key={i.id} className="nav-item" onClick={()=>setView('quote')}>
            <Icon name={i.icon} className="nav-icon"/> {i.label}
          </div>
        ))}
      </div>
      <div className="nav-section">
        <div className="nav-label">Admin</div>
        {admin.map(i => (
          <div key={i.id} className="nav-item">
            <Icon name={i.icon} className="nav-icon"/> {i.label}
            {i.badge && <span className="nav-badge">{i.badge}</span>}
          </div>
        ))}
      </div>
      <div className="user-block">
        <div className="avatar">DM</div>
        <div className="user-info">
          <div className="user-name">D. Mokoena</div>
          <div className="user-role">Sr. Estimator</div>
        </div>
        <Icon name="dots" size={14} style={{color:'var(--text-dim)', marginLeft:'auto', cursor:'pointer'}}/>
      </div>
    </aside>
  );
};

const Topbar = ({ view, project, setView, totals, tweak, setTweak }) => {
  const crumbs = {
    dashboard: [['Workspace'], ['Dashboard']],
    quote:     [['Workspace'], ['Quotes'], [project.num + ' · ' + project.customer]],
  }[view] || [['Workspace']];

  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumb-sep">/</span>}
            <span className={i === crumbs.length-1 ? 'crumb-current' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      {view === 'quote' && (
        <>
          <div style={{width:1, height:24, background:'var(--border)'}}/>
          <div style={{display:'flex', alignItems:'center', gap:18, fontFamily:'IBM Plex Mono, monospace', fontSize:11.5}}>
            <span style={{color:'var(--text-muted)'}}>SELL <b style={{color:'var(--text)'}}>R {totals.subtotal.toLocaleString('en-ZA', {maximumFractionDigits:0})}</b></span>
            <span style={{color:'var(--text-muted)'}}>GP <b style={{color: totals.gp<25?'var(--warning)':'var(--success)'}}>{totals.gp.toFixed(1)}%</b></span>
            <span style={{color:'var(--text-muted)'}}>LINES <b style={{color:'var(--text)'}}>{window.PPE.INITIAL_BOM.length}</b></span>
          </div>
        </>
      )}
      <div className="topbar-actions">
        <div className="search" style={{width:240}}>
          <Icon name="search" size={13} className="search-icon"/>
          <input className="input" placeholder="Search items, quotes, clients…"/>
        </div>
        <span className="kbd">⌘K</span>
        <div className="theme-toggle">
          <button className={tweak.theme==='light'?'active':''} onClick={()=>setTweak('theme','light')} title="Light mode">
            <Icon name="sun" size={13}/>
          </button>
          <button className={tweak.theme==='dark'?'active':''} onClick={()=>setTweak('theme','dark')} title="Dark mode">
            <Icon name="moon" size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Tweaks ---------- */
const TweaksPanelHost = ({ tweak, setTweak }) => (
  <TweaksPanel title="Tweaks">
    <TweakSection label="Appearance">
      <TweakRadio label="Theme" value={tweak.theme}
        options={[{value:'dark',label:'Dark'},{value:'light',label:'Light'}]}
        onChange={v=>setTweak('theme', v)}/>
      <TweakRadio label="Accent" value={tweak.accent}
        options={[{value:'blue',label:'Blue'},{value:'amber',label:'Amber'},{value:'green',label:'Green'},{value:'copper',label:'Copper'}]}
        onChange={v=>setTweak('accent', v)}/>
    </TweakSection>
    <TweakSection label="Calculation">
      <TweakSlider label="VAT rate" value={tweak.vatRate} min={0} max={25} step={0.5} unit="%"
        onChange={v=>setTweak('vatRate', v)}/>
      <TweakSlider label="Margin target" value={tweak.marginTarget} min={10} max={50} step={1} unit="%"
        onChange={v=>setTweak('marginTarget', v)}/>
    </TweakSection>
  </TweaksPanel>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
