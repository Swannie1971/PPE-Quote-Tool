/* Quote Builder — master-detail BOM, customer, labour, copper, summary */

const TABS = [
  { id: 'customer', label: 'Customer', icon: 'user' },
  { id: 'bom',      label: 'BOM Builder', icon: 'bom' },
  { id: 'labour',   label: 'Labour', icon: 'labour' },
  { id: 'copper',   label: 'Copper', icon: 'copper' },
  { id: 'summary',  label: 'Summary & Terms', icon: 'check' },
];

const QuoteBuilder = ({ project, bom, setBom, labour, setLabour, copper, setCopper, onPDF, onBack, totals }) => {
  const [tab, setTab] = React.useState('bom');
  const [selectedId, setSelectedId] = React.useState(bom[0]?.id);
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');

  const selected = bom.find(x => x.id === selectedId) || bom[0];
  const filtered = bom.filter(b => {
    if (filter !== 'all' && b.cat !== filter) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return b.code.toLowerCase().includes(t) || b.desc.toLowerCase().includes(t) || b.supplier.toLowerCase().includes(t);
  });

  const updateLine = (patch) => {
    setBom(bom.map(b => b.id === selected.id ? { ...b, ...patch } : b));
  };
  const removeLine = (id) => {
    const idx = bom.findIndex(b => b.id === id);
    const next = bom.filter(b => b.id !== id);
    setBom(next);
    if (selectedId === id) setSelectedId(next[Math.max(0, idx-1)]?.id);
  };

  return (
    <>
      <div className="tabs">
        {TABS.map((t, i) => (
          <div key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            <span className="tab-num">0{i+1}</span>
            <Icon name={t.icon} size={13}/>
            {t.label}
          </div>
        ))}
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'0 8px'}}>
          <span className="badge"><span className="badge-dot" style={{background:'var(--warning)'}}/>UNSAVED</span>
          <button className="btn btn-sm" onClick={onBack}><Icon name="chevL" size={12}/>Back</button>
          <button className="btn btn-sm"><Icon name="copy" size={12}/>Duplicate</button>
          <button className="btn btn-sm"><Icon name="download" size={12}/>Save</button>
          <button className="btn btn-sm btn-primary" onClick={onPDF}><Icon name="doc" size={12}/>Preview PDF</button>
        </div>
      </div>

      {tab === 'bom' && (
        <BomBuilder
          bom={bom} filtered={filtered} selected={selected}
          setSelectedId={setSelectedId} updateLine={updateLine} removeLine={removeLine}
          filter={filter} setFilter={setFilter} q={q} setQ={setQ}
          totals={totals}
        />
      )}
      {tab === 'customer' && <CustomerTab project={project}/>}
      {tab === 'labour' && <LabourTab labour={labour} setLabour={setLabour}/>}
      {tab === 'copper' && <CopperTab copper={copper} setCopper={setCopper}/>}
      {tab === 'summary' && <SummaryTab totals={totals} project={project} bom={bom} labour={labour}/>}
    </>
  );
};

/* ---------- BOM Builder (master / detail / summary) ---------- */
const BomBuilder = ({ bom, filtered, selected, setSelectedId, updateLine, removeLine, filter, setFilter, q, setQ, totals }) => {
  if (!selected) return <div className="empty">Add an item to get started.</div>;

  const cats = window.PPE.CATEGORIES;
  const lineCost = selected.qty * selected.cost;
  const sell = lineCost * (1 + selected.markup/100);
  const margin = sell > 0 ? ((sell - lineCost) / sell) * 100 : 0;

  return (
    <div className="qb-grid">
      {/* List */}
      <div className="qb-list">
        <div className="qb-list-head">
          <div className="search">
            <Icon name="search" size={13} className="search-icon"/>
            <input className="input" placeholder="Search code / description / supplier…" value={q} onChange={e=>setQ(e.target.value)}/>
          </div>
          <div className="qb-filters">
            {cats.map(c => (
              <span key={c.id} className={`filter-chip ${filter===c.id?'active':''}`} onClick={()=>setFilter(c.id)}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
        <div className="qb-toolbar" style={{top:'unset', position:'sticky'}}>
          <button className="btn btn-sm btn-primary"><Icon name="plus" size={11}/>Add item</button>
          <button className="btn btn-sm"><Icon name="edit" size={11}/>Custom line</button>
          <span style={{marginLeft:'auto', fontFamily:'IBM Plex Mono', fontSize:10.5, color:'var(--text-dim)', alignSelf:'center'}}>
            {filtered.length} / {bom.length} ITEMS
          </span>
        </div>

        {filtered.map(line => {
          const total = line.qty * line.cost * (1 + line.markup/100);
          const isLow = line.markup < 22;
          return (
            <div key={line.id}
              className={`line-row ${selected.id===line.id?'selected':''}`}
              onClick={()=>setSelectedId(line.id)}>
              <div>
                <div className="line-code">{line.code}{isLow && <span className="warn-pill" style={{marginLeft:8, fontSize:9, padding:'1px 5px'}}>LOW MARGIN</span>}</div>
                <div className="line-desc">{line.desc}</div>
                <div className="line-meta">
                  <span className="cat-chip"><CategoryIcon cat={line.cat} size={10}/>{cats.find(c=>c.id===line.cat)?.label}</span>
                  <span>{line.supplier}</span>
                </div>
              </div>
              <div className="line-price">
                <div className="line-qty">{line.qty} {line.unit} × R {line.cost.toLocaleString('en-ZA')}</div>
                <div className="line-total">R {total.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
                <div style={{color: isLow?'var(--warning)':'var(--success)', fontSize:10.5}}>{line.markup}% mu</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail */}
      <div className="qb-detail">
        <div className="detail-head">
          <div className="detail-icon"><CategoryIcon cat={selected.cat} size={20}/></div>
          <div style={{flex:1, minWidth:0}}>
            <h2 className="detail-title">{selected.desc}</h2>
            <div className="detail-sub">
              <span>{selected.code}</span>
              <span>· {selected.supplier}</span>
              <span>· {cats.find(c=>c.id===selected.cat)?.label}</span>
            </div>
          </div>
          <button className="btn btn-sm btn-ghost"><Icon name="copy" size={12}/>Duplicate</button>
          <button className="btn btn-sm btn-ghost btn-danger" onClick={()=>removeLine(selected.id)}><Icon name="trash" size={12}/>Remove</button>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Item Pricing</div></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field">
                <label className="label">Quantity</label>
                <div className="input-group">
                  <input className="input num" type="number" value={selected.qty}
                    onChange={e=>updateLine({qty: Number(e.target.value)})}/>
                  <span className="input-suffix">{selected.unit}</span>
                </div>
              </div>
              <div className="field">
                <label className="label">Unit Cost</label>
                <div className="input-group">
                  <input className="input num" type="number" value={selected.cost}
                    onChange={e=>updateLine({cost: Number(e.target.value)})}/>
                  <span className="input-suffix">ZAR</span>
                </div>
              </div>
              <div className="field">
                <label className="label">Markup %</label>
                <div className="input-group">
                  <input className="input num" type="number" value={selected.markup}
                    onChange={e=>updateLine({markup: Number(e.target.value)})}/>
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="field">
                <label className="label">Discount %</label>
                <div className="input-group">
                  <input className="input num" type="number" defaultValue={0}/>
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>

            <div className="calc-card">
              <div className="calc-grid">
                <div className="calc-cell">
                  <div className="lab">Line Cost</div>
                  <div className="val">R {lineCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
                </div>
                <div className="calc-cell">
                  <div className="lab">Markup Amount</div>
                  <div className="val">R {(sell - lineCost).toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
                </div>
                <div className="calc-cell accent">
                  <div className="lab">Sell Value</div>
                  <div className="val">R {sell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
                </div>
                <div className={`calc-cell ${margin < 22 ? 'warn' : 'accent'}`}>
                  <div className="lab">Margin (GP%)</div>
                  <div className="val">{margin.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{marginTop:14}}>
          <div className="card-head"><div className="card-title">Item Details</div></div>
          <div className="card-body">
            <div className="form-grid cols-2">
              <div className="field">
                <label className="label">Item Code</label>
                <input className="input mono" value={selected.code} readOnly/>
              </div>
              <div className="field">
                <label className="label">Supplier</label>
                <input className="input" value={selected.supplier} readOnly/>
              </div>
              <div className="field col-span-2">
                <label className="label">Description</label>
                <input className="input" value={selected.desc} readOnly/>
              </div>
              <div className="field col-span-2">
                <label className="label">Line Notes (printed on quote)</label>
                <textarea className="input" rows={2} placeholder="e.g. confirm cable entry direction"
                  value={selected.notes} onChange={e=>updateLine({notes: e.target.value})}/>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{marginTop:14}}>
          <div className="card-head" style={{justifyContent:'space-between'}}>
            <div className="card-title">Supplier Reference</div>
            <span className="mono" style={{fontSize:10.5, color:'var(--text-dim)'}}>UPDATED 2026-04-22</span>
          </div>
          <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
            <div><div className="label">List Price</div><div className="num" style={{fontSize:13}}>R {(selected.cost*1.08).toLocaleString('en-ZA')}</div></div>
            <div><div className="label">Lead time</div><div className="num" style={{fontSize:13}}>5–7 wks</div></div>
            <div><div className="label">Stock status</div><div style={{fontSize:13}}><span className="badge badge-success"><span className="badge-dot"/>IN STOCK</span></div></div>
            <div><div className="label">Min. order</div><div className="num" style={{fontSize:13}}>1 ea</div></div>
          </div>
        </div>
      </div>

      {/* Summary sidebar */}
      <QuoteSummary totals={totals}/>
    </div>
  );
};

/* ---------- Sticky summary ---------- */
const QuoteSummary = ({ totals }) => {
  const targetMargin = 25;
  const marginColor = totals.gp < targetMargin ? 'var(--warning)' : 'var(--success)';
  return (
    <aside className="qb-summary">
      <div className="sum-section">
        <div className="sum-title">Live Totals</div>
        <div className="sum-row"><span className="sk">Material cost</span><span>R {totals.matCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Labour cost</span><span>R {totals.labCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Copper fab</span><span>R {totals.copperCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Consumables (3%)</span><span>R {totals.consumables.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row total"><span className="sk">Total Cost</span><span>R {totals.totalCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
      </div>

      <div className="sum-section">
        <div className="sum-title">Sell Build-up</div>
        <div className="sum-row"><span className="sk">Materials sell</span><span>R {totals.matSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Labour sell</span><span>R {totals.labSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Copper sell</span><span>R {totals.copperSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">Sub-total (ex VAT)</span><span>R {totals.subtotal.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">VAT 15%</span><span>R {totals.vat.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row total" style={{fontSize:15}}><span className="sk">Quote Total</span><span style={{color:'var(--primary)'}}>R {totals.grand.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
      </div>

      <div className="sum-section">
        <div className="sum-title">Margin Check</div>
        <div className="sum-row"><span className="sk">Gross Profit</span><span style={{color: marginColor}}>R {totals.gpAmount.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
        <div className="sum-row"><span className="sk">GP%</span><span style={{color: marginColor, fontSize:14}}>{totals.gp.toFixed(1)}%</span></div>
        <div className="margin-meter">
          <div className="meter">
            <div className="meter-fill" style={{width: `${Math.min(totals.gp*2, 100)}%`, background: marginColor}}/>
            <div className="meter-tick" style={{left: `${targetMargin*2}%`}}/>
          </div>
          <span className="mono" style={{fontSize:10.5, color:'var(--text-muted)'}}>tgt {targetMargin}%</span>
        </div>
        {totals.gp < targetMargin && (
          <div className="warn-pill" style={{marginTop:10, width:'100%', justifyContent:'flex-start'}}>
            <Icon name="warn" size={11}/>Below target — review markup
          </div>
        )}
      </div>

      <div className="sum-section" style={{borderBottom:0, marginTop:'auto'}}>
        <div className="sum-title">Breakdown</div>
        <BreakdownBar segments={[
          { label: 'Materials', value: totals.matCost, color: 'var(--primary)' },
          { label: 'Labour', value: totals.labCost, color: 'var(--success)' },
          { label: 'Copper', value: totals.copperCost, color: '#C2410C' },
          { label: 'Consum.', value: totals.consumables, color: 'var(--text-dim)' },
        ]}/>
      </div>
    </aside>
  );
};

const BreakdownBar = ({ segments }) => {
  const total = segments.reduce((a,b)=>a+b.value, 0);
  return (
    <>
      <div style={{display:'flex', height:8, borderRadius:3, overflow:'hidden', border:'1px solid var(--border)', marginBottom:10}}>
        {segments.map(s => (
          <div key={s.label} style={{width: `${(s.value/total)*100}%`, background:s.color}}/>
        ))}
      </div>
      {segments.map(s => (
        <div key={s.label} style={{display:'flex', alignItems:'center', gap:8, fontSize:11.5, padding:'3px 0'}}>
          <span style={{width:8, height:8, borderRadius:2, background:s.color, flexShrink:0}}/>
          <span style={{color:'var(--text-muted)', flex:1}}>{s.label}</span>
          <span className="num" style={{fontSize:11}}>{((s.value/total)*100).toFixed(0)}%</span>
        </div>
      ))}
    </>
  );
};

/* ---------- Customer tab ---------- */
const CustomerTab = ({ project }) => (
  <div className="content" style={{maxWidth:980}}>
    <div className="page-head">
      <div>
        <h1 className="page-title">Customer & Project</h1>
        <div className="page-sub">QUOTE {project.num} · DRAFT · {project.date}</div>
      </div>
    </div>

    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
      <div className="card">
        <div className="card-head"><Icon name="user" size={14} style={{color:'var(--primary)'}}/><div className="card-title">Customer</div></div>
        <div className="card-body">
          <div className="form-grid cols-2">
            <div className="field col-span-2"><label className="label">Customer Name</label><input className="input" defaultValue={project.customer}/></div>
            <div className="field"><label className="label">Contact Person</label><input className="input" defaultValue={project.contact}/></div>
            <div className="field"><label className="label">Phone</label><input className="input mono" defaultValue={project.phone}/></div>
            <div className="field col-span-2"><label className="label">Email</label><input className="input mono" defaultValue={project.email}/></div>
            <div className="field col-span-2"><label className="label">Physical Address</label><textarea className="input" rows={2} defaultValue={project.address}/></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><Icon name="building" size={14} style={{color:'var(--primary)'}}/><div className="card-title">Project</div></div>
        <div className="card-body">
          <div className="form-grid cols-2">
            <div className="field col-span-2"><label className="label">Project Name</label><input className="input" defaultValue={project.project}/></div>
            <div className="field col-span-2"><label className="label">Site Location</label><input className="input" defaultValue={project.site}/></div>
            <div className="field"><label className="label">Quote Number</label><input className="input mono" defaultValue={project.num} readOnly/></div>
            <div className="field"><label className="label">Date</label><input className="input mono" defaultValue={project.date}/></div>
            <div className="field"><label className="label">Estimator</label><input className="input" defaultValue={project.estimator}/></div>
            <div className="field"><label className="label">Validity (days)</label><input className="input num" defaultValue={project.validity}/></div>
            <div className="field"><label className="label">Currency</label>
              <select className="select">
                <option>ZAR — South African Rand</option>
                <option>USD — US Dollar</option>
                <option>EUR — Euro</option>
              </select>
            </div>
            <div className="field"><label className="label">VAT rate</label><div className="input-group"><input className="input num" defaultValue={15}/><span className="input-suffix">%</span></div></div>
          </div>
        </div>
      </div>

      <div className="card" style={{gridColumn:'1 / -1'}}>
        <div className="card-head"><Icon name="info" size={14} style={{color:'var(--primary)'}}/><div className="card-title">Project notes</div></div>
        <div className="card-body">
          <textarea className="input" rows={3} defaultValue={project.notes}/>
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Labour tab ---------- */
const LabourTab = ({ labour, setLabour }) => {
  const update = (id, patch) => setLabour(labour.map(l => l.id===id ? {...l, ...patch} : l));
  const totalHours = labour.reduce((a,b)=>a+b.hours, 0);
  const totalCost = labour.reduce((a,b)=>a+b.hours*b.rate, 0);
  const totalSell = totalCost * 1.45;
  return (
    <div className="content">
      <div className="page-head">
        <div><h1 className="page-title">Labour Calculator</h1><div className="page-sub">AUTO-CALC FROM RULES · 7 CATEGORIES · 45% MARKUP</div></div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn-sm"><Icon name="settings" size={12}/>Edit rates</button>
          <button className="btn btn-sm"><Icon name="plus" size={12}/>Add category</button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        <div className="kpi">
          <div className="kpi-label">Total Hours</div>
          <div className="kpi-value">{totalHours.toFixed(1)}<span style={{fontSize:13, color:'var(--text-muted)'}}> hrs</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Labour Cost</div>
          <div className="kpi-value">R {totalCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Labour Sell</div>
          <div className="kpi-value" style={{color:'var(--success)'}}>R {totalSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
          <div className="kpi-delta delta-up">GP 31.0% @ 45% markup</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Labour Breakdown</div></div>
        <table className="data">
          <thead><tr><th>Category</th><th>Skill</th><th className="t-right">Hours</th><th className="t-right">Rate (R/hr)</th><th className="t-right">Cost</th><th className="t-right">Sell @ 45%</th></tr></thead>
          <tbody>
            {labour.map(l => (
              <tr key={l.id}>
                <td>{l.cat}</td>
                <td><span className="cat-chip">{l.skill}</span></td>
                <td className="t-right"><input className="input num" style={{textAlign:'right', maxWidth:80, padding:'4px 8px'}} value={l.hours} onChange={e=>update(l.id, {hours: Number(e.target.value)})}/></td>
                <td className="t-right"><input className="input num" style={{textAlign:'right', maxWidth:80, padding:'4px 8px'}} value={l.rate} onChange={e=>update(l.id, {rate: Number(e.target.value)})}/></td>
                <td className="t-right t-num">R {(l.hours*l.rate).toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                <td className="t-right t-num" style={{color:'var(--success)'}}>R {(l.hours*l.rate*1.45).toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
              </tr>
            ))}
            <tr style={{background:'var(--surface-2)', fontWeight:600}}>
              <td colSpan={2}>TOTAL</td>
              <td className="t-right t-num">{totalHours.toFixed(1)}</td>
              <td/>
              <td className="t-right t-num">R {totalCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
              <td className="t-right t-num" style={{color:'var(--success)'}}>R {totalSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- Copper tab ---------- */
const CopperTab = ({ copper, setCopper }) => {
  const set = (k, v) => setCopper({ ...copper, [k]: v });

  const density = 8960; // kg/m³ (still used for displayed weight)
  const totalLength = copper.length * copper.qty;
  const volume = (copper.width/1000) * (copper.height/1000) * totalLength;
  const weight = volume * density;
  const matCost = totalLength * copper.mRate * (1 + copper.waste/100);
  const tinUplift = copper.tinned ? matCost * 0.18 : 0;
  const fabCost = copper.fabHours * copper.fabRate;
  const total = matCost + tinUplift + fabCost;
  const sell = total * (1 + copper.markup/100);

  return (
    <div className="content" style={{maxWidth:1100}}>
      <div className="page-head">
        <div><h1 className="page-title">Copper Work Calculator</h1>
        <div className="page-sub">BUSBAR FABRICATION · LIVE PRICE PER M · WASTE FACTOR APPLIED</div></div>
        <button className="btn btn-sm"><Icon name="plus" size={12}/>Add busbar run</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14}}>
        <div className="card">
          <div className="card-head"><Icon name="copper" size={14} style={{color:'#C2410C'}}/><div className="card-title">Busbar Run · 250A Main</div></div>
          <div className="card-body">
            <div className="form-grid">
              <div className="field"><label className="label">Width</label><div className="input-group"><input className="input num" value={copper.width} onChange={e=>set('width', Number(e.target.value))}/><span className="input-suffix">mm</span></div></div>
              <div className="field"><label className="label">Thickness</label><div className="input-group"><input className="input num" value={copper.height} onChange={e=>set('height', Number(e.target.value))}/><span className="input-suffix">mm</span></div></div>
              <div className="field"><label className="label">Length</label><div className="input-group"><input className="input num" value={copper.length} onChange={e=>set('length', Number(e.target.value))}/><span className="input-suffix">m</span></div></div>
              <div className="field"><label className="label">Quantity</label><div className="input-group"><input className="input num" value={copper.qty} onChange={e=>set('qty', Number(e.target.value))}/><span className="input-suffix">bars</span></div></div>

              <div className="field"><label className="label">Cu price / m</label><div className="input-group"><input className="input num" value={copper.mRate} onChange={e=>set('mRate', Number(e.target.value))}/><span className="input-suffix">ZAR</span></div></div>
              <div className="field"><label className="label">Waste %</label><div className="input-group"><input className="input num" value={copper.waste} onChange={e=>set('waste', Number(e.target.value))}/><span className="input-suffix">%</span></div></div>
              <div className="field"><label className="label">Fab. hours</label><div className="input-group"><input className="input num" value={copper.fabHours} onChange={e=>set('fabHours', Number(e.target.value))}/><span className="input-suffix">hrs</span></div></div>
              <div className="field"><label className="label">Fab. rate</label><div className="input-group"><input className="input num" value={copper.fabRate} onChange={e=>set('fabRate', Number(e.target.value))}/><span className="input-suffix">R/h</span></div></div>

              <div className="field col-span-2" style={{flexDirection:'row', alignItems:'center', gap:10}}>
                <input type="checkbox" id="tin" checked={copper.tinned} onChange={e=>set('tinned', e.target.checked)} style={{accentColor:'var(--primary)'}}/>
                <label htmlFor="tin" style={{fontSize:12.5, cursor:'pointer'}}>Tin plated (+18% material)</label>
              </div>
              <div className="field col-span-2"><label className="label">Markup %</label><div className="input-group"><input className="input num" value={copper.markup} onChange={e=>set('markup', Number(e.target.value))}/><span className="input-suffix">%</span></div></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Calculated</div></div>
          <div className="card-body">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div className="calc-cell"><div className="lab">Total Weight</div><div className="val">{weight.toFixed(1)} <span style={{fontSize:12, color:'var(--text-muted)'}}>kg</span></div></div>
              <div className="calc-cell"><div className="lab">Total Length</div><div className="val">{(copper.length*copper.qty).toFixed(1)} <span style={{fontSize:12, color:'var(--text-muted)'}}>m</span></div></div>
              <div className="calc-cell"><div className="lab">Material</div><div className="val">R {matCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div></div>
              <div className="calc-cell"><div className="lab">Tin uplift</div><div className="val">R {tinUplift.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div></div>
              <div className="calc-cell"><div className="lab">Fabrication</div><div className="val">R {fabCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div></div>
              <div className="calc-cell"><div className="lab">Total cost</div><div className="val">R {total.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div></div>
              <div className="calc-cell accent" style={{gridColumn:'span 2', borderTop:'1px solid var(--border)', paddingTop:14, marginTop:4}}>
                <div className="lab">Sell @ {copper.markup}% markup</div>
                <div className="val" style={{fontSize:24}}>R {sell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:14}}>
        <div className="card-head"><div className="card-title">Fabrication checklist</div></div>
        <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, fontSize:12.5}}>
          {['Drill 12mm M10 holes', 'Edge chamfer 0.5mm', 'Tin plate (electrolytic)', 'Heat-shrink insulation', 'Pre-bend ±90°', 'Stamping per phase', 'IR test ≥ 5MΩ', 'Customer markings'].map(t=> (
            <label key={t} style={{display:'flex', gap:8, alignItems:'center'}}>
              <input type="checkbox" defaultChecked style={{accentColor:'var(--primary)'}}/>{t}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------- Summary / Terms ---------- */
const SummaryTab = ({ totals, project, bom, labour }) => (
  <div className="content" style={{maxWidth:1100}}>
    <div className="page-head">
      <div><h1 className="page-title">Summary & Terms</h1>
      <div className="page-sub">FINAL REVIEW BEFORE PDF · {project.num}</div></div>
      <button className="btn btn-primary"><Icon name="check" size={13}/>Mark ready to send</button>
    </div>

    <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14}}>
      <div className="card">
        <div className="card-head"><div className="card-title">Cost vs Sell — by group</div></div>
        <table className="data">
          <thead><tr><th>Group</th><th className="t-right">Cost</th><th className="t-right">Sell</th><th className="t-right">GP%</th></tr></thead>
          <tbody>
            {[
              ['Materials (BOM)', totals.matCost, totals.matSell],
              ['Labour',          totals.labCost, totals.labSell],
              ['Copper fab.',     totals.copperCost, totals.copperSell],
              ['Consumables',     totals.consumables, totals.consumables*1.2],
            ].map(([k, c, s]) => {
              const gp = s>0 ? (s-c)/s*100 : 0;
              return (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="t-right t-num">R {c.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                  <td className="t-right t-num">R {s.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                  <td className="t-right t-num" style={{color: gp<25?'var(--warning)':'var(--success)'}}>{gp.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr style={{background:'var(--surface-2)', fontWeight:600}}>
              <td>TOTAL</td>
              <td className="t-right t-num">R {totals.totalCost.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
              <td className="t-right t-num">R {totals.subtotal.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
              <td className="t-right t-num" style={{color: totals.gp<25?'var(--warning)':'var(--success)'}}>{totals.gp.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Quote Options</div></div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="field"><label className="label">Output format</label>
            <select className="select"><option>Grouped by category</option><option>Itemised — full BOM</option><option>Summary lines only</option></select>
          </div>
          <div className="field"><label className="label">Show line pricing</label>
            <select className="select"><option>Yes — unit & total</option><option>Total only</option><option>Hidden — lump sum</option></select>
          </div>
          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5}}>
            <input type="checkbox" defaultChecked style={{accentColor:'var(--primary)'}}/>Include cost breakdown chart
          </label>
          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5}}>
            <input type="checkbox" defaultChecked style={{accentColor:'var(--primary)'}}/>Include scope-of-supply page
          </label>
          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5}}>
            <input type="checkbox" style={{accentColor:'var(--primary)'}}/>Include single-line diagram placeholder
          </label>
        </div>
      </div>
    </div>

    <div className="card" style={{marginTop:14}}>
      <div className="card-head"><div className="card-title">Exclusions & Terms</div></div>
      <div className="card-body" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <div className="field">
          <label className="label">Exclusions</label>
          <textarea className="input" rows={5} defaultValue={`• On-site installation and commissioning labour\n• Cable interconnections between panels\n• Civil works, plinths, cable trays\n• Any items not listed in this quotation\n• Crane / lifting / off-loading at site`}/>
        </div>
        <div className="field">
          <label className="label">Standard terms</label>
          <textarea className="input" rows={5} defaultValue={`• Prices valid for ${project.validity} days from date of quotation\n• 50% deposit on order, 40% on FAT, 10% on delivery\n• Delivery: 6–8 weeks ex-works subject to material lead times\n• Quote subject to standard PPE conditions of sale\n• Pricing excludes 15% VAT`}/>
        </div>
      </div>
    </div>
  </div>
);

window.QuoteBuilder = QuoteBuilder;
