import { get } from './api';
const KEY = 'mahad_referral_v1';
const CONSENT = 'mahad_storage_consent_v1';
let pendingRef = '';
let attributionDays = 30;

function rawStored() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
function saveReferral(ref) {
  try { localStorage.setItem(KEY, JSON.stringify({ ref, savedAt: Date.now() })); } catch { /* storage may be unavailable */ }
}
export function currentReferral() {
  try {
    if (localStorage.getItem(CONSENT) !== 'accepted') return pendingRef;
    const saved = rawStored();
    if (!saved?.ref || !saved?.savedAt) return pendingRef;
    if (Date.now() - saved.savedAt > attributionDays * 86400000) { localStorage.removeItem(KEY); return pendingRef; }
    return pendingRef || saved.ref;
  } catch { return pendingRef; }
}

async function validateStored() {
  const saved = rawStored();
  if (!saved?.ref || !saved?.savedAt) return '';
  try {
    const result = await get('resolveRef', { ref: saved.ref });
    if (!result?.valid) { localStorage.removeItem(KEY); return ''; }
    const days=Number(result.attribution_days);
    attributionDays=Number.isFinite(days)?Math.max(0,days):30;
    if (Date.now() - saved.savedAt > attributionDays * 86400000) { localStorage.removeItem(KEY); return ''; }
    return saved.ref;
  } catch { return saved.ref; }
}

export async function initialiseReferral() {
  let stored = '';
  try { stored = await validateStored(); } catch { stored = ''; }
  let candidate = '';
  try { candidate = new URL(window.location.href).searchParams.get('ref') || ''; } catch {}
  if (!candidate) return stored;
  try {
    const result = await get('resolveRef', { ref: candidate });
    if (result?.valid) {
      const days=Number(result.attribution_days);
      attributionDays=Number.isFinite(days)?Math.max(0,days):30;
      pendingRef = candidate.toUpperCase();
      try { if (localStorage.getItem(CONSENT) === 'accepted') saveReferral(pendingRef); } catch {}
      return pendingRef;
    }
  } catch { /* invalid/unavailable referral never overwrites a valid stored referral */ }
  return stored;
}
export function savePendingReferral() {
  if (pendingRef) saveReferral(pendingRef);
}
export function setStorageConsent(accepted) {
  try { localStorage.setItem(CONSENT, accepted ? 'accepted' : 'declined'); } catch {}
  if (accepted) savePendingReferral();
  else { try { localStorage.removeItem(KEY); } catch {} }
}
export function hasStorageChoice() {
  try { return Boolean(localStorage.getItem(CONSENT)); } catch { return false; }
}
