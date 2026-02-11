# Genesis Terminal

Real-time ad performance analytics dashboard for Genesis Partners clients. Clients log in to view their campaign metrics across Google Ads, Meta, Bing, and TikTok in a unified, dark-themed dashboard.

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **Framer Motion** for animations
- **Recharts** for charts
- **Vercel** for deployment

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd The-Genesis-Terminal
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and keys from Settings > API

### 3. Run the Database Schema

1. Open the Supabase SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the query to create all tables, RLS policies, and indexes

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Create the Admin User

1. In Supabase Dashboard, go to Authentication > Users
2. Create a new user with your admin email and password
3. Then run this SQL in the SQL Editor (replace the UUID with your user's ID):

```sql
INSERT INTO public.user_profiles (id, role, email)
VALUES ('your-auth-user-uuid', 'admin', 'admin@genesispartners.com');
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to Use

### Admin Login

1. Go to `/admin`
2. Log in with your admin credentials
3. You'll be redirected to the client management panel

### Adding Your First Client

1. In the admin panel, click "Add New Client"
2. Fill in company name, contact name, email, and a password
3. This creates both the client record and their login credentials

### Inputting Data

After creating a client, click "Manage" to access their data tabs:

- **Overview Metrics**: Monthly summary (spend, leads, CPA, % changes)
- **Daily Performance**: Day-by-day spend and leads per channel. Supports CSV bulk import
- **Channel Breakdown**: Spend and leads per channel per period
- **Leads**: Individual lead records with name, company, source, status, value. Supports CSV bulk import
- **Pipeline**: Funnel summary or auto-calculate from leads table

### Client Login

1. Clients go to `/login`
2. They log in with the credentials you created
3. They see their Genesis Terminal dashboard with all their data

### Preview as Client

In the admin panel, click "Preview as Client" on any client's page to see exactly what they see.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, used for creating users) |

## Project Structure

```
src/
  app/
    login/          # Client login page
    admin/          # Admin login + dashboard
      clients/      # Client list + detail pages
    terminal/       # Client dashboard
    api/            # API routes for data management
  components/
    ui/             # Shared UI components
    charts/         # Chart components (Recharts)
    dashboard/      # Dashboard-specific components
    admin/          # Admin tab components
  lib/
    supabase/       # Supabase client configuration
    utils.ts        # Formatting utilities
  types/
    database.ts     # TypeScript types for all tables
supabase/
  schema.sql        # Complete database schema with RLS
```

## Security

- Row Level Security (RLS) enabled on all tables
- Clients can only see their own data
- Admin has full read/write access
- API routes verify authentication and role before operations
- Service role key is only used server-side for user creation

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables in Vercel project settings
4. Deploy
