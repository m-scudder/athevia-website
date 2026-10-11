# Athevia Analytics Dashboard

The private dashboard lives at `/dashboard/` and is mirrored into `docs/dashboard/` for GitHub Pages.

## Current architecture

```text
Athevia iOS / Watch
        |
        v
analytics-ingest Edge Function
        |
        v
public.analytics_events
        |
        +-------------------+
        |                   |
        v                   v
latest cloud backups    semantic events
        |                   |
        +---------+---------+
                  v
      analytics-dashboard Edge Function
                  |
                  v
      authenticated admin dashboard
```

The browser uses only the Supabase publishable key. No service-role key is shipped to the website.

## Authorization

The dashboard requires a valid Supabase Auth session. The `analytics-dashboard` Edge Function then verifies that the authenticated user exists in `public.analytics_admins`.

Normal athlete accounts cannot read analytics data even if they discover the dashboard URL.

Direct client access to `analytics_events` and `analytics_admins` is explicitly denied. Edge Functions use the service role server-side after authorization.

## Athlete plan drill-down

The dashboard can open an athlete and display:

- plan weeks
- plan status and generation reason
- week completion percentage
- planned workouts
- workout status (planned/completed/skipped)
- prescribed distance or duration
- structured workout steps
- completion timestamp
- recorded aggregate distance/duration when available

The dashboard intentionally does not return:

- GPS route points
- heart-rate samples or detailed health metrics
- pain/recovery response details
- coach conversation text
- free-form athlete notes

The latest immutable `backup_revisions.snapshot` is the source for plan detail.

## Event ingestion

The updated iOS app sends allow-listed semantic product events to `analytics-ingest`.

The Edge Function derives `user_id` from the verified JWT. The client cannot choose another athlete's identity.

Allowed properties are explicitly allow-listed. Arbitrary JSON and free-form strings are rejected.

Existing cloud plan data is available immediately. The semantic event stream begins populating when users run an app build containing `SupabaseAnalyticsTransport`.

## Dashboard sign-in

The static dashboard uses Supabase passwordless email sign-in. The email must belong to an authorized admin account.

If the deployment host changes, add the dashboard URL to the Supabase Auth redirect allowlist before relying on email magic-link redirects.

## Source locations

Website:

- `dashboard/index.html`
- `assets/dashboard.js`
- `assets/dashboard-provider.js`
- `assets/dashboard.css`
- mirrored `docs/` copies for GitHub Pages

App/backend:

- `Athevia/Data/Analytics/SupabaseAnalyticsTransport.swift`
- `supabase/functions/analytics-ingest/`
- `supabase/functions/analytics-dashboard/`
- `supabase/migrations/20261011064013_create_custom_analytics_backend.sql`
- `supabase/migrations/20261011064658_explicitly_deny_direct_analytics_access.sql`
