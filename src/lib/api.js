import { SITE } from '../config';

async function readResponse(response) {
  let json;
  try { json = await response.json(); } catch { throw new Error('The server returned an unreadable response. Please try again.'); }
  if (!json?.ok) {
    const error = json?.error || {};
    const e = new Error(error.message || 'The request could not be completed.');
    e.code = error.code || 'request_failed'; e.field = error.field || '';
    throw e;
  }
  return json.data;
}

export async function get(action, params = {}) {
  const url = new URL(SITE.apiUrl);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v); });
  const response = await fetch(url.toString(), { method: 'GET' });
  return readResponse(response);
}

export async function submit(payload) {
  const response = await fetch(SITE.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return readResponse(response);
}

export function friendlyError(error) {
  const known = {
    too_fast: 'Please take a little more time to complete the form before submitting.',
    rate_limited: 'There have been too many attempts. Please wait and try again later.',
    not_eligible: error.message,
    age_out_of_range: error.message,
    prerequisites_required: error.message,
    admissions_closed: error.message,
    group_unavailable: error.message,
    course_unavailable: error.message,
    already_registered: error.message,
    terms_required: error.message,
    forbidden: 'This request could not be accepted. Please refresh the page and try again.',
    busy: 'The institute server is busy. Please try again shortly.'
  };
  return known[error.code] || error.message || 'Something went wrong. Please try again.';
}
