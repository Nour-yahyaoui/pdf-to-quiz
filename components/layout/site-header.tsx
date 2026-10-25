import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignOutButton } from "@/components/layout/sign-out-button";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-rule bg-paper">
      <div className="container-sheet flex h-16 items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-ink">
            PDF to Quiz
          </span>
          <span className="hidden font-mono text-label uppercase text-mute sm:inline">
            exam sheet
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
          <ThemeToggle />
          {user ? (
            <>
              <ButtonLink href="/dashboard" variant="ghost" className="px-3">
                Dashboard
              </ButtonLink>
              <SignOutButton />
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" className="px-3">
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="md" className="hidden sm:inline-flex">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
