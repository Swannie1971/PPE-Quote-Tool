/* Dashboard — loads real quotes from /api/quotes.php */

const Dashboard = ({ user, onOpenQuote, onNewQuote }) => {
  const [quotes,  setQuotes]  = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q,       setQ]       = React.useState('');
  const [status,  setStatus]  = React.useState('all');
  const toast = useToast();

  React.useEffect(() => {
    api.get('quotes.php')
      .then(setQuotes)
      .catch(() => toast('Failed to load quotes.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = quotes.filter(row => {
    if (status !== 'all' && row.status !== status) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return (row.quote_number  || '').toLowerCase().includes(t)
        || (row.customer_name || '').toLowerCase().includes(t)
        || (row.project_name  || '').toLowerCase().includes(t);
  });

  // KPI calculations
  const pipeline   = quotes.filter(x => x.status === 'sent' || x.status === 'draft').reduce((a, b) => a + (+b.sell_total || 0), 0);
  const wonSell    = quotes.filter(x => x.status === 'won').reduce((a, b) => a + (+b.sell_total || 0), 0);
  const wonCount   = quotes.filter(x => x.status === 'won').length;
  const avgMargin  = quotes.length
    ? quotes.reduce((a, b) => a + (+b.gp_pct || 0), 0) / quotes.length
    : 0;

  const handleNew = async () => {
    try {
      const q = await api.post('quotes.php', {});
      onNewQuote(q);
    } catch (e) {
      toast('Failed to create quote: ' + e.message, 'error');
    }
  };

  const handleDuplicate = async (row, e) => {
    e.stopPropagation();
    try {
      const copy = await api.post(`quotes.php?id=${row.id}&action=duplicate`, {});
      onNewQuote(copy);
    } catch (e) {
      toast('Failed to duplicate: ' + e.message, 'error');
    }
  };

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">Estimator Dashboard</h1>
          <div className="page-sub">
            {(user.full_name || '').toUpperCase()} · {new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleNew}>
            <Icon name="plus" size={14}/>New Quote
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Pipeline Value</div>
          <div className="kpi-value">R {(pipeline / 1000).toFixed(0)}k</div>
          <div className="kpi-delta"><span style={{ color: 'var(--text-muted)' }}>Sent + Draft</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Won — MTD</div>
          <div className="kpi-value">R {(wonSell / 1000).toFixed(0)}k</div>
          <div className="kpi-delta"><span style={{ color: 'var(--text-muted)' }}>{wonCount} of {quotes.length} quotes</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Avg. GP%</div>
          <div className="kpi-value" style={{ color: avgMargin >= 25 ? 'var(--success)' : 'var(--warning)' }}>
            {avgMargin.toFixed(1)}%
          </div>
          <div className="kpi-delta"><span style={{ color: 'var(--text-muted)' }}>Target ≥ 25%</span></div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Quotes Issued</div>
          <div className="kpi-value">{quotes.length}</div>
          <div className="kpi-delta"><span style={{ color: 'var(--text-muted)' }}>All time</span></div>
        </div>
      </div>

      {/* Quotes table */}
      <div className="card">
        <div className="card-head" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="card-title">Recent Quotes</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'draft', 'sent', 'won', 'lost'].map(s => (
                <span
                  key={s}
                  className={`filter-chip ${status === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s.toUpperCase()}
                  <span style={{ marginLeft: 4, color: 'var(--text-dim)' }}>
                    {s === 'all' ? quotes.length : quotes.filter(x => x.status === s).length}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search" style={{ width: 240 }}>
              <Icon name="search" size={13} className="search-icon"/>
              <input
                className="input"
                placeholder="Search quotes, clients…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <Spinner label="Loading quotes…"/>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Quote #</th>
                <th>Client / Project</th>
                <th style={{ width: 130 }}>Estimator</th>
                <th style={{ width: 110 }}>Date</th>
                <th style={{ width: 110 }}>Status</th>
                <th className="t-right" style={{ width: 160 }}>Sell Value</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
                    No quotes found.
                  </td>
                </tr>
              )}
              {filtered.map(row => (
                <tr key={row.id} onClick={() => onOpenQuote(row)}>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>{row.quote_number}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.customer_name || '—'}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.project_name}</div>
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.estimator_name || '—'}</td>
                  <td>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.quote_date}</div>
                    {row.updated_by_name && <div style={{ fontSize:10.5, color:'var(--text-dim)', fontFamily:'IBM Plex Mono,monospace', marginTop:1 }}>
                      {row.updated_at?.slice(0,10)} · {row.updated_by_name.split(' ')[0]}
                    </div>}
                  </td>
                  <td><StatusBadge status={row.status}/></td>
                  <td className="t-right t-num">
                    R {(+row.sell_total || 0).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="t-right" onClick={e => e.stopPropagation()}>
                    <div className="row-actions">
                      <button className="btn btn-sm btn-ghost btn-icon" title="PDF"><Icon name="doc" size={13}/></button>
                      <button
                        className="btn btn-sm btn-ghost btn-icon"
                        title="Duplicate"
                        onClick={e => handleDuplicate(row, e)}
                      >
                        <Icon name="copy" size={13}/>
                      </button>
                      <button
                        className="btn btn-sm btn-ghost btn-icon btn-danger"
                        title="Delete"
                        onClick={async () => {
                          if (!confirm(`Delete ${row.quote_number}? This cannot be undone.`)) return;
                          try {
                            await api.delete(`quotes.php?id=${row.id}`);
                            setQuotes(qs => qs.filter(x => x.id !== row.id));
                            toast('Quote deleted.', 'success');
                          } catch (e) {
                            toast('Failed to delete: ' + e.message, 'error');
                          }
                        }}
                      >
                        <Icon name="trash" size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
