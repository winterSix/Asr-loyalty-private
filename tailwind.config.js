/** @type {import('tailwindcss').Config} */
module.exports = {
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
        },
        accent: {
          yellow: '#F5A623',
          orange: '#FF6B35',
          purple: '#9B59B6',
          navy: '#1d3557',
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
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}



