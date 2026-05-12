/* Print-ready PDF preview */

const PdfPreview = ({ project, bom, labour, totals, onBack }) => {
  const cats = window.PPE.CATEGORIES;
  // group BOM by category for the printed quote
  const byCat = {};
  bom.forEach(b => {
    byCat[b.cat] = byCat[b.cat] || [];
    byCat[b.cat].push(b);
  });
  const groupOrder = ['enclosure','protection','copper','internal','wiring','automation','metering'];

  return (
    <div className="main">
      <div className="pdf-toolbar">
        <button className="btn btn-sm" onClick={onBack}><Icon name="chevL" size={12}/>Back to editor</button>
        <span className="pdf-paginator">Page 1 / 1 · A4 Portrait</span>
        <div style={{flex:1}}/>
        <button className="btn btn-sm"><Icon name="printer" size={12}/>Print</button>
        <button className="btn btn-sm"><Icon name="send" size={12}/>Email</button>
        <button className="btn btn-sm btn-primary"><Icon name="download" size={12}/>Download PDF</button>
      </div>

      <div className="pdf-stage">
        <div className="pdf-page">
          {/* Head */}
          <div className="pdf-head">
            <div className="pdf-brand">
              <div className="pdf-brand-mark">PP</div>
              <div>
                <div className="pdf-brand-name">Power Panels & Electrical (Pty) Ltd</div>
                <div className="pdf-brand-sub">Distribution Boards · MCCs · Control Panels</div>
                <div style={{fontSize:9.5, color:'#64748B', marginTop:3}}>
                  12 Anvil Rd, Isando 1600 · +27 11 974 4218 · sales@powerpanels.co.za · powerpanels.co.za
                </div>
              </div>
            </div>
            <div className="pdf-meta">
              <div className="pdf-doctype">Quotation</div>
              <div className="pdf-docnum">{project.num}</div>
              <div style={{fontSize:9.5, color:'#64748B', marginTop:4, fontFamily:'IBM Plex Mono, monospace'}}>
                Issued {project.date}<br/>Valid {project.validity} days
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="pdf-info-grid">
            <div>
              <div className="k">Prepared For</div>
              <div className="v" style={{fontWeight:600, fontSize:12}}>{project.customer}</div>
              <div className="v">Attn: {project.contact}</div>
              <div className="v" style={{fontFamily:'IBM Plex Mono, monospace', fontSize:10}}>{project.email}</div>
              <div className="v" style={{fontFamily:'IBM Plex Mono, monospace', fontSize:10}}>{project.phone}</div>
              <div className="v" style={{marginTop:2}}>{project.address}</div>
            </div>
            <div>
              <div className="k">Project</div>
              <div className="v" style={{fontWeight:600, fontSize:12}}>{project.project}</div>
              <div className="v">{project.site}</div>
              <div className="v" style={{marginTop:8}}><span className="k" style={{display:'inline', marginRight:4}}>Estimator:</span>{project.estimator}</div>
              <div className="v"><span className="k" style={{display:'inline', marginRight:4}}>Currency:</span>{project.currency} · VAT @ 15%</div>
            </div>
          </div>

          {/* Scope */}
          <div className="pdf-section-title">Scope of Supply</div>
          <div style={{fontSize:10.5, lineHeight:1.55}}>
            Design, manufacture, assembly, factory testing and delivery of one (1) custom-built PLC control panel
            for Reactor 7 at Sasol Secunda. Panel shall comply with SANS 1973-1, IEC 61439-1/2, and includes
            internal wiring, copper busbar work, protection, automation hardware, and FAT.
          </div>

          {/* Itemised */}
          <div className="pdf-section-title">Itemised Pricing</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th style={{width:'8%'}}>Item</th>
                <th>Description</th>
                <th style={{width:'8%'}}>Qty</th>
                <th style={{width:'8%'}}>Unit</th>
                <th style={{width:'12%', textAlign:'right'}}>Unit Sell</th>
                <th style={{width:'13%', textAlign:'right'}}>Total</th>
              </tr>
            </thead>
            <tbody>
              {groupOrder.filter(g => byCat[g]).map((g, gi) => {
                const items = byCat[g];
                const gTotal = items.reduce((a,b)=>a + b.qty*b.cost*(1+b.markup/100), 0);
                return (
                  <React.Fragment key={g}>
                    <tr className="group-row">
                      <td colSpan={5}>{String.fromCharCode(65+gi)} · {cats.find(c=>c.id===g)?.label}</td>
                      <td style={{textAlign:'right'}}>R {gTotal.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                    </tr>
                    {items.map((b, i) => {
                      const unitSell = b.cost * (1 + b.markup/100);
                      const total = b.qty * unitSell;
                      return (
                        <tr key={b.id}>
                          <td style={{fontFamily:'IBM Plex Mono, monospace', fontSize:9.5, color:'#64748B'}}>{String.fromCharCode(65+gi)}{i+1}</td>
                          <td>
                            <div style={{fontWeight:500}}>{b.desc}</div>
                            <div style={{fontSize:9, color:'#64748B', fontFamily:'IBM Plex Mono, monospace'}}>{b.code} · {b.supplier}</div>
                          </td>
                          <td style={{fontFamily:'IBM Plex Mono, monospace'}}>{b.qty}</td>
                          <td style={{fontFamily:'IBM Plex Mono, monospace', color:'#64748B'}}>{b.unit}</td>
                          <td style={{fontFamily:'IBM Plex Mono, monospace', textAlign:'right'}}>R {unitSell.toLocaleString('en-ZA', {maximumFractionDigits:2})}</td>
                          <td style={{fontFamily:'IBM Plex Mono, monospace', textAlign:'right', fontWeight:500}}>R {total.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Labour group */}
              <tr className="group-row">
                <td colSpan={5}>H · Labour, Engineering & Testing</td>
                <td style={{textAlign:'right'}}>R {totals.labSell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
              </tr>
              {labour.map((l, i) => {
                const sell = l.hours * l.rate * 1.45;
                return (
                  <tr key={l.id}>
                    <td style={{fontFamily:'IBM Plex Mono, monospace', fontSize:9.5, color:'#64748B'}}>H{i+1}</td>
                    <td>{l.cat} <span style={{fontSize:9.5, color:'#64748B'}}>· {l.skill}</span></td>
                    <td style={{fontFamily:'IBM Plex Mono, monospace'}}>{l.hours}</td>
                    <td style={{fontFamily:'IBM Plex Mono, monospace', color:'#64748B'}}>hrs</td>
                    <td style={{fontFamily:'IBM Plex Mono, monospace', textAlign:'right'}}>R {(l.rate*1.45).toLocaleString('en-ZA', {maximumFractionDigits:2})}</td>
                    <td style={{fontFamily:'IBM Plex Mono, monospace', textAlign:'right', fontWeight:500}}>R {sell.toLocaleString('en-ZA', {maximumFractionDigits:0})}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="pdf-totals">
            <div className="pdf-totals-inner">
              <div className="pdf-tot-row"><span>Sub-total (ex VAT)</span><span>R {totals.subtotal.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
              <div className="pdf-tot-row"><span>VAT @ 15%</span><span>R {totals.vat.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
              <div className="pdf-tot-row grand"><span>TOTAL</span><span>R {totals.grand.toLocaleString('en-ZA', {maximumFractionDigits:0})}</span></div>
            </div>
          </div>

          {/* Exclusions / terms */}
          <div className="pdf-section-title">Exclusions</div>
          <ul style={{fontSize:10, lineHeight:1.65, paddingLeft:18, margin:0, columnCount:2, columnGap:24}}>
            <li>On-site installation & commissioning labour</li>
            <li>Cable interconnections between panels</li>
            <li>Civil works, plinths, cable trays</li>
            <li>Crane / lifting / off-loading at site</li>
            <li>Items not listed in this quotation</li>
            <li>Local authority inspections & sign-off</li>
          </ul>

          <div className="pdf-section-title">Terms of Sale</div>
          <div style={{fontSize:9.5, lineHeight:1.6, color:'#475569'}}>
            Prices valid for {project.validity} days from date of issue. Payment terms: 50% on order, 40% on FAT,
            10% on delivery. Delivery 6–8 weeks ex-works subject to material lead times. Subject to PPE
            standard conditions of sale (available on request). All prices exclusive of 15% VAT unless stated.
          </div>

          {/* Signatures */}
          <div className="pdf-sign">
            <div className="pdf-sign-block">
              <div className="ln">For Power Panels & Electrical</div>
              <div style={{fontSize:9.5, color:'#64748B', marginTop:6}}>{project.estimator} · Senior Estimator</div>
            </div>
            <div className="pdf-sign-block">
              <div className="ln">Accepted by Customer (Sign & Date)</div>
              <div style={{fontSize:9.5, color:'#64748B', marginTop:6}}>Print name & position</div>
            </div>
          </div>

          {/* Foot */}
          <div className="pdf-foot">
            <div>
              <div style={{fontWeight:600, color:'#0F172A'}}>Power Panels & Electrical (Pty) Ltd</div>
              Reg. 2014/118472/07 · VAT 4520271883 · ISO 9001:2015 · SANS 1973 accredited assembler
            </div>
            <div style={{textAlign:'right'}}>
              <div className="mono">{project.num}</div>
              <div>Page 1 of 1 · Generated {project.date}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.PdfPreview = PdfPreview;
