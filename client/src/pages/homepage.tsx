import { useEffect } from 'react';
import { ArrowRight, Brain, Shield, Zap, Star, Award, Camera, Radio, FileText, Users, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { UniversalHeader } from '@/components/universal-header';
import { Footer } from '@/components/footer';
import { FTCDisclaimer } from '@/components/ftc-disclaimer';
import { CanvasHubPage, type CanvasPageConfig } from "@/components/canvas-hub";
import featuresOverviewImg from '@/assets/marketing/features-overview.png';
import schedulingImg from '@/assets/marketing/hero-scheduling.png';
import chatdockImg from '@/assets/marketing/marketing-panel-2-passdown_1769562438216.png';
import payrollImg from '@/assets/marketing/marketing-panel-4-payroll_1769562438216.png';
import gpsImg from '@/assets/marketing/marketing-panel-3-gps_1769562438216.png';
import { SEO, PAGE_SEO, STRUCTURED_DATA } from '@/components/seo';
import { DOMAINS } from "@shared/platformConfig";
import { useAuth } from '@/hooks/useAuth';
import { UniversalSpinner } from '@/components/ui/universal-spinner';

const homepageConfig: CanvasPageConfig = {
  id: 'homepage',
  title: 'CoAIleague',
  category: 'public',
  variant: 'marketing',
  showHeader: false,
};

export default function Homepage() {
  const { isAuthenticated, isLoading, isFetching } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isFetching && isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, isLoading, isFetching, setLocation]);

  useEffect(() => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.display = 'none';
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
    }
  }, []);

  if (!isLoading && !isFetching && isAuthenticated) {
    return (
      <div className="h-dvh w-full flex items-center justify-center bg-background">
        <UniversalSpinner size="md" label="Redirecting to your dashboard…" />
      </div>
    );
  }

  return (
    <CanvasHubPage config={homepageConfig}>
      <SEO
        title={PAGE_SEO.landing.title}
        description={PAGE_SEO.landing.description}
        canonical={`${DOMAINS.app}/`}
        structuredData={[STRUCTURED_DATA.organization, STRUCTURED_DATA.softwareApp]}
      />
      <div className="min-h-dvh bg-background overflow-x-hidden w-full">
        <UniversalHeader variant="public" />

        {/* ── HERO ── */}
        <section className="relative pt-16 md:pt-28 pb-16 md:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Atmospheric background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/6 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Biological brain badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-4 py-2 rounded-full text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>Powered by a Biological AI Brain — Trinity + SARGE</span>
              </div>
            </div>

            <div className="text-center max-w-4xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Your Organization Runs Itself<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-teal-400">
                  When AI Has a Brain
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
                CoAIleague gives every security company two permanent AI co-founders.
                <strong className="text-foreground"> Trinity</strong> runs your back-office.
                <strong className="text-foreground"> SARGE</strong> commands your field officers.
                Together, they replace $100K+ in annual admin overhead — starting Day 1.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-lg font-semibold text-base transition-colors">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/features">
                  <button className="inline-flex items-center gap-2 border border-border text-foreground hover:bg-muted px-8 py-3.5 rounded-lg font-semibold text-base transition-colors">
                    See All Features
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature screenshot strip */}
            <div className="rounded-2xl overflow-hidden border border-border shadow-2xl">
              <img src={featuresOverviewImg} alt="CoAIleague Command Center" className="w-full h-auto" />
            </div>
          </div>
        </section>

        {/* ── TRINITY + SARGE INTRODUCTION ── */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-violet-400 mb-3">Meet Your AI Leadership Team</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                A Biological AI Brain Built for Security Operations
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Trinity and SARGE aren't chatbots. They're autonomous agents with institutional knowledge
                of security law, labor compliance, use-of-force protocols, and FEMA emergency procedures
                across all 50 states.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Trinity */}
              <div className="bg-card border border-violet-500/20 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <Brain className="w-3.5 h-3.5" />
                    Chief AI Architect
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">Trinity</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Trinity's biological brain is a triad of Gemini, Claude, and GPT — each informing the others.
                    She autonomously handles payroll, invoicing, RFP generation, compliance audits, and FEMA
                    surge mobilization. She works while you sleep.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Autonomous payroll + ACH disbursement prep",
                      "Multi-state regulatory knowledge (all 50 states)",
                      "RFP responses drafted in minutes ($500+ value each)",
                      "FEMA ICS-214 Activity Logs auto-generated",
                      "Nightly Dream State: self-improving insights",
                      "GitHub DevOps: proposes and commits code improvements",
                    ].map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* SARGE */}
              <div className="bg-card border border-amber-500/20 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <Shield className="w-3.5 h-3.5" />
                    Senior Adaptive Response &amp; Guidance Engine
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">SARGE</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    SARGE is the officer's field commander. He lives in ChatDock shift rooms,
                    monitoring every clock-in, patrol scan, and PTT transmission. He escalates to
                    Trinity on legally sensitive topics — Use of Force, terminations, and payroll disputes.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Calloff coverage pipeline with 15-minute SLA",
                      "VMS camera alert dispatch to nearest GPS-tracked guard",
                      "PTT push-to-talk command center in every shift room",
                      "Duress code detection — silent alarm, calm facade",
                      "Bilingual (EN/ES) field support",
                      "Officer of the Month recognition & morale boosts",
                    ].map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CHATDOCK SCREENSHOT ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-teal-400 mb-3">ChatDock Command Center</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5">
                  Every Shift Room Has an AI Commander
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  Officers don't fill out forms. They talk to SARGE via push-to-talk audio.
                  SARGE transcribes, classifies, and routes every message — automatically writing
                  to Daily Activity Reports, incident logs, and client files.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Shift rooms auto-created per scheduled shift",
                    "Read receipts: sent → delivered → read",
                    "Message reactions, quoted replies, voice messages",
                    "Officer of the Month badge displayed for all to see",
                    "Legal hold + evidence export for any escalation",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-3 text-muted-foreground">
                      <Zap className="w-4 h-4 text-teal-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/features#chatdock">
                  <button className="inline-flex items-center gap-2 text-teal-400 font-semibold hover:gap-3 transition-all">
                    See ChatDock features <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
              <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
                <img src={chatdockImg} alt="ChatDock — SARGE field command" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SCHEDULING SCREENSHOT ── */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-border shadow-xl">
                <img src={schedulingImg} alt="AI-powered scheduling" className="w-full h-auto" />
              </div>
              <div className="order-1 lg:order-2">
                <p className="text-sm font-semibold uppercase tracking-widest text-violet-400 mb-3">Intelligent Scheduling</p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5">
                  Trinity Fills Shifts Before You Wake Up
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  GetSling-caliber scheduling with autonomous AI coverage. When a guard calls off at
                  2am, Trinity finds coverage within 15 minutes — texting the bench, confirming the
                  replacement, and notifying the client. No manager required.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { label: "15-min calloff SLA", icon: Zap },
                    { label: "Geofenced clock-in", icon: Shield },
                    { label: "FLSA overtime auto-calc", icon: TrendingUp },
                    { label: "Multi-site scheduling", icon: Users },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-3 py-2.5">
                      <Icon className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── VMS BRIDGE FEATURE ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 border border-slate-700 rounded-2xl p-10 md:p-14">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                    <Camera className="w-3.5 h-3.5" />
                    VMS Intelligence Bridge — Add-on
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-5">
                    Tell Clients You're Watching Their Cameras Too
                  </h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">
                    Connect any existing camera system — Verkada, Avigilon, Eagle Eye, Milestone —
                    to CoAIleague. When a camera triggers, SARGE dispatches the nearest GPS-tracked
                    guard and logs the response to the client's Daily Activity Report. Automatically.
                  </p>
                  <ul className="space-y-2.5 mb-8">
                    {[
                      "Hardware-agnostic — no camera replacement needed",
                      "SARGE dispatches nearest clocked-in guard via GPS",
                      "5-minute response SLA with supervisor escalation",
                      "Auto-generates DAR entry on guard acknowledgment",
                      "Per-camera HMAC security — enterprise-grade",
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-slate-300 text-sm">
                        <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">$49</span>
                    <span className="text-slate-400">/month per VMS connection</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-teal-500/10 rounded-full animate-ping opacity-20" />
                    <div className="absolute inset-4 bg-teal-500/15 rounded-full" />
                    <Camera className="w-24 h-24 text-teal-400 relative z-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── OFFICER OF THE MONTH ── */}
        <section className="py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Award className="w-4 h-4" />
              Honor Roll — Officer Recognition
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Great Officers Deserve to Be Seen
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
              CoAIleague tracks every officer's performance score — attendance, patrol compliance,
              incident response, and client ratings. The highest-scoring officer earns a
              <strong className="text-foreground"> Hero Badge</strong> visible to their entire
              organization. No nominations. No politics. Pure meritocracy.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Star, color: "violet", title: "Officer of the Month", desc: "Highest enduser score for 6 consecutive months. Gold chevron badge in ChatDock." },
                { icon: Award, color: "amber", title: "Officer of the Year", desc: "Platform-wide top performer. Annual award. Permanent recognition on honor roll." },
                { icon: Shield, color: "teal", title: "Hero Badge", desc: "Displayed on shift cards, profile, and ChatDock rooms. Visible to managers and clients." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className={`bg-card border border-${color}-500/20 rounded-xl p-6 text-left`}>
                  <div className={`w-10 h-10 bg-${color}-500/10 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PREMIUM FEATURES ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Full Stack — From Hire to Retire
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Every tool a security company needs. One platform. Two AI agents. No extra software.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Radio, title: "PTT Push-to-Talk", desc: "Walkie-talkie-grade audio in every shift room. SARGE transcribes and classifies every transmission.", badge: "$5/seat/mo" },
                { icon: FileText, title: "FEMA Surge Module", desc: "Mass-SMS bench, auto-roster, ICS-214 auto-generation. Guaranteed FEMA reimbursement compliance.", badge: "Enterprise" },
                { icon: Camera, title: "VMS Bridge", desc: "Plug any camera system into CoAIleague. SARGE dispatches guards on camera events.", badge: "$49/mo" },
                { icon: TrendingUp, title: "In-House Payroll + ACH", desc: "Trinity calculates gross pay, OT, and per diem. Owner approves. Plaid disburses directly to bank.", badge: "Professional+" },
                { icon: Shield, title: "DPS Auditor Portal", desc: "Token-gated read-only portal for state licensing board audits. Auto-compiled compliance packets.", badge: "All tiers" },
                { icon: Brain, title: "RFP Automation", desc: "Trinity analyzes RFPs and generates complete proposals. Human RFP writers charge $3,500+. Trinity: from $500.", badge: "Per use" },
              ].map(({ icon: Icon, title, desc, badge }) => (
                <div key={title} className="bg-card border border-border rounded-xl p-6 hover:border-violet-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{badge}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 sm:px-6 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-5">
              Ready to Deploy Trinity and SARGE?
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              14-day free trial. No credit card. Your first shift room is live in under 10 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-xl font-bold text-base transition-colors">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/pricing">
                <button className="inline-flex items-center gap-2 border border-border hover:bg-muted text-foreground px-10 py-4 rounded-xl font-semibold text-base transition-colors">
                  View Pricing
                </button>
              </Link>
            </div>
          </div>
        </section>

        <FTCDisclaimer />
        <Footer />
      </div>
    </CanvasHubPage>
  );
}
