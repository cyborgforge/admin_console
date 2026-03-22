This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase Hybrid Data Flow

This project uses a hybrid Supabase approach:

- Client-side Supabase is used for authentication/session and simple reads.
- Next.js API routes are used for create/update operations and business logic validation.

### Environment setup

1. Create a local env file from `.env.local.example`.
2. Ensure these variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://sgajtdrusjzrmjygxklo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_x0jUmU1husTPDW7MwigiMA_J8AgTqMf
```

Optional:

```bash
# Defaults to "quotations"
NEXT_PUBLIC_SUPABASE_QUOTATIONS_TABLE=quotations
SUPABASE_QUOTATIONS_TABLE=quotations

# Recommended for secure server-side write operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional metadata reference for current Supabase JWT key ID
SUPABASE_JWT_KEY_ID=246ae551-0227-4405-b91f-824d8d43e9fe
```

### Apply SQL migration (quotations + RLS)

Run the SQL in:

- `supabase/migrations/202603190001_create_quotations_with_rls.sql`

This migration creates the quotations table, update trigger, and row-level security policies for authenticated users.

### Seed dummy quotations

Run the SQL in:

- `supabase/migrations/202603190002_seed_dummy_quotations.sql`

Notes:

- The seed inserts the full dummy quotation set.
- It targets the first existing user in `auth.users`.
- It uses `on conflict (id) do nothing`, so re-running is safe.

### Auth routes

- `/auth/login` for email/password sign in
- `/auth/signup` for email/password account creation

Dashboard routes are guarded by a client-side auth gate and redirect unauthenticated users to login.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
