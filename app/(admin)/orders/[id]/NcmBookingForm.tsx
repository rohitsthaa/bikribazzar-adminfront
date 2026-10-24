'use client';

import { useEffect, useState, useTransition } from 'react';
import { getNcmBranchesAction, getNcmShippingRateAction, shipViaNcmAction } from '../actions';
import type { NcmBranch } from '@/lib/api';
import { recallNcmBranch } from './ncm-branch';

/**
 * Books an NCM pickup for an order (creates the NCM order and marks ours shipped). Used in the
 * courier card and in the "Shipped" dialog. Opens with the branch picked while confirming the
 * order, if any.
 */
export default function NcmBookingForm({
  orderId,
  remainingNpr,
  itemTotalNpr,
  paidNpr,
  deliveryFeeNpr,
  initialName,
  initialPhone,
  initialAddress,
  initialFromBranch,
  paymentMethod,
  deliveryFeePending,
  onCancel,
  onBooked,
  cancelLabel = 'Cancel',
}: {
  orderId: string;
  remainingNpr: number;
  itemTotalNpr: number;
  paidNpr: number;
  deliveryFeeNpr: number;
  initialName: string;
  initialPhone: string;
  initialAddress: string;
  initialFromBranch: string;
  paymentMethod?: string | null;
  /** The order's delivery fee hasn't been set yet — offer NCM's quote as the fee. */
  deliveryFeePending: boolean;
  onCancel: () => void;
  onBooked: () => void;
  cancelLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [branches, setBranches] = useState<NcmBranch[] | null>(null);
  const [toBranch, setToBranch] = useState('');
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [fromBranch, setFromBranch] = useState(initialFromBranch);
  const [handling, setHandling] = useState('');
  const [packageType, setPackageType] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [vendorRefId, setVendorRefId] = useState(orderId);
  const [deliveryType, setDeliveryType] = useState('Door2Door');
  const [weightKg, setWeightKg] = useState('1');
  const isOnlineItemsOnlyOrder = ['esewa', 'khalti', 'fonepay'].includes(paymentMethod?.toLowerCase() ?? '');
  const [cod, setCod] = useState(isOnlineItemsOnlyOrder || remainingNpr > 0);
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  // Charge the customer NCM's quoted rate as the delivery fee (only offered while the fee
  // is still pending). On by default: that's what "confirm with customer" usually ends up as.
  const [useNcmFee, setUseNcmFee] = useState(true);
  const applyFee = deliveryFeePending && useNcmFee && charge !== null;
  const effectiveDeliveryFee = applyFee ? charge! : deliveryFeeNpr;
  const onlineDeliveryDue = Math.max(0, effectiveDeliveryFee - Math.max(0, paidNpr - itemTotalNpr));
  const codAmount = isOnlineItemsOnlyOrder
    ? onlineDeliveryDue
    : remainingNpr + (applyFee ? charge! : 0);
  const shouldCollect = isOnlineItemsOnlyOrder || cod;
  const [codCharge, setCodCharge] = useState(String(codAmount));

  useEffect(() => setCodCharge(String(codAmount)), [codAmount]);

  const rateTypeByDeliveryType: Record<string, string> = {
    Door2Door: 'Pickup/Collect',
    Branch2Door: 'Send',
    Door2Branch: 'D2B',
    Branch2Branch: 'B2B',
  };

  function handleBranchChange(next: string, rateDeliveryType = deliveryType, rateFromBranch = fromBranch) {
    setToBranch(next);
    setCharge(null);
    setRateError(null);
    if (!next) return;
    setRateLoading(true);
    // Advisory preview (NCM's quoted charge for this branch) — doesn't block Book while loading.
    getNcmShippingRateAction(next, rateTypeByDeliveryType[rateDeliveryType] ?? 'Pickup/Collect', rateFromBranch.trim()).then((res) => {
      setRateLoading(false);
      if ('error' in res) setRateError(res.error);
      else setCharge(res.charge);
    });
  }

  useEffect(() => {
    let cancelled = false;
    getNcmBranchesAction().then((res) => {
      if (cancelled) return;
      if ('error' in res) setError(res.error);
      else setBranches(res.branches);
    });
    // Branch picked in the Confirm dialog for this order, if any — preselect it and its rate.
    const remembered = recallNcmBranch(orderId);
    if (remembered) handleBranchChange(remembered);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function handleShip() {
    if (!toBranch) { setError('Pick a destination branch.'); return; }
    if (!name.trim() || !phone.trim() || !address.trim() || !fromBranch.trim()) {
      setError('Enter the customer name, phone, delivery address, and pickup branch.');
      return;
    }
    if (!handling) { setError('Choose how NCM should handle this package.'); return; }
    if (!packageType.trim() || !packageDescription.trim()) {
      setError('Enter the package type and description.');
      return;
    }
    if (!codCharge.trim() || !Number.isInteger(Number(codCharge)) || Number(codCharge) < 0) {
      setError('Enter a valid COD amount.');
      return;
    }
    if (!Number.isInteger(Number(weightKg)) || Number(weightKg) <= 0) {
      setError('Package weight must be a whole number greater than zero.');
      return;
    }
    if (isOnlineItemsOnlyOrder && deliveryFeePending && !applyFee) {
      setError("Confirm the delivery fee from NCM's rate before booking this order.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await shipViaNcmAction(orderId, {
        toBranch, cod: shouldCollect, instruction: instruction.trim() || undefined,
        handling, packageType: packageType.trim(), packageDescription: packageDescription.trim(),
        name: name.trim(), phone: phone.trim(), address: address.trim(), fromBranch: fromBranch.trim(),
        codChargeNpr: shouldCollect ? Number(codCharge) : 0, vendorRefId: vendorRefId.trim(),
        deliveryType, weightKg: Number(weightKg),
        ...(applyFee ? { deliveryFee: charge! } : {}),
      });
      if ('error' in res) setError(res.error);
      else onBooked();
    });
  }

  const selected = branches?.find((b) => b.name === toBranch);
  const location = selected ? [selected.district, selected.province].filter(Boolean).join(', ') : '';
  const payloadPreview = {
    name: name.trim(),
    phone: phone.trim(),
    cod_charge: String(shouldCollect ? Number(codCharge) || 0 : 0),
    address: address.trim(),
    fbranch: fromBranch.trim(),
    branch: toBranch,
    package: packageType.trim() && packageDescription.trim() ? `${packageType.trim()}: ${packageDescription.trim()}` : '',
    handling,
    vref_id: vendorRefId.trim(),
    instruction: [handling ? `Handling: ${handling}` : '', instruction.trim()].filter(Boolean).join('\n'),
    delivery_type: deliveryType,
    weight: String(Number(weightKg) || 0),
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-stone-200 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Shipment details sent to NCM</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Customer name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Customer phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Delivery address</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Pickup branch (from)</label>
        <input value={fromBranch} onChange={(e) => { setFromBranch(e.target.value); if (toBranch) handleBranchChange(toBranch, deliveryType, e.target.value); }} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Destination branch</label>
        {branches === null && !error ? (
          <p className="text-xs text-stone-400">Loading branches…</p>
        ) : (
          <select
            value={toBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
          >
            <option value="">Select a branch…</option>
            {branches?.map((b) => (
              <option key={b.pk} value={b.name}>
                {[b.name, [b.district, b.province].filter(Boolean).join(', ')].filter(Boolean).join(' — ')}
              </option>
            ))}
          </select>
        )}
        {toBranch && (
          <p className="text-xs mt-1.5 space-y-0.5">
            {location && <span className="block text-stone-400">{location}</span>}
            {rateLoading ? (
              <span className="block text-stone-400">Fetching delivery charge…</span>
            ) : rateError ? (
              <span className="block text-red-600">{rateError}</span>
            ) : charge !== null ? (
              <span className="block text-stone-500">Delivery fee (NCM): <span className="font-medium text-stone-800">NPR {charge.toLocaleString()}</span></span>
            ) : null}
          </p>
        )}
      </div>
      {deliveryFeePending && charge !== null && (
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={useNcmFee} onChange={(e) => setUseNcmFee(e.target.checked)} />
          Set the delivery fee to NCM&apos;s rate (NPR {charge.toLocaleString()})
        </label>
      )}
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
        checked={shouldCollect}
          disabled={isOnlineItemsOnlyOrder}
          onChange={(e) => setCod(e.target.checked)}
        />
        {isOnlineItemsOnlyOrder
          ? deliveryFeePending && !applyFee
            ? 'NCM collects the confirmed delivery fee on arrival'
            : `NCM collects delivery fee on arrival (NPR ${codAmount.toLocaleString()})`
          : `Collect on delivery (NPR ${codAmount.toLocaleString()})`}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">COD amount sent to NCM (NPR)</label>
          <input type="number" min="0" step="1" value={shouldCollect ? codCharge : '0'} disabled={!shouldCollect} onChange={(e) => setCodCharge(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm disabled:bg-stone-50 disabled:text-stone-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Package weight (kg)</label>
          <input type="number" min="1" step="1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Handling</label>
        <select
          required
          value={handling}
          onChange={(e) => setHandling(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        >
          <option value="">Choose handling…</option>
          <option value="Fragile">Fragile</option>
          <option value="Fragile and Valuable">Fragile and Valuable</option>
          <option value="Valuable">Valuable</option>
          <option value="Non-Fragile">Non-Fragile</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Package type</label>
        <input
          required
          value={packageType}
          onChange={(e) => setPackageType(e.target.value)}
          placeholder="e.g. Clothing, pottery, electronics"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Package description</label>
        <textarea
          required
          value={packageDescription}
          onChange={(e) => setPackageDescription(e.target.value)}
          rows={2}
          placeholder="Describe the contents of the package"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Vendor reference ID</label>
          <input value={vendorRefId} onChange={(e) => setVendorRefId(e.target.value)} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Delivery type</label>
          <select value={deliveryType} onChange={(e) => { setDeliveryType(e.target.value); if (toBranch) handleBranchChange(toBranch, e.target.value); }} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="Door2Door">Door to door</option>
            <option value="Branch2Door">Branch to door</option>
            <option value="Door2Branch">Door to branch</option>
            <option value="Branch2Branch">Branch to branch</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5">Delivery instruction <span className="text-stone-400 font-normal">— optional</span></label>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          rows={2}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30"
        />
      </div>
      <details open className="rounded-xl border border-stone-200 bg-stone-50 p-3">
        <summary className="cursor-pointer text-xs font-semibold text-stone-600">Review exact NCM request</summary>
        <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-stone-600">{JSON.stringify(payloadPreview, null, 2)}</pre>
      </details>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleShip}
          disabled={isPending}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-700 transition-colors disabled:opacity-60"
        >
          {isPending ? 'Booking…' : 'Book pickup'}
        </button>
      </div>
    </div>
  );
}
