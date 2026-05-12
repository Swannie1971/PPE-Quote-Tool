/* Dashboard */

const Dashboard = ({ onOpenQuote, onNewQuote }) => {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const quotes = window.PPE.QUOTES;
  const filtered = quotes.filter(x => {
    if (status !== 'all' && x.status !== status) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return x.num.toLowerCase().includes(t) || x.client.toLowerCase().includes(t) || x.project.toLowerCase().includes(t);
  });

  const totalSell = quotes.reduce((a,b)=>a+b.value, 0);
  const wonSell = quotes.filter(x=>x.status==='won').reduce((a,b)=>a+b.value, 0);
  const avgMargin = quotes.reduce((a,b)=>a+b.margin, 0) / quotes.length;
  const pipeline = quotes.filter(x=>x.status==='sent'||x.status==='draft').reduce((a,b)=>a+b.value, 0);

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Estimator Dashboard</h1>
          <div className="page-sub">D. MOKOENA · WED 11 MAY 2026 · ZA-GP-01</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn"><Icon name="download" size={14}/>Export CSV</button>
          <button className="btn btn-primary" onClick={onNewQuote}><Icon name="plus" size={14}/>New Quote</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Pipeline Value</div>
          <div className="kpi-value">R {(pipeline/1000).toFixed(0)}k</div>
          <div className="kpi-delta delta-up"><Icon name="trend" size={11}/>+12.4% vs Apr</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Won — MTD</div>
          <div className="kpi-value">R {(wonSell/1000).toFixed(0)}k</div>
          <div className="kpi-delta"><span style={{color:'var(--text-muted)'}}>3 of 8 quotes</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg. GP%</div>
          <div className="kpi-value" style={{color:'var(--success)'}}>{avgMargin.toFixed(1)}%</div>
          <div className="kpi-delta"><span style={{color:'var(--text-muted)'}}>Target ≥ 25%</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Quotes Issued</div>
          <div className="kpi-value">{quotes.length}<span style={{fontSize:13, color:'var(--text-muted)'}}> / 14</span></div>
          <div className="kpi-delta delta-up"><Icon name="trend" size={11}/>+2 this week</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div className="card-title">Recent Quotes</div>
            <div style={{display:'flex', gap:6}}>
              {['all','draft','sent','won','lost'].map(s => (
                <span key={s} className={`filter-chip ${status===s?'active':''}`} onClick={()=>setStatus(s)}>
                  {s.toUpperCase()}
                  <span style={{marginLeft:4, color:'var(--text-dim)'}}>
                    {s==='all' ? quotes.length : quotes.filter(x=>x.status===s).length}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <div className="search" style={{width:240}}>
              <Icon name="search" size={13} className="search-icon"/>
              <input className="input" placeholder="Search quotes, clients…" value={q} onChange={e=>setQ(e.target.value)}/>
            </div>
            <button className="btn btn-sm"><Icon name="filter" size={12}/>Filters</button>
          </div>
        </div>

        <table className="data">
          <thead>
            <tr>
              <th style={{width:140}}>Quote #</th>
              <th>Client / Project</th>
              <th style={{width:120}}>Estimator</th>
              <th style={{width:110}}>Date</th>
              <th style={{width:120}}>Status</th>
              <th className="t-right" style={{width:90}}>GP%</th>
              <th className="t-right" style={{width:160}}>Sell Value</th>
              <th style={{width:80}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.num} onClick={()=>onOpenQuote(row)}>
                <td className="mono" style={{color:'var(--text-muted)'}}>{row.num}</td>
                <td>
                  <div style={{fontWeight:500}}>{row.client}</div>
                  <div style={{fontSize:11.5, color:'var(--text-muted)'}}>{row.project}</div>
                </td>
                <td className="mono" style={{fontSize:11.5, color:'var(--text-muted)'}}>{row.estimator}</td>
                <td className="mono" style={{fontSize:11.5, color:'var(--text-muted)'}}>{row.date}</td>
                <td><StatusBadge status={row.status}/></td>
                <td className="t-right t-num" style={{color: row.margin < 25 ? 'var(--warning)' : 'var(--success)'}}>
                  {row.margin.toFixed(1)}%
                </td>
                <td className="t-right t-num">R {row.value.toLocaleString('en-ZA')}</td>
                <td className="t-right">
                  <div className="row-actions" onClick={e=>e.stopPropagation()}>
                    <button className="btn btn-sm btn-ghost btn-icon" title="PDF"><Icon name="doc" size={13}/></button>
                    <button className="btn btn-sm btn-ghost btn-icon" title="More"><Icon name="dots" size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:20}}>
        <div className="card">
          <div className="card-head"><div className="card-title">Profitability by category — last 30 days</div></div>
          <div className="card-body">
            {[
              ['Enclosures',   24.1, 188400],
              ['Protection',   31.8, 412700],
              ['Copper work',  38.2, 152300],
              ['Automation',   22.4, 296800],
              ['Labour',       46.5, 318400],
            ].map(([cat, gp, val]) => (
              <div key={cat} style={{display:'grid', gridTemplateColumns:'120px 1fr 60px 100px', gap:12, alignItems:'center', padding:'6px 0'}}>
                <span style={{fontSize:12}}>{cat}</span>
                <div className="meter"><div className="meter-fill" style={{width:`${Math.min(gp*2,100)}%`, background: gp<25?'var(--warning)':'var(--success)'}}/></div>
                <span className="num" style={{fontSize:11.5, color: gp<25?'var(--warning)':'var(--success)', textAlign:'right'}}>{gp.toFixed(1)}%</span>
                <span className="num" style={{fontSize:11.5, color:'var(--text-muted)', textAlign:'right'}}>R {val.toLocaleString('en-ZA')}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Activity</div></div>
          <div className="card-body" style={{padding:0}}>
            {[
              ['10:42', 'C. van Wyk', 'won PQ-2026-0183 — Sasol Secunda', 'won'],
              ['09:18', 'D. Mokoena', 'updated pricing for SCH-LV432693 (+R220)', 'edit'],
              ['08:55', 'System',     'auto-generated PQ-2026-0184 PDF', 'doc'],
              ['Yesterday', 'D. Mokoena', 'flagged 3 low-margin items on PQ-2026-0182', 'warn'],
              ['Yesterday', 'Admin',   'imported supplier price list — Schneider Q2', 'download'],
            ].map(([t, who, what, ic], i) => (
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)'}}>
                <Icon name={ic} size={14} style={{marginTop:2, color:'var(--text-muted)'}}/>
                <div style={{flex:1, fontSize:12.5}}>
                  <span style={{fontWeight:500}}>{who}</span> <span style={{color:'var(--text-muted)'}}>{what}</span>
                </div>
                <span className="mono" style={{fontSize:10.5, color:'var(--text-dim)'}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
