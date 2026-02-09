# ASR Loyalty Web Frontend

Next.js 14 web application for ASR Loyalty platform with authentication integration.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI component library
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:9000/api
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
asr-loyalty.web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   ├── verify-otp/   # OTP verification page
│   │   ├── dashboard/    # Dashboard page
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Reusable components
│   ├── config/           # Configuration files
│   │   └── api.ts        # API client setup
│   ├── services/         # API services
│   │   └── auth.service.ts
│   ├── store/            # Zustand stores
│   │   └── auth.store.ts
│   ├── providers/        # Context providers
│   └── theme.ts          # MUI theme configuration
└── middleware.ts         # Next.js middleware for route protection
```

## Features

- ✅ User registration with phone number
- ✅ Phone number verification via OTP
- ✅ User login
- ✅ JWT token management with auto-refresh
- ✅ Protected routes
- ✅ Responsive design with Material-UI
- ✅ Form validation with Zod
- ✅ Toast notifications

## Color Theme

The application uses the following brand colors:
- Primary: `#3f37c9`
- Secondary: `#4361ee`
- Tertiary: `#4895ef`

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:9000/api)
