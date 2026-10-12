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

  function rpeText(value) {
    if (!value) return '—';
    if (typeof value === 'number') return `${value} / 10`;
    if (value.lower != null && value.upper != null) return `${value.lower}–${value.upper} / 10`;
    return '—';
  }

  function prettyEnum(value) {
    if (!value) return '—';
    return String(value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replace(/^./, c => c.toUpperCase());
  }

  function painLabel(value) {
    const score = Number(value);
    if (!Number.isFinite(score)) return '—';
    if (score <= 0) return 'No pain';
    if (score <= 2) return 'Barely noticeable';
    if (score <= 4) return 'Mild';
    if (score <= 6) return 'Moderate';
    if (score <= 8) return 'Severe';
    return 'Worst possible';
  }

  function sportTheme(discipline) {
    return {
      running: { tint: '#F7B538', deep: '#C27A14', label: 'Run' },
      swimming: { tint: '#218CFF', deep: '#0A4DC2', label: 'Swim' },
      cycling: { tint: '#29C76B', deep: '#0A8047', label: 'Cycle' },
      multisport: { tint: '#9E6BF2', deep: '#6333B8', label: 'Multisport' },
      recovery: { tint: '#33C7D9', deep: '#08758C', label: 'Recovery' },
      rest: { tint: '#8C8F9E', deep: '#3D4252', label: 'Rest' }
    }[discipline] || { tint: '#8C8F9E', deep: '#3D4252', label: prettyEnum(discipline) };
  }

  function dayKey(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
  }

  function formatMetricNumber(value, digits = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : null;
  }

  function renderSyncedMetrics(workout) {
    const recorded = workout.recorded;
    if (!recorded) return '';
    const m = recorded.metrics || {};
    const rows = [
      ['Average heart rate', recorded.averageHeartRate, v => `${Math.round(v)} bpm`],
      ['Maximum heart rate', recorded.maximumHeartRate, v => `${Math.round(v)} bpm`],
      ['Elevation ascended', recorded.elevationAscendedMeters, v => `${Math.round(v)} m`],
      ['Swim lengths', recorded.swimmingLengths, v => String(Math.round(v))],
      ['Stroke count', recorded.swimmingStrokeCount, v => String(Math.round(v))],
      ['Longest continuous swim', recorded.longestContinuousSwimMeters, v => formatDistance(v)],
      ['Active energy', m.activeEnergyKilocalories, v => `${Math.round(v)} kcal`],
      ['Average cadence', m.averageCadence, v => `${Math.round(v)} spm`],
      ['Average running speed', m.averageRunningSpeed, v => `${(Number(v) * 3.6).toFixed(1)} km/h`],
      ['Average running power', m.averageRunningPower, v => `${Math.round(v)} W`],
      ['Average stride length', m.averageStrideLength, v => `${Number(v).toFixed(2)} m`],
      ['Ground contact time', m.averageGroundContactTime, v => `${Math.round(v)} ms`],
      ['Vertical oscillation', m.averageVerticalOscillation, v => `${Number(v).toFixed(1)} cm`],
      ['Average cycling speed', m.averageCyclingSpeed, v => `${(Number(v) * 3.6).toFixed(1)} km/h`],
      ['Average cycling cadence', m.averageCyclingCadence, v => `${Math.round(v)} rpm`],
      ['Average cycling power', m.averageCyclingPower, v => `${Math.round(v)} W`],
      ['Functional threshold power', m.functionalThresholdPower, v => `${Math.round(v)} W`],
      ['Apple workout effort', m.workoutEffort, v => `${Number(v).toFixed(1)} / 10`],
      ['Apple estimated effort', m.estimatedWorkoutEffort, v => `${Number(v).toFixed(1)} / 10`],
      ['Swim environment', m.swimEnvironment, v => prettyEnum(v)]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');

    const segments = Array.isArray(m.multisportSegments) ? m.multisportSegments : [];
    const segmentHTML = segments.length ? `
      <div class="synced-segments">
        <div class="mirror-eyebrow">MULTISPORT SEGMENTS</div>
        ${segments.map((segment, index) => `
          <div class="synced-segment">
            <strong>${escapeHTML(segment.isTransition ? `Transition ${index + 1}` : prettyEnum(segment.sport || `Segment ${index + 1}`))}</strong>
            <span>${escapeHTML([
              formatDuration(segment.durationSeconds),
              formatDistance(segment.distanceMeters),
              segment.swimEnvironment ? prettyEnum(segment.swimEnvironment) : null
            ].filter(Boolean).join(' · '))}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    if (!rows.length && !segments.length) return '';
    return `
      <div class="synced-metrics">
        <div class="mirror-eyebrow">ALL SYNCED METRICS</div>
        <div class="synced-metric-grid">
          ${rows.map(([label, value, formatter]) => `
            <div class="synced-metric">
              <span>${escapeHTML(label)}</span>
              <strong>${escapeHTML(formatter(value) || '—')}</strong>
            </div>
          `).join('')}
        </div>
        ${segmentHTML}
      </div>
    `;
  }

  function averageRecordedMetric(workout) {
    const recorded = workout.recorded;
    if (!recorded?.distanceMeters || !recorded?.durationSeconds) return { label: 'Avg Speed', value: '—' };
    const distance = Number(recorded.distanceMeters);
    const duration = Number(recorded.durationSeconds);
    if (!(distance > 0) || !(duration > 0)) return { label: 'Avg Speed', value: '—' };

    if (workout.discipline === 'running') {
      const seconds = Math.round(duration / (distance / 1000));
      return { label: 'Avg Pace', value: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} /km` };
    }
    if (workout.discipline === 'swimming') {
      const seconds = Math.round(duration / (distance / 100));
      return { label: 'Avg Pace', value: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} /100m` };
    }
    return { label: 'Avg Speed', value: `${(distance / duration * 3.6).toFixed(1)} km/h` };
  }

  function renderRecordedSummary(workout) {
    const recorded = workout.recorded;
    if (!recorded) return '';
    const average = averageRecordedMetric(workout);
    const metrics = recorded.metrics || {};
    const cells = [
      ['Workout Time', formatDuration(recorded.durationSeconds) || '—'],
      ['Distance', formatDistance(recorded.distanceMeters) || '—'],
      [average.label, average.value],
      ['Avg Heart Rate', recorded.averageHeartRate != null ? `${Math.round(recorded.averageHeartRate)} bpm` : '—'],
      ['Active Calories', metrics.activeEnergyKilocalories != null ? `${Math.round(metrics.activeEnergyKilocalories)} kcal` : '—'],
      ['Completed', formatDateTime(workout.completedAt)]
    ];

    return `
      <section class="mirror-section recorded-section">
        <div class="mirror-eyebrow">RECORDED WORKOUT</div>
        <div class="recorded-grid">
          ${cells.map(([label, value]) => `
            <div class="recorded-cell"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>
          `).join('')}
        </div>
        ${renderSyncedMetrics(workout)}
        <div class="mirror-source">Source: ${escapeHTML(recorded.source || 'Imported workout')} · Synced ${escapeHTML(formatDateTime(recorded.importedAt))}</div>
      </section>
    `;
  }

  function renderFeedback(workout) {
    const feedback = workout.feedback;
    if (!feedback) {
      return workout.status === 'completed'
        ? '<section class="mirror-section"><div class="mirror-eyebrow">YOUR REPORT</div><div class="mirror-empty">Completed · feedback not submitted</div></section>'
        : '';
    }
    const locations = (feedback.painLocations || []).map(prettyEnum).join(', ');
    const symptoms = (feedback.symptoms || []).map(prettyEnum).join(', ');
    return `
      <section class="mirror-section">
        <div class="mirror-eyebrow">YOUR REPORT</div>
        <div class="feedback-topline">
          <div><span>Effort</span><strong>${escapeHTML(feedback.rpe)} / 10</strong><small>${escapeHTML(prettyEnum(feedback.recoveryFeeling))} recovery</small></div>
          <div><span>Pain</span><strong>${escapeHTML(feedback.painScore)} / 10</strong><small>${escapeHTML(painLabel(feedback.painScore))}</small></div>
        </div>
        <div class="mirror-list">
          <div><span>Recovery</span><strong>${escapeHTML(prettyEnum(feedback.recoveryFeeling))}</strong></div>
          ${locations ? `<div><span>Location</span><strong>${escapeHTML(locations)}</strong></div>` : ''}
          ${symptoms ? `<div><span>Symptoms</span><strong>${escapeHTML(symptoms)}</strong></div>` : ''}
          <div><span>Reported</span><strong>${escapeHTML(formatDateTime(feedback.createdAt))}</strong></div>
        </div>
        <p class="mirror-note">Free-form feedback notes are not included in the current cloud backup format.</p>
      </section>
    `;
  }

  function renderRecovery(workout) {
    const recovery = workout.recoveryCheckIn;
    if (!recovery) return '';
    const symptoms = (recovery.symptoms || []).map(prettyEnum).join(', ');
    return `
      <section class="mirror-section">
        <div class="mirror-eyebrow">NEXT-DAY CHECK-IN</div>
        <div class="mirror-list">
          <div><span>Pain</span><strong>${escapeHTML(recovery.painScore)} / 10 · ${escapeHTML(painLabel(recovery.painScore))}</strong></div>
          <div><span>Soreness</span><strong>${escapeHTML(prettyEnum(recovery.soreness))}</strong></div>
          <div><span>Energy</span><strong>${escapeHTML(prettyEnum(recovery.energy))}</strong></div>
          ${symptoms ? `<div><span>Symptoms</span><strong>${escapeHTML(symptoms)}</strong></div>` : ''}
          <div><span>Checked in</span><strong>${escapeHTML(formatDateTime(recovery.createdAt))}</strong></div>
        </div>
      </section>
    `;
  }

  function renderPrescription(workout) {
    return `
      <section class="mirror-section">
        <div class="mirror-eyebrow">PLANNED WORKOUT</div>
        ${workout.goal ? `<p class="mirror-goal">${escapeHTML(workout.goal)}</p>` : ''}
        <div class="prescription-summary">
          <div><span>Target</span><strong>${escapeHTML(workoutTarget(workout))}</strong></div>
          <div><span>Target effort</span><strong>${escapeHTML(rpeText(workout.targetRPE))}</strong></div>
          <div><span>Origin</span><strong>${escapeHTML(prettyEnum(workout.origin))}</strong></div>
        </div>
        ${renderSteps(workout.steps)}
      </section>
    `;
  }

  function renderWorkoutMirror(workout) {
    const stateClass = workout.status === 'completed' ? 'success' : workout.status === 'skipped' ? 'fail' : 'info';
    const sport = sportTheme(workout.discipline);
    return `
      <article class="athlete-workout sport-${escapeHTML(workout.discipline)}" style="--sport:${sport.tint};--sport-deep:${sport.deep}">
        <div class="athlete-workout-header">
          <div class="sport-orb">${escapeHTML(sport.label.slice(0, 1))}</div>
          <div class="athlete-workout-title">
            <span>${escapeHTML(formatDate(workout.date))} · ${escapeHTML(sport.label)}</span>
            <h3>${escapeHTML(workout.title)}</h3>
            <small>${escapeHTML(workoutTarget(workout))}</small>
          </div>
          <span class="badge ${stateClass}">${escapeHTML(workout.status)}</span>
        </div>
        ${workout.status === 'skipped' ? '<div class="state-banner skipped"><strong>Skipped</strong><span>This session was deliberately skipped.</span></div>' : ''}
        ${renderRecordedSummary(workout)}
        ${renderFeedback(workout)}
        ${renderRecovery(workout)}
        ${renderPrescription(workout)}
      </article>
    `;
  }

  function baselineLabel(kind, value) {
    const maps = {
      running: {
        none: "I don't currently run",
        runWalk: "Run/walk for 15–20 minutes",
        continuous10Minutes: "Run continuously ~10 minutes",
        continuous20To30Minutes: "Run continuously 20–30 minutes",
        regular5K: "Regularly run 5 km or more"
      },
      swimming: {
        none: "Not swimming yet",
        continuous25: "25 m continuous",
        continuous50: "50 m continuous",
        continuous100: "100 m continuous",
        continuous200Plus: "200 m+ continuous"
      },
      cycling: {
        under20: "Less than 20 minutes",
        twentyToThirty: "20–30 minutes",
        thirtyToFortyFive: "30–45 minutes",
        fortyFiveToSixty: "45–60 minutes",
        sixtyPlus: "60 minutes or more"
      }
    };
    return maps[kind]?.[value] || prettyEnum(value);
  }

  function weekdayName(raw) {
    return ({2:'Monday',3:'Tuesday',4:'Wednesday',5:'Thursday',6:'Friday',7:'Saturday',1:'Sunday'})[Number(raw)] || String(raw ?? '—');
  }

  function renderOnboardingSection(detail) {
    const o = detail.onboarding;
    if (!o) return '<div class="empty-state compact"><b>No onboarding snapshot</b>This account predates the current onboarding model.</div>';
    const objective = o.objective || {};
    const event = objective.event || {};
    const distance = event.distance || {};
    const components = distance.components || {};
    const baseline = o.baseline || {};
    const selectedSports = (o.sportPreferences || []).filter(p => Number(p.sessionsPerWeek) > 0);
    const schedule = o.schedule?.days || [];

    return `
      <div class="profile-section-grid">
        <article class="profile-panel">
          <h3>Goal & starting point</h3>
          <div class="profile-kv">
            <div><span>Objective</span><strong>${escapeHTML(prettyEnum(objective.kind || o.legacyGoal))}</strong></div>
            ${event.sport ? `<div><span>Event sport</span><strong>${escapeHTML(prettyEnum(event.sport))}</strong></div>` : ''}
            ${distance.kind ? `<div><span>Event distance</span><strong>${escapeHTML(prettyEnum(distance.kind))}</strong></div>` : ''}
            ${event.eventDate ? `<div><span>Event date</span><strong>${escapeHTML(formatDate(event.eventDate))}</strong></div>` : ''}
            ${event.targetIntent ? `<div><span>Intent</span><strong>${escapeHTML(prettyEnum(event.targetIntent))}</strong></div>` : ''}
            ${components.runMeters ? `<div><span>Run target</span><strong>${escapeHTML(formatDistance(components.runMeters))}</strong></div>` : ''}
            ${components.bikeMeters ? `<div><span>Bike target</span><strong>${escapeHTML(formatDistance(components.bikeMeters))}</strong></div>` : ''}
            ${components.swimMeters ? `<div><span>Swim target</span><strong>${escapeHTML(formatDistance(components.swimMeters))}</strong></div>` : ''}
            <div><span>Experience</span><strong>${escapeHTML(prettyEnum(detail.profile?.experienceLevel))}</strong></div>
            <div><span>Running baseline</span><strong>${escapeHTML(baselineLabel('running', baseline.running))}</strong></div>
            <div><span>Swimming baseline</span><strong>${escapeHTML(baselineLabel('swimming', baseline.swimming))}</strong></div>
            <div><span>Cycling baseline</span><strong>${escapeHTML(baselineLabel('cycling', baseline.cycling))}</strong></div>
            <div><span>Swim stroke</span><strong>${escapeHTML(prettyEnum(baseline.stroke))}</strong></div>
            <div><span>Assessed</span><strong>${escapeHTML(formatDateTime(baseline.assessedAt))}</strong></div>
          </div>
        </article>

        <article class="profile-panel">
          <h3>Onboarding choices</h3>
          <div class="profile-kv">
            <div><span>Birth date</span><strong>${escapeHTML(formatDate(o.birthDate))}</strong></div>
            <div><span>Plan start date</span><strong>${escapeHTML(formatDate(o.planStartDate))}</strong></div>
            <div><span>Training days target</span><strong>${escapeHTML(o.trainingDayTarget ?? '—')}</strong></div>
            <div><span>Pool length</span><strong>${escapeHTML(detail.profile?.poolLengthMeters ? `${detail.profile.poolLengthMeters} m` : '—')}</strong></div>
            <div><span>Units</span><strong>${detail.profile?.usesMetricUnits ? 'Metric' : 'Imperial'}</strong></div>
            <div><span>Onboarding stage</span><strong>${escapeHTML(prettyEnum(o.stage))}</strong></div>
            <div><span>Completed</span><strong>${escapeHTML(formatDateTime(o.completedAt))}</strong></div>
          </div>
          <div class="selected-sports-list">
            ${selectedSports.map(pref => {
              const sport = sportTheme(pref.sport);
              return `<div style="--sport:${sport.tint}"><i></i><span>${escapeHTML(sport.label)}</span><strong>${escapeHTML(pref.sessionsPerWeek)} / week · ${escapeHTML(pref.typicalMinutes)} min</strong></div>`;
            }).join('') || '<div class="muted">No selected sports recorded.</div>'}
          </div>
        </article>

        <article class="profile-panel profile-panel-wide">
          <h3>Availability selected during onboarding</h3>
          <div class="availability-grid">
            ${schedule.map(day => `
              <div class="${day.isAvailable ? 'available' : 'unavailable'}">
                <span>${escapeHTML(weekdayName(day.weekday))}</span>
                <strong>${day.isAvailable ? 'Available' : 'Unavailable'}</strong>
                <small>${day.maxDurationMinutes != null ? `${escapeHTML(day.maxDurationMinutes)} min max` : 'No duration limit'}</small>
              </div>
            `).join('')}
          </div>
        </article>
      </div>
    `;
  }

  function renderPreferencesSection(detail) {
    const p = detail.preferences;
    if (!p) return '<div class="empty-state compact"><b>No stored preferences</b>No preference snapshot is available.</div>';
    const open = p.openWaterTrainingConsent || {};
    return `
      <div class="profile-section-grid">
        <article class="profile-panel">
          <h3>Training preferences</h3>
          <div class="profile-kv">
            <div><span>Training days target</span><strong>${escapeHTML(p.trainingDayTarget ?? '—')}</strong></div>
            <div><span>Units</span><strong>${p.usesMetricUnits ? 'Metric' : 'Imperial'}</strong></div>
            <div><span>Pool length</span><strong>${escapeHTML(p.poolLengthMeters ? `${p.poolLengthMeters} m` : '—')}</strong></div>
          </div>
          <div class="selected-sports-list">
            ${(p.sportPreferences || []).map(pref => {
              const sport = sportTheme(pref.sport);
              return `<div style="--sport:${sport.tint}"><i></i><span>${escapeHTML(sport.label)}</span><strong>${escapeHTML(pref.sessionsPerWeek)} / week · ${escapeHTML(pref.typicalMinutes)} min typical</strong></div>`;
            }).join('')}
          </div>
        </article>

        <article class="profile-panel">
          <h3>Open-water preference</h3>
          <div class="profile-kv">
            <div><span>Explicitly confirmed</span><strong>${open.explicitlyConfirmed ? 'Yes' : 'No'}</strong></div>
            <div><span>Safe venue</span><strong>${open.hasSafeVenue ? 'Yes' : 'No'}</strong></div>
            <div><span>Supervision / buddy</span><strong>${open.hasSupervisionOrBuddy ? 'Yes' : 'No'}</strong></div>
          </div>
        </article>
      </div>
    `;
  }

  function renderProgressSection(detail) {
    const progress = detail.progress || {};
    const recent = progress.lastFourWeeks || {};
    const lifetime = progress.lifetime || {};
    const sports = progress.sports || [];
    return `
      <div class="progress-summary-grid">
        <div><span>Last 4 weeks</span><strong>${escapeHTML(formatDuration(recent.trainingSeconds) || '0 min')}</strong><small>Training</small></div>
        <div><span>Last 4 weeks</span><strong>${escapeHTML(recent.completedWorkouts ?? 0)}</strong><small>Completed workouts</small></div>
        <div><span>Last 4 weeks</span><strong>${recent.adherencePercentage == null ? '—' : escapeHTML(recent.adherencePercentage) + '%'}</strong><small>Plan completed</small></div>
        <div><span>Lifetime</span><strong>${escapeHTML(lifetime.planWeeks ?? 0)}</strong><small>Plan weeks</small></div>
        <div><span>Lifetime</span><strong>${escapeHTML(lifetime.completedWorkouts ?? 0)}</strong><small>Completed workouts</small></div>
        <div><span>Lifetime</span><strong>${escapeHTML(formatDuration(lifetime.totalRecordedDurationSeconds) || '0 min')}</strong><small>Recorded training</small></div>
      </div>
      <div class="progress-sports">
        ${sports.map(item => {
          const sport = sportTheme(item.sport);
          return `
            <article style="--sport:${sport.tint};--sport-deep:${sport.deep}">
              <div class="progress-sport-head"><span></span><strong>${escapeHTML(sport.label)}</strong></div>
              <div class="profile-kv">
                <div><span>Completed</span><strong>${escapeHTML(item.completedWorkouts)}</strong></div>
                <div><span>Recorded time</span><strong>${escapeHTML(formatDuration(item.recordedDurationSeconds) || '—')}</strong></div>
                <div><span>Recorded distance</span><strong>${escapeHTML(formatDistance(item.recordedDistanceMeters) || '—')}</strong></div>
                <div><span>Best distance</span><strong>${escapeHTML(formatDistance(item.bestDistanceMeters) || '—')}</strong></div>
                <div><span>Latest completion</span><strong>${escapeHTML(formatDateTime(item.latestCompletedAt))}</strong></div>
              </div>
            </article>
          `;
        }).join('') || '<div class="empty-state compact"><b>No completed training yet</b>Progress appears as workouts are completed and synchronized.</div>'}
      </div>
    `;
  }

  function weekDays(plan) {
    const start = new Date(plan.startDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return date;
    });
  }

  function renderSelectableWeek(plan, selectedDay) {
    const workouts = plan.workouts || [];
    return `
      <div class="week-glance selectable-week">
        ${weekDays(plan).map(date => {
          const key = dayKey(date);
          const dayWorkouts = workouts.filter(workout => dayKey(workout.date) === key);
          const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' }).format(date);
          const dayNumber = new Intl.DateTimeFormat(undefined, { day: 'numeric', timeZone: 'UTC' }).format(date);
          return `
            <button type="button" class="week-day day-select ${selectedDay === key ? 'selected' : ''}" data-day="${escapeHTML(key)}">
              <div class="week-day-head"><span>${escapeHTML(weekday)}</span><strong>${escapeHTML(dayNumber)}</strong></div>
              <div class="week-day-body">
                ${dayWorkouts.length ? dayWorkouts.map(workout => {
                  const sport = sportTheme(workout.discipline);
                  return `
                    <div class="glance-workout" style="--sport:${sport.tint};--sport-deep:${sport.deep}">
                      <div class="glance-sport"><span></span>${escapeHTML(sport.label)}</div>
                      <strong>${escapeHTML(workout.title)}</strong>
                      <small>${escapeHTML(workoutTarget(workout))}</small>
                      <div class="glance-meta"><span class="glance-status ${escapeHTML(workout.status)}">${escapeHTML(workout.status)}</span></div>
                    </div>
                  `;
                }).join('') : '<div class="glance-empty">No session</div>'}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderSelectedDay(plan, day) {
    const workouts = (plan.workouts || []).filter(workout => dayKey(workout.date) === day);
    if (!workouts.length) {
      return '<div class="selected-day-empty"><b>No workout planned</b><span>This day has no session in the selected week.</span></div>';
    }
    return `<div class="selected-day-workouts">${workouts.map(renderWorkoutMirror).join('')}</div>`;
  }

  function renderPlansSection(detail, selectedWeekIndex, selectedDay) {
    const plans = detail.plans || [];
    if (!plans.length) return '<div class="empty-state"><b>No plan available</b>This account does not yet have a cloud-backed training plan.</div>';
    const plan = plans[selectedWeekIndex] || plans[plans.length - 1];
    const resolvedIndex = Math.max(0, plans.indexOf(plan));
    const firstWorkoutDay = plan.workouts?.[0] ? dayKey(plan.workouts[0].date) : dayKey(plan.startDate);
    const activeDay = selectedDay || firstWorkoutDay;
    return `
      <div class="plan-selector-row">
        <div>
          <span class="week-kicker">WEEKLY PLAN</span>
          <h3>Week ${escapeHTML(plan.weekNumber)}</h3>
          <p>${escapeHTML(formatDate(plan.startDate))} – ${escapeHTML(formatDate(plan.endDate))}</p>
        </div>
        <label class="week-select-label">
          <span>Select week</span>
          <select id="athlete-week-select">
            ${plans.map((item, index) => `
              <option value="${index}" ${index === resolvedIndex ? 'selected' : ''}>
                Week ${escapeHTML(item.weekNumber)} · ${escapeHTML(formatDate(item.startDate))}
              </option>
            `).join('')}
          </select>
        </label>
        <div class="week-completion">
          <strong>${escapeHTML(plan.completion?.percentage ?? 0)}%</strong>
          <span>${escapeHTML(plan.completion?.completed ?? 0)} of ${escapeHTML(plan.completion?.planned ?? 0)} completed</span>
        </div>
      </div>
      <div class="week-reason">${escapeHTML(plan.generationReason || plan.generationReasonCode || 'Generated training week')}</div>
      ${renderSelectableWeek(plan, activeDay)}
      <div class="selected-day-detail">
        <div class="selected-day-title">
          <span>SELECTED DAY</span>
          <strong>${escapeHTML(formatDate(activeDay))}</strong>
        </div>
        ${renderSelectedDay(plan, activeDay)}
      </div>
    `;
  }

  function renderUserDetail(detail) {
    $('#user-detail-title').textContent = detail.user?.name || 'Athlete';
    $('#user-detail-subtitle').textContent = [
      detail.user?.email,
      `Last backup ${relativeTime(detail.user?.lastBackupAt)}`
    ].filter(Boolean).join(' · ');

    const plans = detail.plans ?? [];
    const latestIndex = Math.max(0, plans.length - 1);
    const latest = plans[latestIndex];

    const content = $('#user-detail-content');
    content.innerHTML = `
      <div class="mirror-profile">
        <div><span>Experience</span><strong>${escapeHTML(prettyEnum(detail.profile?.experienceLevel))}</strong></div>
        <div><span>Training since</span><strong>${escapeHTML(formatDate(detail.profile?.trainingStartDate))}</strong></div>
        <div><span>Current week</span><strong>${escapeHTML(latest ? `Week ${latest.weekNumber}` : '—')}</strong></div>
        <div><span>Completion</span><strong>${escapeHTML(latest?.completion?.percentage ?? 0)}%</strong></div>
        <div><span>Cloud snapshot</span><strong>${escapeHTML(formatDateTime(detail.snapshotCreatedAt))}</strong></div>
      </div>

      <nav class="athlete-section-tabs" aria-label="Athlete detail sections">
        <button type="button" data-athlete-section="onboarding" aria-pressed="true">Onboarding profile</button>
        <button type="button" data-athlete-section="plans" aria-pressed="false">Weekly plans</button>
        <button type="button" data-athlete-section="progress" aria-pressed="false">Progress</button>
        <button type="button" data-athlete-section="preferences" aria-pressed="false">Preferences</button>
      </nav>

      <section class="athlete-section" data-athlete-panel="onboarding">
        ${renderOnboardingSection(detail)}
      </section>
      <section class="athlete-section" data-athlete-panel="plans" hidden>
        <div id="athlete-plans-content"></div>
      </section>
      <section class="athlete-section" data-athlete-panel="progress" hidden>
        ${renderProgressSection(detail)}
      </section>
      <section class="athlete-section" data-athlete-panel="preferences" hidden>
        ${renderPreferencesSection(detail)}
      </section>
    `;

    let selectedWeekIndex = latestIndex;
    let selectedDay = latest?.workouts?.[0] ? dayKey(latest.workouts[0].date) : (latest ? dayKey(latest.startDate) : '');

    const renderPlans = () => {
      $('#athlete-plans-content').innerHTML = renderPlansSection(detail, selectedWeekIndex, selectedDay);
      const select = $('#athlete-week-select');
      if (select) {
        select.addEventListener('change', event => {
          selectedWeekIndex = Number(event.target.value);
          const plan = detail.plans[selectedWeekIndex];
          selectedDay = plan?.workouts?.[0] ? dayKey(plan.workouts[0].date) : dayKey(plan?.startDate);
          renderPlans();
        });
      }
      $$('.day-select', $('#athlete-plans-content')).forEach(button => {
        button.addEventListener('click', () => {
          selectedDay = button.dataset.day;
          renderPlans();
        });
      });
    };
    renderPlans();

    $$('.athlete-section-tabs button').forEach(button => {
      button.addEventListener('click', () => {
        const section = button.dataset.athleteSection;
        $$('.athlete-section-tabs button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        $$('.athlete-section').forEach(panel => {
          panel.hidden = panel.dataset.athletePanel !== section;
        });
      });
    });
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
        showAuth('This admin session is not authorized to access analytics.');
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
    const password = $('#admin-password').value;
    button.disabled = true;
    button.textContent = 'Signing in…';
    $('#auth-status').textContent = '';
    try {
      await auth.signIn(email, password);
      $('#admin-password').value = '';
      showDashboard();
      await refresh();
    } catch (error) {
      if (error?.status === 429) {
        $('#auth-status').textContent = 'Too many failed attempts. Try again in about 15 minutes.';
      } else {
        $('#auth-status').textContent = error?.status === 401
          ? 'Invalid admin email or password.'
          : (error?.message || 'Could not sign in.');
      }
    } finally {
      button.disabled = false;
      button.textContent = 'Sign in';
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
  $('#dashboard-signout').addEventListener('click', () => {
    auth.signOut();
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

  const session = auth.session();
  if (!session) {
    showAuth();
  } else {
    showDashboard();
    await refresh();
  }
})();