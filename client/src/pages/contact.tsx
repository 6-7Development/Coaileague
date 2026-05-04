import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { CONTACTS, DOMAINS } from "@shared/platformConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UniversalHeader } from "@/components/universal-header";
import { SEO, PAGE_SEO } from "@/components/seo";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Phone, Mail, MessageSquare, Clock, Send, HeadphonesIcon, Briefcase,
  Zap, CheckCircle2, Globe, Building2, Bot, Volume2, PhoneCall,
  Sparkles, ShieldCheck, Brain, Lock, Users, Cpu, Mic, Activity,
  TrendingUp, ArrowRight, BarChart3, Shield,
} from "lucide-react";

// ── Pulsing status dot ──────────────────────────────────────────────────────
function PulsingDot({ color = "bg-emerald-400" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

// ── Animated typing cursor ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <span className="inline-flex gap-0.5 items-center h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// ── Guest ChatDock Shell ────────────────────────────────────────────────────
function GuestChatDock() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I'm Trinity — CoAIleague's AI co-pilot. I can walk you through pricing, calculate your exact ROI for your guard count, answer compliance questions, or book you a demo with our team. What would you like to know?",
      ts: "Just now",
    },
  ]);
  const [isTrinity, setIsTrinity] = useState(false);

  const quickPrompts = [
    "What does it cost for 45 guards?",
    "Show me the DPS compliance features",
    "Calculate my ROI",
    "Book a demo",
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const userMsg = { role: "user", text: inputValue, ts: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTrinity(true);
    setTimeout(() => {
      setIsTrinity(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Great question — let me pull that for you. For full access to Trinity's live response, sign up or contact our sales team at trinity@coaileague.com. She's available 24/7.",
          ts: "Just now",
        },
      ]);
    }, 2200);
  };

  return (
    <div className="flex flex-col h-[520px] rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl shadow-amber-500/5 bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Sales Trinity</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Online · Responds instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/25 text-[10px] font-medium">
            AI-Powered
          </Badge>
          <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/50 text-[10px]">
            Guest Mode
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-slate-800 text-slate-100 rounded-tl-sm border border-white/5"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-tr-sm shadow-md"
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 px-1">{msg.ts}</span>
            </div>
          </div>
        ))}
        {isTrinity && (
          <div className="flex gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-white/5">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => { setInputValue(p); }}
              className="text-[11px] px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 border border-white/8 hover:border-amber-500/40 hover:text-amber-300 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-white/8 rounded-xl px-3 py-2 focus-within:border-amber-500/40 transition-colors">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about pricing, compliance, ROI..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-amber-500/20 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-all"
            title="Push to talk"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            onClick={handleSend}
            className="h-8 w-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white hover:opacity-90 transition-opacity shadow-md shadow-amber-500/30"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          Guest mode · <a href={`mailto:${CONTACTS.trinity}`} className="text-amber-600/70 hover:text-amber-400 transition-colors">Sign in</a> for full Trinity access
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function Contact() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: isLoadingAuth } = useQuery<{ user: { id: string; email: string } }>({
    queryKey: ["/api/auth/me"],
    retry: false,
    retryOnMount: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  const isAuthenticated = !!currentUser?.user;

  const [formData, setFormData] = useState({
    name: "", email: "", company: "", phone: "", subject: "", tier: "", message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: (response) => {
      setIsSubmitted(true);
      setTicketNumber(response.ticketNumber);
      toast({
        title: "Message Received",
        description: `Trinity AI is reviewing your request. Ticket: ${response.ticketNumber}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit contact form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <SEO
        title={PAGE_SEO.contact.title}
        description={PAGE_SEO.contact.description}
        canonical={DOMAINS.contactUrl}
      />
      <UniversalHeader variant="public" />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-16 px-4 overflow-hidden">
          {/* Background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />
          {/* Glow orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500/6 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-5xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide uppercase">
              <Bot className="h-3.5 w-3.5" />
              CoAIleague Command Center
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight"
              data-testid="heading-contact"
            >
              How can we{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                help?
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade support for security operations teams. Talk to Trinity instantly, or reach our human experts directly.
            </p>

            {/* Status bar */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900 border border-white/8 text-sm">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <PulsingDot />
                All Systems Operational
              </span>
              <span className="w-px h-4 bg-white/10" />
              <span className="text-slate-400">Trinity response &lt;3s</span>
              <span className="w-px h-4 bg-white/10" />
              <span className="text-slate-400">24/7 availability</span>
            </div>
          </div>
        </section>

        {/* ── Ask Sales Trinity (primary hero) ─────────────────────────── */}
        <section className="px-4 pb-16 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left — context */}
            <div className="space-y-6 lg:pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Primary sales channel
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                  Ask Sales Trinity
                </h2>
                <p className="text-slate-400 text-base leading-relaxed">
                  Trinity is CoAIleague's AI co-pilot — she knows pricing, compliance, ROI math, and your industry cold. Most questions resolve in under 60 seconds without waiting for a human.
                </p>
              </div>

              {/* Capability chips */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: BarChart3, label: "Live ROI Calculator", desc: "Guard count → monthly savings" },
                  { icon: Shield, label: "DPS Compliance", desc: "Texas OC 1702 expertise" },
                  { icon: TrendingUp, label: "Pricing & Tiers", desc: "Exact per-seat costs" },
                  { icon: Brain, label: "Feature Deep-Dives", desc: "Scheduling, payroll, AI" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-white/6 hover:border-amber-500/20 transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voice channel */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-900 border border-amber-500/15">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="h-6 w-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Prefer voice?</p>
                  <a
                    href="tel:+18664644151"
                    className="text-amber-400 font-mono text-base hover:text-amber-300 transition-colors"
                    data-testid="link-trinity-phone"
                  >
                    {import.meta.env.VITE_TRINITY_PHONE || "+1 (866) 464-4151"}
                  </a>
                  <p className="text-xs text-slate-500">Toll-free · 24/7 · Bilingual EN/ES</p>
                </div>
                <div className="hidden sm:flex flex-col gap-1 text-[10px] text-slate-500 text-right flex-shrink-0">
                  {["Sales", "Support", "Emergency", "Careers"].map((opt) => (
                    <span key={opt} className="text-slate-400">{opt}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — ChatDock shell */}
            <GuestChatDock />
          </div>
        </section>

        {/* ── Support Cards Grid ───────────────────────────────────────── */}
        <section className="px-4 pb-16 max-w-7xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-xs text-slate-500 uppercase tracking-widest font-medium px-3">Other ways to reach us</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Email Support */}
            <Card className="bg-slate-900 border border-white/8 p-5 space-y-4 hover:border-violet-500/30 transition-colors group" data-testid="card-email-support">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-violet-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Email Support</h3>
                <p className="text-sm text-slate-400 mt-1">Detailed technical assistance with a &lt;24hr response time.</p>
              </div>
              <a
                href={`mailto:${CONTACTS.trinity}`}
                className="text-sm font-mono text-violet-400 hover:text-violet-300 transition-colors break-all"
                data-testid="link-email-support"
              >
                {CONTACTS.trinity}
              </a>
            </Card>

            {/* Enterprise Sales */}
            <Card className="bg-slate-900 border border-white/8 p-5 space-y-4 hover:border-amber-500/30 transition-colors group" data-testid="card-enterprise-sales">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-400" />
                </div>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Strategic</Badge>
              </div>
              <div>
                <h3 className="font-semibold text-white">Enterprise Sales</h3>
                <p className="text-sm text-slate-400 mt-1">100+ employees? Get custom pricing, dedicated onboarding, and white-glove SLA.</p>
              </div>
              <Button
                size="sm"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-md shadow-amber-500/20"
                onClick={() => window.location.href = `mailto:${CONTACTS.support}`}
                data-testid="button-enterprise-contact"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Contact Sales
              </Button>
            </Card>

            {/* System Status */}
            <Card className="bg-slate-900 border border-white/8 p-5 space-y-4 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <PulsingDot />
                  <span className="text-[10px] text-emerald-400 font-medium">Operational</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-white">System Status</h3>
                <p className="text-sm text-slate-400 mt-1">All services running normally. Zero incidents in the last 30 days.</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "API & Auth", ok: true },
                  { label: "ChatDock", ok: true },
                  { label: "Payroll Engine", ok: true },
                  { label: "Scheduling AI", ok: true },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{label}</span>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Operational
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ── Contact Form + Sidebar ───────────────────────────────────── */}
        <section className="px-4 pb-20 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form — 3/5 */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-900 border border-white/8 overflow-hidden">
                <div className="px-6 py-5 border-b border-white/6">
                  <h2 className="text-lg font-semibold text-white">Send a Message</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Trinity reviews every submission and responds within 24 hours.</p>
                </div>

                <div className="p-6">
                  {!isSubmitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="name" className="text-slate-300 text-sm">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Jane Smith"
                            required
                            className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50"
                            data-testid="input-name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="email" className="text-slate-300 text-sm">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="jane@company.com"
                            required
                            className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50"
                            data-testid="input-email"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="company" className="text-slate-300 text-sm">Company</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Acme Security LLC"
                            className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50"
                            data-testid="input-company"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="phone" className="text-slate-300 text-sm">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50"
                            data-testid="input-phone"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="tier" className="text-slate-300 text-sm">Plan Interest</Label>
                        <Select value={formData.tier} onValueChange={(value) => setFormData({ ...formData, tier: value })}>
                          <SelectTrigger id="tier" className="bg-slate-800 border-white/10 text-white focus:border-amber-500/50" data-testid="select-tier">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10 text-white">
                            <SelectItem value="starter">Starter — $299/mo</SelectItem>
                            <SelectItem value="professional">Professional — $999/mo</SelectItem>
                            <SelectItem value="enterprise">Enterprise — $2,999/mo</SelectItem>
                            <SelectItem value="custom">Custom Enterprise — $7,999+/mo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="subject" className="text-slate-300 text-sm">Subject *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="How can we help?"
                          required
                          className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50"
                          data-testid="input-subject"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="message" className="text-slate-300 text-sm">Message *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Tell us about your workforce management needs..."
                          rows={5}
                          required
                          className="bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-amber-500/50 resize-none"
                          data-testid="input-message"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white h-11 shadow-lg shadow-amber-500/20 hover:opacity-90 transition-opacity"
                        data-testid="button-submit-contact"
                      >
                        {submitMutation.isPending ? (
                          <>
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Sending to Trinity...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <Card className="bg-emerald-950/30 border border-emerald-500/20 p-5 space-y-5" data-testid="card-success">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Message Received!</h3>
                          <p className="text-sm text-slate-400">Trinity AI is reviewing your request</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg">
                        <Brain className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-300/80 leading-relaxed">
                          Trinity is working your ticket. If she can't resolve it, you'll be connected to a human automatically — no action needed.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-800 rounded-lg border border-white/8 space-y-2">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Your Ticket Number</p>
                        <div className="flex items-center justify-between gap-3">
                          <code className="text-2xl font-bold font-mono text-amber-400" data-testid="text-ticket-number">
                            {ticketNumber}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(ticketNumber);
                              toast({ title: "Copied!", description: "Ticket number copied to clipboard" });
                            }}
                            className="border-white/15 text-slate-300 hover:text-white hover:border-amber-500/40"
                            data-testid="button-copy-ticket"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setLocation("/chatrooms")}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          data-testid="button-goto-chat"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Go to Live Chat
                        </Button>
                        <Button
                          onClick={() => {
                            setIsSubmitted(false);
                            setTicketNumber("");
                            setFormData({ name: "", email: "", company: "", phone: "", subject: "", tier: "", message: "" });
                          }}
                          variant="outline"
                          className="border-white/15 text-slate-300"
                          data-testid="button-send-another"
                        >
                          New Ticket
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar — 2/5 */}
            <div className="lg:col-span-2 space-y-4">
              {/* Support tiers */}
              <Card className="bg-slate-900 border border-white/8 p-5 space-y-4" data-testid="card-support-tiers">
                <h3 className="font-semibold text-white text-sm">Support Included</h3>
                <div className="space-y-3">
                  {[
                    { tier: "Starter", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", items: ["Email & chat", "4hr response", "Knowledge base"] },
                    { tier: "Professional", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", items: ["Phone + email + chat", "1hr response", "Dedicated engineer"] },
                    { tier: "Enterprise", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", items: ["24/7 priority phone", "15min response", "Account manager"] },
                  ].map(({ tier, color, items }) => (
                    <div key={tier} className="space-y-1.5">
                      <Badge className={`${color} border text-[10px]`}>{tier}</Badge>
                      <ul className="space-y-0.5">
                        {items.map((item) => (
                          <li key={item} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-slate-600 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Hours */}
              <Card className="bg-slate-900 border border-white/8 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <h3 className="font-semibold text-white text-sm">Business Hours</h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Mon – Fri</span>
                    <span className="font-mono text-slate-300">6AM – 10PM EST</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sat – Sun</span>
                    <span className="font-mono text-slate-300">8AM – 8PM EST</span>
                  </div>
                  <div className="pt-2 border-t border-white/6">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      24/7 Emergency Line Available
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Contact links */}
              <Card className="bg-slate-900 border border-white/8 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <h3 className="font-semibold text-white text-sm">Direct Contact</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-slate-500 mb-0.5">Trinity AI</p>
                    <a href={`mailto:${CONTACTS.trinity}`} className="font-mono text-amber-400 hover:text-amber-300 transition-colors" data-testid="link-email-trinity">
                      {CONTACTS.trinity}
                    </a>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-0.5">General Support</p>
                    <a href={`mailto:${CONTACTS.support}`} className="font-mono text-violet-400 hover:text-violet-300 transition-colors" data-testid="link-email-info">
                      {CONTACTS.support}
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="light" />
    </div>
  );
}
