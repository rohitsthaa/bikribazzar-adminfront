'use client';

import { useState, useTransition } from 'react';
import { saveDeliveryAction } from '../actions';

// Kept in sync with the storefront checkout's DEFAULT_AREAS. "Outside Valley"
// drives the nationwide flag on the order (handled server-side).
const DELIVERY_AREAS = [
  'Thamel', 'Baneshwor', 'Koteshwor', 'Lazimpat', 'Baluwatar',
  'Maharajgunj', 'Swayambhu', 'Chabahil', 'New Road', 'Patan / Lalitpur',
  'Bhaktapur', 'Budhanilkantha', 'Sitapaila', 'Outside Valley',
];

export default function DeliveryEditor({
  orderId,
  initialArea,
  initialAddress,
  initialLandmark,
  initialProvince,
  initialDistrict,
  initialRecipientName,
  initialRecipientPhone,
}: {
  orderId: string;
  initialArea?: string;
  initialAddress?: string;
  initialLandmark?: string;
  initialProvince?: string;
  initialDistrict?: string;
  initialRecipientName?: string;
  initialRecipientPhone?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [area, setArea] = useState(initialArea ?? '');
  const [address, setAddress] = useState(initialAddress ?? '');
  const [landmark, setLandmark] = useState(initialLandmark ?? '');
  const [province, setProvince] = useState(initialProvince ?? '');
  const [district, setDistrict] = useState(initialDistrict ?? '');
  const [recipientName, setRecipientName] = useState(initialRecipientName ?? '');
  const [recipientPhone, setRecipientPhone] = useState(initialRecipientPhone ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // If the area isn't one of the known options, show it as a custom value.
  const knownArea = DELIVERY_AREAS.includes(area);

  function handleSave() {
    setError('');
    startTransition(async () => {
      const result = await saveDeliveryAction(orderId, {
        deliveryArea: area.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        province: province.trim(),
        district: district.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
      });
      if (result && 'error' in result) {
        setError(result.error);
      } else {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  const hasDelivery = (initialArea && initialArea.length > 0) || (initialAddress && initialAddress.length > 0);

  if (!editing) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-2"
        >
          {hasDelivery ? 'Edit delivery' : '+ Add delivery address'}
        </button>
        {saved && <span className="ml-2 text-xs text-green-600">✓ Saved</span>}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-3">
      <label className="block text-xs">
        <span className="text-stone-500 uppercase tracking-wide font-medium">Delivery area</span>
        <select
          value={knownArea ? area : (area ? '__custom' : '')}
          onChange={(e) => setArea(e.target.value === '__custom' ? '' : e.target.value)}
          className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
        >
          <option value="">— Select area —</option>
          {DELIVERY_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          <option value="__custom">Other (type below)</option>
        </select>
      </label>

      {!knownArea && (
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Custom area"
          className="w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
        />
      )}

      <label className="block text-xs">
        <span className="text-stone-500 uppercase tracking-wide font-medium">Address</span>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          placeholder="Street, house no., etc."
          className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 resize-none bg-white text-stone-800"
        />
      </label>

      <label className="block text-xs">
        <span className="text-stone-500 uppercase tracking-wide font-medium">Landmark</span>
        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="e.g. Near Boudha Stupa"
          className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">
          <span className="text-stone-500 uppercase tracking-wide font-medium">Province</span>
          <input
            type="text"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="e.g. Bagmati"
            className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
          />
        </label>
        <label className="block text-xs">
          <span className="text-stone-500 uppercase tracking-wide font-medium">District</span>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="e.g. Kathmandu"
            className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">
          <span className="text-stone-500 uppercase tracking-wide font-medium">Recipient name</span>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="If shipping to someone else"
            className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
          />
        </label>
        <label className="block text-xs">
          <span className="text-stone-500 uppercase tracking-wide font-medium">Recipient phone</span>
          <input
            type="text"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-2.5 py-2 bg-white text-stone-800"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors"
        >
          {isPending ? 'Saving…' : 'Save delivery'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setArea(initialArea ?? '');
            setAddress(initialAddress ?? '');
            setLandmark(initialLandmark ?? '');
            setProvince(initialProvince ?? '');
            setDistrict(initialDistrict ?? '');
            setRecipientName(initialRecipientName ?? '');
            setRecipientPhone(initialRecipientPhone ?? '');
            setError('');
          }}
          className="px-3 py-1.5 text-stone-500 hover:text-stone-800 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
