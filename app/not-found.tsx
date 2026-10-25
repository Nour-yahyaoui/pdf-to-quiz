import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-sheet flex min-h-[60vh] items-center">
        <div className="max-w-measure">
          <p className="exam-label mb-4">Error 404</p>
          <h1 className="font-display text-display text-ink">
            This sheet has gone missing
          </h1>
          <p className="mt-5 text-body text-mute">
            The page you are looking for does not exist. Quizzes are reachable only
            through their unique link or the history saved on this device.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center rounded-sm bg-accent px-6 py-3 font-medium text-white hover:bg-accent-deep dark:text-ink"
            >
              Go to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm border border-rule bg-raised px-6 py-3 font-medium text-ink hover:border-accent hover:text-accent"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
