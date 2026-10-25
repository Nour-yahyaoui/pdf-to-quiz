import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-sheet flex justify-center py-10 sm:py-16">
        <div className="w-full max-w-md animate-fade-in">
          <p className="exam-label mb-3">Start in under a minute</p>
          <h1 className="font-display text-title text-ink">Create your account</h1>
          <p className="mt-2 text-mute">
            Turn lecture notes, papers and PDFs into practice quizzes.
          </p>

          <div className="mt-8 rounded-md border border-rule bg-raised p-6 sm:p-8">
            <AuthForm mode="signup" />
          </div>

          <p className="mt-6 text-sm text-mute">
            Already have an account?{" "}
            <Link href="/login" className="text-accent underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
