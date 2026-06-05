/** Browser client for guided testing (SQLite via /api/guided-runner). */

export const GUIDED_RUNNER_ROOT_ID = 'ph-guided-next';
export const GUIDED_RUNNER_POLL_EVENT = 'ph-guided-runner-poll';

export function emitGuidedPoll() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GUIDED_RUNNER_POLL_EVENT));
}

export async function fetchGuidedState(includeLog = false) {
  const q = includeLog ? '?log=1' : '';
  try {
    const res = await fetch(`/api/guided-runner/state${q}`, { cache: 'no-store', credentials: 'same-origin' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, session: null, step: null, error: data.error };
    return data;
  } catch {
    return { ok: false, session: null, step: null, error: 'network' };
  }
}

export async function postGuidedClick() {
  try {
    const res = await fetch('/api/guided-runner/click', {
      method: 'POST',
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    emitGuidedPoll();
    return data;
  } catch {
    return { ok: false, error: 'network' };
  }
}

export function isStepArmed(step) {
  return !!(step?.armed && !step?.running && step?.waitGen);
}

export async function acknowledgeGuidedNextClick() {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const data = await postGuidedClick();
    if (data.ok) return { ok: true };

    if (attempt >= 3) {
      return { ok: false, reason: data.reason || data.error || 'not_armed' };
    }

    await new Promise((r) => setTimeout(r, 60 * (attempt + 1)));
    const state = await fetchGuidedState();
    if (!isStepArmed(state.step)) {
      return { ok: false, reason: data.reason || data.error || 'not_armed' };
    }
  }

  return { ok: false, reason: 'not_armed' };
}
