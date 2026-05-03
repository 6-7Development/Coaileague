/**
 * sessionExpiredBus — Wave 8 Part 2
 * ─────────────────────────────────────────────────────────────────────────────
 * Module-level singleton that bridges the queryClient (which catches 401s) to
 * the React component tree (which renders the Re-Auth Modal).
 *
 * Why not React context? The queryClient lives outside React's render cycle.
 * A plain module singleton + useSyncExternalStore gives us synchronous state
 * that React can subscribe to without a Provider.
 *
 * Flow:
 *   queryClient 401 → sessionExpiredBus.trigger() → ReAuthModal renders
 *   User re-auths    → sessionExpiredBus.clear()  → modal closes, app resumes
 */

type Listener = () => void;

let _isExpired = false;
let _userEmail = ''; // Captured at expiry so the modal can pre-fill email
const _listeners = new Set<Listener>();

function notifyAll() {
  _listeners.forEach((l) => l());
}

export const sessionExpiredBus = {
  /** Current expired state — read by useSyncExternalStore */
  get isExpired(): boolean {
    return _isExpired;
  },

  /** Email of the user whose session expired — pre-fills the modal */
  get userEmail(): string {
    return _userEmail;
  },

  /**
   * trigger(email?) — called by the 401 interceptor.
   * Marks the session as expired and captures the user's email so the modal
   * can display "Re-enter password for <email>".
   */
  trigger(email = '') {
    if (_isExpired) return; // Already showing modal — don't re-trigger
    _userEmail = email;
    _isExpired = true;
    notifyAll();
  },

  /**
   * clear() — called after successful re-authentication.
   * Resets expired state so the modal closes.
   */
  clear() {
    _isExpired = false;
    _userEmail = '';
    notifyAll();
  },

  /** Subscribe for useSyncExternalStore */
  subscribe(listener: Listener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },

  /** Snapshot for useSyncExternalStore */
  getSnapshot(): boolean {
    return _isExpired;
  },
};
