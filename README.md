# indic8

An open-source revenue intelligence platform and financial studio for modern internet businesses. Aggregate, normalize, and visualize subscription and transaction metrics across multiple payment gateways in a single self-hosted dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fhoshine-labs%2Findic8)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com)

---

## Overview

indic8 connects to your payment providers, normalizes incoming financial data into a unified domain model, and gives you real-time metrics including Monthly Recurring Revenue (MRR), Net Revenue, Customer Lifetime Value, Churn, and Geographic Distribution.

It also includes an integrated Studio mode for exporting charts, social graphics, and financial reports.

### Key Capabilities

- Multi-Provider Ingestion: Connect multiple payment accounts across different providers simultaneously.
- Unified Financial Engine: Real-time currency conversion, normalized MRR calculation, refund tracking, and customer reconciliation.
- Studio and Export Engine: High-resolution export for social sharing, investor updates, and financial reviews.
- Security-First Architecture: Provider credentials encrypted at rest with AES-256-GCM.
- Self-Hosted and Privacy-Centric: Complete control over your customer and financial data.

---

## Supported Providers

| Provider | Revenue Tracking | Subscriptions & MRR | Refunds | Customer Analytics | Geographic Breakdown |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Stripe | Yes | Yes | Yes | Yes | Yes |
| Lemon Squeezy | Yes | Yes | Yes | Yes | Yes |
| Polar.sh | Yes | Yes | No | Yes | Yes |
| RevenueCat | Yes | Yes | Yes | Yes | No |
| Paddle | Yes | Yes | Yes | Yes | Yes |
| Dodo Payments | Yes | Yes | Yes | Yes | Yes |
| Creem | Yes | Yes | Yes | Yes | Yes |
| Apple App Store | Yes | Yes | Yes | Yes | Yes |
| Google Play | Yes | Yes | Yes | Yes | Yes |

---

## Tech Stack

- Framework: Next.js 16 (App Router, Turbopack, React 19)
- Language: TypeScript
- Styling: Tailwind CSS v4
- Charts: ECharts, Recharts, Custom Canvas Visualizers
- Animations: Motion / Framer Motion, NumberFlow
- Database and Auth: PostgreSQL (Supabase), Better Auth
- Cryptography: AES-256-GCM for credential encryption

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, pnpm, or yarn
- A PostgreSQL database (e.g. Supabase, Neon, or local Postgres)

### 1. Clone the Repository

```bash
git clone https://github.com/hoshine-labs/indic8.git
cd indic8
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET="your-32-plus-character-secret"
BETTER_AUTH_URL="http://localhost:3000"

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/indic8"
SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-public-key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"

# Credential Encryption (32-character AES-256 key)
ENCRYPTION_SECRET="your-32-character-secret-master-key"
```

### 4. Database Setup

Apply the SQL schema located in `supabase/schema.sql` to your Supabase or PostgreSQL database.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### Deploy to Vercel

The easiest way to deploy indic8 is using Vercel:

1. Click the "Deploy with Vercel" button above or import the repository in the Vercel Dashboard.
2. Set the environment variables in the Vercel project settings.
3. Deploy.

---

## Project Structure

```
indic8/
├── src/
│   ├── app/                 # Next.js App Router pages and API routes
│   ├── components/
│   │   ├── activity/        # Real-time transaction feed
│   │   ├── charts/          # Interactive chart components
│   │   ├── dashboard/       # Main revenue dashboard views
│   │   ├── evilcharts/      # High-performance chart wrappers
│   │   ├── gallery/         # Exported assets and templates
│   │   ├── onboarding/      # Provider connection setup flow
│   │   ├── products/        # Product-level breakdown and metrics
│   │   ├── providers/       # Gateway management and status
│   │   ├── studio/          # Canvas graphic designer and exporter
│   │   └── ui/              # Reusable UI component library
│   ├── context/             # Theme and layout context providers
│   ├── lib/
│   │   ├── auth/            # Better Auth client and server config
│   │   ├── db/              # Database client
│   │   ├── domain/          # Financial normalization types and math
│   │   ├── metrics/         # MRR, ARR, churn calculation engines
│   │   ├── providers/       # Adapter implementations for each gateway
│   │   └── security/        # AES-256-GCM encryption utilities
│   └── types/               # TypeScript definitions
├── supabase/                # Database migrations and schema definitions
└── public/                  # Static assets and icons
```

---

## Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Compiles and builds the application for production.
- `npm run start`: Runs the built production server.
- `npm run lint`: Runs ESLint across the codebase.

---

## Contributing

Contributions are welcome. Please open an issue to discuss proposed changes or submit a pull request with your improvements.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Powered by [Vercel](https://vercel.com).
