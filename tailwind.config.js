/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3f37c9',
          light: '#4361ee',
          lighter: '#4895ef',
          dark: '#312cad',
          darker: '#2a2596',
        },
        accent: {
          yellow: '#F5A623',
          orange: '#FF6B35',
          purple: '#9B59B6',
          navy: '#1d3557',
          cyan: '#00D4FF',
          pink: '#FF6B9D',
        },
        sidebar: {
          bg: '#0f172a',
          hover: '#1e293b',
          active: '#1e3a5f',
          border: '#1e293b',
          text: '#94a3b8',
          heading: '#64748b',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3f37c9 0%, #4361ee 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #4361ee 0%, #4895ef 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF6B35 0%, #F5A623 100%)',
        'gradient-purple': 'linear-gradient(135deg, #9B59B6 0%, #3f37c9 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(228, 85%, 52%, 0.3) 0, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 56%, 0.2) 0, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.2) 0, transparent 50%), radial-gradient(at 80% 50%, hsla(340, 85%, 66%, 0.15) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(22, 100%, 77%, 0.15) 0, transparent 50%)',
        'gradient-hero': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        'gradient-glow': 'radial-gradient(circle, rgba(67,97,238,0.15) 0%, transparent 70%)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'nav-progress': 'navProgress 1.2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'particle': 'particle 20s linear infinite',
        'glow-ring': 'glowRing 2s ease-in-out infinite',
        'typewriter': 'typewriter 3s steps(40) 1s forwards',
        'blink': 'blink 0.7s step-end infinite',
        'counter': 'counter 2s ease-out forwards',
        'orbit': 'orbit 20s linear infinite',
        'morph': 'morph 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(67,97,238,0.3), 0 0 10px rgba(67,97,238,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(67,97,238,0.5), 0 0 40px rgba(67,97,238,0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        particle: {
          '0%': { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100vh) rotate(720deg)', opacity: '0' },
        },
        glowRing: {
          '0%, 100%': { boxShadow: '0 0 2px rgba(67,97,238,0.4), inset 0 0 2px rgba(67,97,238,0.4)' },
          '50%': { boxShadow: '0 0 10px rgba(67,97,238,0.6), inset 0 0 10px rgba(67,97,238,0.2)' },
        },
        typewriter: {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: 'white' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(150px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(150px) rotate(-360deg)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        navProgress: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(350%)' },
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(67,97,238,0.3)',
        'glow-lg': '0 0 30px rgba(67,97,238,0.4)',
        'glow-purple': '0 0 15px rgba(155,89,182,0.3)',
        'inner-glow': 'inset 0 0 20px rgba(67,97,238,0.1)',
        'sidebar': '4px 0 24px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
