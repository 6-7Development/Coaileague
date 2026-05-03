/**
 * ReAuthModal — Wave 8 Part 2
 * ─────────────────────────────────────────────────────────────────────────────
 * Intercepts expired JWT sessions before they destroy in-progress work.
 *
 * SCENARIO: Manager builds an 8-minute schedule. JWT expires silently. They
 * click "Publish". Without this modal: hard redirect to /login, schedule gone.
 * With this modal: password prompt appears, they re-auth inline, click Publish
 * again — schedule is still there.
 *
 * Architecture:
 *   - Subscribes to sessionExpiredBus via useSyncExternalStore
 *   - Fires when any 401 is intercepted in queryClient.ts
 *   - On success: invalidates /api/auth/me so React re-establishes the session
 *   - Never redirects — the user stays on the page they were on
 *
 * z-index: 9999 — renders above everything including ChatDock and modals
 */

import { useSyncExternalStore, useState, useEffect, useRef } from "react";
import { sessionExpiredBus } from "@/lib/sessionExpiredBus";
import { secureFetch } from "@/lib/csrf";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

export function ReAuthModal() {
  const queryClient = useQueryClient();
  const isExpired = useSyncExternalStore(
    sessionExpiredBus.subscribe,
    sessionExpiredBus.getSnapshot,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  // Pre-fill email from the bus (captured at expiry from auth cache)
  useEffect(() => {
    if (isExpired) {
      const builtinEmail = sessionExpiredBus.userEmail;
      if (builtinEmail) setEmail(builtinEmail);
      setPassword('');
      setError('');
      // Auto-focus password field if email is pre-filled
      setTimeout(() => {
        if (builtinEmail) passwordRef.current?.focus();
      }, 100);
    }
  }, [isExpired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await secureFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: 'Incorrect password. Please try again.',
          ACCOUNT_LOCKED: 'Account locked. Please reset your password.',
          ORGANIZATION_INACTIVE: 'Your organization account is inactive.',
        };
        setError(messages[data.code] || data.message || 'Authentication failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Re-auth succeeded — restore session state, close modal
      // Invalidate auth cache so all components see the fresh session
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      sessionExpiredBus.clear();
      setPassword('');
      setIsLoading(false);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  if (!isExpired) return null;

  return (
    // Full-screen backdrop — blocks all interaction while expired
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="reauth-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 id="reauth-title" className="font-semibold text-foreground">
              Session Expired
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Re-enter your password to continue — your work is safe.
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Your session timed out. Sign back in below — you will return to exactly where you were.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reauth-email">Email</Label>
            <Input
              id="reauth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              className="bg-background"
              data-testid="input-reauth-email"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reauth-password">Password</Label>
            <div className="relative">
              <Input
                id="reauth-password"
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="bg-background pr-10"
                data-testid="input-reauth-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email.trim() || !password}
            data-testid="button-reauth-submit"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
            ) : (
              'Continue'
            )}
          </Button>

          {/* Escape hatch — full logout if they don't remember password */}
          <p className="text-center text-xs text-muted-foreground">
            Forgot your password?{' '}
            <a
              href="/forgot-password"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => sessionExpiredBus.clear()}
            >
              Reset it here
            </a>
            {' '}(unsaved work may be lost)
          </p>
        </form>
      </div>
    </div>
  );
}
