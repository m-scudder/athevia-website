(() => {
  const root = document.querySelector('[data-dashboard-root]');
  if (!root || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const DEMO = {
    summary: {
      activeUsers: 128,
      sessions: 342,
      workoutsCompleted: 219,
      completionRate: 74,
      activeUsersTrend: '+12% vs prior 7d',
      sessionsTrend: '+8% vs prior 7d',
      workoutsTrend: '+17% vs prior 7d',
      completionTrend: '+4.2 pts vs prior 7d'
    },
    activitySeries: [41, 52, 49, 61, 72, 68, 83, 78, 91, 97, 102, 110, 106, 128],
    onboarding: [
      ['Starting point', 100],
      ['Schedule', 86],
      ['Plan preview', 78],
      ['Completed', 71],
      ['First workout', 54]
    ],
    sports: [
      { label: 'Running', value: 48, color: '#4195ef' },
      { label: 'Cycling', value: 31, color: '#54d76a' },
      { label: 'Swimming', value: 21, color: '#a78bfa' }
    ],
    recentActivity: [
      { icon: '↻', title: 'Plan regenerated', detail: 'Profile update · 3 future workouts changed', time: '2m ago' },
      { icon: '⌚', title: 'Watch schedule succeeded', detail: 'Running · distance prescription', time: '7m ago' },
      { icon: '✓', title: 'Workout completed', detail: 'Cycling · time prescription', time: '18m ago' },
      { icon: '⇣', title: 'HealthKit import completed', detail: '2 activities matched', time: '24m ago' },
      { icon: '△', title: 'Workout skipped', detail: 'Swimming · athlete initiated', time: '41m ago' }
    ],
    users: [
      { user: 'Beta athlete 01', email: 'athlete01@example.com', lastSeen: '2m ago', sessions: 12, workouts: 8, status: 'Active' },
      { user: 'Beta athlete 02', email: 'athlete02@example.com', lastSeen: '11m ago', sessions: 9, workouts: 6, status: 'Active' },
      { user: 'Beta athlete 03', email: 'athlete03@example.com', lastSeen: '1h ago', sessions: 5, workouts: 3, status: 'Active' },
      { user: 'Beta athlete 04', email: 'athlete04@example.com', lastSeen: '2d ago', sessions: 4, workouts: 1, status: 'At risk' }
    ],
    journey: [
      { stage: 'Plan generated', users: 100, conversion: 100 },
      { stage: 'Workout viewed', users: 92, conversion: 92 },
      { stage: 'Workout started', users: 76, conversion: 76 },
      { stage: 'Workout completed', users: 68, conversion: 68 },
      { stage: 'Feedback submitted', users: 59, conversion: 59 },
      { stage: 'Next week generated', users: 43, conversion: 43 }
    ],
    planChanges: [
      { reason: 'Workout target', count: 18, before: '20 min Easy Run', after: '2 km Easy Run' },
      { reason: 'Running ability', count: 14, before: '2 km Easy Run', after: '3 km Easy Run' },
      { reason: 'Availability', count: 11, before: 'Wed · Cycling', after: 'Thu · Cycling' },
      { reason: 'Event date', count: 7, before: 'Build phase', after: 'Specific phase' }
    ],
    watch: [
      { stage: 'Requested', value: 91 },
      { stage: 'Scheduled', value: 86 },
      { stage: 'Started', value: 72 },
      { stage: 'Completed', value: 64 },
      { stage: 'Synced', value: 61 },
      { stage: 'Matched', value: 58 }
    ],
    imports: [
      { stage: 'Import started', value: 83 },
      { stage: 'Workouts found', value: 79 },
      { stage: 'Imported', value: 76 },
      { stage: 'Matched to plan', value: 62 }
    ],
    events: [
      { time: '22:04:19', event: 'plan_regenerated', user: 'athlete01@example.com', context: 'running · profile_changed · 3 workouts', outcome: 'success' },
      { time: '22:03:58', event: 'profile_updated', user: 'athlete01@example.com', context: 'prescription_basis · distance → time', outcome: 'info' },
      { time: '22:01:21', event: 'send_to_watch_succeeded', user: 'athlete02@example.com', context: 'running · distance', outcome: 'success' },
      { time: '21:58:44', event: 'healthkit_import_completed', user: 'athlete03@example.com', context: '2 activities · 1 matched', outcome: 'success' },
      { time: '21:53:02', event: 'send_to_watch_failed', user: 'athlete04@example.com', context: 'cycling · authorization', outcome: 'fail' },
      { time: '21:49:36', event: 'workout_completed', user: 'athlete02@example.com', context: 'cycling · time', outcome: 'success' },
      { time: '21:45:15', event: 'workout_viewed', user: 'athlete01@example.com', context: 'running · updated_plan', outcome: 'info' }
    ]
  };

  const provider = window.AtheviaAnalyticsDataProvider;
  const state = {
    range: '7d',
    environment: 'production',
    currentView: 'overview',
    data: DEMO,
    source: provider ? 'connected' : 'demo'
  };

  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => [...scope.querySelectorAll(selector)];

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function initials(value) {
    return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function renderSummary() {
    const s = state.data.summary;
    const metrics = [
      ['Active users', s.activeUsers, s.activeUsersTrend, 'positive'],
      ['Sessions', s.sessions, s.sessionsTrend, 'positive'],
      ['Workouts completed', s.workoutsCompleted, s.workoutsTrend, 'positive'],
      ['Completion rate', s.completionRate + '%', s.completionTrend, 'positive']
    ];
    $('#metric-grid').innerHTML = metrics.map(([label, value, trend, tone]) => `
      <article class="metric-card">
        <div class="metric-label">${escapeHTML(label)}</div>
        <div class="metric-value">${escapeHTML(value)}</div>
        <div class="metric-trend ${tone}">${escapeHTML(trend)}</div>
      </article>
    `).join('');
  }

  function linePath(values, width = 680, height = 205, pad = 18) {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = Math.max(max - min, 1);
    return values.map((value, index) => {
      const x = pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2);
      const y = pad + (1 - (value - min) / span) * (height - pad * 2);
      return { x, y, value };
    });
  }

  function renderActivityChart() {
    const points = linePath(state.data.activitySeries);
    const line = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)} 205 L ${points[0].x.toFixed(1)} 205 Z`;
    $('#activity-chart').innerHTML = `
      <svg class="line-chart" viewBox="0 0 680 220" role="img" aria-label="Active users trend">
        <defs><linearGradient id="activityGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4195ef"/><stop offset="1" stop-color="#4195ef" stop-opacity="0"/></linearGradient></defs>
        <line class="chart-axis" x1="18" y1="205" x2="662" y2="205"/>
        <line class="chart-axis" x1="18" y1="115" x2="662" y2="115"/>
        <line class="chart-axis" x1="18" y1="25" x2="662" y2="25"/>
        <path class="chart-area" d="${area}"/>
        <path class="chart-line" d="${line}"/>
        ${points.map((p, i) => i === points.length - 1 ? `<circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="5"/>` : '').join('')}
        <text class="chart-label" x="18" y="218">14 days ago</text>
        <text class="chart-label" x="615" y="218">Today</text>
      </svg>
    `;
  }

  function renderFunnel(target, rows, valueKey = 1, labelKey = 0) {
    const el = $(target);
    el.innerHTML = rows.map(row => {
      const label = typeof row === 'object' && !Array.isArray(row) ? row[labelKey] : row[labelKey];
      const value = typeof row === 'object' && !Array.isArray(row) ? row[valueKey] : row[valueKey];
      return `
        <div class="funnel-row">
          <span>${escapeHTML(label)}</span>
          <div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(3, Math.min(100, value))}%"></div></div>
          <strong>${escapeHTML(value)}%</strong>
        </div>
      `;
    }).join('');
  }

  function renderRecentActivity() {
    $('#recent-activity').innerHTML = state.data.recentActivity.map(item => `
      <div class="activity-item">
        <div class="activity-icon">${escapeHTML(item.icon)}</div>
        <div class="activity-copy"><b>${escapeHTML(item.title)}</b><span>${escapeHTML(item.detail)}</span></div>
        <div class="activity-time">${escapeHTML(item.time)}</div>
      </div>
    `).join('');
  }

  function renderSports() {
    const max = Math.max(...state.data.sports.map(item => item.value), 1);
    $('#sport-breakdown').innerHTML = state.data.sports.map(item => `
      <div class="breakdown-row">
        <span>${escapeHTML(item.label)}</span>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${item.value / max * 100}%;background:${item.color}"></div></div>
        <strong>${item.value}%</strong>
      </div>
    `).join('');
  }

  function renderUsers() {
    $('#users-table-body').innerHTML = state.data.users.map(user => `
      <tr>
        <td><div class="user-cell"><span class="avatar">${initials(user.user)}</span><div><strong>${escapeHTML(user.user)}</strong><div class="muted">${escapeHTML(user.email)}</div></div></div></td>
        <td>${escapeHTML(user.lastSeen)}</td>
        <td>${escapeHTML(user.sessions)}</td>
        <td>${escapeHTML(user.workouts)}</td>
        <td><span class="badge ${user.status === 'Active' ? 'success' : 'fail'}">${escapeHTML(user.status)}</span></td>
      </tr>
    `).join('');
  }

  function renderJourney() {
    const max = Math.max(...state.data.journey.map(item => item.users), 1);
    $('#journey-table-body').innerHTML = state.data.journey.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.stage)}</strong></td>
        <td>${escapeHTML(item.users)}</td>
        <td><div class="breakdown-track" style="max-width:360px"><div class="breakdown-fill" style="width:${item.users / max * 100}%;background:#4195ef"></div></div></td>
        <td>${escapeHTML(item.conversion)}%</td>
      </tr>
    `).join('');
  }

  function renderPlanChanges() {
    $('#plan-change-list').innerHTML = state.data.planChanges.map(item => `
      <div class="plan-change">
        <div><strong>${escapeHTML(item.reason)}</strong><div class="muted">${escapeHTML(item.count)} updates</div></div>
        <div class="before-after"><small>Before</small>${escapeHTML(item.before)}</div>
        <div class="before-after"><small>After</small>${escapeHTML(item.after)}</div>
      </div>
    `).join('');
  }

  function renderOperations() {
    renderFunnel('#watch-funnel', state.data.watch, 'value', 'stage');
    renderFunnel('#import-funnel', state.data.imports, 'value', 'stage');
  }

  function renderEvents(filter = 'all', query = '') {
    const normalized = query.trim().toLowerCase();
    const rows = state.data.events.filter(event => {
      const matchesFilter = filter === 'all' || event.outcome === filter;
      const haystack = [event.event, event.user, event.context, event.outcome].join(' ').toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
    $('#events-table-body').innerHTML = rows.length ? rows.map(event => `
      <tr>
        <td class="muted">${escapeHTML(event.time)}</td>
        <td class="event-name">${escapeHTML(event.event)}</td>
        <td>${escapeHTML(event.user)}</td>
        <td class="muted">${escapeHTML(event.context)}</td>
        <td><span class="badge ${event.outcome}">${escapeHTML(event.outcome)}</span></td>
      </tr>
    `).join('') : '<tr><td colspan="5"><div class="empty-state"><b>No matching events</b>Try a different filter or search.</div></td></tr>';
  }

  function renderProviderState() {
    const banner = $('#demo-banner');
    const source = $('[data-source-label]');
    if (state.source === 'connected') {
      banner.hidden = true;
      source.textContent = 'Live data provider';
    } else {
      banner.hidden = false;
      source.textContent = 'Demo data';
    }
  }

  function renderAll() {
    renderSummary();
    renderActivityChart();
    renderFunnel('#onboarding-funnel', state.data.onboarding);
    renderRecentActivity();
    renderSports();
    renderUsers();
    renderJourney();
    renderPlanChanges();
    renderOperations();
    renderEvents();
    renderProviderState();
  }

  async function refresh() {
    if (!provider || typeof provider.loadDashboard !== 'function') {
      state.data = DEMO;
      state.source = 'demo';
      renderAll();
      return;
    }
    const refreshButton = $('#refresh-dashboard');
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
    try {
      const next = await provider.loadDashboard({
        range: state.range,
        environment: state.environment
      });
      state.data = { ...DEMO, ...next };
      state.source = 'connected';
      renderAll();
    } catch (error) {
      console.error('Athevia analytics provider failed', error);
      state.data = DEMO;
      state.source = 'demo';
      renderAll();
      bannerMessage('Live analytics could not be loaded. Demo data is shown.');
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  }

  function bannerMessage(message) {
    const banner = $('#demo-banner');
    banner.hidden = false;
    banner.querySelector('[data-demo-message]').textContent = message;
  }

  function switchView(view) {
    state.currentView = view;
    $$('.dashboard-view').forEach(panel => panel.hidden = panel.dataset.view !== view);
    $$('.dashboard-nav button').forEach(button => {
      button.setAttribute('aria-current', button.dataset.nav === view ? 'page' : 'false');
    });
    const title = {
      overview: ['Product overview', 'Monitor engagement, activation and recent product activity.'],
      users: ['Users', 'Investigate individual beta users and product engagement.'],
      journey: ['Training journey', 'Follow the path from generated plan to the next training week.'],
      plans: ['Plan intelligence', 'See why Athevia changes training and what changed.'],
      operations: ['Watch & imports', 'Monitor Apple Watch scheduling and HealthKit ingestion.'],
      events: ['Event stream', 'Inspect semantic product events for debugging and instrumentation QA.'],
      setup: ['Data connection', 'Connect the dashboard to the authenticated Athevia analytics API.']
    }[view];
    $('#view-title').textContent = title[0];
    $('#view-subtitle').textContent = title[1];
  }

  $$('.dashboard-nav button').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.nav));
  });

  $('#range-select').addEventListener('change', event => {
    state.range = event.target.value;
    refresh();
  });
  $('#environment-select').addEventListener('change', event => {
    state.environment = event.target.value;
    refresh();
  });
  $('#refresh-dashboard').addEventListener('click', refresh);

  let eventFilter = 'all';
  $$('#event-filters .filter-button').forEach(button => {
    button.addEventListener('click', () => {
      eventFilter = button.dataset.eventFilter;
      $$('#event-filters .filter-button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      renderEvents(eventFilter, $('#event-search').value);
    });
  });
  $('#event-search').addEventListener('input', event => renderEvents(eventFilter, event.target.value));

  renderAll();
  refresh();
})();