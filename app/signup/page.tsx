'use client';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signupAction, checkSlugAction } from './actions';

const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'Bikri Bazaar';
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'bikribazaar.com';

// ─── Templates shown in the picker ────────────────────────────────────────
const TEMPLATES = [
  { id: 'aurora',   name: 'Aurora',   desc: 'Modern · Minimal · Clean',        color: '#6d28d9' },
  { id: 'bloom',    name: 'Bloom',    desc: 'Botanical · Warm · Serif',         color: '#5a7d5a' },
  { id: 'coastal',  name: 'Coastal',  desc: 'Ocean · Bold · Modern',            color: '#2d7d9a' },
  { id: 'neon',     name: 'Neon',     desc: 'Dark · Electric · Bold',           color: '#00e5ff' },
  { id: 'bubbly',   name: 'Bubbly',   desc: 'Playful · Colourful · Fun',        color: '#ff4d6d' },
  { id: 'folio',    name: 'Folio',    desc: 'Editorial · Minimal · Portfolio',  color: '#e05c2a' },
  { id: 'profile',  name: 'Profile',  desc: 'Professional · Trust · Business',  color: '#c9a227' },
  { id: 'artisan',  name: 'Artisan',  desc: 'Handicraft · Golden · Warm',       color: '#b5651d' },
  { id: 'capsule',  name: 'Capsule',  desc: 'Fashion · Y2K · Feminine',         color: '#c94070' },
  { id: 'soulthread', name: 'Soul Thread', desc: 'Warm · Artisan · Earthy',     color: '#c96a3a' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function Input({
  label, name, type = 'text', value, onChange, placeholder, hint, error, required, autoFocus,
}: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; hint?: string;
  error?: string; required?: boolean; autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type} name={name} value={value} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 bg-stone-50 placeholder:text-stone-400 ${
          error ? 'border-red-300 focus:ring-red-300' : 'border-stone-300 focus:ring-stone-400'
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!error && hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i + 1 < current ? 'bg-stone-800 text-white' :
            i + 1 === current ? 'bg-stone-800 text-white ring-4 ring-stone-200' :
            'bg-stone-200 text-stone-500'
          }`}>
            {i + 1 < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={`h-px w-8 ${i + 1 < current ? 'bg-stone-800' : 'bg-stone-200'}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [globalError, setGlobalError] = useState('');
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  // Step 1 fields
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [slugError, setSlugError] = useState('');
  const [templateId, setTemplateId] = useState('aurora');

  // Step 2 fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Auto-generate slug from store name ──────────────────────────────────
  useEffect(() => {
    if (!slugManual && storeName) {
      setSlug(slugify(storeName));
    }
  }, [storeName, slugManual]);

  // ── Debounced slug availability check ───────────────────────────────────
  const checkSlug = useCallback((s: string) => {
    if (!s || s.length < 3) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    setSlugError('');
    const timer = setTimeout(async () => {
      const result = await checkSlugAction(s);
      if (result.error) { setSlugStatus('error'); setSlugError(result.error); }
      else setSlugStatus(result.available ? 'available' : 'taken');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = checkSlug(slug);
    return cleanup;
  }, [slug, checkSlug]);

  // ── Step 1 validation ────────────────────────────────────────────────────
  function validateStep1() {
    if (!storeName.trim()) { setGlobalError('Store name is required.'); return false; }
    if (!slug) { setGlobalError('Store URL is required.'); return false; }
    if (slugStatus === 'taken') { setGlobalError('That URL is already taken.'); return false; }
    if (slugStatus === 'error') { setGlobalError(slugError || 'Invalid URL format.'); return false; }
    setGlobalError('');
    return true;
  }

  // ── Step 2 validation ────────────────────────────────────────────────────
  function validateStep2() {
    const errs: Record<string, string> = {};
    if (!ownerName.trim()) errs.ownerName = 'Name is required.';
    if (!ownerEmail.trim()) errs.ownerEmail = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) errs.ownerEmail = 'Enter a valid email.';
    if (!ownerPassword) errs.ownerPassword = 'Password is required.';
    else if (ownerPassword.length < 8) errs.ownerPassword = 'At least 8 characters.';
    if (whatsapp && !/^[0-9]{7,15}$/.test(whatsapp)) errs.whatsapp = 'Digits only, 7–15 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Final submit ─────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validateStep2()) return;
    setGlobalError('');
    startTransition(async () => {
      const result = await signupAction({
        storeId: slug,
        storeName: storeName.trim(),
        templateId,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        ownerPassword,
        whatsappNumber: whatsapp.replace(/\D/g, ''),
      });
      if (!result.ok) {
        setGlobalError(result.error);
        return;
      }
      setDoneEmail(result.email);
      setStep(3);
    });
  }

  // ── Template colour pill ─────────────────────────────────────────────────
  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-stone-800 text-white text-lg font-bold rounded-2xl mb-4">
            BB
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">{PLATFORM_NAME}</h1>
          <p className="text-sm text-stone-500 mt-1">Create your online store</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-7">

          {step < 3 && <Steps current={step} total={2} />}

          {/* ── Step 1: Store setup ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-stone-900">Set up your store</h2>

              <Input
                label="Store name" name="storeName" value={storeName} autoFocus
                onChange={setStoreName} placeholder="e.g. Ningwa Boutique"
                required hint="This is what customers will see."
              />

              {/* Slug field */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Store URL<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex items-center border rounded-xl overflow-hidden bg-stone-50 focus-within:ring-2 focus-within:ring-stone-400 border-stone-300">
                  <span className="px-3 py-2.5 text-sm text-stone-400 border-r border-stone-200 bg-stone-100 shrink-0">
                    {PLATFORM_DOMAIN}/
                  </span>
                  <input
                    type="text" value={slug}
                    onChange={(e) => { setSlugManual(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }}
                    placeholder="your-store"
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
                  />
                  <span className="px-3 shrink-0 text-sm">
                    {slugStatus === 'checking' && <span className="text-stone-400">…</span>}
                    {slugStatus === 'available' && <span className="text-emerald-600 font-medium">✓ Available</span>}
                    {slugStatus === 'taken' && <span className="text-red-500 font-medium">✗ Taken</span>}
                    {slugStatus === 'error' && <span className="text-red-500 font-medium">✗</span>}
                  </span>
                </div>
                {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
                {slugStatus === 'available' && (
                  <p className="text-xs text-emerald-600 mt-1">Your store will be live at <strong>{slug}.{PLATFORM_DOMAIN}</strong></p>
                )}
              </div>

              {/* Template picker */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Choose a template<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id} type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={`text-left rounded-xl border p-3 transition-all ${
                        templateId === t.id
                          ? 'border-stone-800 ring-2 ring-stone-800 bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="w-6 h-3 rounded mb-2" style={{ background: t.color }} />
                      <p className="text-xs font-semibold text-stone-800 leading-tight">{t.name}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {globalError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{globalError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Account ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => setStep(1)} className="text-stone-400 hover:text-stone-600 text-sm">← Back</button>
                <h2 className="text-lg font-semibold text-stone-900">Your account</h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600">
                <div className="w-4 h-2 rounded-sm shrink-0" style={{ background: selectedTemplate.color }} />
                <span className="font-medium">{storeName}</span>
                <span className="text-stone-400 mx-1">·</span>
                <span className="text-stone-400">{slug}.{PLATFORM_DOMAIN}</span>
                <span className="text-stone-400 mx-1">·</span>
                <span className="text-stone-500">{selectedTemplate.name}</span>
              </div>

              <Input
                label="Your name" name="ownerName" value={ownerName} autoFocus
                onChange={setOwnerName} placeholder="Ningwa Shrestha"
                error={fieldErrors.ownerName} required
              />
              <Input
                label="Email" name="ownerEmail" type="email" value={ownerEmail}
                onChange={setOwnerEmail} placeholder="you@example.com"
                error={fieldErrors.ownerEmail} required
                hint="You'll use this to log in."
              />
              <Input
                label="Password" name="ownerPassword" type="password" value={ownerPassword}
                onChange={setOwnerPassword} placeholder="At least 8 characters"
                error={fieldErrors.ownerPassword} required
              />
              <Input
                label="WhatsApp number" name="whatsapp" value={whatsapp}
                onChange={setWhatsapp} placeholder="9841234567"
                error={fieldErrors.whatsapp}
                hint="Customers will order via this number. You can update it later."
              />

              {globalError && (
                <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{globalError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isPending ? 'Creating your store…' : 'Start my free trial →'}
              </button>

              <p className="text-xs text-stone-400 text-center leading-relaxed">
                7-day free trial · No credit card required · Cancel anytime
              </p>
            </div>
          )}

          {/* ── Step 3: Check your email ─────────────────────────────────── */}
          {step === 3 && doneEmail && (
            <div className="text-center space-y-5">
              <div className="text-5xl">📬</div>
              <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-2">Check your inbox</h2>
                <p className="text-sm text-stone-500 leading-relaxed">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-stone-700">{doneEmail}</span>.
                  Click the link to activate your account and access your store.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
                  Don't see it?
                </p>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Check your spam or junk folder. The link expires in 24 hours.
                </p>
              </div>

              <p className="text-xs text-stone-400">
                Wrong email?{' '}
                <button
                  type="button"
                  onClick={() => { setStep(1); setDoneEmail(null); }}
                  className="text-stone-600 underline underline-offset-2"
                >
                  Start over
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-stone-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-stone-600 hover:underline font-medium">Sign in</a>
          {' · '}© {new Date().getFullYear()} {PLATFORM_NAME}
        </p>
      </div>
    </div>
  );
}
