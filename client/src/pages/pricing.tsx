import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkforceOSLogo } from "@/components/workforceos-logo";
import { Check, X, TrendingUp, Sparkles } from "lucide-react";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  savings: string;
  features: { name: string; included: boolean }[];
  cta: string;
  popular?: boolean;
  roi: string;
}

export default function Pricing() {
  const tiers: PricingTier[] = [
    {
      name: "Professional",
      price: "$799",
      savings: "$8k-$10k/month",
      roi: "10x ROI",
      description: "Replace scheduler + billing clerk - Perfect for growing teams",
      cta: "Start Free Trial",
      features: [
        { name: "Up to 50 employees", included: true },
        { name: "Smart scheduling (Better than Sling)", included: true },
        { name: "Drag-and-drop shift management", included: true },
        { name: "Auto-billing & invoice generation", included: true },
        { name: "Auto-payment collection (Stripe)", included: true },
        { name: "Time tracking with GPS clock-in", included: true },
        { name: "Photo timestamp verification", included: true },
        { name: "Basic RMS reporting", included: true },
        { name: "Employee onboarding workflow", included: true },
        { name: "Analytics dashboard", included: true },
        { name: "Email & chat support", included: true },
        { name: "Auto-payroll processing", included: false },
        { name: "Full RMS with customer portal", included: false },
        { name: "Compliance audit trails", included: false },
        { name: "API access", included: false },
      ],
    },
    {
      name: "Enterprise",
      price: "$2,999",
      savings: "$20k-$25k/month",
      roi: "8x ROI",
      description: "Replace HR + Payroll + Billing + Scheduling teams",
      cta: "Start Free Trial",
      popular: true,
      features: [
        { name: "Up to 250 employees", included: true },
        { name: "Everything in Professional", included: true },
        { name: "Auto-payroll processing", included: true },
        { name: "Federal & state tax compliance", included: true },
        { name: "Full RMS with customer portal", included: true },
        { name: "SOC2-ready audit compliance", included: true },
        { name: "Manager assignments (RBAC)", included: true },
        { name: "Multi-workspace management", included: true },
        { name: "Advanced analytics & forecasting", included: true },
        { name: "Job posting & hiring workflow", included: true },
        { name: "Document management system", included: true },
        { name: "Priority support (4-hour response)", included: true },
        { name: "White-label branding", included: false },
        { name: "Custom integrations", included: false },
        { name: "Dedicated account manager", included: false },
      ],
    },
    {
      name: "Fortune 500",
      price: "$7,999",
      savings: "$40k-$50k/month",
      roi: "5-6x ROI",
      description: "Complete workforce automation - Replace entire departments",
      cta: "Contact Sales",
      features: [
        { name: "Unlimited employees", included: true },
        { name: "Everything in Enterprise", included: true },
        { name: "White-label RMS branding", included: true },
        { name: "Custom domain & SSL", included: true },
        { name: "API access & webhooks", included: true },
        { name: "Custom integrations (ADP, Workday, QuickBooks)", included: true },
        { name: "Dedicated account manager", included: true },
        { name: "99.95% uptime SLA", included: true },
        { name: "Priority phone support (1-hour response)", included: true },
        { name: "Custom feature development", included: true },
        { name: "White-glove onboarding & training", included: true },
        { name: "Quarterly business reviews", included: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--cad-background))] text-[hsl(var(--cad-text-primary))]">
      {/* CAD-Style Top Bar */}
      <div className="h-12 bg-[hsl(var(--cad-chrome))] border-b border-[hsl(var(--cad-border-strong))] flex items-center justify-between px-6">
        <WorkforceOSLogo size="sm" showText={true} />
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/"}
            className="text-xs h-8 text-[hsl(var(--cad-text-secondary))] hover:text-[hsl(var(--cad-text-primary))] hover:bg-[hsl(var(--cad-chrome-hover))]"
          >
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => window.location.href = "/api/login"}
            className="h-8 text-xs bg-[hsl(var(--cad-blue))] hover:bg-[hsl(var(--cad-blue))]/90 text-white"
          >
            Launch Platform
          </Button>
        </div>
      </div>

      {/* Pricing Hero */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-[hsl(var(--cad-green))]/10 text-[hsl(var(--cad-green))] border-none mb-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Enterprise-Grade ROI
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
            Investment That <span className="text-[hsl(var(--cad-green))]">Pays Itself</span> In Weeks
          </h1>
          <p className="text-lg text-[hsl(var(--cad-text-secondary))] max-w-2xl mx-auto">
            Replace entire departments. Save $100k-$500k annually. All plans include 14-day free trial.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`bg-[hsl(var(--cad-surface-elevated))] border-[hsl(var(--cad-border-strong))] p-8 space-y-6 relative ${
                tier.popular ? "ring-2 ring-[hsl(var(--cad-green))]" : ""
              }`}
              data-testid={`card-pricing-${tier.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(var(--cad-green))] text-white border-none">
                  Best Value
                </Badge>
              )}

              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-[hsl(var(--cad-text-primary))]">
                  {tier.name}
                </h3>
                <p className="text-sm text-[hsl(var(--cad-text-secondary))]">
                  {tier.description}
                </p>
                
                {/* ROI Badge */}
                <div className="flex items-center gap-2 pt-2">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--cad-green))]" />
                  <span className="text-sm font-semibold text-[hsl(var(--cad-green))]">
                    {tier.roi}
                  </span>
                  <span className="text-xs text-[hsl(var(--cad-text-tertiary))]">
                    • Save {tier.savings}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-4xl font-bold font-mono">
                  {tier.price}
                  {tier.price !== "Contact Sales" && (
                    <span className="text-lg font-normal text-[hsl(var(--cad-text-tertiary))]">
                      /mo
                    </span>
                  )}
                </div>
                {tier.price !== "Contact Sales" && (
                  <p className="text-xs text-[hsl(var(--cad-text-tertiary))]">
                    Billed annually • 14-day free trial
                  </p>
                )}
              </div>

              <Button
                className={`w-full h-11 ${
                  tier.popular
                    ? "bg-[hsl(var(--cad-green))] hover:bg-[hsl(var(--cad-green))]/90 text-white"
                    : "border-[hsl(var(--cad-border-strong))] text-[hsl(var(--cad-text-primary))] hover:bg-[hsl(var(--cad-chrome-hover))]"
                }`}
                variant={tier.popular ? "default" : "outline"}
                onClick={() => window.location.href = tier.cta === "Contact Sales" ? "mailto:sales@workforceos.com" : "/api/login"}
                data-testid={`button-${tier.name.toLowerCase().replace(/\s+/g, "-")}-cta`}
              >
                {tier.cta}
              </Button>

              <div className="space-y-3 pt-4 border-t border-[hsl(var(--cad-border))]">
                {tier.features.map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-start gap-3 text-sm"
                  >
                    {feature.included ? (
                      <Check className="h-5 w-5 text-[hsl(var(--cad-green))] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-[hsl(var(--cad-text-tertiary))]/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-[hsl(var(--cad-text-primary))]"
                          : "text-[hsl(var(--cad-text-tertiary))]/60"
                      }
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Cost Breakdown */}
        <Card className="mt-16 max-w-4xl mx-auto bg-gradient-to-br from-[hsl(var(--cad-green))]/10 via-[hsl(var(--cad-surface-elevated))] to-[hsl(var(--cad-cyan))]/10 border-[hsl(var(--cad-border-strong))] p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Why Our Pricing Makes Sense</h2>
              <p className="text-sm text-[hsl(var(--cad-text-secondary))]">
                Compare our monthly fee to the staff costs you're replacing
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  plan: "Professional",
                  price: "$799/mo",
                  replaces: ["Scheduler ($45k/yr)", "Billing Clerk ($40k/yr)"],
                  totalSaved: "$85k/yr",
                  costOfPlan: "$9.5k/yr",
                  netSavings: "$75.5k/yr"
                },
                {
                  plan: "Enterprise",
                  price: "$2,999/mo",
                  replaces: ["HR Manager ($65k/yr)", "Payroll ($50k/yr)", "Scheduler ($45k/yr)", "Billing ($40k/yr)"],
                  totalSaved: "$200k/yr",
                  costOfPlan: "$36k/yr",
                  netSavings: "$164k/yr"
                },
                {
                  plan: "Fortune 500",
                  price: "$7,999/mo",
                  replaces: ["Full HR Dept ($255k/yr)", "Compliance ($55k/yr)", "Benefits ($195k/yr)"],
                  totalSaved: "$505k/yr",
                  costOfPlan: "$96k/yr",
                  netSavings: "$409k/yr"
                },
              ].map((breakdown) => (
                <div key={breakdown.plan} className="bg-[hsl(var(--cad-surface))] border border-[hsl(var(--cad-border))] rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-[hsl(var(--cad-text-primary))]">
                      {breakdown.plan}
                    </h3>
                    <div className="text-2xl font-bold text-[hsl(var(--cad-blue))] font-mono">
                      {breakdown.price}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="text-xs text-[hsl(var(--cad-text-tertiary))] uppercase tracking-wide">
                      Replaces:
                    </div>
                    {breakdown.replaces.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[hsl(var(--cad-text-secondary))]">
                        <Check className="h-3 w-3 text-[hsl(var(--cad-green))]" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[hsl(var(--cad-border))] space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[hsl(var(--cad-text-tertiary))]">Annual plan cost:</span>
                      <span className="text-[hsl(var(--cad-red))] font-mono">-{breakdown.costOfPlan}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2">
                      <span className="text-[hsl(var(--cad-text-primary))]">Net savings:</span>
                      <span className="text-[hsl(var(--cad-green))] font-mono text-lg">+{breakdown.netSavings}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Why are the prices higher than competitors?",
                a: "Because we replace 3-5 full-time staff positions with complete automation. Our Enterprise plan costs $36k/year but saves you $164k annually - that's a 4.5x return. Most competitors only replace scheduling, not your entire HR department.",
              },
              {
                q: "What's included in the free trial?",
                a: "Full access to all features in your chosen plan for 14 days. No credit card required. Experience GPS clock-ins, auto-payroll, smart scheduling, and RMS reporting risk-free.",
              },
              {
                q: "Can I start with Professional and upgrade later?",
                a: "Absolutely. Most customers start with Professional and upgrade within 3-6 months as they see ROI. Your data migrates seamlessly, and we'll credit any unused time toward your new plan.",
              },
              {
                q: "What payment methods do you accept?",
                a: "All major credit cards, ACH transfers, and wire transfers. Fortune 500 plans include net-30 payment terms and can be invoiced quarterly or annually.",
              },
              {
                q: "Is implementation included?",
                a: "Professional includes self-service setup with video tutorials. Enterprise includes guided onboarding. Fortune 500 includes white-glove implementation with a dedicated account manager.",
              },
              {
                q: "What if I need custom features?",
                a: "Fortune 500 plans include custom feature development. We'll work with your team to build integrations, custom reports, or workflow automations specific to your business.",
              },
            ].map((faq) => (
              <Card
                key={faq.q}
                className="bg-[hsl(var(--cad-surface))] border-[hsl(var(--cad-border))] p-6"
              >
                <h3 className="font-semibold mb-2 text-[hsl(var(--cad-text-primary))]">
                  {faq.q}
                </h3>
                <p className="text-sm text-[hsl(var(--cad-text-secondary))]">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--cad-border))] bg-[hsl(var(--cad-chrome))]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--cad-text-tertiary))]">
              <WorkforceOSLogo size="sm" showText={false} />
              <span>© 2025 WorkforceOS. Fortune 500-grade workforce automation.</span>
            </div>
            <div className="flex gap-6 text-xs text-[hsl(var(--cad-text-tertiary))]">
              <a href="/support" className="hover:text-[hsl(var(--cad-text-primary))]" data-testid="link-support">
                Support Center
              </a>
              <a href="/contact" className="hover:text-[hsl(var(--cad-text-primary))]" data-testid="link-contact">
                Contact Us
              </a>
              <a href="#" className="hover:text-[hsl(var(--cad-text-primary))]">
                Privacy
              </a>
              <a href="#" className="hover:text-[hsl(var(--cad-text-primary))]">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
