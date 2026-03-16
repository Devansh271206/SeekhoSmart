/**
 * script.js — AdaptLearn frontend API client
 * Handles auth, navigation, and all page data fetching.
 */

const API = 'http://localhost:5000/api';

/* ════════════════════════════════════════════════════════════
   AUTH HELPERS
════════════════════════════════════════════════════════════ */

const getToken = ()      => localStorage.getItem('al_token');
const getUser  = ()      => JSON.parse(localStorage.getItem('al_user') || 'null');
const setAuth  = (t, u)  => { localStorage.setItem('al_token', t); localStorage.setItem('al_user', JSON.stringify(u)); };
const clearAuth = ()     => { localStorage.removeItem('al_token'); localStorage.removeItem('al_user'); };

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization:  `Bearer ${getToken()}`,
});

/** Redirect to login if no token is present */
const requireAuth = () => {
  if (!getToken()) { window.location.href = 'login.html'; }
};

/** Generic fetch wrapper — always returns parsed JSON */
async function apiFetch(path, options = {}) {
  const res  = await fetch(`${API}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ════════════════════════════════════════════════════════════
   ALERT HELPER
════════════════════════════════════════════════════════════ */

function showAlert(msg, type = 'error', boxId = 'alertBox') {
  const box = document.getElementById(boxId);
  if (!box) return;
  box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => (box.innerHTML = ''), 5000);
}

/* ════════════════════════════════════════════════════════════
   PAGE ROUTER
════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // Fill [data-username] spans
  const user = getUser();
  document.querySelectorAll('[data-username]').forEach(el => {
    if (user) el.textContent = user.name.split(' ')[0];
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      clearAuth();
      window.location.href = 'index.html';
    });
  }

  switch (page) {
    case 'signup':    initSignup();    break;
    case 'login':     initLogin();     break;
    case 'dashboard': initDashboard(); break;
    case 'topics':    initTopics();    break;
    case 'lesson':    initLesson();    break;
    case 'quiz':      initQuiz();      break;
    case 'results':   initResults();   break;
    case 'progress':  initProgress();  break;
  }
});

/* ════════════════════════════════════════════════════════════
   SIGNUP
════════════════════════════════════════════════════════════ */

function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      const data = await apiFetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     document.getElementById('name').value.trim(),
          email:    document.getElementById('email').value.trim(),
          password: document.getElementById('password').value,
        }),
      });

      setAuth(data.token, data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

/* ════════════════════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════════════════════ */

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('email').value.trim(),
          password: document.getElementById('password').value,
        }),
      });

      setAuth(data.token, data.user);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert(err.message);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════ */

async function initDashboard() {
  requireAuth();

  try {
    const [progressRes, recRes] = await Promise.all([
      apiFetch('/progress',             { headers: authHeaders() }),
      apiFetch('/progress/recommended', { headers: authHeaders() }),
    ]);

    // Progress bar
    const pct = progressRes.data.stats.overallPct;
    document.getElementById('progressPct').textContent = `${pct}%`;
    document.getElementById('progressBar').style.width  = `${pct}%`;

    // Recommended lessons
    const list = document.getElementById('lessonList');
    list.innerHTML = '';
    const lessons = recRes.data;

    if (!lessons.length) {
      list.innerHTML = '<li class="text-muted">🎉 You\'ve completed all lessons!</li>';
      return;
    }

    lessons.forEach(lesson => {
      const li = document.createElement('li');
      li.className = 'lesson-item';
      li.innerHTML = `
        <a href="lesson.html?id=${lesson._id}" class="lesson-link">
          <span class="lesson-icon">${lesson.topic?.icon || '📖'}</span>
          <span>
            <strong>${lesson.title}</strong>
            <small class="text-muted"> — ${lesson.topic?.title || ''}</small>
          </span>
          <span class="badge">${lesson.difficulty}</span>
        </a>`;
      list.appendChild(li);
    });
  } catch (err) {
    showAlert(err.message);
  }
}

/* ════════════════════════════════════════════════════════════
   TOPICS
════════════════════════════════════════════════════════════ */

async function initTopics() {
  requireAuth();

  try {
    const res = await apiFetch('/topics', { headers: authHeaders() });
    const progressRes = await apiFetch('/progress', { headers: authHeaders() });

    const doneTopicIds = progressRes.data.completedTopics.map(t => t._id);
    const grid = document.getElementById('topicsGrid');
    grid.innerHTML = '';

    res.data.forEach(topic => {
      const done = doneTopicIds.includes(topic._id);
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.style.setProperty('--topic-color', topic.color);
      card.innerHTML = `
        <div class="topic-icon">${topic.icon}</div>
        <h3>${topic.title} ${done ? '✅' : ''}</h3>
        <p>${topic.description}</p>
        <a href="topics.html?topic=${topic._id}" class="btn btn-outline btn-sm mt-1">
          ${done ? 'Review' : 'Start Learning'}
        </a>`;
      grid.appendChild(card);
    });

    // If a ?topic= param is present, show lessons for that topic
    const params  = new URLSearchParams(window.location.search);
    const topicId = params.get('topic');
    if (topicId) loadTopicLessons(topicId);

  } catch (err) {
    showAlert(err.message);
  }
}

async function loadTopicLessons(topicId) {
  try {
    const res = await apiFetch(`/topics/${topicId}/lessons`, { headers: authHeaders() });
    const grid = document.getElementById('topicsGrid');
    grid.innerHTML = '<h2 style="grid-column:1/-1">Lessons</h2>';

    res.data.forEach(lesson => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <h3>${lesson.title}</h3>
        <span class="badge">${lesson.difficulty}</span>
        <a href="lesson.html?id=${lesson._id}" class="btn btn-primary btn-sm mt-1">Open Lesson</a>`;
      grid.appendChild(card);
    });
  } catch (err) {
    showAlert(err.message);
  }
}

/* ════════════════════════════════════════════════════════════
   LESSON
════════════════════════════════════════════════════════════ */

async function initLesson() {
  requireAuth();

  const params   = new URLSearchParams(window.location.search);
  const lessonId = params.get('id');
  if (!lessonId) { window.location.href = 'topics.html'; return; }

  try {
    const res    = await apiFetch(`/lessons/${lessonId}`, { headers: authHeaders() });
    const lesson = res.data;

    document.title                          = `${lesson.title} — AdaptLearn`;
    document.getElementById('lessonTopic').textContent = lesson.topic?.title || '';
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonBody').innerHTML    = lesson.content;

    // Quiz button
    document.getElementById('startQuizBtn').addEventListener('click', () => {
      window.location.href = `quiz.html?lesson=${lessonId}`;
    });

    // Next lesson
    const nextRes = await apiFetch(`/lessons/${lessonId}/next`, { headers: authHeaders() });
    const nextBtn = document.getElementById('nextBtn');
    if (nextRes.data) {
      nextBtn.addEventListener('click', () => {
        window.location.href = `lesson.html?id=${nextRes.data._id}`;
      });
    } else {
      nextBtn.disabled = true;
      nextBtn.textContent = 'Last Lesson';
    }

    // Prev — just go back
    document.getElementById('prevBtn').addEventListener('click', () => history.back());

  } catch (err) {
    showAlert(err.message);
  }
}

/* ════════════════════════════════════════════════════════════
   QUIZ
════════════════════════════════════════════════════════════ */

async function initQuiz() {
  requireAuth();

  const params   = new URLSearchParams(window.location.search);
  const lessonId = params.get('lesson');
  if (!lessonId) { window.location.href = 'topics.html'; return; }

  try {
    const res  = await apiFetch(`/lessons/${lessonId}/quiz`, { headers: authHeaders() });
    const quiz = res.data;

    const wrap = document.getElementById('quizWrap');
    wrap.innerHTML = '';

    quiz.questions.forEach((q, qi) => {
      const card = document.createElement('div');
      card.className = 'card mb-2';
      card.innerHTML = `<p class="quiz-question"><strong>Q${qi + 1}.</strong> ${q.text}</p>
        <ul class="quiz-options">
          ${q.options.map((o, oi) => `
            <li>
              <label class="quiz-option">
                <input type="radio" name="q_${q._id}" value="${oi}">
                ${o.text}
              </label>
            </li>`).join('')}
        </ul>`;
      wrap.appendChild(card);
    });

    document.getElementById('submitBtn').addEventListener('click', async () => {
      const answers = quiz.questions.map(q => {
        const selected = document.querySelector(`input[name="q_${q._id}"]:checked`);
        return {
          questionId:    q._id,
          selectedIndex: selected ? parseInt(selected.value) : -1,
        };
      });

      try {
        const result = await apiFetch(`/quiz/${quiz._id}/submit`, {
          method:  'POST',
          headers: authHeaders(),
          body:    JSON.stringify({ answers }),
        });

        // Store result for results.html
        sessionStorage.setItem('al_result', JSON.stringify(result.data));
        window.location.href = 'results.html';
      } catch (err) {
        showAlert(err.message);
      }
    });

  } catch (err) {
    showAlert(err.message);
  }
}

/* ════════════════════════════════════════════════════════════
   RESULTS
════════════════════════════════════════════════════════════ */

function initResults() {
  requireAuth();

  const result = JSON.parse(sessionStorage.getItem('al_result') || 'null');
  if (!result) { window.location.href = 'dashboard.html'; return; }

  document.getElementById('scorePct').textContent      = `${result.percentage}%`;
  document.getElementById('scoreNum').textContent      = result.score;
  document.getElementById('totalQuestions').textContent = result.totalQuestions;

  // Answer review
  const review = document.getElementById('answerReview');
  review.innerHTML = '';
  result.answers.forEach((a, i) => {
    const li = document.createElement('li');
    li.className = `review-item ${a.isCorrect ? 'correct' : 'incorrect'}`;
    li.innerHTML = `
      <strong>Q${i + 1}:</strong> ${a.questionText}<br>
      <span class="${a.isCorrect ? 'text-success' : 'text-danger'}">
        ${a.isCorrect ? '✅ Correct' : '❌ Incorrect'}
      </span>
      ${a.explanation ? `<p class="text-muted mt-1">${a.explanation}</p>` : ''}`;
    review.appendChild(li);
  });

  // Next lesson button — go back to the lesson to navigate to next
  document.getElementById('nextLessonBtn').addEventListener('click', () => {
    window.location.href = 'topics.html';
  });
}

/* ════════════════════════════════════════════════════════════
   PROGRESS
════════════════════════════════════════════════════════════ */

async function initProgress() {
  requireAuth();

  try {
    const res   = await apiFetch('/progress', { headers: authHeaders() });
    const { stats, completedTopics } = res.data;

    document.getElementById('totalLessons').textContent  = stats.totalLessons;
    document.getElementById('totalTopics').textContent   = stats.totalTopics;
    document.getElementById('accuracyPct').textContent   = `${stats.accuracy}%`;
    document.getElementById('totalQuizzes').textContent  = stats.totalQuizzes;
    document.getElementById('overallPct').textContent    = `${stats.overallPct}%`;
    document.getElementById('overallBar').style.width    = `${stats.overallPct}%`;

    const list = document.getElementById('completedList');
    list.innerHTML = '';

    if (!completedTopics.length) {
      list.innerHTML = '<li class="text-muted">No topics completed yet — keep learning! 🚀</li>';
      return;
    }

    completedTopics.forEach(topic => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${topic.icon}</span> <strong>${topic.title}</strong>
        <span class="badge badge-success ml-1">Complete</span>`;
      list.appendChild(li);
    });

  } catch (err) {
    showAlert(err.message);
  }
}
