# Athevia Analytics Dashboard

The dashboard UI lives at `/dashboard/` and is intentionally provider-driven.

## Current state

The initial dashboard is a functional UI prototype with demo data. It is **not connected to production user analytics**.

The public website is deployed from `docs/` through GitHub Pages, so real analytics must not be loaded until the dashboard has authenticated admin access and a server-authorized read API.

## Data flow

```text
Athevia iOS / Watch
        |
        v
Authenticated analytics ingestion
        |
        v
Supabase analytics schema
        |
        +--> immutable analytics.events
        +--> aggregated analytics views
        |
        v
Authenticated admin analytics API
        |
        v
Athevia dashboard data provider
```

The browser dashboard must never contain a Supabase service-role key.

## Dashboard provider contract

The UI checks for:

```js
window.AtheviaAnalyticsDataProvider = {
  async loadDashboard({ range, environment }) {
    // Return dashboard data.
  }
}
```

If no provider is present or loading fails, the dashboard falls back to clearly labeled demo data.

Recommended server response:

```json
{
  "summary": {
    "activeUsers": 128,
    "sessions": 342,
    "workoutsCompleted": 219,
    "completionRate": 74,
    "activeUsersTrend": "+12% vs prior 7d",
    "sessionsTrend": "+8% vs prior 7d",
    "workoutsTrend": "+17% vs prior 7d",
    "completionTrend": "+4.2 pts vs prior 7d"
  },
  "activitySeries": [41, 52, 49, 61],
  "onboarding": [
    ["Starting point", 100],
    ["Schedule", 86],
    ["Plan preview", 78],
    ["Completed", 71],
    ["First workout", 54]
  ],
  "sports": [
    { "label": "Running", "value": 48, "color": "#4195ef" }
  ],
  "recentActivity": [],
  "users": [],
  "journey": [],
  "planChanges": [],
  "watch": [],
  "imports": [],
  "events": []
}
```

## Event policy

Analytics should describe product behavior, not duplicate HealthKit.

Allowed examples:

- `app_opened`
- `screen_viewed`
- `onboarding_step_viewed`
- `onboarding_completed`
- `profile_updated`
- `plan_generated`
- `plan_regenerated`
- `workout_prescription_changed`
- `workout_viewed`
- `workout_started`
- `workout_completed`
- `workout_skipped`
- `workout_moved`
- `plan_update_explanation_viewed`
- `send_to_watch_requested`
- `send_to_watch_succeeded`
- `send_to_watch_failed`
- `healthkit_import_started`
- `healthkit_import_completed`
- `healthkit_import_failed`
- `workout_matched`

Allowed structured dimensions include:

- sport
- workout prescription basis
- training phase
- event outcome
- app environment
- plan regeneration reason
- affected workout count
- selected weekly training frequency

Do not send:

- heart rate
- GPS routes
- raw HealthKit samples
- DOB
- pain/free-form feedback text
- coach conversations
- arbitrary user-entered text

## Security requirements before live data

1. Admin authentication is mandatory.
2. Authorization must be enforced server-side.
3. The analytics API should be read-only for the dashboard.
4. Service-role credentials stay server-side.
5. Event ingestion validates a fixed event/property schema.
6. User-level lookup should be available only to approved admin accounts.
7. Aggregate dashboard queries should come from analytics views rather than scanning application backup tables.

## Planned backend work

1. Create the Supabase analytics schema.
2. Create an authenticated ingestion Edge Function.
3. Add an Athevia analytics transport that posts the existing semantic event envelope.
4. Create daily/session/funnel aggregate views.
5. Create an authenticated read Edge Function for this dashboard.
6. Implement `AtheviaAnalyticsDataProvider` against that endpoint.
7. Add admin auth and access-denied states.
8. Replace demo fixtures with live data.
