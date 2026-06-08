import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder, getProducts, getSettings } from '@/lib/api';
import type { Order } from '@/lib/api';
import StatusUpdater from './StatusUpdater';
import PaymentRecorder from './PaymentRecorder';

interface Props { params: { id: string } }

const PIPELINE: Array<{ value: Order['status']; label: string; color: string }> = [
  { value: 'new',       label: 'Received',  color: 'bg-blue-500'   },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-amber-500'  },
  { value: 'shipped',   label: 'Shipped',   color: 'bg-purple-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500'  },
];

const STATUS_BADGE: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700 ring-blue-200',
  confirmed: 'bg-amber-100 text-amber-700 ring-amber-200',
  shipped:   'bg-purple-100 text-purple-700 ring-purple-200',
  delivered: 'bg-green-100 text-green-700 ring-green-200',
  cancelled: 'bg-red-50 text-red-600 ring-red-200',
};

const SOURCE_META: Record<string, { label: string; color: string; icon: string }> = {
  website:   { label: 'Website',   color: 'bg-stone-100 text-stone-600',   icon: '🌐' },
  tiktok:    { label: 'TikTok',    color: 'bg-pink-50 text-pink-700',      icon: '🎵' },
  instagram: { label: 'Instagram', color: 'bg-purple-50 text-purple-700',  icon: '📸' },
  whatsapp:  { label: 'WhatsApp',  color: 'bg-green-50 text-green-700',    icon: '💬' },
  phone:     { label: 'Phone',     color: 'bg-blue-50 text-blue-700',      icon: '📞' },
  walkin:    { label: 'Walk-in',   color: 'bg-amber-50 text-amber-700',    icon: '🚶' },
  other:     { label: 'Other',     color: 'bg-stone-100 text-stone-600',   icon: '📋' },
};

function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.other;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
      <span className="text-[11px]">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

const STATUS_DOT: Record<string, string> = {
  new: 'bg-blue-500', confirmed: 'bg-amber-500', shipped: 'bg-purple-500',
  delivered: 'bg-green-500', cancelled: 'bg-red-400',
};

export async function generateMetadata({ params }: Props) {
  try {
    const order = await getOrder(params.id);
    return { title: `Order #${order.id} — Soul Thread Admin` };
  } catch {
    return { title: 'Order Not Found' };
  }
}

export default async function OrderDetailPage({ params }: Props) {
  let order: Order | null = null;
  try { order = await getOrder(params.id); } catch { notFound(); }
  if (!order) notFound();

  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings().catch(() => ({} as Record<string, string>)),
  ]);
  const currency = settings.currency_symbol || 'NPR';
  const productMap = new Map(products.map((p) => [p.id, p]));

  const TZ = 'Asia/Kathmandu';
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleString('en-US', { timeZone: TZ, ...opts });

  const createdAt  = new Date(order.createdAt);
  const updatedAt  = new Date(order.updatedAt);
  const waText     = encodeURIComponent(`Hi ${order.customerName}, regarding your Soul Thread order #${order.id} — `);
  const waLink     = `https://wa.me/9779845422250?text=${waText}`;
  const pipelineIdx = PIPELINE.findIndex(s => s.value === order!.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <main className="p-6 md:p-8 max-w-6xl space-y-6">

        {/* ── Header ── */}
        <div>
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            All orders
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Order #{order.id}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 capitalize ${STATUS_BADGE[order.status] ?? STATUS_BADGE.new}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status] ?? STATUS_DOT.new}`} />
                {order.status === 'new' ? 'New order' : order.status}
              </span>
              {order.source && order.source !== 'website' && (
                <SourceBadge source={order.source} />
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-stone-900">{currency} {order.totalNpr.toLocaleString()}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {fmt(createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Status pipeline (only for non-cancelled) ── */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
            <div className="flex items-center gap-0">
              {PIPELINE.map((step, i) => {
                const done   = i < pipelineIdx;
                const active = i === pipelineIdx;
                const last   = i === PIPELINE.length - 1;
                return (
                  <div key={step.value} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold transition-all ${
                        done   ? 'bg-stone-800' :
                        active ? `${step.color} ring-4 ring-offset-2 ring-${step.color.replace('bg-', '')}/30` :
                                 'bg-stone-100 text-stone-400'
                      }`}>
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={active ? 'text-white' : 'text-stone-400'}>{i + 1}</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-stone-900' : done ? 'text-stone-500' : 'text-stone-300'}`}>
                        {step.label}
                      </span>
                    </div>
                    {!last && (
                      <div className={`h-0.5 flex-1 mx-2 mb-5 rounded-full transition-colors ${done ? 'bg-stone-800' : 'bg-stone-100'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Line items */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-900">
                  Items
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium">{order.items.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-stone-100">
                {order.items.map((item, i) => {
                  const product = productMap.get(item.productId);
                  return (
                    <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-stone-50/60 transition-colors">
                      <div className="flex items-center gap-4">
                        {/* Product image */}
                        <div className="w-14 h-14 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                          {product?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/image?src=${encodeURIComponent(product.image)}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-300">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {product?.name ?? item.productId}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">{currency} {item.priceNpr.toLocaleString()} each</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-medium text-xs">× {item.quantity}</span>
                        <span className="font-semibold text-stone-900 w-28 text-right">
                          {currency} {(item.priceNpr * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-t border-stone-100">
                <span className="text-sm font-medium text-stone-500">Order total</span>
                <span className="text-lg font-bold text-stone-900">{currency} {order.totalNpr.toLocaleString()}</span>
              </div>
            </div>

            {/* Customer card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-stone-800 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-stone-900 text-lg leading-tight">{order.customerName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <a href={`mailto:${order.email}`} className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {order.email}
                    </a>
                    <span className="text-stone-200">·</span>
                    <a href={`tel:${order.phone}`} className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12 19.79 19.79 0 01.17 3.38 2 2 0 012.15 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.18 6.18l1.48-.48a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                      {order.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm pt-4 border-t border-stone-100">
                {order.address && (
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-1">Delivery address</p>
                    <p className="text-stone-700">{order.address}</p>
                  </div>
                )}
                {order.notes && (
                  <div className={order.address ? '' : 'sm:col-span-2'}>
                    <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-1">Notes</p>
                    <p className="text-stone-700 leading-relaxed">{order.notes}</p>
                  </div>
                )}
                {!order.address && !order.notes && (
                  <p className="text-sm text-stone-400 sm:col-span-2">No delivery address or notes.</p>
                )}
              </div>

              {/* Quick contact actions */}
              <div className="flex gap-2 mt-5 pt-4 border-t border-stone-100">
                <a
                  href={`mailto:${order.email}?subject=Your Soul Thread order %23${order.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.85L.057 23.1a.75.75 0 00.916.938l5.453-1.429A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.698-.498-5.254-1.37l-.376-.215-3.896 1.021 1.04-3.796-.233-.386A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`tel:${order.phone}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 12 19.79 19.79 0 01.17 3.38 2 2 0 012.15 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.18 6.18l1.48-.48a2 2 0 012.11.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  Call
                </a>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">

            {/* Change status */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h2 className="font-semibold text-stone-900 mb-3 text-sm uppercase tracking-wide">Update Status</h2>
              <StatusUpdater orderId={params.id} currentStatus={order.status} />
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h2 className="font-semibold text-stone-900 mb-4 text-sm uppercase tracking-wide">Payment</h2>

              {/* Summary rows */}
              <div className="space-y-1.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Order total</span>
                  <span className="font-medium text-stone-800">{currency} {order.totalNpr.toLocaleString()}</span>
                </div>
                {order.advanceNpr > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Advance expected</span>
                    <span className="font-medium text-amber-700">{currency} {order.advanceNpr.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Received so far</span>
                  <span className={`font-semibold ${order.paidNpr > 0 ? 'text-green-700' : 'text-stone-400'}`}>
                    {order.paidNpr > 0 ? `${currency} ${order.paidNpr.toLocaleString()}` : '—'}
                  </span>
                </div>
                {order.paidNpr < order.totalNpr && (
                  <div className="flex justify-between pt-1.5 border-t border-stone-100">
                    <span className="font-medium text-stone-700">Remaining</span>
                    <span className="font-bold text-stone-900">{currency} {(order.totalNpr - order.paidNpr).toLocaleString()}</span>
                  </div>
                )}
                {order.paidNpr >= order.totalNpr && (
                  <div className="flex justify-between pt-1.5 border-t border-stone-100">
                    <span className="font-medium text-green-700">Fully paid</span>
                    <span className="font-bold text-green-700">✓</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-2">Record payment</p>
              <PaymentRecorder
                orderId={params.id}
                totalNpr={order.totalNpr}
                advanceNpr={order.advanceNpr}
                paidNpr={order.paidNpr}
                currency={currency}
              />
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <h2 className="font-semibold text-stone-900 text-sm uppercase tracking-wide mb-4">Timeline</h2>
              <ol className="relative border-l border-stone-200 space-y-4 ml-1.5">
                {/* Order placed — always first */}
                <li className="pl-5">
                  <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-stone-300 border-2 border-white" />
                  <p className="text-sm font-medium text-stone-700">Order placed</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {fmt(createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>

                {/* Status log entries */}
                {(order.statusLog ?? []).map((entry, i) => {
                  const dot = STATUS_DOT[entry.status] ?? 'bg-stone-400';
                  const label = entry.status === 'new' ? 'Received'
                    : entry.status.charAt(0).toUpperCase() + entry.status.slice(1);
                  const at = new Date(entry.at);
                  const isLatest = i === (order.statusLog.length - 1);
                  return (
                    <li key={i} className="pl-5">
                      <span className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full border-2 border-white ${isLatest ? dot : 'bg-stone-300'}`} />
                      <p className={`text-sm font-medium ${isLatest ? 'text-stone-900' : 'text-stone-500'}`}>
                        Marked as {label}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {fmt(at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

          </div>
        </div>
    </main>
  );
}
