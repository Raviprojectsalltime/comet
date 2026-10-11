import { useEffect, useMemo, useRef, useState } from 'react';

// SheetJS is heavy — load it only when a user actually uploads/downloads.
const loadXlsx = () => import('xlsx');

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'orders', label: 'Orders & Shipments', icon: '⇄' },
  { id: 'manufacturing', label: 'Manufacturing', icon: '⚙' },
  { id: 'inventory', label: 'Inventory & Returns', icon: '▤' },
];

const TABLE_FOR_TAB = {
  orders: ['ops_orders', 'ops_shipments'],
  manufacturing: ['ops_batches'],
  inventory: ['ops_inventory', 'ops_returns', 'ops_refunds'],
};

const ST_COLOR = {
  Delivered: 'green', 'Out for Delivery': 'blue', Shipped: 'blue',
  'Ready to Ship': 'gold', Processing: 'gold', 'Order Placed': 'gold',
  Cancelled: 'red', 'Delivery Failed': 'red', Returned: 'red',
  Paid: 'green', Pending: 'gold', Refunded: 'red',
  Completed: 'green', Approved: 'green', Rejected: 'red',
  Passed: 'green', Failed: 'red',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const inr = (n) => `₹${fmt(Math.round(n))}`;
const dd = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`kpi ${tone || ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Pill({ v }) {
  return <span className={`pill p-${ST_COLOR[v] || 'grey'}`}>{v}</span>;
}

function BarChart({ data, height = 140 }) {
  if (!data?.length) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="bars" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="bar-col" title={`${d.l}: ${fmt(d.v)}`}>
          <div className="bar" style={{ height: `${(d.v / max) * 100}%` }} />
          <span>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ data }) {
  if (!data?.length) return <div className="chart-empty">No data</div>;
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  let acc = 0;
  const colors = ['#3b2416', '#8a5a2b', '#b8860b', '#1a7f37', '#b3232b', '#666', '#1d4ed8', '#7c3aed'];
  const stops = data.map((d, i) => {
    const start = (acc / total) * 360;
    acc += d.v;
    return `${colors[i % colors.length]} ${start}deg ${(acc / total) * 360}deg`;
  });
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops.join(',')})` }}>
        <span>{fmt(total)}</span>
      </div>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i}><i style={{ background: colors[i % colors.length] }} /> {d.l} <b>{fmt(d.v)}</b></div>
        ))}
      </div>
    </div>
  );
}

function HBars({ data }) {
  if (!data?.length) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map((d) => d.v), 1);
  return (
    <div className="hbars">
      {data.map((d) => (
        <div key={d.l} className="hbar">
          <span title={d.l}>{d.l}</span>
          <div><i style={{ width: `${(d.v / max) * 100}%` }} /></div>
          <b>{d.fmt ? d.fmt(d.v) : fmt(d.v)}</b>
        </div>
      ))}
    </div>
  );
}

function UploadBar({ tables, onUploaded }) {
  const fileRef = useRef();
  const [msg, setMsg] = useState(null);

  const parseAndSend = async (file) => {
    setMsg('Parsing file…');
    try {
      const XLSX = await loadXlsx();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const allRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!allRows.length) { setMsg('Empty sheet — no rows found.'); return; }
      let inserted = 0, failed = [];
      for (const t of tables) {
        const r = await fetch(`/api/ops/${t}/import`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: allRows }),
        });
        const d = await r.json();
        if (d.inserted) inserted += d.inserted;
        else if (d.error) failed.push(`${t}: ${d.error}`);
      }
      setMsg(inserted ? `Imported ${inserted} row${inserted > 1 ? 's' : ''} into ${tables.join(', ')}${failed.length ? ' (partial: ' + failed.join('; ') + ')' : ''}` : `Nothing matched — check column names.`);
      if (inserted) onUploaded();
    } catch (e) {
      setMsg('Could not parse that file — use .xlsx or .csv.');
    }
  };

  return (
    <div className="upload-bar">
      <button className="ops-btn" onClick={() => fileRef.current.click()}>⬆ Upload Excel</button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden
        onChange={(e) => { if (e.target.files[0]) parseAndSend(e.target.files[0]); e.target.value = ''; }} />
      {msg && <span className="upload-msg">{msg}</span>}
    </div>
  );
}

export default function Dashboard({ user, onBack }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState({});
  const [insights, setInsights] = useState(null);
  const [refreshed, setRefreshed] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const load = () => {
    const tables = ['ops_orders', 'ops_shipments', 'ops_batches', 'ops_inventory', 'ops_returns', 'ops_refunds'];
    Promise.all(tables.map((t) => fetch(`/api/ops/${t}`).then((r) => r.json()).catch(() => [])))
      .then(([orders, shipments, batches, inventory, returns, refunds]) => {
        setData({ orders, shipments, batches, inventory, returns, refunds });
        setRefreshed(new Date());
      });
    fetch('/api/ops/insights').then((r) => r.json()).then((d) => setInsights(d)).catch(() => {});
  };
  useEffect(load, []);

  const { orders = [], shipments = [], batches = [], inventory = [], returns = [], refunds = [] } = data;

  const m = useMemo(() => {
    const gross = orders.reduce((s, o) => s + o.order_value, 0);
    const refunded = refunds.filter((r) => r.status === 'Completed').reduce((s, r) => s + r.amount, 0);
    const units = orders.reduce((s, o) => s + o.quantity, 0);
    const group = (arr, k, val = () => 1) => {
      const g = {};
      arr.forEach((x) => { g[x[k]] = (g[x[k]] || 0) + val(x); });
      return g;
    };
    const days = [...Array(14)].map((_, i) => {
      const d = new Date(Date.now() - (13 - i) * 864e5);
      return { l: `${d.getDate()}/${d.getMonth() + 1}`, v: 0, key: d.toISOString().slice(0, 10) };
    });
    orders.forEach((o) => { const d = days.find((x) => x.key === o.order_date.slice(0, 10)); if (d) d.v += o.order_value; });
    const courierPerf = Object.entries(group(shipments, 'courier')).map(([l, v]) => ({ l, v }));
    const defectByFactory = Object.entries(group(batches, 'factory', (b) => b.defective_qty || 0)).map(([l, v]) => ({ l, v }));
    const stockByWh = Object.entries(group(inventory, 'warehouse', (i) => i.available)).map(([l, v]) => ({ l, v }));
    const returnReasons = Object.entries(group(returns, 'reason')).map(([l, v]) => ({ l, v }));
    return {
      gross, net: gross - refunded, refunded, units,
      byStatus: Object.entries(group(orders, 'fulfillment_status')).map(([l, v]) => ({ l, v })),
      byCat: Object.entries(group(orders, 'category', (o) => o.order_value)).map(([l, v]) => ({ l, v, fmt: inr })),
      days, courierPerf, defectByFactory, stockByWh, returnReasons,
      stageDist: Object.entries(group(batches, 'stage')).map(([l, v]) => ({ l, v })),
      aov: orders.length ? gross / orders.length : 0,
      inProd: batches.reduce((s, b) => s + b.planned_qty - b.completed_qty, 0),
      completed: batches.reduce((s, b) => s + b.completed_qty, 0),
      awaitingQc: batches.filter((b) => b.stage === 'QC Inspection').reduce((s, b) => s + b.planned_qty - b.completed_qty, 0),
      defective: batches.reduce((s, b) => s + (b.defective_qty || 0), 0),
      delayedBatches: batches.filter((b) => !b.actual_completion && new Date(b.planned_completion) < new Date()).length,
      lowStock: inventory.filter((i) => i.available < i.threshold).length,
      outStock: inventory.filter((i) => i.available === 0).length,
      totalStock: inventory.reduce((s, i) => s + i.available, 0),
      damagedStock: inventory.reduce((s, i) => s + i.damaged, 0),
      openReturns: returns.filter((r) => r.approval_status === 'Pending').length,
      pendingRefunds: refunds.filter((r) => r.status !== 'Completed').length,
      delayedShips: shipments.filter((s) => s.exception === 'Late delivery').length,
      failedShips: shipments.filter((s) => s.status === 'Delivery Failed').length,
    };
  }, [orders, shipments, batches, inventory, returns, refunds]);

  const categories = [...new Set(orders.map((o) => o.category))];
  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      (statusFilter === 'All' || o.fulfillment_status === statusFilter) &&
      (categoryFilter === 'All' || o.category === categoryFilter) &&
      (!q || [o.order_id, o.product, o.customer_ref, o.destination].some((f) => String(f).toLowerCase().includes(q)))
    );
  });

  const download = async (name, rows) => {
    const XLSX = await loadXlsx();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: 'no data' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  const Actions = ({ tables, downloads }) => (
    <div className="ops-actions">
      <UploadBar tables={tables} onUploaded={load} />
      {downloads.map(([name, rows]) => (
        <button key={name} className="ops-btn ghost" onClick={() => download(name, rows)}>⬇ {name}</button>
      ))}
    </div>
  );

  return (
    <section className="ops">
      <aside className="ops-side">
        <div className="ops-side-head">
          <h3>Operations</h3>
          <span>Intelligence</span>
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); setSearch(''); setStatusFilter('All'); setCategoryFilter('All'); }}>
            <i>{t.icon}</i> {t.label}
          </button>
        ))}
        <button className="ops-side-back" onClick={onBack}>← Back to store</button>
      </aside>

      <div className="ops-main">
        <div className="ops-top">
          <div>
            <h2>{TABS.find((t) => t.id === tab).label}</h2>
            <span className="ops-badge">Internal · Stakeholder view</span>
          </div>
          {refreshed && <span className="ops-refresh">Last refresh {refreshed.toLocaleTimeString('en-IN')}</span>}
        </div>

        {tab === 'overview' && (
          <>
            <div className="kpi-grid">
              <Kpi label="Gross Sales" value={inr(m.gross)} sub={`Net ${inr(m.net)}`} />
              <Kpi label="Total Orders" value={fmt(orders.length)} sub={`${fmt(m.units)} units`} />
              <Kpi label="Avg Order Value" value={inr(m.aov)} />
              <Kpi label="Refunds Paid" value={inr(m.refunded)} sub={`${m.pendingRefunds} pending`} tone={m.pendingRefunds ? 'warn' : ''} />
              <Kpi label="In Production" value={fmt(m.inProd)} sub={`${fmt(m.completed)} completed`} />
              <Kpi label="Defective Units" value={fmt(m.defective)} tone={m.defective ? 'warn' : ''} />
              <Kpi label="Low / Out of Stock" value={`${m.lowStock} / ${m.outStock}`} tone="warn" />
              <Kpi label="Delivery Issues" value={m.delayedShips + m.failedShips} sub={`${m.delayedShips} late · ${m.failedShips} failed`} tone={m.failedShips ? 'bad' : 'warn'} />
              <Kpi label="Open Returns" value={m.openReturns} />
              <Kpi label="Delayed Batches" value={m.delayedBatches} tone={m.delayedBatches ? 'bad' : ''} />
            </div>
            <div className="ops-charts">
              <div className="chart-card"><h4>Revenue — last 14 days</h4><BarChart data={m.days} /></div>
              <div className="chart-card"><h4>Orders by status</h4><Donut data={m.byStatus} /></div>
              <div className="chart-card"><h4>Revenue by category</h4><HBars data={m.byCat} /></div>
            </div>
            <div className="insights-card">
              <div className="insights-head">
                <h4>Key Insights</h4>
                <span className={`insights-src ${insights?.source || ''}`}>
                  {insights === null ? 'Analyzing…' : insights.source === 'ai' ? 'AI analysis' : 'Computed'}
                </span>
              </div>
              {insights === null ? (
                <div className="insights-loading">
                  <span /><span /><span /> Crunching operations data…
                </div>
              ) : (
                <ul className="insights-list">
                  {insights.insights.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
            </div>
          </>
        )}

        {tab === 'orders' && (
          <>
            <div className="kpi-grid">
              <Kpi label="Orders" value={fmt(orders.length)} sub={inr(m.gross) + ' value'} />
              <Kpi label="Shipments" value={fmt(shipments.length)} />
              <Kpi label="Delivered" value={fmt(orders.filter((o) => o.fulfillment_status === 'Delivered').length)} />
              <Kpi label="Late / Failed" value={`${m.delayedShips} / ${m.failedShips}`} tone={m.failedShips ? 'bad' : 'warn'} />
            </div>
            <div className="ops-charts cols-2">
              <div className="chart-card"><h4>Orders by status</h4><Donut data={m.byStatus} /></div>
              <div className="chart-card"><h4>Shipments by courier</h4><HBars data={m.courierPerf} /></div>
            </div>
            <Actions tables={TABLE_FOR_TAB.orders} downloads={[[ 'orders', orders ], [ 'shipments', shipments ]]} />
            <div className="ops-filters">
              <input placeholder="Search order ID, product, customer, city…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All</option>
                {[...new Set(orders.map((o) => o.fulfillment_status))].map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option>All</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className="ops-count">{filteredOrders.length} orders</span>
            </div>
            <div className="ops-table">
              <table>
                <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Product</th><th>Qty</th><th>Value</th><th>Payment</th><th>Status</th><th>Destination</th></tr></thead>
                <tbody>
                  {filteredOrders.slice(0, 50).map((o) => (
                    <tr key={o.order_id}>
                      <td><b>{o.order_id}</b></td><td>{dd(o.order_date)}</td><td>{o.customer_ref}</td>
                      <td>{o.product}</td><td>{o.quantity}</td><td>{inr(o.order_value)}</td>
                      <td><Pill v={o.payment_status} /></td><td><Pill v={o.fulfillment_status} /></td><td>{o.destination}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4 className="ops-sub">Shipments <span>({shipments.length})</span></h4>
            <div className="ops-table">
              <table>
                <thead><tr><th>Tracking</th><th>Courier</th><th>Order</th><th>To</th><th>Dispatch</th><th>Status</th><th>Expected</th><th>Delivered</th><th>Exception</th></tr></thead>
                <tbody>
                  {shipments.slice(0, 30).map((s) => (
                    <tr key={s.shipment_id} className={s.exception ? 'row-warn' : ''}>
                      <td><b>{s.shipment_id}</b></td><td>{s.courier}</td><td>{s.order_id}</td><td>{s.destination}</td>
                      <td>{s.dispatch_date}</td><td><Pill v={s.status} /></td><td>{s.expected_delivery}</td>
                      <td>{s.actual_delivery || '—'}</td><td>{s.exception || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'manufacturing' && (
          <>
            <div className="kpi-grid">
              <Kpi label="Total Batches" value={batches.length} />
              <Kpi label="Units Planned" value={fmt(batches.reduce((s, b) => s + b.planned_qty, 0))} />
              <Kpi label="Completed" value={fmt(m.completed)} />
              <Kpi label="Awaiting QC" value={fmt(m.awaitingQc)} />
              <Kpi label="Defective" value={fmt(m.defective)} tone="warn" />
              <Kpi label="Delayed" value={m.delayedBatches} tone={m.delayedBatches ? 'bad' : ''} />
            </div>
            <div className="ops-charts cols-2">
              <div className="chart-card"><h4>Batches by stage</h4><Donut data={m.stageDist} /></div>
              <div className="chart-card"><h4>Defective units by factory</h4><HBars data={m.defectByFactory} /></div>
            </div>
            <Actions tables={TABLE_FOR_TAB.manufacturing} downloads={[[ 'production-batches', batches ]]} />
            <div className="ops-table">
              <table>
                <thead><tr><th>Batch</th><th>Product</th><th>Factory</th><th>Planned</th><th>Done</th><th>Stage</th><th>QC</th><th>Defects</th><th>Rework</th><th>Planned Done</th></tr></thead>
                <tbody>
                  {batches.map((b) => {
                    const late = !b.actual_completion && new Date(b.planned_completion) < new Date();
                    return (
                      <tr key={b.batch_id} className={late || b.qc_status === 'Failed' ? 'row-warn' : ''}>
                        <td><b>{b.batch_id}</b>{late && <span className="pill p-red">late</span>}</td>
                        <td>{b.product}</td><td>{b.factory}</td><td>{fmt(b.planned_qty)}</td><td>{fmt(b.completed_qty)}</td>
                        <td>{b.stage}</td><td><Pill v={b.qc_status} /></td><td>{b.defective_qty}</td><td>{b.rework_qty}</td>
                        <td>{b.planned_completion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'inventory' && (
          <>
            <div className="kpi-grid">
              <Kpi label="Total Stock" value={fmt(m.totalStock)} />
              <Kpi label="Low Stock SKUs" value={m.lowStock} tone={m.lowStock ? 'warn' : ''} />
              <Kpi label="Out of Stock" value={m.outStock} tone={m.outStock ? 'bad' : ''} />
              <Kpi label="Damaged" value={fmt(m.damagedStock)} />
              <Kpi label="Returns" value={returns.length} sub={`${m.openReturns} pending`} />
              <Kpi label="Refunds" value={refunds.length} sub={`${m.pendingRefunds} pending`} />
            </div>
            <div className="ops-charts cols-2">
              <div className="chart-card"><h4>Stock by warehouse</h4><HBars data={m.stockByWh} /></div>
              <div className="chart-card"><h4>Return reasons</h4><Donut data={m.returnReasons} /></div>
            </div>
            <Actions tables={TABLE_FOR_TAB.inventory} downloads={[[ 'inventory', inventory ], [ 'returns', returns ], [ 'refunds', refunds ]]} />
            <div className="ops-filters">
              <input placeholder="Search product / SKU / warehouse…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="ops-table">
              <table>
                <thead><tr><th>Product</th><th>SKU</th><th>Size</th><th>Warehouse</th><th>Available</th><th>Reserved</th><th>Damaged</th><th>Status</th></tr></thead>
                <tbody>
                  {inventory
                    .filter((i) => !search || `${i.product} ${i.sku} ${i.warehouse}`.toLowerCase().includes(search.toLowerCase()))
                    .map((i, idx) => (
                      <tr key={idx} className={i.available === 0 ? 'row-bad' : i.available < i.threshold ? 'row-warn' : ''}>
                        <td>{i.product}</td><td>{i.sku}</td><td>{i.size}</td><td>{i.warehouse}</td>
                        <td>{i.available}</td><td>{i.reserved}</td><td>{i.damaged}</td>
                        <td><Pill v={i.available === 0 ? 'Failed' : i.available < i.threshold ? 'Pending' : 'Passed'} />
                          {i.available === 0 ? 'Out of stock' : i.available < i.threshold ? 'Low stock' : 'OK'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h4 className="ops-sub">Returns <span>({returns.length})</span> · Refunds <span>({refunds.length})</span></h4>
            <div className="ops-table">
              <table>
                <thead><tr><th>Return</th><th>Order</th><th>Product</th><th>Qty</th><th>Reason</th><th>Approval</th><th>Decision</th><th>Refund</th><th>Refund Status</th></tr></thead>
                <tbody>
                  {returns.map((r) => {
                    const rf = refunds.find((x) => x.order_id === r.order_id);
                    return (
                      <tr key={r.return_id}>
                        <td><b>{r.return_id}</b></td><td>{r.order_id}</td><td>{r.product}</td><td>{r.quantity}</td>
                        <td>{r.reason}</td><td><Pill v={r.approval_status} /></td><td>{r.decision}</td>
                        <td>{rf ? inr(rf.amount) : '—'}</td><td>{rf ? <Pill v={rf.status} /> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
