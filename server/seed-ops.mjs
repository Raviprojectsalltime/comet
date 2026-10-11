import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'));
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const iso = (d) => d.toISOString();
const date = (d) => d.toISOString().slice(0, 10);

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi'];
const COURIERS = ['Delhivery', 'BlueDart', 'DTDC', 'Ecom Express', 'XpressBees'];
const FACTORIES = ['Agra Unit 1', 'Agra Unit 2', 'Chennai Works', 'Ludhiana Fab'];
const WAREHOUSES = ['Bhiwandi WH', 'Sonipat WH', 'Bengaluru WH'];
const STAGES = ['Material Prep', 'Cutting & Stitching', 'Assembly & Sole', 'Finishing', 'QC Inspection', 'Packed'];
const FULFILL = ['Order Placed', 'Processing', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Delivered', 'Delivered', 'Delivered', 'Cancelled', 'Delivery Failed', 'Returned'];
const PAY = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];
const DEFECTS = ['Sole separation', 'Fabric tearing', 'Stitching defect', 'Colour inconsistency', 'Material defect', 'Incorrect size', 'Finishing issue'];
const RETURN_REASONS = ['Size too small', 'Size too big', 'Fabric tearing', 'Colour not as expected', 'Changed mind', 'Arrived damaged', 'Wrong product received'];

// ---------- ops_orders: 120 orders over last 60 days ----------
const orders = [];
for (let i = 1; i <= 120; i++) {
  const p = rnd(products);
  const d = daysAgo(ri(0, 60));
  const status = rnd(FULFILL);
  const qty = Math.random() < 0.85 ? 1 : 2;
  orders.push({
    order_id: `ORD-${210000 + i}`,
    order_date: iso(d),
    customer_ref: `CUST-${ri(1000, 1400)}`,
    product: `${p.silhouette} ${p.title}`,
    sku: p.id.toUpperCase(),
    category: p.silhouette,
    quantity: qty,
    order_value: p.price * qty,
    payment_status: status === 'Cancelled' ? 'Refunded' : rnd(PAY),
    fulfillment_status: status,
    expected_delivery: date(new Date(d.getTime() + ri(4, 8) * 864e5)),
    destination: rnd(CITIES),
  });
}
const { error: e1 } = await s.from('ops_orders').upsert(orders, { onConflict: 'order_id' });
console.log('orders:', e1?.message || orders.length);

// ---------- ops_shipments: one per shipped-ish order ----------
const shipped = orders.filter((o) => ['Shipped', 'Out for Delivery', 'Delivered', 'Delivery Failed', 'Returned'].includes(o.fulfillment_status));
const shipments = shipped.map((o, i) => {
  const dispatched = new Date(new Date(o.order_date).getTime() + ri(1, 2) * 864e5);
  const delivered = o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Returned'
    ? new Date(dispatched.getTime() + ri(2, 6) * 864e5) : null;
  return {
    shipment_id: `SHP-${ri(7000000, 7999999)}`,
    courier: rnd(COURIERS),
    order_id: o.order_id,
    destination: o.destination,
    dispatch_date: date(dispatched),
    status: o.fulfillment_status,
    expected_delivery: o.expected_delivery,
    actual_delivery: delivered ? date(delivered) : null,
    exception: o.fulfillment_status === 'Delivery Failed' ? 'Customer unreachable' :
      (delivered && delivered > new Date(o.expected_delivery) ? 'Late delivery' : null),
  };
});
const { error: e2 } = await s.from('ops_shipments').delete().neq('id', -1);
await s.from('ops_shipments').insert(shipments);
console.log('shipments:', shipments.length);

// ---------- ops_batches: 12 production batches ----------
const batches = [];
for (let i = 1; i <= 12; i++) {
  const p = rnd(products);
  const start = daysAgo(ri(5, 45));
  const planned = ri(200, 800);
  const stageIdx = ri(0, 5);
  const done = stageIdx === 5 ? planned : Math.floor(planned * (stageIdx / 6 + Math.random() * 0.15));
  const delayed = stageIdx < 5 && Math.random() < 0.25;
  const defective = Math.floor(done * (Math.random() * 0.06));
  batches.push({
    batch_id: `BTH-${2600 + i}`,
    product: `${p.silhouette} ${p.title}`,
    sku: p.id.toUpperCase(),
    category: p.silhouette,
    factory: rnd(FACTORIES),
    planned_qty: planned,
    completed_qty: Math.min(done, planned),
    stage: STAGES[stageIdx],
    start_date: date(start),
    planned_completion: date(new Date(start.getTime() + 14 * 864e5)),
    actual_completion: stageIdx === 5 ? date(new Date(start.getTime() + ri(12, 18) * 864e5)) : null,
    qc_status: stageIdx >= 4 ? (defective > done * 0.04 ? 'Failed' : 'Passed') : 'Pending',
    defective_qty: defective,
    rework_qty: Math.floor(defective * 0.7),
  });
}
await s.from('ops_batches').delete().neq('id', -1);
await s.from('ops_batches').insert(batches);
console.log('batches:', batches.length);

// ---------- ops_inventory: stock per product per warehouse ----------
const inventory = [];
for (const p of products) {
  for (const wh of WAREHOUSES.slice(0, ri(1, 3))) {
    const avail = ri(0, 120);
    inventory.push({
      product: `${p.silhouette} ${p.title}`,
      sku: p.id.toUpperCase(),
      category: p.silhouette,
      size: `UK ${ri(6, 11)}`,
      color: p.color,
      warehouse: wh,
      available: avail,
      reserved: ri(0, 15),
      damaged: ri(0, 4),
      threshold: 20,
    });
  }
}
await s.from('ops_inventory').delete().neq('id', -1);
await s.from('ops_inventory').insert(inventory);
console.log('inventory:', inventory.length);

// ---------- ops_returns ----------
const delivered = orders.filter((o) => o.fulfillment_status === 'Returned');
const returns = delivered.map((o, i) => ({
  return_id: `RET-${31000 + i}`,
  order_id: o.order_id,
  product: o.product,
  quantity: o.quantity,
  reason: rnd(RETURN_REASONS),
  request_date: iso(new Date(new Date(o.order_date).getTime() + ri(8, 15) * 864e5)),
  approval_status: rnd(['Approved', 'Approved', 'Approved', 'Pending', 'Rejected']),
  condition_result: rnd(['Good - restock', 'Good - restock', 'Damaged - dispose', 'Pending inspection']),
  decision: rnd(['Restocked', 'Restocked', 'Disposed', 'Pending']),
}));
// add a few extra returns on delivered orders too
for (let i = 0; i < 8; i++) {
  const o = rnd(orders.filter((x) => x.fulfillment_status === 'Delivered'));
  returns.push({
    return_id: `RET-${31100 + i}`,
    order_id: o.order_id,
    product: o.product,
    quantity: 1,
    reason: rnd(RETURN_REASONS),
    request_date: iso(daysAgo(ri(1, 30))),
    approval_status: rnd(['Approved', 'Pending', 'Rejected']),
    condition_result: rnd(['Good - restock', 'Damaged - dispose', 'Pending inspection']),
    decision: rnd(['Restocked', 'Disposed', 'Pending']),
  });
}
await s.from('ops_returns').delete().neq('id', -1);
await s.from('ops_returns').insert(returns);
console.log('returns:', returns.length);

// ---------- ops_refunds ----------
const refunds = returns.map((r, i) => {
  const o = orders.find((x) => x.order_id === r.order_id) || {};
  const st = rnd(['Completed', 'Completed', 'Completed', 'Processing', 'Pending']);
  return {
    refund_id: `RFD-${41000 + i}`,
    order_id: r.order_id,
    amount: o.order_value || 4299,
    reason: r.reason,
    request_date: r.request_date,
    status: st,
    processed_date: st === 'Completed' ? iso(new Date(new Date(r.request_date).getTime() + ri(2, 7) * 864e5)) : null,
    payment_ref: st === 'Completed' ? `pay_${ri(100000, 999999)}` : null,
  };
});
await s.from('ops_refunds').delete().neq('id', -1);
await s.from('ops_refunds').insert(refunds);
console.log('refunds:', refunds.length);

console.log('DONE — ops data seeded');
