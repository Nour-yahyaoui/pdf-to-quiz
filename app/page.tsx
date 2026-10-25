import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SpecTable } from "@/components/landing/spec-table";
import { CtaBand } from "@/components/landing/cta-band";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <SpecTable />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  );
}
