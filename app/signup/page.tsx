'use client';
import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BikriMark } from '@/components/BikriMark';
import { signupAction, checkSlugAction, getSignupTemplatesAction, type SignupTemplate } from './actions';
import { TemplateMockup, BADGE_WORDS } from './TemplateMockup';
import { LivePreview } from './LivePreview';
import { Confetti } from './Confetti';

const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'BikriBazaar';
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'bikribazaar.com';

// Cycles under the logo — small dose of personality on the page every store owner starts at.
const TAGLINES = [
  'Create your online store',
  "Let's make something beautiful",
  'Ready when you are',
  'Live in minutes, not months',
];

// ─── Templates shown in the picker ────────────────────────────────────────
// Built-in fallback, used until the real catalog (name, tagline, palette, optional
// preview photo — same data the marketing site's template showcase reads from
// /templates) loads, or if that request fails. Keeps signup working either way.
const FALLBACK_TEMPLATES: SignupTemplate[] = [
  { id: 'aurora',   name: 'Aurora',   tagline: 'Modern · Minimal · Clean',        palette: ['#6d28d9'], paletteLabels: [] },
  { id: 'bloom',    name: 'Bloom',    tagline: 'Botanical · Warm · Serif',         palette: ['#5a7d5a'], paletteLabels: [] },
  { id: 'coastal',  name: 'Coastal',  tagline: 'Ocean · Bold · Modern',            palette: ['#2d7d9a'], paletteLabels: [] },
  { id: 'neon',     name: 'Neon',     tagline: 'Dark · Electric · Bold',           palette: ['#00e5ff'], paletteLabels: [] },
  { id: 'bubbly',   name: 'Bubbly',   tagline: 'Playful · Colourful · Fun',        palette: ['#ff4d6d'], paletteLabels: [] },
  { id: 'folio',    name: 'Folio',    tagline: 'Editorial · Minimal · Portfolio',  palette: ['#e05c2a'], paletteLabels: [] },
  { id: 'profile',  name: 'Profile',  tagline: 'Professional · Trust · Business',  palette: ['#c9a227'], paletteLabels: [] },
  { id: 'artisan',  name: 'Artisan',  tagline: 'Handicraft · Golden · Warm',       palette: ['#b5651d'], paletteLabels: [] },
  { id: 'capsule',  name: 'Capsule',  tagline: 'Fashion · Y2K · Feminine',         palette: ['#c94070'], paletteLabels: [] },
  { id: 'soulthread', name: 'Soul Thread', tagline: 'Warm · Artisan · Earthy',     palette: ['#c96a3a'], paletteLabels: [] },
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
  const [templates, setTemplates] = useState<SignupTemplate[]>(FALLBACK_TEMPLATES);
  const [poppedId, setPoppedId] = useState<string | null>(null);

  // Fun bits: cycling tagline + confetti bursts (slug win, final success)
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [burst, setBurst] = useState<{ id: number; count: number } | null>(null);
  const prevSlugStatus = useRef<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');

  // Step 2 fields
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Load the real template catalog (name, tagline, palette, preview photo) ──
  // Starts from FALLBACK_TEMPLATES so the picker is never empty; swaps in the
  // real data once it arrives, or silently keeps the fallback if the API is down.
  useEffect(() => {
    let cancelled = false;
    getSignupTemplatesAction().then((data) => {
      if (!cancelled && data) setTemplates(data);
    });
    return () => { cancelled = true; };
  }, []);

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

  // ── Fun: cycling tagline under the logo ──────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTaglineIndex((i) => (i + 1) % TAGLINES.length), 2600);
    return () => clearInterval(t);
  }, []);

  // ── Fun: confetti burst the moment a slug becomes available ──────────────
  useEffect(() => {
    if (slugStatus === 'available' && prevSlugStatus.current !== 'available') {
      setBurst({ id: Date.now(), count: 18 });
    }
    prevSlugStatus.current = slugStatus;
  }, [slugStatus]);

  // ── Fun: bigger confetti burst on the final "check your inbox" screen ────
  useEffect(() => {
    if (step === 3) setBurst({ id: Date.now(), count: 60 });
  }, [step]);

  function selectTemplate(id: string) {
    setTemplateId(id);
    setPoppedId(id);
    setTimeout(() => setPoppedId((p) => (p === id ? null : p)), 300);
  }

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
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? templates[0];

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 animate-[floatY_3s_ease-in-out_infinite]">
            <BikriMark bg="#fafaf9" size={52} />
          </div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-stone-900">{PLATFORM_NAME}</h1>
          <p key={taglineIndex} className="text-sm text-stone-500 mt-1 animate-[fadeSlideIn_0.4s_ease]">
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center md:items-start">
        <div className="w-full max-w-lg mx-auto md:mx-0">
        <div className="relative bg-white rounded-2xl shadow-sm border border-stone-200 p-7">
          {burst && <Confetti key={burst.id} count={burst.count} colors={selectedTemplate?.palette ?? []} />}

          {step < 3 && <Steps current={step} total={2} />}

          {/* ── Step 1: Store setup ─────────────────────────────────────── */}
          {step === 1 && (
            <div key="step1" className="space-y-5 animate-[fadeSlideIn_0.35s_ease]">
              <h2 className="text-lg font-semibold text-stone-900">Let&apos;s set up your store ✨</h2>

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
                  <p className="text-xs text-emerald-600 mt-1 animate-[fadeSlideIn_0.3s_ease]">🎉 Nice — <strong>{slug}.{PLATFORM_DOMAIN}</strong> is all yours.</p>
                )}
              </div>

              {/* Template picker */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Choose a template<span className="text-red-500 ml-0.5">*</span>
                </label>
                <p className="hidden md:block text-xs text-stone-400 -mt-1 mb-2">Watch it come to life in the preview →</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {templates.map((t) => (
                    <button
                      key={t.id} type="button"
                      onClick={() => selectTemplate(t.id)}
                      title={t.tagline}
                      className={`text-left rounded-xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        templateId === t.id
                          ? 'border-stone-800 ring-2 ring-stone-800'
                          : 'border-stone-200 hover:border-stone-300'
                      } ${poppedId === t.id ? 'animate-[pop_0.3s_ease]' : ''}`}
                    >
                      {/* Preview: real screenshot if the catalog has one, otherwise the CSS mockup */}
                      <div className="relative h-[84px] w-full bg-stone-100">
                        {t.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.imageUrl} alt={t.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <TemplateMockup id={t.id} />
                        )}
                        {BADGE_WORDS[t.id] && (
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                            {BADGE_WORDS[t.id]}
                          </span>
                        )}
                      </div>
                      <div className="bg-white p-2.5">
                        <p className="text-xs font-semibold text-stone-800 leading-tight">{t.name}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5 leading-snug truncate">{t.tagline}</p>
                        {t.palette.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {t.palette.slice(0, 4).map((c, i) => (
                              <span
                                key={i}
                                title={t.paletteLabels[i] ?? c}
                                className="h-3 w-3 rounded-full ring-1 ring-black/5"
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
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
            <div key="step2" className="space-y-5 animate-[fadeSlideIn_0.35s_ease]">
              <div className="flex items-center gap-3 mb-1">
                <button type="button" onClick={() => setStep(1)} className="text-stone-400 hover:text-stone-600 text-sm">← Back</button>
                <h2 className="text-lg font-semibold text-stone-900">Almost there — your account</h2>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600">
                <div className="w-4 h-2 rounded-sm shrink-0" style={{ background: selectedTemplate.palette[0] }} />
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
            <div key="step3" className="text-center space-y-5 animate-[fadeSlideIn_0.4s_ease]">
              <div className="text-5xl animate-[floatY_2.4s_ease-in-out_infinite]">📬</div>
              <div>
                <h2 className="text-xl font-semibold text-stone-900 mb-2">You&apos;re almost live! 🎉</h2>
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
        <p className="text-center text-[11px] text-stone-300 mt-1.5">🇳🇵 Made with love in Kathmandu</p>
        </div>

        {/* Live preview — mirrors the form as you fill it in */}
        {step < 3 && selectedTemplate && (
          <div className="hidden md:block w-full max-w-sm">
            <LivePreview storeName={storeName} slug={slug} platformDomain={PLATFORM_DOMAIN} template={selectedTemplate} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
