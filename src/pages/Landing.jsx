import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scissors, Clock, BarChart3, Users, Bell, CreditCard,
  Star, Shield, Zap, ChevronRight, Check, Menu, X,
  Smartphone, Calendar, TrendingUp, Award, Quote,
  Building2, Rocket, Target, Sparkles, ArrowRight,
  CheckCircle2, Play
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
];

/* ─────────────────────────────── NAVBAR ─────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SalonOS</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login/customer" className="text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5">
              Customer App
            </Link>
            <Link to="/login/owner" className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
              Owner Login
            </Link>
            <Link to="/login/admin" className="text-sm border border-white/20 hover:border-brand-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors">
              Admin
            </Link>
          </div>

          <button className="md:hidden text-gray-400" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-white/10 px-4 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} className="block text-gray-400 hover:text-white text-sm py-1" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <Link to="/login/customer" className="block text-center text-sm text-gray-300 border border-white/20 rounded-lg py-2">Customer App</Link>
            <Link to="/login/owner" className="block text-center text-sm bg-brand-600 text-white rounded-lg py-2 font-medium">Owner Dashboard</Link>
            <Link to="/login/admin" className="block text-center text-sm border border-white/20 text-gray-300 rounded-lg py-2">Admin Panel</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated BG blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-[600px] h-[600px] bg-brand-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-900/30 rounded-full blur-[150px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-sm text-brand-300 border border-brand-500/30">
          <Zap className="w-3.5 h-3.5 text-gold-400" />
          India's First Multi-Tenant Smart Salon SaaS Platform
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
          Run Your Salon{' '}
          <span className="gradient-text">Smarter.</span>
          <br />
          <span className="text-gray-300">Zero Waiting.</span>{' '}
          <span className="gradient-text">Maximum Growth.</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
          Manage bookings, live queue, payments, and customers —
          all in one powerful salon system.
        </p>

        {/* Trust line */}
        <p className="text-sm text-gray-500 mb-10 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Trusted by local salons & growing businesses across India
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/login/owner"
            className="group flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-8 py-3.5 rounded-xl font-semibold text-lg glow transition-all duration-200"
          >
            <Rocket className="w-5 h-5" />
            Start Free Trial
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login/customer"
            className="group flex items-center gap-2 glass border border-white/20 hover:border-brand-400/60 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all duration-200"
          >
            <Play className="w-4 h-4 text-brand-400" />
            Book Demo
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: '0', unit: ' min', label: 'Waiting Time' },
            { value: '14+', unit: ' yrs', label: 'Pilot Experience' },
            { value: '₹999', unit: '/mo', label: 'Starting Plan' },
            { value: '100%', unit: '', label: 'Data Isolated' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center border border-white/5 hover:border-brand-500/20 transition-colors">
              <div className="text-2xl font-bold gradient-text">{s.value}<span className="text-base font-medium">{s.unit}</span></div>
              <div className="text-xs text-gray-300 font-medium mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── VALUE SECTION ─────────────────────────── */
function ValueSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-900/10 via-transparent to-gold-900/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 text-brand-400 text-sm font-medium mb-4 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
              <Sparkles className="w-4 h-4" /> Why SalonOS?
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Everything Your Salon Needs —{' '}
              <span className="gradient-text">In One Platform</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Automate your salon. Increase your revenue. Save hours daily.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🚫', text: 'No more waiting lines — customers join the live queue from their phone' },
                { icon: '📵', text: 'No more manual bookings — smart scheduling runs itself' },
                { icon: '🙅', text: 'No more missed customers — automated reminders & follow-ups' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-4 glass rounded-xl p-4 border border-white/5 hover:border-brand-500/20 transition-colors">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                to="/login/owner"
                className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-semibold transition-colors group"
              >
                See how it works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right — visual stats card */}
          <div className="relative">
            <div className="glass rounded-3xl p-8 border border-brand-500/20 glow">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { val: '40%', label: 'More Revenue', color: 'text-emerald-400' },
                  { val: '0 min', label: 'Avg Wait Time', color: 'text-brand-400' },
                  { val: '3x', label: 'Repeat Customers', color: 'text-gold-400' },
                  { val: '2 hrs', label: 'Time Saved Daily', color: 'text-blue-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 rounded-2xl p-5 text-center border border-white/5">
                    <div className={`text-3xl font-black mb-1 ${s.color}`}>{s.val}</div>
                    <div className="text-xs text-gray-100 font-bold uppercase tracking-tight">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-brand-600/20 to-gold-500/10 rounded-2xl p-4 border border-brand-500/20 text-center">
                <div className="text-sm text-gray-100 font-bold italic">
                  "Trusted by modern salons to deliver better customer experience"
                </div>
              </div>
            </div>
            {/* Floating accent */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-brand-500 to-gold-400 rounded-2xl flex items-center justify-center opacity-80 blur-sm" />
            <div className="absolute -top-3 -right-3 w-18 h-18 glass rounded-2xl flex items-center justify-center border border-white/20 w-16 h-16">
              <Scissors className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FEATURES ─────────────────────────────── */
const FEATURES = [
  {
    icon: Calendar,
    title: 'Smart Booking',
    desc: 'Customers book anytime — no calls, no confusion.',
    color: 'from-brand-600 to-brand-400',
  },
  {
    icon: Clock,
    title: 'Live Queue System',
    desc: 'Real-time queue. No waiting at salon.',
    color: 'from-gold-600 to-gold-400',
  },
  {
    icon: BarChart3,
    title: 'Salon Dashboard',
    desc: 'Track bookings, revenue, peak hours.',
    color: 'from-emerald-600 to-emerald-400',
  },
  {
    icon: Users,
    title: 'CRM & Customer History',
    desc: 'Know your customers. Increase repeat visits.',
    color: 'from-blue-600 to-blue-400',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Reduce no-shows with reminders.',
    color: 'from-pink-600 to-pink-400',
  },
  {
    icon: CreditCard,
    title: 'Payments Integration',
    desc: 'Accept UPI, cash & online payments.',
    color: 'from-violet-600 to-violet-400',
  },
  {
    icon: Shield,
    title: 'Data Isolation (SaaS)',
    desc: 'Every salon gets private, secure data.',
    color: 'from-red-600 to-red-400',
  },
  {
    icon: Zap,
    title: 'AI Smart Features',
    desc: 'Auto suggestions, smart scheduling.',
    color: 'from-amber-600 to-amber-400',
  },
];

function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-brand-400 text-sm font-medium mb-4 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
            <Star className="w-4 h-4" /> Full Feature Suite
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Features That Actually{' '}
            <span className="gradient-text">Grow Your Salon</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From booking to billing — SalonOS handles every aspect of your salon business.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6 border border-white/5 hover:border-brand-500/30 hover:-translate-y-1 transition-all duration-200 group cursor-default"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-100 font-medium leading-relaxed opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom trust line */}
        <p className="text-center text-sm text-gray-500 mt-10">
          Trusted by modern salons to deliver better customer experience
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────── HOW IT WORKS ─────────────────────────── */
const STEPS = [
  { step: '01', title: 'Signup & Onboard', desc: 'Register your salon in minutes. Get your own dashboard, unique tenant ID, and branded booking link.' },
  { step: '02', title: 'Configure Services', desc: 'Add your services, set prices, add staff profiles, and configure your working hours.' },
  { step: '03', title: 'Go Live', desc: 'Share your booking link. Customers start booking online or joining the live queue from their phones.' },
  { step: '04', title: 'Grow with Data', desc: 'Use analytics to find peak hours, top-earning services, and customer retention patterns.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Up & Running in <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-gray-400">Simple 4-step onboarding. No technical knowledge required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
          {STEPS.map((s) => (
            <div key={s.step} className="relative text-center group">
              <div className="w-20 h-20 rounded-2xl glass border border-brand-500/30 glow mx-auto flex flex-col items-center justify-center mb-6 group-hover:border-brand-500/60 transition-colors">
                <span className="text-xs text-brand-400 font-medium">STEP</span>
                <span className="text-2xl font-black gradient-text">{s.step}</span>
              </div>
              <h3 className="font-bold text-lg text-white mb-3">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── PRICING ─────────────────────────────── */
const PLANS = [
  {
    name: 'Basic',
    price: '₹999',
    period: '/month',
    badge: null,
    tagline: 'Best for single salon',
    color: 'border-white/10',
    btn: 'bg-white/10 hover:bg-white/20 text-white',
    scale: '',
    features: [
      '1 Salon (Single Shop)',
      'Booking System',
      'Live Queue',
      'Customer Management',
      'Notifications',
      'Payments',
      'Basic Reports',
    ],
  },
  {
    name: 'Pro',
    price: '₹1,499',
    period: '/month',
    badge: '🔥 Most Popular',
    tagline: 'Best for growing salons',
    color: 'border-brand-500/70',
    btn: 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 glow text-white',
    scale: 'lg:scale-105',
    features: [
      'Everything in Basic +',
      '2 Salons / Branches',
      'Advanced Analytics',
      'Staff Management',
      'Priority Support',
      'Smart Queue Optimization',
      'AI Recommendations',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    badge: 'Multi-Branch',
    tagline: 'Best for chains & premium salons',
    color: 'border-gold-500/40',
    btn: 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-white',
    scale: '',
    features: [
      'Unlimited Salons',
      'Multi-branch Dashboard',
      'Custom Features',
      'Dedicated Support',
      'Custom Integrations',
      'White-label Option',
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-900/20 rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-gold-400 text-sm font-medium mb-4 bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20">
            <Award className="w-4 h-4" /> Pricing Plans
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple Pricing.{' '}
            <span className="gradient-text">Built for Every Salon.</span>
          </h2>
          <p className="text-gray-400">No hidden fees. Cancel anytime. Optional setup: ₹10k–₹30k.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative glass rounded-2xl p-8 border ${p.color} flex flex-col ${p.scale} transition-transform`}
            >
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className={`${p.name === 'Pro' ? 'bg-gradient-to-r from-brand-600 to-brand-500' : 'bg-gradient-to-r from-gold-600 to-gold-500'} text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap`}>
                    {p.badge}
                  </span>
                </div>
              )}
              <div className="mb-6 pt-2">
                <h3 className="font-bold text-xl text-white mb-1">{p.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{p.tagline}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold gradient-text">{p.price}</span>
                  <span className="text-gray-400 mb-1 text-sm">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.name === 'Pro' ? 'text-brand-400' : p.name === 'Enterprise' ? 'text-gold-400' : 'text-emerald-400'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login/owner"
                className={`block text-center font-semibold py-3 rounded-xl transition-all ${p.btn}`}
              >
                {p.name === 'Enterprise' ? 'Contact Us' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>

        {/* Below pricing CTA */}
        <p className="text-center text-gray-400 mt-10 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-gold-400" />
          Start Free Trial – No Risk, No Commitment
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */
const TESTIMONIALS = [
  {
    quote: "Earlier we had too much waiting and confusion. After using SalonOS, everything is automated — bookings, queue, and customer flow. Our customers are happier and business has improved.",
    name: 'Salon Owner',
    role: 'Gondia, Maharashtra',
    avatar: 'S',
    type: 'Salon Owner',
    color: 'from-brand-600 to-brand-400',
    stars: 5,
  },
  {
    quote: "Best thing is I don't have to wait anymore. I book from home and go exactly at my time. This app changed my salon experience completely.",
    name: 'Regular Customer',
    role: 'Happy Client',
    avatar: 'R',
    type: 'Customer',
    color: 'from-gold-600 to-gold-400',
    stars: 5,
  },
  {
    quote: "SalonOS helped us manage customers, track revenue, and reduce no-shows. It feels like running a smart digital salon now.",
    name: 'Premium Salon Partner',
    role: 'Business Partner',
    avatar: 'P',
    type: 'Business Growth',
    color: 'from-emerald-600 to-emerald-400',
    stars: 5,
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-brand-400 text-sm font-medium mb-4 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
            <Star className="w-4 h-4 fill-brand-400" /> Real Results
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Salons <span className="gradient-text">Love</span> SalonOS
          </h2>
          <p className="text-gray-400">Real reviews from real salon owners and customers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-7 border border-white/5 hover:border-brand-500/20 transition-all duration-200 flex flex-col group"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-gold-400 fill-gold-400" />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="w-8 h-8 text-brand-500/30 mb-3" />

              {/* Quote text */}
              <blockquote className="text-gray-300 text-sm leading-relaxed flex-1 mb-6 italic">
                "{t.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full">{t.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pilot testimonial — Aurangzeb */}
        <div className="mt-8 glass rounded-3xl p-10 md:p-12 border border-brand-500/20 glow relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center text-white font-black text-3xl shrink-0">
              A
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex justify-center md:justify-start gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />)}
              </div>
              <blockquote className="text-xl text-gray-200 font-light leading-relaxed mb-4">
                "SalonOS has completely transformed how we manage our salon. Zero waiting time,
                fully automated bookings, and our customers love the live queue feature."
              </blockquote>
              <div>
                <div className="font-bold text-white">Aurangzeb Alamgir</div>
                <div className="text-sm text-gray-400">Owner, Sam's Creation – The Unisex Salon · 14+ Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── COMPANY SECTION ─────────────────────────── */
function CompanySection() {
  return (
    <section id="company" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-brand-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gold-900/10 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* About Company */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-brand-400 text-sm font-medium mb-5 bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20">
              <Building2 className="w-4 h-4" /> About the Company
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white">Omkesh AI Lab</h2>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Helping startups and businesses build AI-powered systems, modern websites, and scalable SaaS applications.
            </p>
            <p className="text-gray-500 leading-relaxed mb-8">
              We don't just talk about technology — <span className="text-white font-medium">we build real, working products that solve real problems.</span>
            </p>
            <div className="space-y-3">
              {[
                { icon: '⚡', title: 'Automation that saves time', desc: 'Intelligent workflows that work while you sleep' },
                { icon: '📈', title: 'Systems that scale', desc: 'Multi-tenant architecture built for growth' },
                { icon: '❤️', title: 'Products users actually love', desc: 'Design-first development for real user delight' },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Founder Message */}
          <div className="glass rounded-3xl p-8 border border-brand-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-gold-400 text-xs font-semibold mb-5 bg-gold-500/10 px-3 py-1.5 rounded-full border border-gold-500/20">
                👑 Founder's Message
              </div>

              {/* Large quote */}
              <div className="text-5xl text-brand-500/30 font-serif leading-none mb-2">"</div>

              <blockquote className="text-gray-300 leading-relaxed mb-6 text-sm">
                Most ideas fail not because they are bad — but because they never get built properly.
                <br /><br />
                At Omkesh AI Lab, our goal is simple: <span className="text-white font-semibold">turn ideas into real, working products.</span>
                <br /><br />
                We focus on execution over theory — building SaaS platforms, AI systems, and applications that actually deliver results.
                <br /><br />
                SalonOS is one of those products — designed not just as an app, but as a <span className="text-brand-400 font-medium">scalable business system for salons.</span>
              </blockquote>

              <div className="flex items-center gap-4 pt-5 border-t border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center text-white font-black text-xl shrink-0">
                  O
                </div>
                <div>
                  <div className="font-bold text-white">Omkesh</div>
                  <div className="text-sm text-brand-400">Founder & CEO, Omkesh AI Lab</div>
                </div>
                <div className="ml-auto glass border border-gold-500/20 rounded-xl px-3 py-1.5 text-xs text-gold-400 font-medium">
                  Verified Founder
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FINAL CTA ─────────────────────────────── */
function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-brand-700/15 rounded-full blur-[120px]" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm text-gold-400 border border-gold-500/30">
          <TrendingUp className="w-4 h-4" /> Scale from 1 salon to thousands
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
          Ready to{' '}
          <span className="gradient-text">Transform</span> Your Salon?
        </h2>
        <p className="text-xl text-gray-400 mb-3">
          Join the next generation of smart salons using SalonOS.
        </p>
        <p className="text-sm text-gray-500 mb-10">No credit card required. Setup in minutes.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login/owner"
            className="group flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white px-10 py-4 rounded-xl font-bold text-lg glow transition-all duration-200"
          >
            <Rocket className="w-5 h-5" />
            Start Free Trial Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login/customer"
            className="glass border border-white/20 hover:border-brand-400/60 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-200"
          >
            See Customer App
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-400 flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">SalonOS</span>
            </div>
            <p className="text-xs text-gray-600 ml-10">by Omkesh AI Lab</p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#company" className="hover:text-white transition-colors">Company</a>
            <Link to="/login/customer" className="hover:text-white transition-colors">Customer App</Link>
            <Link to="/login/owner" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/login/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 Omkesh AI Lab. Built for Indian Salons.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────── EXPORT ─────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <Hero />
      <ValueSection />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CompanySection />
      <CTA />
      <Footer />
    </div>
  );
}
