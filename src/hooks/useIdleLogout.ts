/**
 * Idle-logout hook (frontend Phase 1).
 *
 * After `idleMs` of no user activity, raises a `state === 'warning'` so the
 * caller can render a "you'll be signed out soon" dialog. After a further
 * `warnMs` with no activity, calls `logoutUser()` and dispatches the
 * existing `auth-changed` event so the rest of the app re-renders the
 * gated routes.
 *
 * Activity = real user input (mouse, keyboard, scroll, touch). Background
 * fetches do NOT count, by design — a `setInterval` poll cannot keep the
 * user signed in forever.
 *
 * Multi-tab: subscribes to `storage` events on the auth token key. If
 * another tab logs out, this tab follows immediately.
 *
 * Page Visibility: when the tab is hidden the timer is cleared; when it
 * regains focus we treat it as a fresh activity event so users coming
 * back to a previously-open tab don't get auto-logged-out on first
 * interaction.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { isAuthenticated, logoutUser } from '@wc/lib/api';

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 min before warning
const DEFAULT_WARN_MS = 60 * 1000; // 60 s warning before forced logout
const ACTIVITY_THROTTLE_MS = 1000; // collapse listener floods to 1 Hz
const AUTH_TOKEN_KEY = 'auth_token';

/** Browser events that count as "the user is here". */
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
  'focus',
];

export type IdleState = 'active' | 'warning' | 'logged_out';

export interface UseIdleLogoutOptions {
  /** Quiet period before the warning fires. Defaults to 15 minutes. */
  idleMs?: number;
  /** Length of the warning grace period. Defaults to 60 seconds. */
  warnMs?: number;
  /**
   * Master switch — when false, all listeners are torn down and timers
   * cleared. Callers typically pass `isAuthenticated()`.
   */
  enabled?: boolean;
  /**
   * Fired exactly once when the hook auto-logs the user out (i.e. the
   * warning countdown reached zero, or the storage event surfaced a
   * logout from another tab). Useful for surfacing a toast.
   */
  onAutoLogout?: () => void;
}

export interface UseIdleLogoutResult {
  state: IdleState;
  /** Counts down only while `state === 'warning'`. 0 otherwise. */
  secondsUntilLogout: number;
  /** Dismiss the warning dialog and reset the idle timer. */
  stayActive: () => void;
  /** Trigger logout immediately (e.g. from a "Sign out now" button). */
  logoutNow: () => void;
}

export function useIdleLogout(
  opts: UseIdleLogoutOptions = {},
): UseIdleLogoutResult {
  const idleMs = opts.idleMs ?? DEFAULT_IDLE_MS;
  const warnMs = opts.warnMs ?? DEFAULT_WARN_MS;
  const enabled = opts.enabled ?? isAuthenticated();
  const onAutoLogoutRef = useRef(opts.onAutoLogout);
  onAutoLogoutRef.current = opts.onAutoLogout;

  const [state, setState] = useState<IdleState>('active');
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(0);

  // Refs hold the cross-render mutable bits that don't need to trigger
  // re-renders themselves. The timer ref points at whichever phase
  // (idle -> warning, or warning -> logout) is currently armed.
  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearCountdown = () => {
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Hard auto-logout path — used by the warning expiry, the manual
  // "Sign out now" button, and the cross-tab storage handler.
  const performLogout = useCallback(
    (silent = false) => {
      clearTimer();
      clearCountdown();
      setState('logged_out');
      setSecondsUntilLogout(0);
      // Only call logoutUser/dispatch when we initiated the logout. When
      // the storage listener forwards a logout from another tab, the
      // token has already been removed elsewhere — we just need to flip
      // local state.
      if (!silent) {
        logoutUser();
        window.dispatchEvent(new Event('auth-changed'));
      }
      if (!silent) {
        onAutoLogoutRef.current?.();
      }
    },
    [],
  );

  // Schedule the next phase boundary based on `lastActivityRef`. Called
  // on every (throttled) activity event and after dismissing the warning.
  const armIdleTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      // Idle period elapsed -> enter warning state with a 1Hz countdown.
      setState('warning');
      const startedAt = Date.now();
      setSecondsUntilLogout(Math.ceil(warnMs / 1000));
      clearCountdown();
      countdownRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, warnMs - elapsed);
        setSecondsUntilLogout(Math.ceil(remaining / 1000));
        if (remaining <= 0) {
          performLogout();
        }
      }, 1000);
      // Hard backstop in case the interval drifts (e.g. throttled tab).
      timerRef.current = window.setTimeout(() => performLogout(), warnMs);
    }, idleMs);
  }, [idleMs, warnMs, performLogout]);

  const registerActivity = useCallback(() => {
    // Only meaningful while we're in 'active' state. Once warning is
    // showing, the user must explicitly click "Stay signed in" — random
    // mouse jitter shouldn't dismiss it.
    if (document.hidden) return;
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    lastActivityRef.current = now;
    if (state === 'active') {
      armIdleTimer();
    }
  }, [state, armIdleTimer]);

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setState('active');
    setSecondsUntilLogout(0);
    clearCountdown();
    armIdleTimer();
  }, [armIdleTimer]);

  const logoutNow = useCallback(() => {
    performLogout();
  }, [performLogout]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      clearCountdown();
      setState('active');
      setSecondsUntilLogout(0);
      return;
    }

    // Seed activity to "now" so a freshly-mounted hook gives the user a
    // full idle window even if they didn't move the mouse since logging in.
    lastActivityRef.current = Date.now();
    setState('active');
    armIdleTimer();

    const onActivity = () => registerActivity();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true, capture: true });
    }

    // visibilitychange is special: we want to PAUSE timers when the tab
    // is hidden (a backgrounded tab shouldn't drain the user's grace
    // window) and TREAT a return-to-visible as fresh activity, so people
    // coming back to a previously-open tab don't immediately see the
    // warning dialog.
    const onVisibility = () => {
      if (document.hidden) {
        clearTimer();
        clearCountdown();
        // Keep state — if they were in warning, they'll be again on
        // return. If they were active, they'll stay active.
      } else {
        lastActivityRef.current = Date.now();
        if (state === 'warning') {
          setState('active');
          setSecondsUntilLogout(0);
        }
        armIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Multi-tab sync: another tab clearing the auth token means the
    // user logged out (or the token expired) globally. Mirror that here
    // immediately.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== AUTH_TOKEN_KEY) return;
      if (e.newValue === null) {
        // `silent` because the tab that initiated the logout already
        // called logoutUser() — calling it again is harmless but firing
        // a second auth-changed event here lets local listeners react
        // even if they missed the cross-tab event source.
        performLogout(true);
        window.dispatchEvent(new Event('auth-changed'));
        onAutoLogoutRef.current?.();
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      clearTimer();
      clearCountdown();
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity, { capture: true } as EventListenerOptions);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
    };
    // We intentionally don't depend on `state` here — re-installing
    // window-level listeners on every state change would break the
    // "warn modal stays put" invariant. armIdleTimer is stable because
    // its deps are constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, idleMs, warnMs]);

  return { state, secondsUntilLogout, stayActive, logoutNow };
}
