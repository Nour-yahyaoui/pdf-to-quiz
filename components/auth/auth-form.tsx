"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormProps {
  mode: "login" | "signup";
  redirectedFrom?: string;
}

export function AuthForm({ mode, redirectedFrom }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFieldError(null);
    setPending(true);

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFieldError(data?.error?.message ?? "Something went wrong. Try again.");
        return;
      }

      if (isSignup) {
        toast.success("Account created. Check your inbox to confirm your email, or sign in now.");
        router.push("/login");
        return;
      }

      router.push(redirectedFrom ?? data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setFieldError("Network problem — check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    if (googlePending) return;
    setGooglePending(true);
    try {
      const res = await fetch("/api/auth/google", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toast.error(data?.error?.message ?? "Google sign-in is unavailable right now.");
        setGooglePending(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      toast.error("Network problem — try again.");
      setGooglePending(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute"
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11"
              aria-invalid={fieldError ? true : undefined}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">
            Password {isSignup && <span className="normal-case tracking-normal">(minimum 12 characters)</span>}
          </Label>
          <div className="relative">
            <Lock
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute"
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 12 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11"
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? "auth-error" : undefined}
            />
          </div>
        </div>

        {fieldError && (
          <p
            id="auth-error"
            role="alert"
            className="rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {fieldError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              {isSignup ? "Creating account…" : "Signing in…"}
            </>
          ) : isSignup ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4" role="separator" aria-label="Or">
        <span className="h-px flex-1 bg-rule" />
        <span className="font-mono text-label uppercase text-mute">or</span>
        <span className="h-px flex-1 bg-rule" />
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={googlePending}
      >
        {googlePending ? (
          <Loader2 size={18} className="animate-spin" aria-hidden />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </Button>
    </div>
  );
}

function GoogleMark() {
  // Inline four-colour Google "G" — an illustration, not an emoji (STYLE.md ban).
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.68-3.9 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
