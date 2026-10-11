(async () => {
  await (window.AtheviaAnalyticsReady ?? Promise.resolve());

  const root = document.querySelector('[data-dashboard-root]');
  const authGate = document.querySelector('#auth-gate');
  const auth = window.AtheviaAnalyticsAuth;
  const provider = window.AtheviaAnalyticsDataProvider;
  if (!root || !auth || !provider || root.dataset.ready === 'true') return;
  root.dataset.ready = 'true';

  const EMPTY = {
    summary: {
      activeUsers: 0,
      sessions: 0,
      workoutsCompleted: 0,
      completionRate: 0,
      activeUsersTrend: 'Current period',
      sessionsTrend: 'Current period',
      workoutsTrend: 'Current period',
      completionTrend: 'Scheduled workouts due in period'
    },
    activitySeries: [0],
    onboarding: [],
    sports: [],
    recentActivity: [],
    users: [],
    journey: [],
    planChanges: [],
    watch: [],
    imports: [],
    events: []
  };

  const state = {
    range: '7d',
    environment: 'production',
    currentView: 'overview',
    data: EMPTY,
    authenticated: false
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const formatDateTime = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : new Intl.DateTimeFormat(undefined, {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }).format(date);
  };

  const relativeTime = value => {
    if (!value) return 'No activity';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatDuration = seconds => {
    if (seconds == null || Number.isNaN(Number(seconds))) return null;
    const mins = Math.round(Number(seconds) / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  };

  const formatDistance = meters => {
    if (meters == null || Number.isNaN(Number(meters))) return null;
    const value = Number(meters);
    return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} km` : `${Math.round(value)} m`;
  };

  function initials(value) {
    return String(value || 'A').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  function showAuth(message = '') {
    state.authenticated = false;
    root.hidden = true;
    authGate.hidden = false;
    $('#auth-status').textContent = message;
  }

  function showDashboard() {
    state.authenticated = true;
    authGate.hidden = true;
    root.hidden = false;
  }

  function setBanner(message, tone = 'info') {
    const banner = $('#demo-banner');
    if (!message) {
      banner.hidden = true;
      return;
    }
    banner.hidden = false;
    banner.dataset.tone = tone;
    banner.querySelector('[data-demo-message]').textContent = message;
  }

  function renderSummary() {
    const s = state.data.summary ?? EMPTY.summary;
    const metrics = [
      ['Active users', s.activeUsers ?? 0, s.activeUsersTrend],
      ['Sessions', s.sessions ?? 0, s.sessionsTrend],
      ['Workouts completed', s.workoutsCompleted ?? 0, s.workoutsTrend],
      ['Completion rate', `${s.completionRate ?? 0}%`, s.completionTrend]
    ];
    $('#metric-grid').innerHTML = metrics.map(([label, value, trend]) => `
      <article class="metric-card">
        <div class="metric-label">${escapeHTML(label)}</div>
        <div class="metric-value">${escapeHTML(value)}</div>
        <div class="metric-trend">${escapeHTML(trend ?? '')}</div>
      </article>
    `).join('');
  }

  function linePath(values, width = 680, height = 205, pad = 18) {
    const safe = values.length ? values : [0];
    const max = Math.max(...safe, 1);
    const min = Math.min(...safe, 0);
    const span = Math.max(max - min, 1);
    return safe.map((value, index) => ({
      x: pad + (index / Math.max(safe.length - 1, 1)) * (width - pad * 2),
      y: pad + (1 - (value - min) / span) * (height - pad * 2)
    }));
  }

  function renderActivityChart() {
    const values = state.data.activitySeries ?? [0];
    const points = linePath(values);
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
        <circle class="chart-dot" cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="5"/>
        <text class="chart-label" x="18" y="218">Earlier</text>
        <text class="chart-label" x="625" y="218">Today</text>
      </svg>
    `;
  }

  function renderFunnel(target, rows, valueKey = 1, labelKey = 0) {
    const el = $(target);
    const values = rows ?? [];
    el.innerHTML = values.length ? values.map(row => {
      const label = Array.isArray(row) ? row[labelKey] : row[labelKey];
      const value = Number(Array.isArray(row) ? row[valueKey] : row[valueKey]) || 0;
      return `
        <div class="funnel-row">
          <span>${escapeHTML(label)}</span>
          <div class="funnel-track"><div class="funnel-fill" style="width:${Math.max(0, Math.min(100, value))}%"></div></div>
          <strong>${escapeHTML(value)}%</strong>
        </div>
      `;
    }).join('') : '<div class="empty-state compact"><b>No data yet</b>This metric will populate as activity arrives.</div>';
  }

  function renderRecentActivity() {
    const rows = state.data.recentActivity ?? [];
    $('#recent-activity').innerHTML = rows.length ? rows.map(item => `
      <div class="activity-item">
        <div class="activity-icon">${escapeHTML(item.icon)}</div>
        <div class="activity-copy"><b>${escapeHTML(item.title)}</b><span>${escapeHTML(item.detail)}</span></div>
        <div class="activity-time">${escapeHTML(relativeTime(item.time))}</div>
      </div>
    `).join('') : '<div class="empty-state compact"><b>No semantic events yet</b>Existing plan data is live; product events start arriving from the updated app build.</div>';
  }

  function renderSports() {
    const rows = state.data.sports ?? [];
    const max = Math.max(...rows.map(item => Number(item.value) || 0), 1);
    $('#sport-breakdown').innerHTML = rows.length ? rows.map(item => `
      <div class="breakdown-row">
        <span>${escapeHTML(item.label)}</span>
        <div class="breakdown-track"><div class="breakdown-fill" style="width:${(Number(item.value) || 0) / max * 100}%;background:${escapeHTML(item.color)}"></div></div>
        <strong>${escapeHTML(item.value)}%</strong>
      </div>
    `).join('') : '<div class="empty-state compact"><b>No completed workouts</b>No sport mix exists for this period.</div>';
  }

  function renderUsers() {
    const rows = state.data.users ?? [];
    $('#users-table-body').innerHTML = rows.length ? rows.map(user => `
      <tr class="clickable-row" data-user-id="${escapeHTML(user.id)}" tabindex="0" role="button" aria-label="Open training plan for ${escapeHTML(user.user)}">
        <td><div class="user-cell"><span class="avatar">${initials(user.user)}</span><div><strong>${escapeHTML(user.user)}</strong><div class="muted">${escapeHTML(user.email ?? '')}</div></div></div></td>
        <td>${escapeHTML(relativeTime(user.lastSeen))}</td>
        <td>${escapeHTML(user.sessions ?? 0)}</td>
        <td>${escapeHTML(user.workouts ?? 0)}</td>
        <td>${escapeHTML(user.planWeeks ?? 0)}</td>
        <td><strong>${escapeHTML(user.completionRate ?? 0)}%</strong></td>
        <td><span class="badge ${user.status === 'Active' ? 'success' : 'fail'}">${escapeHTML(user.status)}</span></td>
      </tr>
    `).join('') : '<tr><td colspan="7"><div class="empty-state"><b>No athletes found</b>No cloud-backed user plans are available.</div></td></tr>';

    $$('#users-table-body [data-user-id]').forEach(row => {
      const open = () => openUserDetail(row.dataset.userId);
      row.addEventListener('click', open);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function renderJourney() {
    const rows = state.data.journey ?? [];
    const max = Math.max(...rows.map(item => Number(item.users) || 0), 1);
    $('#journey-table-body').innerHTML = rows.length ? rows.map(item => `
      <tr>
        <td><strong>${escapeHTML(item.stage)}</strong></td>
        <td>${escapeHTML(item.users)}</td>
        <td><div class="breakdown-track" style="max-width:360px"><div class="breakdown-fill" style="width:${(Number(item.users) || 0) / max * 100}%;background:#4195ef"></div></div></td>
        <td>${escapeHTML(item.conversion)}%</td>
      </tr>
    `).join('') : '<tr><td colspan="4"><div class="empty-state"><b>No journey data yet</b>Updated app events will populate this funnel.</div></td></tr>';
  }

  function renderPlanChanges() {
    const rows = state.data.planChanges ?? [];
    $('#plan-change-list').innerHTML = rows.length ? rows.map(item => `
      <div class="plan-change">
        <div><strong>${escapeHTML(item.reason)}</strong><div class="muted">${escapeHTML(item.count)} updates</div></div>
        <div class="before-after"><small>Before</small>${escapeHTML(item.before)}</div>
        <div class="before-after"><small>After</small>${escapeHTML(item.after)}</div>
      </div>
    `).join('') : '<div class="empty-state compact"><b>No regeneration events yet</b>Plan-change analytics begin with the updated app build.</div>';
  }

  function renderOperations() {
    renderFunnel('#watch-funnel', state.data.watch ?? [], 'value', 'stage');
    renderFunnel('#import-funnel', state.data.imports ?? [], 'value', 'stage');
  }

  function renderEvents(filter = 'all', query = '') {
    const normalized = query.trim().toLowerCase();
    const rows = (state.data.events ?? []).filter(event => {
      const matchesFilter = filter === 'all' || event.outcome === filter;
      const haystack = [event.event, event.user, event.email, event.context, event.outcome].join(' ').toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
    $('#events-table-body').innerHTML = rows.length ? rows.map(event => `
      <tr>
        <td class="muted">${escapeHTML(formatDateTime(event.time))}</td>
        <td class="event-name">${escapeHTML(event.event)}</td>
        <td>${escapeHTML(event.user)}</td>
        <td class="muted">${escapeHTML(event.context)}</td>
        <td><span class="badge ${escapeHTML(event.outcome)}">${escapeHTML(event.outcome)}</span></td>
      </tr>
    `).join('') : '<tr><td colspan="5"><div class="empty-state"><b>No matching events</b>New semantic analytics will appear here as updated app builds are used.</div></td></tr>';
  }

  function renderAll() {
    renderSummary();
    renderActivityChart();
    renderFunnel('#onboarding-funnel', state.data.onboarding ?? []);
    renderRecentActivity();
    renderSports();
    renderUsers();
    renderJourney();
    renderPlanChanges();
    renderOperations();
    renderEvents();
    $('[data-source-label]').textContent = 'Live Supabase data';
  }

  function workoutTarget(workout) {
    const distance = formatDistance(workout.targetDistanceMeters);
    const duration = formatDuration(workout.prescribedDurationSeconds);
    return distance || duration || 'Structured session';
  }

  function recordedTarget(workout) {
    if (!workout.recorded) return null;
    const distance = formatDistance(workout.recorded.distanceMeters);
    const duration = formatDuration(workout.recorded.durationSeconds);
    return [distance, duration].filter(Boolean).join(' · ') || 'Recorded workout';
  }

  function renderSteps(steps, depth = 0) {
    if (!steps?.length) return '';
    return `<div class="workout-steps">${steps.map(step => {
      const amount = [formatDistance(step.distanceMeters), formatDuration(step.durationSeconds)].filter(Boolean).join(' · ');
      const repeats = step.repeatCount && step.repeatCount > 1 ? `${step.repeatCount}× · ` : '';
      return `
        <div class="workout-step" style="--step-depth:${depth}">
          <span class="step-index">${escapeHTML(step.order + 1)}</span>
          <div><strong>${escapeHTML(step.title)}</strong><span>${escapeHTML(repeats + amount)}</span></div>
        </div>
        ${renderSteps(step.children, depth + 1)}
      `;
    }).join('')}</div>`;
  }

  function renderUserDetail(detail) {
    $('#user-detail-title').textContent = detail.user?.name || 'Athlete';
    $('#user-detail-subtitle').textContent = [detail.user?.email, `Last backup ${relativeTime(detail.user?.lastBackupAt)}`].filter(Boolean).join(' · ');

    const plans = detail.plans ?? [];
    const latest = plans[plans.length - 1];
    const content = $('#user-detail-content');
    content.innerHTML = `
      <div class="user-detail-metrics">
        <div><span>Plan weeks</span><strong>${plans.length}</strong></div>
        <div><span>Current completion</span><strong>${latest?.completion?.percentage ?? 0}%</strong></div>
        <div><span>Experience</span><strong>${escapeHTML(detail.profile?.experienceLevel ?? '—')}</strong></div>
      </div>
      <div class="plan-week-list">
        ${plans.slice().reverse().map((plan, index) => `
          <details class="plan-week" ${index === 0 ? 'open' : ''}>
            <summary>
              <div>
                <strong>Week ${escapeHTML(plan.weekNumber)}</strong>
                <span>${escapeHTML(formatDate(plan.startDate))} – ${escapeHTML(formatDate(plan.endDate))}</span>
              </div>
              <div class="week-summary-right">
                <span class="badge ${plan.status === 'completed' ? 'success' : 'info'}">${escapeHTML(plan.status)}</span>
                <strong>${escapeHTML(plan.completion?.completed ?? 0)}/${escapeHTML(plan.completion?.planned ?? 0)}</strong>
              </div>
            </summary>
            <div class="week-reason">${escapeHTML(plan.generationReason || plan.generationReasonCode || 'Generated training week')}</div>
            <div class="workout-plan-list">
              ${(plan.workouts ?? []).map(workout => `
                <article class="workout-plan-card">
                  <div class="workout-plan-head">
                    <div>
                      <span class="workout-date">${escapeHTML(formatDate(workout.date))} · ${escapeHTML(workout.discipline)}</span>
                      <h3>${escapeHTML(workout.title)}</h3>
                    </div>
                    <span class="badge ${workout.status === 'completed' ? 'success' : workout.status === 'skipped' ? 'fail' : 'info'}">${escapeHTML(workout.status)}</span>
                  </div>
                  <div class="workout-targets">
                    <div><span>Prescribed</span><strong>${escapeHTML(workoutTarget(workout))}</strong></div>
                    <div><span>Recorded</span><strong>${escapeHTML(recordedTarget(workout) || '—')}</strong></div>
                    <div><span>Completed</span><strong>${escapeHTML(formatDateTime(workout.completedAt))}</strong></div>
                  </div>
                  ${renderSteps(workout.steps)}
                </article>
              `).join('')}
            </div>
          </details>
        `).join('') || '<div class="empty-state"><b>No plan available</b>This account does not yet have a cloud-backed training plan.</div>'}
      </div>
    `;
  }

  async function openUserDetail(userID) {
    const drawer = $('#user-detail');
    drawer.hidden = false;
    $('#user-detail-title').textContent = 'Loading plan…';
    $('#user-detail-subtitle').textContent = '';
    $('#user-detail-content').innerHTML = '<div class="empty-state"><b>Loading training plan</b>Reading the latest secure cloud backup.</div>';
    try {
      const detail = await provider.loadUserDetail(userID);
      renderUserDetail(detail);
    } catch (error) {
      console.error('User detail failed', error);
      $('#user-detail-content').innerHTML = '<div class="empty-state"><b>Could not load this plan</b>The secure analytics API returned an error.</div>';
    }
  }

  function closeUserDetail() {
    $('#user-detail').hidden = true;
  }

  async function refresh() {
    if (!state.authenticated) return;
    const refreshButton = $('#refresh-dashboard');
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing…';
    setBanner('');
    try {
      state.data = { ...EMPTY, ...(await provider.loadDashboard({
        range: state.range,
        environment: state.environment
      })) };
      renderAll();
    } catch (error) {
      console.error('Athevia analytics provider failed', error);
      if (error?.code === 'AUTH_REQUIRED' || error?.status === 401) {
        showAuth('Your session expired. Sign in again.');
        return;
      }
      if (error?.status === 403) {
        showAuth('This Athevia account is not authorized to access analytics.');
        return;
      }
      setBanner('Live analytics could not be loaded. No fallback user data is shown.', 'error');
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh';
    }
  }

  function switchView(view) {
    state.currentView = view;
    $$('.dashboard-view').forEach(panel => panel.hidden = panel.dataset.view !== view);
    $$('.dashboard-nav button').forEach(button => {
      button.setAttribute('aria-current', button.dataset.nav === view ? 'page' : 'false');
    });
    const title = {
      overview: ['Product overview', 'Monitor engagement, plan completion and recent product activity.'],
      users: ['Users', 'Inspect each athlete’s actual plan and completion history.'],
      journey: ['Training journey', 'Follow the path from generated plan to the next training week.'],
      plans: ['Plan intelligence', 'See why Athevia changes training and what changed.'],
      operations: ['Watch & imports', 'Monitor Apple Watch scheduling and HealthKit ingestion.'],
      events: ['Event stream', 'Inspect semantic product events for debugging and instrumentation QA.'],
      setup: ['Data connection', 'Review the live authenticated analytics architecture.']
    }[view];
    $('#view-title').textContent = title[0];
    $('#view-subtitle').textContent = title[1];
  }

  $('#admin-signin-form').addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('#admin-signin-button');
    const email = $('#admin-email').value;
    button.disabled = true;
    button.textContent = 'Sending…';
    $('#auth-status').textContent = '';
    try {
      await auth.sendMagicLink(email);
      $('#auth-status').textContent = 'Check your email and open the secure sign-in link on this device.';
    } catch (error) {
      $('#auth-status').textContent = error?.message || 'Could not send the sign-in link.';
    } finally {
      button.disabled = false;
      button.textContent = 'Send sign-in link';
    }
  });

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
  $('#dashboard-signout').addEventListener('click', async () => {
    await auth.signOut();
    showAuth('Signed out.');
  });
  $('#user-detail-close').addEventListener('click', closeUserDetail);

  let eventFilter = 'all';
  $$('#event-filters .filter-button').forEach(button => {
    button.addEventListener('click', () => {
      eventFilter = button.dataset.eventFilter;
      $$('#event-filters .filter-button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      renderEvents(eventFilter, $('#event-search').value);
    });
  });
  $('#event-search').addEventListener('input', event => renderEvents(eventFilter, event.target.value));

  const session = await auth.session();
  if (!session) {
    showAuth();
  } else {
    showDashboard();
    await refresh();
  }

  await auth.onAuthStateChange(async sessionValue => {
    if (!sessionValue) {
      showAuth();
      return;
    }
    if (!state.authenticated) {
      showDashboard();
      await refresh();
    }
  });
})();