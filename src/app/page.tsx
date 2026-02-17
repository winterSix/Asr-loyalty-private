'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import {
  FiWallet,
  FiGift,
  FiStar,
  FiShield,
  FiQrCode,
  FiTrendingUp,
  FiCheckCircle,
  FiArrowRight,
  FiSmartphone,
  FiCreditCard,
  FiUsers,
  FiBarChart,
  FiZap,
  FiLock,
  FiHeart,
  FiTarget,
  FiGlobe,
  FiPlay,
  FiAward,
  FiCheck,
} from '@/utils/icons';

// Animated counter component
function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''));
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += numericValue / steps;
      if (current >= numericValue) {
        current = numericValue;
        clearInterval(timer);
      }
      setDisplayValue(Math.floor(current).toLocaleString());
    }, stepDuration);

    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}

// Floating particles background component
// Uses useMemo + mounted guard to avoid hydration mismatch from Math.random()
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      background: `rgba(${Math.random() > 0.5 ? '67, 97, 238' : '72, 149, 239'}, ${Math.random() * 0.3 + 0.1})`,
      xOffset: Math.random() * 20 - 10,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    }));
  }, [mounted]);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.width,
            height: p.height,
            left: p.left,
            top: p.top,
            background: p.background,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.xOffset, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// 3D tilt card component
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { scrollYProgress } = useScroll();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  // Redirect authenticated users to dashboard (only if actual token exists)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasToken = !!(localStorage.getItem('accessToken') || Cookies.get('accessToken'));
    if (isAuthenticated && hasToken) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const benefitsRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });
  const howItWorksInView = useInView(howItWorksRef, { once: true, amount: 0.1 });
  const benefitsInView = useInView(benefitsRef, { once: true, amount: 0.1 });
  const testimonialsInView = useInView(testimonialsRef, { once: true, amount: 0.2 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.3 });

  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.9]);

  const features = [
    {
      icon: <FiWallet className="w-7 h-7" />,
      title: 'Digital Wallet',
      description: 'Secure wallet with instant funding and seamless transactions across all channels',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: <FiGift className="w-7 h-7" />,
      title: 'Smart Rewards',
      description: 'AI-powered reward suggestions based on your spending patterns and preferences',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: <FiStar className="w-7 h-7" />,
      title: 'Loyalty Tiers',
      description: 'Progress through Bronze, Silver, Gold, and Platinum with escalating benefits',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      icon: <FiQrCode className="w-7 h-7" />,
      title: 'QR Payments',
      description: 'Lightning-fast QR code payments with instant reward credits on every scan',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      icon: <FiShield className="w-7 h-7" />,
      title: 'Bank-Grade Security',
      description: 'Enterprise encryption, 2FA authentication, and real-time fraud detection',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      icon: <FiBarChart className="w-7 h-7" />,
      title: 'Live Analytics',
      description: 'Real-time dashboards tracking spending, rewards, and tier progression',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up in seconds with email verification and start your rewards journey',
      icon: <FiUsers className="w-7 h-7" />,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      number: '02',
      title: 'Fund Your Wallet',
      description: 'Add money securely using bank transfer, card, or mobile payment methods',
      icon: <FiCreditCard className="w-7 h-7" />,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      number: '03',
      title: 'Earn Points',
      description: 'Every transaction automatically earns loyalty points and tier progress',
      icon: <FiGift className="w-7 h-7" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      number: '04',
      title: 'Redeem & Enjoy',
      description: 'Convert points to cashback, discounts, and exclusive partner rewards',
      icon: <FiAward className="w-7 h-7" />,
      color: 'from-pink-500 to-rose-500',
    },
  ];

  const testimonials = [
    {
      name: 'Adunni Bakare',
      role: 'Business Owner',
      content: 'ASR Loyalty transformed how I reward my customers. The QR payment system is incredibly fast and my repeat customer rate increased by 45%.',
      avatar: 'AB',
      rating: 5,
    },
    {
      name: 'Emeka Okonkwo',
      role: 'Frequent Shopper',
      content: "I've earned over 50,000 points in just 3 months! The tier system keeps me motivated and the rewards are actually worthwhile unlike other programs.",
      avatar: 'EO',
      rating: 5,
    },
    {
      name: 'Fatima Mohammed',
      role: 'Restaurant Manager',
      content: 'Setting up the loyalty program for our restaurant was seamless. Our customers love scanning QR codes and watching their points grow in real-time.',
      avatar: 'FM',
      rating: 5,
    },
  ];

  const benefits = [
    {
      icon: <FiZap className="w-6 h-6" />,
      title: 'Instant Transactions',
      description: 'Lightning-fast payments processed in under 2 seconds',
    },
    {
      icon: <FiLock className="w-6 h-6" />,
      title: 'Secure & Protected',
      description: 'Bank-grade encryption and OTP protection on all transactions',
    },
    {
      icon: <FiSmartphone className="w-6 h-6" />,
      title: 'Mobile First',
      description: 'Access your wallet and rewards anywhere, anytime',
    },
    {
      icon: <FiGlobe className="w-6 h-6" />,
      title: 'Wide Acceptance',
      description: 'Use at thousands of partner locations nationwide',
    },
    {
      icon: <FiHeart className="w-6 h-6" />,
      title: 'Personalized',
      description: 'Rewards tailored to your spending habits and preferences',
    },
    {
      icon: <FiTarget className="w-6 h-6" />,
      title: 'Goal Tracking',
      description: 'Set savings goals and track your progress in real-time',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isNavScrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-black/[0.03] border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-white font-black text-lg">A</span>
                </div>
              </div>
              <span className={`text-xl font-black transition-colors duration-300 ${isNavScrolled ? 'text-gray-900' : 'text-white'}`}>
                ASR Loyalty
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`hidden sm:inline-flex px-5 py-2.5 font-semibold rounded-xl transition-all duration-300 ${
                  isNavScrolled
                    ? 'text-gray-700 hover:text-primary hover:bg-primary/5'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 bg-white text-primary font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-200 text-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 animated-gradient-bg" />

        {/* Decorative morphing shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              borderRadius: ['60% 40% 30% 70% / 60% 30% 70% 40%', '30% 60% 70% 40% / 50% 60% 30% 60%', '60% 40% 30% 70% / 60% 30% 70% 40%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{
              borderRadius: ['30% 60% 70% 40% / 50% 60% 30% 60%', '60% 40% 30% 70% / 60% 30% 70% 40%', '30% 60% 70% 40% / 50% 60% 30% 60%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-accent-cyan/10 blur-3xl"
          />
          <motion.div
            animate={{
              borderRadius: ['50% 50% 40% 60% / 40% 60% 50% 50%', '40% 60% 50% 50% / 50% 50% 40% 60%', '50% 50% 40% 60% / 40% 60% 50% 50%'],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-accent-purple/10 blur-3xl"
          />
        </div>

        {/* Floating particles */}
        <FloatingParticles />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={heroInView ? { scale: 1, rotate: 0 } : {}}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-8"
            >
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-semibold shadow-lg">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                Trusted by 10,000+ customers
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-6xl lg:text-[80px] font-black text-white mb-6 leading-[1.05] tracking-tight"
            >
              <span className="block">Earn More With</span>
              <span className="block mt-2">
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 bg-clip-text text-transparent">
                    Every Transaction
                  </span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={heroInView ? { width: '100%' } : {}}
                    transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -bottom-2 left-0 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  />
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              The smartest loyalty platform that rewards you for every purchase.
              Earn points, climb tiers, and unlock exclusive perks automatically.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-white text-primary font-bold rounded-2xl text-lg shadow-2xl shadow-black/20 hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                Start Earning Now
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="group px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-semibold hover:bg-white/10 transition-all text-lg flex items-center gap-2"
              >
                <FiPlay className="w-5 h-5" />
                See How It Works
              </Link>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            >
              {[
                { value: '10000', suffix: '+', label: 'Active Users', icon: <FiUsers className="w-5 h-5" /> },
                { value: '50', prefix: '\u20A6', suffix: 'M+', label: 'Transactions Processed', icon: <FiTrendingUp className="w-5 h-5" /> },
                { value: '1000000', suffix: '+', label: 'Points Earned', icon: <FiAward className="w-5 h-5" /> },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1 + index * 0.15, duration: 0.5 }}
                  className="relative group"
                >
                  <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-center gap-2 text-white/60 mb-2">
                      {stat.icon}
                    </div>
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                    </div>
                    <div className="text-sm text-white/50 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Scroll</span>
            <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1 h-1 bg-white/60 rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 lg:py-32 bg-gray-50 relative">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={featuresInView ? { opacity: 1, scale: 1 } : {}}
              className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-sm font-bold rounded-full mb-4 border border-primary/10"
            >
              FEATURES
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-5 tracking-tight">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              A complete loyalty ecosystem designed to maximize your rewards
              and simplify every transaction
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <TiltCard>
                  <div className="group bg-white rounded-2xl p-7 border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500 h-full">
                    <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center ${feature.iconColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed text-[15px]">{feature.description}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={howItWorksInView ? { opacity: 1, scale: 1 } : {}}
              className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-sm font-bold rounded-full mb-4 border border-primary/10"
            >
              HOW IT WORKS
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-5 tracking-tight">
              Four Simple Steps
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Get started in minutes and begin earning rewards immediately
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden lg:block absolute top-[60px] left-[12%] right-[12%] h-[2px]">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={howItWorksInView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.5, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 origin-left"
              />
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative text-center group"
              >
                {/* Step number circle */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`relative mx-auto w-[120px] h-[120px] mb-8`}
                >
                  {/* Outer ring */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  {/* Inner circle */}
                  <div className={`absolute inset-3 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                    <span className="text-3xl font-black">{step.number}</span>
                  </div>
                  {/* Icon badge */}
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-100">
                    <span className={`bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                      {step.icon}
                    </span>
                  </div>
                </motion.div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-[15px] max-w-[240px] mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-24 lg:py-32 relative overflow-hidden">
        {/* Animated dark gradient background */}
        <div className="absolute inset-0 animated-gradient-bg" />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[20%] -right-[200px] w-[500px] h-[500px] border border-white/5 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-[100px] -left-[200px] w-[600px] h-[600px] border border-white/5 rounded-full"
          />
        </div>

        <FloatingParticles />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={benefitsInView ? { opacity: 1, scale: 1 } : {}}
              className="inline-block px-4 py-1.5 bg-white/10 text-white text-sm font-bold rounded-full mb-4 border border-white/10"
            >
              WHY ASR LOYALTY
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight">
              Built for You
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Experience the future of loyalty rewards with cutting-edge technology
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={benefitsInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-7 hover:bg-white/[0.1] hover:border-white/20 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-accent-cyan/30 rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-white/50 leading-relaxed text-[15px]">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 lg:py-32 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={testimonialsInView ? { opacity: 1, scale: 1 } : {}}
              className="inline-block px-4 py-1.5 bg-primary/5 text-primary text-sm font-bold rounded-full mb-4 border border-primary/10"
            >
              TESTIMONIALS
            </motion.span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-5 tracking-tight">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              See what our customers are saying about ASR Loyalty
            </p>
          </motion.div>

          {/* Testimonial cards */}
          <div className="max-w-4xl mx-auto">
            <div className="relative min-h-[280px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-1 mb-6">
                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                      <FiStar key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 italic">
                    &ldquo;{testimonials[activeTestimonial].content}&rdquo;
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-lighter rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                      {testimonials[activeTestimonial].avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{testimonials[activeTestimonial].name}</p>
                      <p className="text-gray-400 font-medium">{testimonials[activeTestimonial].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`transition-all duration-300 rounded-full ${
                    activeTestimonial === index
                      ? 'w-8 h-3 bg-primary'
                      : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* CTA card with gradient border */}
            <div className="relative rounded-3xl overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent-cyan to-accent-purple p-[2px] rounded-3xl" style={{
                backgroundSize: '200% 200%',
                animation: 'gradientShift 4s ease infinite',
              }}>
                <div className="w-full h-full bg-gray-900 rounded-3xl" />
              </div>

              {/* Content */}
              <div className="relative bg-gray-900 rounded-3xl p-10 md:p-16">
                {/* Decorative particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-10 left-10 w-2 h-2 bg-primary/30 rounded-full animate-float" />
                  <div className="absolute top-20 right-20 w-3 h-3 bg-accent-cyan/20 rounded-full animate-float-slow" />
                  <div className="absolute bottom-16 left-1/4 w-2 h-2 bg-accent-purple/30 rounded-full animate-float-delayed" />
                </div>

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={ctaInView ? { scale: 1 } : {}}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-primary to-primary-lighter rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/30"
                >
                  <FiGift className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
                  Ready to Start
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    Earning Rewards?
                  </span>
                </h2>
                <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
                  Join thousands of users already earning points on every transaction.
                  It&apos;s free to get started.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="group px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl text-lg shadow-2xl shadow-black/30 hover:shadow-white/10 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
                  >
                    Create Free Account
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 border-2 border-white/20 rounded-2xl text-white font-semibold hover:bg-white/5 transition-all text-lg"
                  >
                    Sign In
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 mt-10 text-gray-500">
                  <div className="flex items-center gap-2 text-sm">
                    <FiCheck className="w-4 h-4 text-emerald-400" />
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FiCheck className="w-4 h-4 text-emerald-400" />
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm hidden sm:flex">
                    <FiCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant setup</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main footer */}
          <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <span className="text-white font-black text-lg">A</span>
                </div>
                <span className="text-xl font-black text-white">ASR Loyalty</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Your all-in-one digital wallet and loyalty rewards platform. Earn more, spend smarter.
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">All systems operational</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors text-[15px]">Features</Link></li>
                <li><Link href="/dashboard/rewards" className="hover:text-white transition-colors text-[15px]">Rewards</Link></li>
                <li><Link href="/dashboard/loyalty" className="hover:text-white transition-colors text-[15px]">Loyalty Tiers</Link></li>
                <li><Link href="/dashboard/wallet" className="hover:text-white transition-colors text-[15px]">Digital Wallet</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors text-[15px]">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors text-[15px]">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors text-[15px]">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors text-[15px]">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Get Started</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/register" className="hover:text-white transition-colors text-[15px]">Create Account</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors text-[15px]">Sign In</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors text-[15px]">Help Center</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="py-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} ASR Loyalty. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
