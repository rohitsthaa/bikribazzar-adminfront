'use client';

import { useState, useTransition } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { saveAboutImage, savePaymentQr, saveBankDetails } from './actions';

function SettingCard({
  title,
  description,
  children,
  onSave,
  isPending,
  saved,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  isPending: boolean;
  saved: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {children}
      <div className="flex items-center justify-between pt-2">
        <span className={`text-xs font-medium transition-opacity ${saved ? 'text-green-600 opacity-100' : 'opacity-0'}`}>
          ✓ Saved
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white text-sm rounded-xl transition-colors font-medium"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-stone-300 ${mono ? 'font-mono tracking-wide' : ''}`}
      />
    </div>
  );
}

export default function SettingsClient({
  initialAboutImage,
  initialPaymentQr,
  initialBankName,
  initialAccountName,
  initialAccountNo,
}: {
  initialAboutImage: string;
  initialPaymentQr: string;
  initialBankName: string;
  initialAccountName: string;
  initialAccountNo: string;
}) {
  const [aboutImage, setAboutImage] = useState(initialAboutImage);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutPending, startAboutTransition] = useTransition();

  const [paymentQr, setPaymentQr] = useState(initialPaymentQr);
  const [qrSaved, setQrSaved] = useState(false);
  const [qrPending, startQrTransition] = useTransition();

  const [bankName, setBankName] = useState(initialBankName);
  const [accountName, setAccountName] = useState(initialAccountName);
  const [accountNo, setAccountNo] = useState(initialAccountNo);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankPending, startBankTransition] = useTransition();

  function handleAboutSave() {
    startAboutTransition(async () => {
      await saveAboutImage(aboutImage);
      setAboutSaved(true);
      setTimeout(() => setAboutSaved(false), 2000);
    });
  }

  function handleQrSave() {
    startQrTransition(async () => {
      await savePaymentQr(paymentQr);
      setQrSaved(true);
      setTimeout(() => setQrSaved(false), 2000);
    });
  }

  function handleBankSave() {
    startBankTransition(async () => {
      await saveBankDetails(bankName, accountName, accountNo);
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 2000);
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <SettingCard
        title="About / Story band image"
        description='Shown on the homepage next to "One thread, one knot, at a time."'
        onSave={handleAboutSave}
        isPending={aboutPending}
        saved={aboutSaved}
      >
        <ImageUploader value={aboutImage} onChange={setAboutImage} />
      </SettingCard>

      <SettingCard
        title="Bank details"
        description="Shown on the order confirmation page alongside the payment QR code."
        onSave={handleBankSave}
        isPending={bankPending}
        saved={bankSaved}
      >
        <Field
          label="Bank name"
          value={bankName}
          onChange={setBankName}
          placeholder="e.g. NIMB (Nepal Investment Mega Bank)"
        />
        <Field
          label="Account holder name"
          value={accountName}
          onChange={setAccountName}
          placeholder="e.g. Rohit Shrestha"
        />
        <Field
          label="Account number"
          value={accountNo}
          onChange={setAccountNo}
          placeholder="e.g. 03805030270878"
          mono
        />
      </SettingCard>

      <SettingCard
        title="Payment QR code"
        description="Scan-to-pay QR shown on the order confirmation page for the 10% advance."
        onSave={handleQrSave}
        isPending={qrPending}
        saved={qrSaved}
      >
        <ImageUploader value={paymentQr} onChange={setPaymentQr} />
        {paymentQr && (
          <div className="mt-3 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={paymentQr}
              alt="Payment QR preview"
              className="w-40 h-40 object-contain border border-gray-200 rounded-xl bg-white p-2"
            />
          </div>
        )}
      </SettingCard>
    </div>
  );
}
