'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '@/services/public.service';

/* ─── tiny hooks ──────────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 2000) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!target || started.current) return;
    started.current = true;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const id = setInterval(() => {
      current += increment;
      if (current >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/* ─── animation presets ──────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }),
} as unknown as Variants;
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.7 } } };

/* ─── data ────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🎯',
    title: 'Smart Loyalty Points',
    desc: 'Earn points automatically on every transaction. Your rewards grow with every purchase.',
    color: 'from-violet-500 to-indigo-600',
    bg: 'bg-violet-500/10',
  },
  {
    icon: '📱',
    title: 'QR Code Payments',
    desc: 'Scan & pay instantly. No cash, no card — just your phone and a loyalty boost.',
    color: 'from-sky-500 to-cyan-600',
    bg: 'bg-sky-500/10',
  },
  {
    icon: '🏆',
    title: 'Loyalty Tiers',
    desc: 'Climb from Bronze to Platinum. Higher tiers unlock bigger rewards & exclusive perks.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/10',
  },
  {
    icon: '💳',
    title: 'Digital Wallet',
    desc: 'Fund your wallet with card, bank transfer, or USSD. Manage your balance effortlessly.',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: '🔒',
    title: 'Bank-Grade Security',
    desc: '2FA, encrypted PINs, device tracking, and real-time fraud monitoring keep you safe.',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/10',
  },
  {
    icon: '⚡',
    title: 'Instant Notifications',
    desc: 'Get real-time alerts for every transaction, reward earned, and account update.',
    color: 'from-purple-500 to-fuchsia-600',
    bg: 'bg-purple-500/10',
  },
];

const TIERS = [
  { name: 'Bronze', color: '#CD7F32', bg: 'from-amber-700 to-amber-900', ring: 'ring-amber-600', reward: '1%', min: '₦0' },
  { name: 'Silver', color: '#94A3B8', bg: 'from-slate-400 to-slate-600', ring: 'ring-slate-400', reward: '2%', min: '₦50K' },
  { name: 'Gold', color: '#F59E0B', bg: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400', reward: '3.5%', min: '₦200K' },
  { name: 'Platinum', color: '#6366f1', bg: 'from-indigo-400 to-violet-600', ring: 'ring-indigo-400', reward: '5%', min: '₦500K' },
];

const STEPS = [
  { n: '01', title: 'Create Account', desc: 'Enter your name, email, and a secure password. Optionally add your phone number to get started.' },
  { n: '02', title: 'Fund Your Wallet', desc: 'Top up via card, bank transfer, USSD or Monnify. Instant crediting.' },
  { n: '03', title: 'Pay & Earn', desc: 'Shop with your QR code or wallet. Watch loyalty points stack up automatically.' },
];

/* ─── NavBar ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-md shadow-lg shadow-black/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="ASR Loyalty" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
            ASR<span className="text-indigo-500">Loyalty</span>
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          {['Features', 'How It Works', 'Tiers', 'About'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-4 py-2">
            Log in
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:-translate-y-0.5">
            Get Started →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className="sr-only">Menu</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-4 pb-4"
          >
            <div className="flex flex-col gap-2 pt-3">
              {['Features', 'How It Works', 'Tiers', 'About'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm">
                  {item}
                </a>
              ))}
              <hr className="border-gray-100 dark:border-gray-800 my-1" />
              <Link href="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm">Log in</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm">Get Started →</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Stat counter card ───────────────────────────────────────────────────── */
function StatCard({ label, value, prefix = '', isAmount = false }: { label: string; value: number; prefix?: string; isAmount?: boolean }) {
  const counted = useCountUp(value);
  const display = isAmount ? formatBig(counted) : counted.toLocaleString();
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
        {prefix}{display}
      </span>
      <span className="text-sm text-slate-400 font-medium">{label}</span>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { data: stats } = useQuery({
    queryKey: ['landing', 'stats'],
    queryFn: () => publicService.getLandingStats(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Gradient blobs */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 right-1/4 w-80 h-80 bg-violet-400/20 dark:bg-violet-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] [background-size:40px_40px] pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              The Smart Loyalty Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight mb-6">
            <span className="text-gray-900 dark:text-white">Every Purchase</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
              Earns You More
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ASR Loyalty turns your everyday spending into rewards. Earn points, unlock tiers, and pay smarter with your digital wallet — all in one app.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/40 transition-all hover:shadow-indigo-500/60 hover:-translate-y-1 text-base">
              Start Earning Free
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-8 py-4 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all text-base">
              Log In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fadeIn} initial="hidden" animate="visible"
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 dark:text-gray-500">
            {['🔒 Bank-Grade Security', '⚡ Instant Setup', '🌍 Available Everywhere', '✅ No Monthly Fees'].map((b) => (
              <span key={b} className="font-medium">{b}</span>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating cards */}
        <div className="absolute right-4 lg:right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 z-10">
          {[
            { label: 'Points earned', value: '+250 pts', color: 'text-emerald-500', icon: '🎯' },
            { label: 'Tier upgraded!', value: 'GOLD 🏆', color: 'text-amber-500', icon: '📈' },
            { label: 'Cashback today', value: '₦1,240', color: 'text-indigo-500', icon: '💰' },
          ].map((card, i) => (
            <motion.div key={card.label}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{ delay: 0.6 + i * 0.15, duration: 0.5, y: { delay: 1 + i * 0.3, duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-xl shadow-black/10 flex items-center gap-3 w-52">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                <p className={`font-black text-sm ${card.color}`}>{card.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Left floating card */}
        <div className="absolute left-4 lg:left-12 top-1/2 -translate-y-1/2 hidden lg:block z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
            transition={{ delay: 0.8, duration: 0.5, y: { delay: 1.2, duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-xl shadow-black/10 w-56">
            <p className="text-xs text-gray-400 font-medium mb-2">Your Wallet</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">₦24,580</p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs text-emerald-500 font-semibold">+₦1,200 today</p>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs font-medium">Scroll to explore</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>

      {/* ── LIVE STATS ───────────────────────────────────────────────────── */}
      <section className="relative py-20 bg-[#080D1A] dark:bg-[#111827] overflow-hidden border-y border-white/[0.06] dark:border-indigo-500/[0.15]">
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-indigo-600/25 dark:bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-violet-600/25 dark:bg-violet-500/20 rounded-full blur-3xl" />
        </div>
        {/* Dot grid */}
        <div className="absolute inset-0 [background-image:radial-gradient(rgba(99,102,241,0.1)_1px,transparent_1px)] dark:[background-image:radial-gradient(rgba(99,102,241,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center text-indigo-400/70 text-xs font-bold uppercase tracking-[0.2em] mb-12">
            Platform in numbers
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Active Users', value: stats?.totalUsers ?? 0, icon: '👥', isAmount: false },
              { label: 'Transactions Done', value: stats?.totalTransactions ?? 0, icon: '⚡', isAmount: false },
              { label: 'Rewards Given', value: stats?.totalRewardsGiven ?? 0, icon: '🎁', isAmount: true },
            ].map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="relative bg-white/[0.05] dark:bg-white/[0.07] border border-white/[0.1] dark:border-indigo-400/[0.2] rounded-2xl p-8 flex flex-col items-center text-center backdrop-blur-sm hover:bg-white/[0.1] hover:border-indigo-400/50 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 dark:bg-indigo-500/25 border border-indigo-500/30 dark:border-indigo-400/40 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <StatCard label={item.label} value={item.value} isAmount={item.isAmount} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">What we offer</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">Everything you need to reward smarter</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">A complete loyalty ecosystem built for forward-thinking businesses and their customers.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center text-2xl mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Simple process</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">Up and earning in 3 steps</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-indigo-300 dark:via-indigo-700 to-transparent" />

            {STEPS.map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="flex flex-col items-center text-center relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-indigo-500/40 mb-6 relative z-10">
                  {s.n}
                </div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOYALTY TIERS ────────────────────────────────────────────────── */}
      <section id="tiers" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Reward tiers</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">The higher you go, the more you earn</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Spend more, tier up, and unlock increasingly generous reward multipliers.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier, i) => (
            <motion.div key={tier.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              className={`relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center ring-2 ring-transparent hover:ring-offset-2 dark:hover:ring-offset-gray-950 hover:${tier.ring} transition-all hover:-translate-y-1`}>
              {/* Tier badge */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.bg} flex items-center justify-center mb-4 shadow-lg`}>
                <span className="text-2xl">{'⭐'.repeat(i + 1)}</span>
              </div>
              <h3 className="font-black text-xl mb-1" style={{ color: tier.color }}>{tier.name}</h3>
              <p className="text-xs text-gray-400 font-medium mb-4">Starts at {tier.min} spent</p>
              <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Reward rate</p>
                <p className="text-3xl font-black" style={{ color: tier.color }}>{tier.reward}</p>
                <p className="text-xs text-gray-400 mt-0.5">per transaction</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-12 sm:p-16 shadow-2xl shadow-indigo-500/30 overflow-hidden">
            <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to start earning?</h2>
              <p className="text-indigo-100/80 mb-10 text-base max-w-lg mx-auto">
                Join thousands of users already turning everyday transactions into meaningful rewards.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-indigo-600 font-black px-8 py-4 rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 text-base">
                  Create Free Account
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl transition-all text-base">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <section id="about" className="relative py-28 px-4 sm:px-6 bg-[#080D1A] dark:bg-[#0B1120] overflow-hidden border-y border-white/[0.06]">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-800/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative max-w-6xl mx-auto">

          {/* Top label */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-400">Who we are</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-500" />
          </motion.div>

          {/* Big company name */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
            className="text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-4">
              <Image src="/logo.svg" alt="ASR Loyalty" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-xs font-bold text-indigo-400/70 uppercase tracking-widest">ASR Loyalty</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              AS-SUDAISY
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                RESOURCES LIMITED
              </span>
            </h2>
          </motion.div>

          {/* What they do pills */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
            className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {[
              { label: 'Plywood & Timber', icon: '🪵' },
              { label: 'Foodstuff & Provisions', icon: '🛒' },
              { label: 'Loyalty Rewards', icon: '🎯' },
            ].map((tag) => (
              <span key={tag.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-300 text-sm font-medium">
                <span>{tag.icon}</span>
                {tag.label}
              </span>
            ))}
          </motion.div>

          {/* Mission quote */}
          <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
            className="text-center text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-16">
            A trusted Nigerian trading company dealing in{' '}
            <span className="text-white font-semibold">plywood, timber</span> and{' '}
            <span className="text-white font-semibold">foodstuff</span> — now rewarding every
            purchase through the <span className="text-indigo-400 font-semibold">ASR Loyalty</span> platform.
          </motion.p>

          {/* Contact strip */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                label: 'Office',
                value: 'Abimbola St, Isolo Road, Isolo, Lagos',
                color: 'from-indigo-500 to-blue-600',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                label: 'Phone',
                value: '+234 916 721 7393',
                href: 'tel:+2349167217393',
                color: 'from-violet-500 to-purple-600',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                label: 'Registered Name',
                value: 'AS-SUDAISY RESOURCES LIMITED',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                label: 'Country',
                value: 'Federal Republic of Nigeria',
                color: 'from-amber-500 to-orange-600',
              },
            ].map((item) => (
              <div key={item.label}
                className="group relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all duration-300 overflow-hidden">
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.06] transition-opacity rounded-2xl`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold text-slate-200 hover:text-indigo-400 transition-colors leading-snug block">
                    {item.value}
                  </a>
                ) : (
                  <p className="text-sm font-semibold text-slate-200 leading-snug">{item.value}</p>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="ASR Loyalty" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="font-extrabold text-gray-900 dark:text-white">ASR<span className="text-indigo-500">Loyalty</span></span>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-1 text-sm text-gray-400">
              <a href="tel:+2349167217393" className="hover:text-indigo-500 transition-colors">+234 916 721 7393</a>
              <span>Abimbola street, Isolo road, Isolo, Lagos</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} ASR Loyalty. Rewards that move with you.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-indigo-500 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-indigo-500 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
