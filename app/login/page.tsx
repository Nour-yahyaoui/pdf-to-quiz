import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="container-sheet flex justify-center py-10 sm:py-16">
        <div className="w-full max-w-md animate-fade-in">
          <p className="exam-label mb-3">Step onto the exam sheet</p>
          <h1 className="font-display text-title text-ink">Welcome back</h1>
          <p className="mt-2 text-mute">
            Sign in to generate quizzes and review your past attempts.
          </p>

          {params.error === "oauth" && (
            <p
              role="alert"
              className="mt-5 rounded-sm border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              Google sign-in did not complete. Please try again or use your email and password.
            </p>
          )}

          <div className="mt-8 rounded-md border border-rule bg-raised p-6 sm:p-8">
            <AuthForm mode="login" redirectedFrom={params.redirectedFrom} />
          </div>

          <p className="mt-6 text-sm text-mute">
            New here?{" "}
            <Link href="/signup" className="text-accent underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
