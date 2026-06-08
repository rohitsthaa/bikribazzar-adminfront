import { notFound } from 'next/navigation';
import { getOrder, getProducts, getSettings } from '@/lib/api';

interface Props { params: { id: string } }

export default async function PrintPackSlip({ params }: Props) {
  let order;
  try { order = await getOrder(params.id); } catch { notFound(); }

  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings().catch(() => ({} as Record<string, string>)),
  ]);
  const currency = settings.currency_symbol || 'NPR';
  const productMap = new Map(products.map((p) => [p.id, p]));

  const TZ = 'Asia/Kathmandu';
  const fmt = (d: string) =>
    new Date(d).toLocaleString('en-US', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Print trigger + back link — hidden on print */}
      <div className="p-6 flex items-center gap-4 print:hidden">
        <a href={`/orders/${params.id}`} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
          ← Back to order
        </a>
        <button
          onClick={() => window.print()}
          // rendered as inline script for SSR
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
        >
          Print
        </button>
      </div>

      {/* Pack slip */}
      <div className="max-w-[680px] mx-auto p-8 font-sans text-sm text-stone-800 print:p-6 print:max-w-none">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-stone-200">
          <div>
            <p className="text-xl font-bold tracking-tight">Soul Thread</p>
            <p className="text-xs text-stone-400 mt-1">Handwoven Macramé · Budanilkantha, Kathmandu</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">Order #{order.id}</p>
            <p className="text-xs text-stone-400 mt-1">{fmt(order.createdAt)}</p>
          </div>
        </div>

        {/* Customer */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Customer</p>
            <p className="font-semibold">{order.customerName}</p>
            {order.phone && <p className="text-stone-600 mt-0.5">{order.phone}</p>}
            {order.email && <p className="text-stone-600 mt-0.5">{order.email}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Delivery</p>
            {order.deliveryArea && <p className="font-semibold">{order.deliveryArea}</p>}
            {order.address && <p className="text-stone-600 mt-0.5">{order.address}</p>}
            {!order.deliveryArea && !order.address && <p className="text-stone-400">Not specified</p>}
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-stone-200 text-xs text-stone-400 uppercase tracking-wide">
              <th className="text-left pb-2 font-semibold">Item</th>
              <th className="text-center pb-2 font-semibold">Qty</th>
              <th className="text-right pb-2 font-semibold">Unit price</th>
              <th className="text-right pb-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const product = productMap.get(item.productId);
              return (
                <tr key={i} className="border-b border-stone-100">
                  <td className="py-3 font-medium">{product?.name ?? item.productId}</td>
                  <td className="py-3 text-center text-stone-600">{item.quantity}</td>
                  <td className="py-3 text-right text-stone-600">{currency} {item.priceNpr.toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold">{currency} {(item.priceNpr * item.quantity).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {(order.discountNpr ?? 0) > 0 && (
              <tr>
                <td colSpan={3} className="pt-4 text-right text-stone-500">
                  Discount {order.discountCode ? `(${order.discountCode})` : ''}
                </td>
                <td className="pt-4 text-right text-stone-500">− {currency} {(order.discountNpr ?? 0).toLocaleString()}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="pt-4 text-right font-semibold text-stone-700">Order total</td>
              <td className="pt-4 text-right font-bold text-stone-900 text-base">{currency} {order.totalNpr.toLocaleString()}</td>
            </tr>
            {order.advanceNpr > 0 && (
              <tr>
                <td colSpan={3} className="pt-1 text-right text-stone-500 text-xs">Advance paid</td>
                <td className="pt-1 text-right text-stone-500 text-xs">{currency} {order.paidNpr.toLocaleString()}</td>
              </tr>
            )}
            {order.paidNpr < order.totalNpr && (
              <tr>
                <td colSpan={3} className="pt-1 text-right font-semibold text-stone-700">Remaining (COD)</td>
                <td className="pt-1 text-right font-bold text-stone-900">{currency} {(order.totalNpr - order.paidNpr).toLocaleString()}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {/* Notes */}
        {order.notes && (
          <div className="mb-8 p-4 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">Customer notes</p>
            <p className="text-stone-700">{order.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-stone-200 text-center text-xs text-stone-400">
          <p>Thank you for your order! · soulthreadktm.com · hello@soulthreadktm.com</p>
        </div>
      </div>

      {/* Auto-print script */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script dangerouslySetInnerHTML={{ __html: `
        // Auto-print when opened directly (not in iframe)
        if (window.self === window.top) {
          window.addEventListener('load', function() {
            // small delay for fonts
            setTimeout(function() { /* manual trigger only */ }, 500);
          });
        }
      `}} />
    </>
  );
}
