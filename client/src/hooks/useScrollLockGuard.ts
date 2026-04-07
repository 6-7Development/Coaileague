import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * SCROLL LOCK GUARD v3
 *
 * ROOT CAUSE (confirmed):
 *   react-remove-scroll adds a NON-PASSIVE BUBBLE-MODE touchmove listener on
 *   `document` that calls `preventDefault()` whenever its internal `lockStack`
 *   has entries. `lockStack` is a module-level array — not tied to
 *   `body[data-scroll-locked]`. Removing the attribute does NOT remove the
 *   listener or clear the stack.
 *
 * THE FIX (this file):
 *   1. BUBBLE INTERCEPT — Add a passive touchmove listener on `document.body`
 *      (the last node before `document` in the bubble chain). For touches that
 *      are NOT inside an open dialog/modal, call `e.stopPropagation()`. This
 *      prevents the event from ever reaching react-remove-scroll's `shouldPrevent`
 *      handler on `document`, so `preventDefault()` is never called and native
 *      scroll proceeds. `stopPropagation` does NOT affect the browser's default
 *      scroll action — only `preventDefault` does.
 *
 *   2. STALE ATTRIBUTE CLEANUP — Still remove `data-scroll-locked` / inline
 *      overflow styles when no blocking dialog is in the DOM (route changes,
 *      watchdog, visibility change).
 *
 * WHY DIALOGS STILL WORK:
 *   Touches INSIDE a Radix Dialog/Sheet/Vaul match the
 *   `[role="dialog"]` selector so we skip `stopPropagation`. The event
 *   bubbles normally to `document`, react-remove-scroll analyzes it, and may
 *   call `preventDefault()` only if the in-dialog scroll is truly exhausted —
 *   preventing background bleed-through while still allowing in-dialog scroll.
 */

const LOCK_ATTR = "data-scroll-locked";

function hasActiveLockInDOM(): boolean {
  const attr = document.body.getAttribute(LOCK_ATTR);
  if (!attr) return false;
  const count = parseInt(attr, 10);
  return isFinite(count) && count > 0;
}

function hasVisibleScrollLockingDialog(): boolean {
  return (
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-vaul-dialog][data-state="open"]'
    ) !== null
  );
}

function forceReleaseStaleLock() {
  if (hasActiveLockInDOM() && !hasVisibleScrollLockingDialog()) {
    document.body.removeAttribute(LOCK_ATTR);
  }

  if (!hasVisibleScrollLockingDialog()) {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.style.marginRight = "";
    document.body.style.height = "";
    document.body.style.touchAction = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.height = "";
    document.documentElement.style.touchAction = "";

    const root = document.getElementById("root");
    if (root) {
      root.style.overflow = "";
      root.style.height = "";
    }
  }

  if (document.body.getAttribute("data-nav-overlay-open") === "true") {
    if (!document.querySelector('[data-nav-overlay="true"]')) {
      document.body.removeAttribute("data-nav-overlay-open");
    }
  }
}

/**
 * Intercept touchmove AND wheel in the BUBBLE phase at `document.body`.
 *
 * For events that originate OUTSIDE an open dialog/sheet/alertdialog, stop
 * bubbling before the event reaches `document`. This prevents
 * react-remove-scroll's `shouldPrevent` handler from calling
 * `preventDefault()`, restoring native scroll everywhere.
 *
 * For events INSIDE a dialog, let them bubble normally so Radix can manage
 * in-dialog scroll correctly (allowing scroll within the dialog while
 * preventing background bleed-through when the dialog's content is exhausted).
 *
 * Phase V6 (2026-04-07) — PREVIOUSLY this guard only covered `touchmove`,
 * which fixed mobile pan-y scroll but LEFT DESKTOP MOUSE WHEEL BROKEN because
 * react-remove-scroll blocks `wheel` events via the exact same non-passive
 * document handler. Users reported "scrolling doesn't work even on desktop
 * with mouse" — confirmed root cause. Extended to also intercept `wheel`.
 */
function installScrollPassthrough() {
  const DIALOG_SELECTOR =
    '[role="dialog"], [role="alertdialog"], [data-vaul-dialog]';

  function stopRemoveScrollBubble(e: TouchEvent | WheelEvent) {
    const target = e.target as Element | null;
    if (!target) {
      e.stopPropagation();
      return;
    }

    // Let react-remove-scroll handle events that are genuinely inside an
    // open modal so it can prevent background bleed-through.
    if (target.closest(DIALOG_SELECTOR)) return;

    // For everything else (main content, sidebars, public pages, etc.)
    // stop the bubble so shouldPrevent never runs and native scroll proceeds.
    e.stopPropagation();
  }

  document.body.addEventListener("touchmove", stopRemoveScrollBubble as any, {
    passive: true,
  });
  document.body.addEventListener("wheel", stopRemoveScrollBubble as any, {
    passive: true,
  });

  // Return cleanup function
  return () => {
    document.body.removeEventListener("touchmove", stopRemoveScrollBubble as any);
    document.body.removeEventListener("wheel", stopRemoveScrollBubble as any);
  };
}

export function useScrollLockGuard() {
  const [location] = useLocation();

  // ── 1. BUBBLE INTERCEPT (runs once, lives for the app lifetime) ─────────
  useEffect(() => {
    return installScrollPassthrough();
  }, []);

  // ── 2. Stale attribute cleanup on route changes ─────────────────────────
  useEffect(() => {
    const id = setTimeout(forceReleaseStaleLock, 350);
    return () => clearTimeout(id);
  }, [location]);

  // ── 3. Tab-switch recovery ───────────────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        forceReleaseStaleLock();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // ── 4. Periodic watchdog (catches locks that survive route changes) ───────
  useEffect(() => {
    const watchdog = setInterval(() => {
      forceReleaseStaleLock();
    }, 2000);
    return () => clearInterval(watchdog);
  }, []);
}
