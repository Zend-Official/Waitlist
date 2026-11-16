// Zend stats dashboard (no libraries). Every value from the API is put on the
// page with textContent (never as HTML), so user-written text stays text.

// ---------- Small helpers ----------
const $ = (s, el = document) => el.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}
const svgNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}) {
  const el = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}
const DASH = '—';

// ---------- Formatting ----------
const group3 = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** A money object {currency, minor, decimals} shown with `dp` decimals (BigInt: exact). */
function money(m, dp = 2) {
  if (!m || m.minor == null) return DASH;
  let n = BigInt(m.minor);
  const neg = n < 0n;
  if (neg) n = -n;
  const d = Number(m.decimals ?? 2);
  if (d > dp) {
    const f = 10n ** BigInt(d - dp);
    n = (n + f / 2n) / f;
  } else if (d < dp) n *= 10n ** BigInt(dp - d);
  const str = n.toString().padStart(dp + 1, '0');
  const int = str.slice(0, str.length - dp);
  const frac = dp ? '.' + str.slice(-dp) : '';
  const body = group3(int) + frac;
  const sign = neg ? '-' : '';
  return m.currency === 'NGN' ? `${sign}₦${body}` : `${sign}${body} ${m.currency ?? ''}`.trim();
}
const ngnKobo = (minor) => (minor == null ? DASH : money({ currency: 'NGN', minor, decimals: 2 }));
const num = (v) => (v == null ? DASH : group3(String(v)));
const toNumber = (m) => (m && m.value != null ? Number(m.value) : 0);
const dtf = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const when = (iso) => (iso ? dtf.format(new Date(iso)) : DASH);
const dfUtc = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const day = (iso) => (iso ? dfUtc.format(new Date(iso)) : DASH); // range ends are UTC midnights
const words = (s) => (s ? String(s).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : DASH);
const short = (id, n = 8) => (id ? (String(id).length > n * 2 ? `${String(id).slice(0, n)}…${String(id).slice(-4)}` : String(id)) : DASH);
const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : null);

const TONE = {
  good: ['active', 'released', 'completed', 'funded', 'ready', 'confirmed', 'closed_resolved'],
  warn: ['awaiting_payment', 'funding', 'releasing', 'refunding', 'pending', 'processing', 'retrying', 'onboarding', 'open'],
  bad: ['funding_failed', 'release_failed', 'refund_failed', 'failed', 'suspended'],
};
function chip(status) {
  const tone = Object.keys(TONE).find((k) => TONE[k].includes(status));
  return h('span', { class: `chip${tone ? ` chip--${tone}` : ''}`, text: words(status) });
}

const STATUSES = {
  users: ['onboarding', 'active', 'suspended', 'closed'],
  payments: ['awaiting_payment', 'funding', 'funding_failed', 'funded', 'releasing', 'release_failed', 'released', 'refunding', 'refund_failed', 'refunded', 'cancelled'],
  links: ['open', 'closed'],
  issues: ['open', 'closed'],
  operations: ['pending', 'processing', 'retrying', 'completed', 'failed'],
};

// ---------- Date range (inclusive dates on screen; the API's `to` is exclusive) ----------
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function lastDays(n) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (n - 1));
  return { from: iso(from), to: iso(to) };
}
const range = lastDays(30);
function rangeParams() {
  const end = new Date(`${range.to}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { from: range.from, to: end.toISOString().slice(0, 10) };
}

// ---------- API ----------
class ApiError extends Error {}
async function api(path, params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) q.set(k, v);
  const r = await fetch(`/api/${path}${q.size ? `?${q}` : ''}`, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
  if (r.status === 401) {
    location.replace('/login');
    throw new ApiError('Signed out');
  }
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.success === false || j.Success === false) {
    const msg = j?.Message || j?.message || j?.error || `Request failed (${r.status})`;
    throw new ApiError(r.status === 429 ? 'Too many requests. Wait a minute and try again.' : msg);
  }
  if (j.meta?.network) {
    const p = $('#network');
    p.textContent = j.meta.network;
    p.hidden = false;
  }
  return j;
}
const alertBox = (e) => h('p', { class: 'alert', role: 'alert', text: e instanceof Error ? e.message : String(e) });

// ---------- Router (#/view?filters) ----------
const view = $('#view');
function route() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [name, qs] = raw.split('?');
  return { name: name || 'overview', params: new URLSearchParams(qs ?? '') };
}
function go(name, params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) q.set(k, v);
  location.hash = `#/${name}${q.size ? `?${q}` : ''}`;
}
let renderSeq = 0;
async function render() {
  const { name, params } = route();
  document.querySelectorAll('.tabs a').forEach((a) => (a.dataset.tab === name ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const seq = ++renderSeq;
  view.replaceChildren(h('p', { class: 'loading', text: 'Loading…' }));
  try {
    const node = name === 'overview' ? await overview() : LISTS[name] ? await listView(name, params) : h('p', { text: 'Not found.' });
    if (seq === renderSeq) view.replaceChildren(node);
  } catch (e) {
    if (seq === renderSeq && !(e instanceof ApiError && e.message === 'Signed out')) view.replaceChildren(alertBox(e));
  }
}

// ---------- Overview ----------
function tile(label, value, sub) {
  return h('div', { class: 'tile' }, h('span', { class: 'tile__label', text: label }), h('span', { class: 'tile__value', text: value }), sub ? h('span', { class: 'tile__sub', text: sub }) : null);
}
function volTile(label, metric) {
  if (!metric) return tile(label, DASH);
  const parts = [`${num(metric.count)} payment${metric.count === 1 ? '' : 's'}`, money(metric.amount?.usdc)];
  if (metric.missingUsdcTerms) parts.push(`${metric.missingUsdcTerms} without USDC terms`);
  return tile(label, money(metric.amount?.ngn), parts.join(' · '));
}
function breakdown(title, block) {
  const entries = Object.entries(block?.byStatus ?? {}).sort((a, b) => b[1] - a[1]);
  return h(
    'section',
    { class: 'card' },
    h('div', { class: 'card__head' }, h('h2', { text: title }), h('span', { class: 'muted', text: `${num(block?.total ?? 0)} total` })),
    entries.length
      ? h('dl', { class: 'kv' }, entries.map(([k, v]) => h('div', {}, h('dt', {}, chip(k)), h('dd', { text: num(v) }))))
      : h('p', { class: 'muted', text: 'None in this period.' }),
  );
}

const TREND_METRICS = {
  payments: { label: 'Payments', get: (r) => r.payments ?? 0, fmt: num },
  paymentVolume: { label: 'Payment volume (₦)', get: (r) => toNumber(r.paymentVolume?.amount?.ngn), fmt: (_, r) => (r.paymentVolume ? money(r.paymentVolume.amount?.ngn) : '₦0.00') },
  releasedVolume: { label: 'Released (₦)', get: (r) => toNumber(r.releasedVolume?.amount?.ngn), fmt: (_, r) => (r.releasedVolume ? money(r.releasedVolume.amount?.ngn) : '₦0.00') },
  refundedVolume: { label: 'Refunded (₦)', get: (r) => toNumber(r.refundedVolume?.amount?.ngn), fmt: (_, r) => (r.refundedVolume ? money(r.refundedVolume.amount?.ngn) : '₦0.00') },
  registrations: { label: 'New users', get: (r) => r.registrations ?? 0, fmt: num },
  paymentLinks: { label: 'Payment links created', get: (r) => r.paymentLinks ?? 0, fmt: num },
};
const trendPrefs = { metric: 'paymentVolume', groupBy: 'day' };

async function overview() {
  const p = rangeParams();
  const [ov, tr] = await Promise.all([api('overview', p), api('trends', { ...p, groupBy: trendPrefs.groupBy, timezone: 'Africa/Lagos' })]);
  const d = ov.data;
  const pay = d.payments ?? {};
  const wb = d.currentWalletBalances;
  const meta = ov.meta;
  const fu = d.followups ?? {};

  const head = h(
    'p',
    { class: 'note' },
    `Records created ${day(meta.from)} – ${day(new Date(new Date(meta.to).getTime() - 1).toISOString())}, with their status today. Updated ${when(meta.generatedAt)}.`,
  );

  const money1 = h(
    'div',
    { class: 'tiles' },
    volTile('Payment volume', pay.paymentVolume),
    volTile('Deposited (incl. buyer fee)', pay.depositedVolume),
    volTile('Released', pay.releasedVolume),
    volTile('Paid to sellers', pay.recipientVolume),
    volTile('Refunded', pay.refundedVolume),
    volTile('Fees collected', pay.treasuryFees),
  );
  const now = h(
    'div',
    { class: 'tiles' },
    tile('Held in escrow now', money(d.currentEscrow?.amount?.ngn), `${num(d.currentEscrow?.count ?? 0)} payments · ${money(d.currentEscrow?.amount?.usdc)}`),
    tile(
      'Saved wallet balances',
      money(wb?.usdc),
      [
        wb?.ngn ? `≈ ${money(wb.ngn)}` : 'No naira value (rate unavailable)',
        `${num(wb?.wallets ?? 0)} wallets`,
        wb?.unknownWallets ? `${wb.unknownWallets} not synced` : null,
        wb?.newestSnapshotAt ? `synced ${when(wb.newestSnapshotAt)}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    ),
    tile('Follow-ups', num((fu.pending ?? 0) + (fu.review ?? 0)), `${num(fu.pending ?? 0)} pending · ${num(fu.review ?? 0)} in review · ${num(fu.due ?? 0)} due`),
  );
  const activity = h(
    'div',
    { class: 'tiles' },
    tile('New users', num(d.users?.total ?? 0)),
    tile('Payment links', num(d.paymentLinks?.total ?? 0)),
    tile('Payments', num(pay.total ?? 0)),
    tile('Disputes', num(pay.disputes ?? 0)),
    tile('Under review', num(pay.underReview ?? 0)),
    tile('Wallet operations', num(d.operations?.total ?? 0)),
  );

  return h(
    'div',
    { class: 'stack' },
    head,
    h('h2', { class: 'section-title', text: 'Money in this period' }),
    money1,
    h('h2', { class: 'section-title', text: 'Right now' }),
    now,
    h('h2', { class: 'section-title', text: 'Activity in this period' }),
    activity,
    trendCard(tr),
    h('div', { class: 'breakdowns' }, breakdown('Payments by status', d.payments), breakdown('Payment links', d.paymentLinks), breakdown('Users', d.users), breakdown('Wallet operations', d.operations)),
  );
}

// Fill the empty days/months the API leaves out, so the time axis is honest.
function fillBuckets(rows, groupBy, fromIso, toIso) {
  const by = new Map(rows.map((r) => [r.period, r]));
  const out = [];
  if (groupBy === 'day' && rows.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.period))) {
    for (let t = new Date(`${fromIso}T00:00:00Z`); t < new Date(`${toIso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + 1)) {
      const k = t.toISOString().slice(0, 10);
      out.push(by.get(k) ?? { period: k });
    }
    return out;
  }
  if (groupBy === 'month' && rows.every((r) => /^\d{4}-\d{2}$/.test(r.period))) {
    const t = new Date(`${fromIso.slice(0, 7)}-01T00:00:00Z`);
    for (; t < new Date(`${toIso}T00:00:00Z`); t.setUTCMonth(t.getUTCMonth() + 1)) {
      const k = t.toISOString().slice(0, 7);
      out.push(by.get(k) ?? { period: k });
    }
    return out;
  }
  return rows;
}
function periodLabel(p, groupBy) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) {
    const d = new Date(`${p}T12:00:00Z`);
    const f = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    return groupBy === 'week' ? `Week of ${f}` : f;
  }
  if (/^\d{4}-\d{2}$/.test(p)) return new Date(`${p}-15T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
  return p;
}

function trendCard(tr) {
  const p = rangeParams();
  const card = h('section', { class: 'card' });
  const metricSel = h(
    'select',
    { class: 'select', 'aria-label': 'Measure' },
    Object.entries(TREND_METRICS).map(([k, m]) => h('option', { value: k, text: m.label, selected: k === trendPrefs.metric })),
  );
  const groupSel = h(
    'select',
    { class: 'select', 'aria-label': 'Group by' },
    ['day', 'week', 'month'].map((g) => h('option', { value: g, text: `By ${g}`, selected: g === trendPrefs.groupBy })),
  );
  const body = h('div');
  card.append(h('div', { class: 'card__head' }, h('h2', { text: 'Over time' }), metricSel, groupSel), body);

  let rows = fillBuckets(tr.data ?? [], trendPrefs.groupBy, p.from, p.to);
  const draw = () => body.replaceChildren(barChart(rows, TREND_METRICS[trendPrefs.metric], trendPrefs.groupBy));
  metricSel.addEventListener('change', () => {
    trendPrefs.metric = metricSel.value;
    draw();
  });
  groupSel.addEventListener('change', async () => {
    trendPrefs.groupBy = groupSel.value;
    body.replaceChildren(h('p', { class: 'loading', text: 'Loading…' }));
    try {
      const t = await api('trends', { ...rangeParams(), groupBy: trendPrefs.groupBy, timezone: 'Africa/Lagos' });
      rows = fillBuckets(t.data ?? [], trendPrefs.groupBy, p.from, p.to);
      draw();
    } catch (e) {
      body.replaceChildren(alertBox(e));
    }
  });
  draw();
  return card;
}

function niceMax(v) {
  if (v <= 0) return 1;
  const e = 10 ** Math.floor(Math.log10(v));
  const f = v / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

function barChart(rows, metric, groupBy) {
  const wrap = h('div', { class: 'chart' });
  if (!rows.length || rows.every((r) => !metric.get(r))) {
    wrap.append(h('p', { class: 'empty', text: 'Nothing in this period yet.' }));
    return wrap;
  }
  const tip = h('div', { class: 'tip', hidden: true });
  const svg = s('svg', { role: 'img', 'aria-label': `${metric.label} by ${groupBy}` });
  wrap.append(svg, tip);

  const paint = () => {
    const W = Math.max(wrap.clientWidth, 280);
    const H = 260;
    const L = 44, R = 8, T = 10, B = 28;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const max = niceMax(Math.max(...rows.map(metric.get)));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      svg.append(s('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      const t = s('text', { class: 'axis', x: L - 6, y: y(v) + 4, 'text-anchor': 'end' });
      t.textContent = compact.format(v);
      svg.append(t);
    }
    const band = (W - L - R) / rows.length;
    const bw = Math.max(2, Math.min(36, band - 2));
    const every = Math.ceil(70 / band);
    rows.forEach((r, i) => {
      const v = metric.get(r);
      const x = L + i * band + (band - bw) / 2;
      const top = y(v);
      const base = y(0);
      const hit = s('rect', { class: 'hit', x: L + i * band, y: T, width: band, height: H - T - B });
      const bar = s('path', { class: 'bar' });
      if (v > 0) {
        const rr = Math.min(4, bw / 2, base - top);
        bar.setAttribute('d', `M${x},${base}V${top + rr}Q${x},${top} ${x + rr},${top}H${x + bw - rr}Q${x + bw},${top} ${x + bw},${top + rr}V${base}Z`);
      }
      const show = () => {
        tip.hidden = false;
        tip.textContent = `${periodLabel(r.period, groupBy)}: ${metric.fmt(v, r)}`;
        tip.style.left = `${((x + bw / 2) / W) * 100}%`;
        tip.style.top = `${Math.min(top, base - 2)}px`;
      };
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('pointerleave', () => (tip.hidden = true));
      svg.append(hit, bar);
      if (i % every === 0) {
        const t = s('text', { class: 'axis', x: L + i * band + band / 2, y: H - 8, 'text-anchor': 'middle' });
        t.textContent = periodLabel(r.period, groupBy).replace('Week of ', '');
        svg.append(t);
      }
    });
  };
  new ResizeObserver(paint).observe(wrap);

  const table = h(
    'details',
    {},
    h('summary', { class: 'note table-toggle', text: 'Show as a table' }),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        {},
        h('thead', {}, h('tr', {}, h('th', { text: groupBy === 'day' ? 'Day' : groupBy === 'week' ? 'Week' : 'Month' }), h('th', { class: 'num', text: metric.label }))),
        h('tbody', {}, rows.map((r) => h('tr', {}, h('td', { text: periodLabel(r.period, groupBy) }), h('td', { class: 'num', text: metric.fmt(metric.get(r), r) })))),
      ),
    ),
  );
  return h('div', {}, wrap, table);
}

// ---------- Lists ----------
function explorerLink(url, label = 'View') {
  return h('a', { class: 'btn btn--small', href: url, target: '_blank', rel: 'noopener noreferrer', onclick: (e) => e.stopPropagation() }, label, h('span', { 'aria-hidden': 'true', text: ' ↗' }));
}
// The transaction that settled the payment (release or refund), else its funding.
function mainTx(p) {
  const t = p.transactions ?? {};
  return [t.release, t.refund, t.funding].find((x) => x?.hash && safeUrl(x.explorerUrl)) ?? null;
}
const userBtn = (id, name) => (id ? h('button', { class: 'linkish', type: 'button', text: name || short(id), onclick: (e) => (e.stopPropagation(), openUser(id)) }) : DASH);
const payStatus = (p) => h('span', {}, chip(p.status), p.underReview ? h('span', { class: 'flag', text: 'Review' }) : null, p.hasDispute ? h('span', { class: 'flag', text: 'Dispute' }) : null);

const LISTS = {
  users: {
    title: 'Users',
    search: 'Name, WhatsApp name or ID',
    cols: [
      ['Name', (u) => h('span', {}, h('span', { text: u.name || DASH }), u.whatsappName ? h('div', { class: 'muted', text: u.whatsappName }) : null)],
      ['Phone', (u) => u.phoneMasked ?? DASH],
      ['Status', (u) => h('span', {}, chip(u.status), u.isPinLocked ? h('span', { class: 'flag', text: 'PIN locked' }) : null)],
      ['USDC', (u) => money(u.balances?.[0]?.usdc), 'num'],
      ['≈ Naira', (u) => money(u.balances?.[0]?.ngn), 'num'],
      ['Joined', (u) => when(u.createdAt)],
    ],
    open: (u) => openUser(u.id),
  },
  payments: {
    title: 'Payments',
    search: 'Reference, item, names, ID or transaction hash',
    extra: ['amount', 'review'],
    cols: [
      ['Created', (p) => when(p.createdAt)],
      ['Reference', (p) => h('span', { class: 'mono', text: p.reference ?? short(p.id) })],
      ['Item', (p) => p.item ?? DASH],
      ['Buyer', (p) => userBtn(p.payerId, p.payerName)],
      ['Seller', (p) => userBtn(p.payeeId, p.payeeName)],
      ['Amount', (p) => money(p.amount?.ngn), 'num'],
      ['USDC', (p) => money(p.amount?.usdc), 'num'],
      ['Status', payStatus],
      ['Explorer', (p) => (mainTx(p) ? explorerLink(mainTx(p).explorerUrl) : DASH)],
    ],
    open: (p) => openPayment(p.id),
  },
  links: {
    title: 'Payment links',
    search: 'Code, item, owner name or ID',
    extra: ['role'],
    cols: [
      ['Created', (l) => when(l.createdAt)],
      ['Code', (l) => h('span', { class: 'mono', text: l.code ?? DASH })],
      ['Owner', (l) => userBtn(l.ownerId, l.ownerName)],
      ['Role', (l) => (l.role === 'getting_paid' ? 'Getting paid' : l.role === 'paying' ? 'Paying' : words(l.role))],
      ['Item', (l) => l.item ?? DASH],
      ['Amount', (l) => ngnKobo(l.amountMinor), 'num'],
      ['Status', (l) => chip(l.status)],
    ],
    open: (l) => go('payments', { linkId: l.id }),
    openLabel: 'Click a link to see its payments.',
  },
  operations: {
    title: 'Wallet operations',
    search: 'Type, user ID, error code or ID',
    cols: [
      ['Created', (o) => when(o.createdAt)],
      ['Type', (o) => words(o.type)],
      ['Status', (o) => chip(o.status)],
      ['Attempts', (o) => num(o.attempts), 'num'],
      ['Error', (o) => (o.lastErrorCode ? h('span', { class: 'mono', text: o.lastErrorCode }) : DASH)],
      ['User', (o) => userBtn(o.userId)],
      ['Finished', (o) => when(o.completedAt)],
    ],
  },
  issues: {
    title: 'Issue reports',
    search: 'Explanation, reference, item or ID',
    cols: [
      ['Created', (i) => when(i.createdAt)],
      ['Reporter', (i) => userBtn(i.reporterId ?? i.userId, i.reporterName)],
      ['Reference', (i) => (i.reference ? h('span', { class: 'mono', text: i.reference }) : DASH)],
      ['Item', (i) => i.item ?? DASH],
      ['Explanation', (i) => h('span', { class: 'wrap', text: i.explanation ?? DASH })],
      ['Status', (i) => chip(i.status)],
    ],
    open: (i) => (i.reference || i.orderId ? openPayment(i.reference ?? i.orderId) : i.reporterId ? openUser(i.reporterId) : null),
  },
};
// Filters carried in from other views (shown as removable notes).
const CARRIED = { userId: 'User', payerId: 'Buyer', payeeId: 'Seller', linkId: 'Payment link', role: 'Role' };

function multiSelect(label, options, chosen, onChange) {
  const sum = h('summary');
  const update = () => (sum.textContent = chosen.size ? `${label}: ${[...chosen].map(words).join(', ')}` : `${label}: all`);
  const det = h(
    'details',
    { class: 'multi' },
    sum,
    h(
      'div',
      { class: 'multi__menu' },
      options.map((o) =>
        h(
          'label',
          {},
          h('input', {
            type: 'checkbox',
            checked: chosen.has(o),
            onchange: (e) => {
              e.target.checked ? chosen.add(o) : chosen.delete(o);
              update();
            },
          }),
          words(o),
        ),
      ),
    ),
  );
  det.addEventListener('toggle', () => !det.open && onChange());
  document.addEventListener('click', (e) => det.open && !det.contains(e.target) && (det.open = false));
  update();
  return det;
}

async function listView(name, params) {
  const cfg = LISTS[name];
  const f = Object.fromEntries(params);
  const card = h('section', { class: 'card' });
  const apply = (changes) => {
    const next = { ...f, ...changes };
    for (const k of Object.keys(next)) if (next[k] === '' || next[k] == null) delete next[k];
    go(name, next);
  };

  // Filter row
  const search = h('input', { class: 'input', type: 'search', placeholder: cfg.search, value: f.search ?? '', maxlength: 100 });
  let t;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => apply({ search: search.value.trim() }), 400);
  });
  const chosen = new Set((f.status ?? '').split(',').filter(Boolean));
  const statusSel = multiSelect('Status', STATUSES[name], chosen, () => {
    const v = [...chosen].join(',');
    if (v !== (f.status ?? '')) apply({ status: v });
  });
  const sortSel = h(
    'select',
    { class: 'select', 'aria-label': 'Order', onchange: (e) => apply(JSON.parse(e.target.value)) },
    [
      ['Newest first', { sort: '', direction: '' }],
      ['Oldest first', { sort: '', direction: 'asc' }],
      ['Recently updated', { sort: 'updatedAt', direction: '' }],
    ].map(([label, v]) => h('option', { value: JSON.stringify(v), text: label, selected: (f.sort ?? '') === v.sort && (f.direction ?? '') === v.direction })),
  );
  const filters = h('div', { class: 'filters' }, h('label', { class: 'field field--grow' }, 'Search', search), h('div', { class: 'field' }, 'Status', statusSel));
  if (cfg.extra?.includes('amount')) {
    const naira = (k, lbl) =>
      h(
        'label',
        { class: 'field field--num' },
        lbl,
        h('input', {
          class: 'input',
          type: 'number',
          min: 0,
          step: 'any',
          inputmode: 'decimal',
          placeholder: '₦',
          value: f[k] ? String(Number(f[k]) / 100) : '',
          onchange: (e) => apply({ [k]: e.target.value === '' ? '' : String(Math.round(Number(e.target.value) * 100)) }),
        }),
      );
    filters.append(naira('minAmount', 'Min ₦'), naira('maxAmount', 'Max ₦'));
  }
  if (cfg.extra?.includes('review')) {
    filters.append(
      h(
        'label',
        { class: 'field' },
        'Review',
        h(
          'select',
          { class: 'select', onchange: (e) => apply({ underReview: e.target.value }) },
          [['', 'Any'], ['true', 'Under review'], ['false', 'Not under review']].map(([v, l]) => h('option', { value: v, text: l, selected: (f.underReview ?? '') === v })),
        ),
      ),
    );
  }
  if (cfg.extra?.includes('role')) {
    filters.append(
      h(
        'label',
        { class: 'field' },
        'Role',
        h(
          'select',
          { class: 'select', onchange: (e) => apply({ role: e.target.value }) },
          [['', 'Any'], ['paying', 'Paying'], ['getting_paid', 'Getting paid']].map(([v, l]) => h('option', { value: v, text: l, selected: (f.role ?? '') === v })),
        ),
      ),
    );
  }
  filters.append(h('label', { class: 'field' }, 'Order', sortSel));

  const carried = Object.keys(CARRIED).filter((k) => f[k] && !(k === 'role' && cfg.extra?.includes('role')));
  const carriedRow = carried.length
    ? h(
        'div',
        { class: 'filters' },
        carried.map((k) => h('button', { class: 'btn', type: 'button', onclick: () => apply({ [k]: '' }), title: 'Remove this filter' }, `${CARRIED[k]}: ${k === 'role' ? words(f[k]) : short(f[k])}`, ' ✕')),
      )
    : null;

  const tbody = h('tbody');
  const count = h('span', { class: 'muted' });
  const moreBtn = h('button', { class: 'btn', type: 'button', text: 'Load more' });
  const table = h(
    'div',
    { class: 'table-wrap' },
    h('table', {}, h('thead', {}, h('tr', {}, cfg.cols.map(([label, , cls]) => h('th', { class: cls, text: label })))), tbody),
  );
  card.append(...[h('div', { class: 'card__head' }, h('h2', { text: cfg.title }), cfg.openLabel ? h('span', { class: 'note', text: cfg.openLabel }) : null), filters, carriedRow, table, h('div', { class: 'more' }, count, moreBtn)].filter(Boolean));

  const query = { ...rangeParams(), ...f, limit: 50 };
  let shown = 0;
  let cursor = null;
  const load = async () => {
    moreBtn.disabled = true;
    const j = await api(name, cursor ? { ...query, cursor } : query);
    for (const row of j.data ?? []) {
      const tr = h('tr', { class: cfg.open ? 'clickable' : null }, cfg.cols.map(([, get, cls]) => h('td', { class: cls }, get(row))));
      if (cfg.open) {
        tr.tabIndex = 0;
        tr.addEventListener('click', () => cfg.open(row));
        tr.addEventListener('keydown', (e) => e.key === 'Enter' && cfg.open(row));
      }
      tbody.append(tr);
    }
    shown += j.data?.length ?? 0;
    cursor = j.meta?.hasMore ? j.meta.nextCursor : null;
    count.textContent = `Showing ${num(shown)} of ${num(j.meta?.total ?? shown)}`;
    moreBtn.hidden = !cursor;
    moreBtn.disabled = false;
    if (!shown) tbody.replaceChildren(h('tr', {}, h('td', { colspan: cfg.cols.length, class: 'empty', text: 'Nothing matches these filters in this period.' })));
  };
  moreBtn.addEventListener('click', () => load().catch((e) => card.append(alertBox(e))));
  await load();
  return card;
}

// ---------- Detail panel ----------
const panel = $('#panel');
$('#panel-close').addEventListener('click', () => panel.close());
panel.addEventListener('click', (e) => e.target === panel && panel.close()); // backdrop
async function showPanel(title, build) {
  $('#panel-title').textContent = title;
  const body = $('#panel-body');
  body.replaceChildren(h('p', { class: 'loading', text: 'Loading…' }));
  if (!panel.open) panel.showModal();
  try {
    body.replaceChildren(...(await build()));
  } catch (e) {
    body.replaceChildren(alertBox(e));
  }
}
const facts = (pairs) => h('dl', { class: 'facts' }, pairs.filter(Boolean).flatMap(([k, v]) => [h('dt', { text: k }), h('dd', {}, v ?? DASH)]));
const txLink = (t) => {
  if (!t?.hash) return DASH;
  const u = safeUrl(t.explorerUrl);
  return h('span', { class: 'tx' }, h('span', { class: 'mono', text: short(t.hash, 10) }), u ? explorerLink(u, 'View on explorer') : null);
};

function openUser(id) {
  showPanel('User', async () => {
    const j = await api(`users/${encodeURIComponent(id)}`, { ...rangeParams(), limit: 25 });
    const { user = {}, wallets = [], summary = {}, payments = [] } = j.data ?? {};
    $('#panel-title').textContent = user.name || 'User';
    const pay = summary.payments ?? {};
    const nav = h(
      'div',
      { class: 'filters' },
      [
        ['Payments', 'payments'],
        ['Links', 'links'],
        ['Operations', 'operations'],
        ['Issues', 'issues'],
      ].map(([l, v]) => h('button', { class: 'btn', type: 'button', text: `All ${l.toLowerCase()}`, onclick: () => (panel.close(), go(v, { userId: user.id ?? id })) })),
    );
    const pg = j.data?.paymentPagination ?? {};
    return [
      facts([
        ['Name', user.name],
        ['WhatsApp name', user.whatsappName],
        ['Phone', user.phoneMasked],
        ['Status', chip(user.status)],
        ['PIN locked', user.isPinLocked ? 'Yes' : 'No'],
        ['Joined', when(user.createdAt)],
        ['Finished sign-up', when(user.onboardingCompletedAt)],
        ['User ID', h('span', { class: 'mono', text: user.id ?? id })],
      ]),
      nav,
      h(
        'div',
        { class: 'tiles' },
        tile('Payments', num(pay.total ?? 0), 'In the chosen period'),
        volTile('Volume', pay.paymentVolume),
        volTile('Released', pay.releasedVolume),
        volTile('Refunded', pay.refundedVolume),
      ),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'card__head' }, h('h2', { text: 'Wallets' })),
        wallets.length
          ? wallets.map((w) =>
              facts([
                ['Purpose', words(w.purpose)],
                ['Status', chip(w.status)],
                ['Address', h('span', { class: 'mono wrap', text: w.address ?? DASH })],
                w.balance ? ['Balance', `${money(w.balance.usdc)}${w.balance.ngn ? ` (≈ ${money(w.balance.ngn)})` : ''}`] : ['Balance', 'Not saved'],
                w.balance?.syncedAt ? ['Synced', when(w.balance.syncedAt)] : null,
              ]),
            )
          : h('p', { class: 'muted', text: 'No wallets.' }),
      ),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'card__head' }, h('h2', { text: 'Payments' }), h('span', { class: 'muted', text: pg.total != null ? `${num(payments.length)} of ${num(pg.total)}` : '' })),
        payments.length
          ? h(
              'div',
              { class: 'table-wrap' },
              h(
                'table',
                {},
                h('thead', {}, h('tr', {}, ['Created', 'Item', 'Role', 'Amount', 'Status', 'Explorer'].map((c, i) => h('th', { class: i === 3 ? 'num' : null, text: c })))),
                h(
                  'tbody',
                  {},
                  payments.map((p) => {
                    const tr = h(
                      'tr',
                      { class: 'clickable', tabindex: 0 },
                      h('td', { text: when(p.createdAt) }),
                      h('td', { text: p.item ?? DASH }),
                      h('td', { text: p.payerId === (user.id ?? id) ? 'Buying' : 'Selling' }),
                      h('td', { class: 'num', text: money(p.amount?.ngn) }),
                      h('td', {}, payStatus(p)),
                      h('td', {}, mainTx(p) ? explorerLink(mainTx(p).explorerUrl) : DASH),
                    );
                    tr.addEventListener('click', () => openPayment(p.id));
                    return tr;
                  }),
                ),
              ),
            )
          : h('p', { class: 'muted', text: 'No payments in this period.' }),
        pg.hasMore ? h('button', { class: 'btn btn--spaced', type: 'button', text: 'See all payments', onclick: () => (panel.close(), go('payments', { userId: user.id ?? id })) }) : null,
      ),
    ];
  });
}

function openPayment(id) {
  showPanel('Payment', async () => {
    const j = await api(`payments/${encodeURIComponent(id)}`, { limit: 50 });
    const p = j.data ?? {};
    $('#panel-title').textContent = `${p.item ?? 'Payment'} · ${p.reference ?? short(p.id)}`;
    const parts = p.participants ?? {};
    const tx = p.transactions ?? {};
    const attempts = p.attempts ?? [];
    const main = mainTx(p);
    return [
      main ? h('div', { class: 'filters' }, explorerLink(main.explorerUrl, 'View payment on explorer')) : h('p', { class: 'note', text: 'No blockchain transaction yet, so there is nothing to view on the explorer.' }),
      facts([
        ['Status', payStatus(p)],
        ['Item', p.item],
        ['Amount', money(p.amount?.ngn)],
        ['USDC terms', p.amount?.usdc ? money(p.amount.usdc, 7) : 'Not fixed yet'],
        ['Buyer fee', p.fees?.buyer ? money(p.fees.buyer, 7) : DASH],
        ['Seller fee', p.fees?.seller ? money(p.fees.seller, 7) : DASH],
        ['Buyer', userBtn(p.payerId, parts.payer?.name ?? p.payerName)],
        ['Seller', userBtn(p.payeeId, parts.payee?.name ?? p.payeeName)],
        ['Created', when(p.createdAt)],
        ['Updated', when(p.updatedAt)],
        p.completedAt ? ['Completed', when(p.completedAt)] : null,
        ['Reference', h('span', { class: 'mono', text: p.reference ?? DASH })],
        ['Payment link', p.linkId ? h('button', { class: 'linkish mono', type: 'button', text: short(p.linkId), onclick: () => (panel.close(), go('payments', { linkId: p.linkId })) }) : DASH],
        ['Payment ID', h('span', { class: 'mono wrap', text: p.id ?? DASH })],
        p.contractOrderId ? ['Contract order', h('span', { class: 'mono wrap', text: p.contractOrderId })] : null,
      ]),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'card__head' }, h('h2', { text: 'Blockchain' })),
        facts([
          ['Funding', txLink(tx.funding)],
          ['Release', txLink(tx.release)],
          ['Refund', txLink(tx.refund)],
          ['Latest attempt', txLink(tx.latestAttempt)],
          p.payerAddress ? ['Buyer wallet', h('span', { class: 'mono wrap', text: p.payerAddress })] : null,
          p.payeeAddress ? ['Seller wallet', h('span', { class: 'mono wrap', text: p.payeeAddress })] : null,
        ]),
      ),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'card__head' }, h('h2', { text: 'Transaction attempts' }), h('span', { class: 'muted', text: num(j.meta?.total ?? attempts.length) })),
        attempts.length
          ? h(
              'div',
              { class: 'table-wrap' },
              h(
                'table',
                {},
                h('thead', {}, h('tr', {}, ['When', 'Purpose', 'Status', 'Transaction', 'Error'].map((c) => h('th', { text: c })))),
                h(
                  'tbody',
                  {},
                  attempts.map((a) =>
                    h(
                      'tr',
                      {},
                      h('td', { text: when(a.createdAt) }),
                      h('td', { text: words(a.purpose ?? a.type) }),
                      h('td', {}, a.status ? chip(a.status) : DASH),
                      h('td', {}, txLink({ hash: a.hash ?? a.transactionHash, explorerUrl: a.explorerUrl })),
                      h('td', { class: 'mono', text: a.errorCode ?? a.lastErrorCode ?? DASH }),
                    ),
                  ),
                ),
              ),
            )
          : h('p', { class: 'muted', text: 'None yet.' }),
      ),
    ];
  });
}

// ---------- Top bar ----------
const fromIn = $('#from');
const toIn = $('#to');
const pop = $('#range-pop');
const rangeLabel = $('#range-label');
const shortDay = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
const labelOf = (d) => shortDay.format(new Date(`${d}T12:00:00Z`));
function showRange() {
  fromIn.value = range.from;
  toIn.value = range.to;
  rangeLabel.textContent = `${labelOf(range.from)} – ${labelOf(range.to)}`;
  pop.querySelectorAll('[data-days]').forEach((b) => {
    const r = lastDays(Number(b.dataset.days));
    b.setAttribute('aria-pressed', String(r.from === range.from && r.to === range.to));
  });
}
fromIn.max = toIn.max = iso(new Date());
function setRange(from, to) {
  if (!from || !to || from > to) return showRange();
  range.from = from;
  range.to = to;
  showRange();
  render();
}
fromIn.addEventListener('change', () => setRange(fromIn.value, toIn.value));
toIn.addEventListener('change', () => setRange(fromIn.value, toIn.value));
pop.addEventListener('click', (e) => {
  const b = e.target.closest('[data-days]');
  if (!b) return;
  const r = lastDays(Number(b.dataset.days));
  setRange(r.from, r.to);
  pop.hidePopover();
});
pop.addEventListener('submit', (e) => e.preventDefault());
showRange();
$('#signout').addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  location.replace('/login');
});

addEventListener('hashchange', render);
render();
