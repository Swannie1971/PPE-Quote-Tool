/* PDF Preview — A4 client-facing quote document */

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtPdf = (n, d=2) =>
  'R ' + Number(+n||0).toLocaleString('en-ZA', { minimumFractionDigits:d, maximumFractionDigits:d });

function pdfComputeTotals(quote) {
  const bom    = quote.bom    || [];
  const labour = quote.labour || [];
  const copper = quote.copper || [];
  const vat    = +quote.vat_rate || 15;

  const bomSell    = bom.reduce((s,i)    => s + (+i.qty||0)*(+i.cost_price||0)*(1+(+i.markup_pct||0)/100), 0);
  const labourSell = labour.reduce((s,i) => s + (+i.hours||0)*(+i.rate||0), 0);

  let copperSell = 0;
  for (const r of copper) {
    const mat  = (+r.qty||1)*(+r.length_m||0)*(+r.price_per_m||0)*(1+(+r.waste_pct||0)/100);
    const fab  = (+r.fab_hours||0)*(+r.fab_rate||0);
    copperSell += (mat + fab) * (1 + (+r.markup_pct||0)/100);
  }

  const subtotal = bomSell + labourSell + copperSell;
  const vatAmt   = subtotal * vat / 100;
  return { bomSell, labourSell, copperSell, subtotal, vatAmt, total: subtotal + vatAmt };
}

// Group BOM by category for 'grouped' PDF format
function groupBom(bom) {
  const groups = {};
  for (const item of bom) {
    const cat = item.category || 'misc';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return Object.entries(groups);
}

const CAT_LABELS = {
  enclosure: 'Enclosures', protection: 'Circuit Protection', copper: 'Copper Work',
  internal: 'Internal Components', wiring: 'Wiring', automation: 'Automation',
  metering: 'Metering', misc: 'Miscellaneous',
};

// ── Per-panel row computation ─────────────────────────────────────────────────

function computePerPanelRows(quote) {
  const bom    = quote.bom    || [];
  const labour = (quote.labour || []).filter(r => (+r.hours||0) > 0);
  const copper = quote.copper || [];
  const panels = quote.panels || [];

  const bsell = (items) => items.reduce((s,i) => s + (+i.qty||0)*(+i.cost_price||0)*(1+(+i.markup_pct||0)/100), 0);
  const lsell = (rows)  => rows.reduce((s,r) => s + (+r.hours||0)*(+r.rate||0), 0);
  const csell = (runs)  => runs.reduce((s,r) => {
    const mat = (+r.qty||1)*(+r.length_m||0)*(+r.price_per_m||0)*(1+(+r.waste_pct||0)/100);
    const fab = (+r.fab_hours||0)*(+r.fab_rate||0);
    return s + (mat + fab) * (1 + (+r.markup_pct||0)/100);
  }, 0);

  const assignedIds = new Set(panels.map(p => String(p.id)));

  const panelRows = panels.map(p => {
    const pid   = String(p.id);
    const total = bsell(bom.filter(i    => String(i.panel_id) === pid))
                + lsell(labour.filter(r => String(r.panel_id) === pid))
                + csell(copper.filter(r => String(r.panel_id) === pid));
    return { panel: p, total };
  });

  const generalTotal = bsell(bom.filter(i    => !i.panel_id    || !assignedIds.has(String(i.panel_id))))
                     + lsell(labour.filter(r  => !r.panel_id   || !assignedIds.has(String(r.panel_id))))
                     + csell(copper.filter(r  => !r.panel_id   || !assignedIds.has(String(r.panel_id))));

  return { panelRows, generalTotal };
}

// ── PDF Page component ────────────────────────────────────────────────────────

const PdfPage = ({ quote, settings, totals }) => {
  const fmt = quote.pdf_format || 'itemised';
  const bom = quote.bom || [];
  const labour = (quote.labour || []).filter(r => (+r.hours||0) > 0);
  const copper = quote.copper || [];

  const { panelRows, generalTotal } = computePerPanelRows(quote);

  const co = {
    name:    settings.company_name    || 'Power Panels & Electrical (Pty) Ltd',
    sub:     settings.company_sub     || 'Distribution Boards · MCCs · Control Panels',
    address: settings.company_address || '',
    phone:   settings.company_phone   || '',
    email:   settings.company_email   || '',
    reg:     settings.company_reg     || '',
    vat:     settings.company_vat     || '',
    cert:    settings.company_cert    || '',
  };

  return (
    <div className="pdf-page">
      {/* ── Header ── */}
      <div className="pdf-head">
        <div className="pdf-brand">
          {settings.company_logo
            ? <img src={`assets/logo.${settings.company_logo}`} alt={co.name} style={{ height:44, maxWidth:180, objectFit:'contain', flexShrink:0 }}/>
            : <div className="pdf-brand-mark">PP</div>
          }
          <div>
            <div className="pdf-brand-name">{co.name}</div>
            <div className="pdf-brand-sub">{co.sub}</div>
          </div>
        </div>
        <div className="pdf-meta">
          <div className="pdf-doctype">Quotation</div>
          <div className="pdf-docnum">{quote.quote_number}</div>
          <div style={{ fontSize:9.5, color:'#64748B', marginTop:4, fontFamily:'IBM Plex Mono,monospace' }}>
            {quote.quote_date || ''}
          </div>
          <div style={{ fontSize:9.5, color:'#64748B', marginTop:2, fontFamily:'IBM Plex Mono,monospace' }}>
            Valid {quote.validity_days || 30} days
          </div>
        </div>
      </div>

      {/* ── Bill-to / Project info ── */}
      <div className="pdf-info-grid">
        <div>
          <div className="k">Bill To</div>
          <div className="v" style={{ fontWeight:600 }}>{quote.customer_name || '—'}</div>
          {quote.contact_person && <div className="v">{quote.contact_person}</div>}
          {quote.phone          && <div className="v">{quote.phone}</div>}
          {quote.email          && <div className="v">{quote.email}</div>}
          {quote.address        && <div className="v" style={{ color:'#64748B' }}>{quote.address}</div>}
        </div>
        <div>
          <div className="k">Project</div>
          <div className="v" style={{ fontWeight:600 }}>{quote.project_name || '—'}</div>
          {quote.site_location && <div className="v" style={{ color:'#64748B' }}>{quote.site_location}</div>}
          <div style={{ marginTop:10 }}>
            <div className="k">Prepared by</div>
            <div className="v">{quote.estimator_name || '—'}</div>
          </div>
        </div>
        <div>
          <div className="k">From</div>
          <div className="v" style={{ fontWeight:600 }}>{co.name}</div>
          {co.address && <div className="v" style={{ color:'#64748B' }}>{co.address}</div>}
          {co.phone   && <div className="v">{co.phone}</div>}
          {co.email   && <div className="v">{co.email}</div>}
        </div>
        <div>
          {co.reg  && <><div className="k">Reg No.</div><div className="v">{co.reg}</div></>}
          {co.vat  && <><div className="k" style={{ marginTop:8 }}>VAT No.</div><div className="v">{co.vat}</div></>}
          {co.cert && <><div className="k" style={{ marginTop:8 }}>Certification</div><div className="v" style={{ color:'#64748B' }}>{co.cert}</div></>}
        </div>
      </div>

      {/* ── Per-panel scope of supply ── */}
      {fmt === 'per_panel' && (
        <>
          <div className="pdf-section-title">Scope of Supply</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Panel / Description</th>
                <th className="t-right" style={{ width:44 }}>Qty</th>
                <th className="t-right" style={{ width:130 }}>Unit Price</th>
                <th className="t-right" style={{ width:130 }}>Total (excl. VAT)</th>
              </tr>
            </thead>
            <tbody>
              {panelRows.map(({ panel, total }) => {
                const qty       = Math.max(1, +panel.qty || 1);
                const unitPrice = total / qty;
                return (
                  <tr key={panel.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{panel.name || '—'}</div>
                      {panel.description && <div style={{ fontSize:9.5, color:'#64748B', marginTop:2 }}>{panel.description}</div>}
                    </td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{qty}</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(unitPrice)}</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf(total)}</td>
                  </tr>
                );
              })}
              {generalTotal > 0 && (
                <tr>
                  <td><div style={{ fontWeight:600 }}>General / Common</div></td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>1</td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(generalTotal)}</td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf(generalTotal)}</td>
                </tr>
              )}
              {panelRows.length === 0 && generalTotal === 0 && (
                <tr>
                  <td colSpan={4} style={{ color:'#94A3B8', fontStyle:'italic' }}>No panels defined — add panels on the Panels tab in the quote builder</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── BOM section ── */}
      {fmt !== 'per_panel' && bom.length > 0 && (
        <>
          <div className="pdf-section-title">Bill of Materials</div>
          {fmt === 'itemised' && (
            <table className="pdf-table">
              <thead>
                <tr>
                  <th style={{ width:120 }}>Item Code</th>
                  <th>Description</th>
                  <th style={{ width:50 }}>Unit</th>
                  <th className="t-right" style={{ width:50 }}>Qty</th>
                  <th className="t-right" style={{ width:90 }}>Unit Price</th>
                  <th className="t-right" style={{ width:100 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bom.map((item, i) => {
                  const sell  = (+item.cost_price||0) * (1 + (+item.markup_pct||0)/100);
                  const total = (+item.qty||0) * sell;
                  return (
                    <tr key={i}>
                      <td style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9.5, color:'#64748B' }}>{item.item_code || '—'}</td>
                      <td>{item.description}</td>
                      <td style={{ color:'#64748B' }}>{item.unit}</td>
                      <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{item.qty}</td>
                      <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(sell)}</td>
                      <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {fmt === 'grouped' && (
            <table className="pdf-table">
              <thead>
                <tr>
                  <th style={{ width:120 }}>Item Code</th>
                  <th>Description</th>
                  <th style={{ width:50 }}>Unit</th>
                  <th className="t-right" style={{ width:50 }}>Qty</th>
                  <th className="t-right" style={{ width:90 }}>Unit Price</th>
                  <th className="t-right" style={{ width:100 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {groupBom(bom).map(([cat, items]) => (
                  <React.Fragment key={cat}>
                    <tr className="group-row">
                      <td colSpan={6}>{CAT_LABELS[cat] || cat}</td>
                    </tr>
                    {items.map((item, i) => {
                      const sell  = (+item.cost_price||0) * (1 + (+item.markup_pct||0)/100);
                      const total = (+item.qty||0) * sell;
                      return (
                        <tr key={i}>
                          <td style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:9.5, color:'#64748B' }}>{item.item_code || '—'}</td>
                          <td>{item.description}</td>
                          <td style={{ color:'#64748B' }}>{item.unit}</td>
                          <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{item.qty}</td>
                          <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(sell)}</td>
                          <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf(total)}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          {fmt === 'summary' && (
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="t-right" style={{ width:140 }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {groupBom(bom).map(([cat, items]) => {
                  const catTotal = items.reduce((s,i) => s + (+i.qty||0)*(+i.cost_price||0)*(1+(+i.markup_pct||0)/100), 0);
                  return (
                    <tr key={cat}>
                      <td>{CAT_LABELS[cat] || cat}</td>
                      <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(catTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* ── Labour ── */}
      {fmt !== 'per_panel' && labour.length > 0 && (
        <>
          <div className="pdf-section-title">Labour</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ width:120 }}>Skill Level</th>
                <th className="t-right" style={{ width:80 }}>Hours</th>
                <th className="t-right" style={{ width:100 }}>Rate (R/hr)</th>
                <th className="t-right" style={{ width:110 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {labour.map((row, i) => (
                <tr key={i}>
                  <td>{row.category}</td>
                  <td style={{ color:'#64748B', textTransform:'capitalize' }}>{row.skill_level}</td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{(+row.hours||0).toFixed(1)}</td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{fmtPdf(+row.rate||0, 0)}</td>
                  <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf((+row.hours||0)*(+row.rate||0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Copper ── */}
      {fmt !== 'per_panel' && copper.length > 0 && (
        <>
          <div className="pdf-section-title">Copper Fabrication</div>
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ width:100 }}>Size (mm)</th>
                <th className="t-right" style={{ width:70 }}>Length</th>
                <th className="t-right" style={{ width:50 }}>Qty</th>
                <th className="t-right" style={{ width:110 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {copper.map((r, i) => {
                const mat  = (+r.qty||1)*(+r.length_m||0)*(+r.price_per_m||0)*(1+(+r.waste_pct||0)/100);
                const fab  = (+r.fab_hours||0)*(+r.fab_rate||0);
                const sell = (mat + fab) * (1 + (+r.markup_pct||0)/100);
                return (
                  <tr key={i}>
                    <td>
                      {r.name}
                      {r.tinned ? <span style={{ marginLeft:6, fontSize:9, color:'#64748B', fontFamily:'IBM Plex Mono,monospace' }}>TINNED</span> : null}
                    </td>
                    <td style={{ fontFamily:'IBM Plex Mono,monospace', color:'#64748B' }}>{r.width_mm}×{r.height_mm}</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{(+r.length_m||0).toFixed(1)} m</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace' }}>{r.qty||1}</td>
                    <td className="t-right" style={{ fontFamily:'IBM Plex Mono,monospace', fontWeight:500 }}>{fmtPdf(sell)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {/* ── Totals ── */}
      <div className="pdf-totals">
        <div className="pdf-totals-inner">
          {fmt !== 'per_panel' && totals.bomSell    > 0 && <div className="pdf-tot-row"><span>Materials</span><span>{fmtPdf(totals.bomSell)}</span></div>}
          {fmt !== 'per_panel' && totals.labourSell > 0 && <div className="pdf-tot-row"><span>Labour</span><span>{fmtPdf(totals.labourSell)}</span></div>}
          {fmt !== 'per_panel' && totals.copperSell > 0 && <div className="pdf-tot-row"><span>Copper Fabrication</span><span>{fmtPdf(totals.copperSell)}</span></div>}
          <div className="pdf-tot-row"><span>Subtotal</span><span>{fmtPdf(totals.subtotal)}</span></div>
          <div className="pdf-tot-row"><span>VAT ({+quote.vat_rate || 15}%)</span><span>{fmtPdf(totals.vatAmt)}</span></div>
          <div className="pdf-tot-row grand"><span>TOTAL</span><span>{fmtPdf(totals.total)}</span></div>
        </div>
      </div>

      {/* ── Notes & Exclusions ── */}
      {(quote.notes || quote.exclusions) && (
        <div className="pdf-foot" style={{ gridTemplateColumns: quote.notes && quote.exclusions ? '1fr 1fr' : '1fr' }}>
          {quote.notes && (
            <div>
              <div style={{ fontWeight:700, fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6, color:'#0F172A' }}>Notes</div>
              <div style={{ whiteSpace:'pre-line' }}>{quote.notes}</div>
            </div>
          )}
          {quote.exclusions && (
            <div>
              <div style={{ fontWeight:700, fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6, color:'#0F172A' }}>Exclusions</div>
              <div style={{ whiteSpace:'pre-line' }}>{quote.exclusions}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Terms ── */}
      {quote.terms && (
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #E2E8F0', fontSize:9.5, color:'#64748B' }}>
          <div style={{ fontWeight:700, fontSize:9.5, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5, color:'#0F172A' }}>Terms &amp; Conditions</div>
          <div style={{ whiteSpace:'pre-line' }}>{quote.terms}</div>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className="pdf-sign">
        <div className="pdf-sign-block">
          <div className="ln">Authorised — {co.name}</div>
        </div>
        <div className="pdf-sign-block">
          <div className="ln">Accepted — {quote.customer_name || 'Customer'}</div>
        </div>
      </div>

      {/* ── Page footer ── */}
      <div style={{ marginTop:24, paddingTop:10, borderTop:'1px solid #E2E8F0', display:'flex', justifyContent:'space-between', fontSize:8.5, color:'#94A3B8', fontFamily:'IBM Plex Mono,monospace' }}>
        <span>{co.name}{co.reg ? ' · Reg ' + co.reg : ''}{co.vat ? ' · VAT ' + co.vat : ''}</span>
        <span>{quote.quote_number}</span>
      </div>
    </div>
  );
};

// ── PdfPreview shell ──────────────────────────────────────────────────────────

const PdfPreview = ({ quote, onBack }) => {
  const [settings, setSettings] = React.useState({});
  const [loading,  setLoading]  = React.useState(true);

  React.useEffect(() => {
    api.get('settings.php')
      .then(data => {
        const s = {};
        if (Array.isArray(data)) data.forEach(r => { s[r.key] = r.value; });
        else if (data) Object.assign(s, data);
        setSettings(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totals = pdfComputeTotals(quote);

  const handlePrint = () => window.print();

  if (loading) return <Spinner label="Loading settings…"/>;

  return (
    <div className="pdf-preview-wrap">
      {/* Toolbar */}
      <div className="pdf-toolbar">
        <button className="btn btn-sm btn-ghost" onClick={onBack}><Icon name="chevL" size={12}/>Back to Quote</button>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:11, color:'var(--text-muted)' }}>
            {quote.quote_number} · {quote.customer_name || '—'}
          </span>
          <button className="btn btn-sm btn-primary" onClick={handlePrint}><Icon name="printer" size={12}/>Print / Save as PDF</button>
        </div>
      </div>

      {/* A4 stage */}
      <div className="pdf-stage" style={{ flex:1 }}>
        <PdfPage quote={quote} settings={settings} totals={totals}/>
      </div>

      {/* Print-only styles */}
      <style>{`
        .pdf-preview-wrap {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .pdf-toolbar, .sidebar, .topbar { display: none !important; }
          .pdf-preview-wrap, .app, .main, #root, body, html {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: white !important;
          }
          .pdf-stage {
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          .pdf-page {
            box-shadow: none !important;
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 16mm 18mm !important;
          }
          .pdf-section-title { page-break-after: avoid; break-after: avoid; }
          .pdf-table { page-break-inside: auto; break-inside: auto; }
          .pdf-table tr { page-break-inside: avoid; break-inside: avoid; }
          .pdf-totals, .pdf-sign { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

window.PdfPreview = PdfPreview;
