import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { StatsCounter } from "@/components/landing/stats-counter";
import { BentoGrid } from "@/components/landing/bento-grid";
import { WorkflowSteps } from "@/components/landing/workflow-steps";
import { CodeShowcase } from "@/components/landing/code-showcase";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-ink-950 text-ink-50 selection:bg-fuji-500/30 selection:text-white noise-overlay">
      {/* ─── 1. Glassmorphic Japanese Header ─── */}
      <Navbar />

      {/* ─── 2. Cyber-Zen Hero + Interactive 3-Tab Widget ─── */}
      <Hero />

      {/* ─── 3. Neo-Brutalist Stat Counters ─── */}
      <StatsCounter />

      {/* ─── 4. Mistral-Style Interactive Bento Grid ─── */}
      <BentoGrid />

      {/* ─── 5. 4-Step Animated Pipeline Workflow ─── */}
      <WorkflowSteps />

      {/* ─── 6. Live Output Code & Markdown Showcase ─── */}
      <CodeShowcase />

      {/* ─── 7. High-Conversion CTA & Japanese Footer ─── */}
      <CTASection />
      <Footer />
    </main>
  );
}
