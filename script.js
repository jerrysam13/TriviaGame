/* ============================================================
   Constants
   ============================================================ */
const STORAGE_KEY     = 'triviaLeaderboard';
const TOTAL_QUESTIONS = 10;
const API_BASE        = 'https://opentdb.com/api.php';
const FLASH_DURATION  = 1000;

/* ============================================================
   DOM Cache
   ============================================================ */
const screens = {
  welcome:  document.getElementById('screen-welcome'),
  question: document.getElementById('screen-question'),
  feedback: document.getElementById('screen-feedback'),
  final:    document.getElementById('screen-final'),
};

const els = {
  // Welcome
  diffBtns:        document.querySelectorAll('.diff-btn'),
  btnStart:        document.getElementById('btn-start'),
  leaderboardList: document.getElementById('leaderboard-list'),

  // Question
  questionCounter: document.getElementById('question-counter'),
  runningScore:    document.getElementById('running-score'),
  progressFill:    document.getElementById('progress-fill'),
  questionText:    document.getElementById('question-text'),
  answersGrid:     document.getElementById('answers-grid'),

  // Feedback
  feedbackIcon:      document.getElementById('feedback-icon'),
  feedbackLabel:     document.getElementById('feedback-label'),
  correctAnswerText: document.getElementById('correct-answer-text'),
  btnNext:           document.getElementById('btn-next'),

  // Final
  scoreValue:     document.getElementById('score-value'),
  finalMessage:   document.getElementById('final-message'),
  nameInput:      document.getElementById('name-input'),
  btnSave:        document.getElementById('btn-save'),
  btnPlayAgain:   document.getElementById('btn-play-again'),
  btnEnd:         document.getElementById('btn-end'),
  thankYou:       document.getElementById('thank-you'),
  saveScoreGroup: document.getElementById('save-score-group'),
};

/* ============================================================
   Game State
   ============================================================ */
const state = {
  questions:    [],
  currentIndex: 0,
  score:        0,
  difficulty:   'easy',
};

/* ============================================================
   Utilities
   ============================================================ */
function decodeHTML(html) {
  const t = document.createElement('textarea');
  t.innerHTML = html;
  return t.value;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ============================================================
   Screen Management
   ============================================================ */
function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
}

/* ============================================================
   Leaderboard
   ============================================================ */
function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function updateLeaderboard(newEntry) {
  let board = loadLeaderboard();

  if (newEntry) {
    board.push(newEntry);
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 5);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch {
      // Storage quota exceeded — continue without saving
    }
  }

  if (board.length === 0) {
    els.leaderboardList.innerHTML =
      '<li class="leaderboard-empty">No scores yet. Be the first!</li>';
    return;
  }

  els.leaderboardList.innerHTML = board
    .map((entry, i) => `
      <li>
        <span class="lb-rank">${i + 1}.</span>
        <span class="lb-name">${entry.name}</span>
        <span class="lb-score">${entry.score}/10</span>
      </li>
    `)
    .join('');
}

/* ============================================================
   API
   ============================================================ */
async function fetchQuestions(difficulty) {
  const url = `${API_BASE}?amount=${TOTAL_QUESTIONS}&type=multiple&difficulty=${difficulty}`;
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error('Network error. Please check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error('Server error. Please try again in a moment.');
  }

  const data = await response.json();

  if (data.response_code !== 0) {
    const messages = {
      1: 'Not enough questions available for this difficulty. Try another.',
      5: 'Too many requests. Please wait a moment and try again.',
    };
    throw new Error(
      messages[data.response_code] || 'Failed to load questions. Please try again.'
    );
  }

  return data.results.map(q => ({
    question:          decodeHTML(q.question),
    correct_answer:    decodeHTML(q.correct_answer),
    incorrect_answers: q.incorrect_answers.map(decodeHTML),
  }));
}

/* ============================================================
   Error Display
   ============================================================ */
function showError(message) {
  document.querySelector('.error-msg')?.remove();

  const div = document.createElement('div');
  div.className = 'error-msg';
  div.textContent = message;

  els.btnStart.insertAdjacentElement('beforebegin', div);
  els.btnStart.textContent = 'Try Again';
  els.btnStart.disabled = false;
}

/* ============================================================
   Game Lifecycle
   ============================================================ */
async function initGame() {
  state.questions    = [];
  state.currentIndex = 0;
  state.score        = 0;

  document.querySelector('.error-msg')?.remove();
  els.btnStart.disabled = true;
  els.btnStart.textContent = 'Loading...';

  try {
    state.questions = await fetchQuestions(state.difficulty);
    showScreen('question');
    displayQuestion();
  } catch (err) {
    showError(err.message);
  }
}

function displayQuestion() {
  const q = state.questions[state.currentIndex];
  const num = state.currentIndex + 1;

  els.questionCounter.textContent = `Question ${num} of ${TOTAL_QUESTIONS}`;
  els.runningScore.textContent    = `Score: ${state.score}`;
  els.progressFill.style.width    = `${((num - 1) / TOTAL_QUESTIONS) * 100}%`;
  els.questionText.textContent    = q.question;

  const answers = shuffle([q.correct_answer, ...q.incorrect_answers]);

  els.answersGrid.innerHTML = '';

  answers.forEach(answer => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answer;
    btn.dataset.answer = answer;
    btn.addEventListener('click', () => handleAnswer(btn, answer));
    els.answersGrid.appendChild(btn);
  });
}

function handleAnswer(btn, selectedAnswer) {
  const allBtns = els.answersGrid.querySelectorAll('.answer-btn');
  allBtns.forEach(b => (b.disabled = true));

  const correctAnswer = state.questions[state.currentIndex].correct_answer;
  const isCorrect     = selectedAnswer === correctAnswer;

  if (isCorrect) {
    state.score++;
    btn.classList.add('flash-correct');
  } else {
    btn.classList.add('flash-wrong');
    allBtns.forEach(b => {
      if (b.dataset.answer === correctAnswer) {
        b.classList.add('flash-correct');
      }
    });
  }

  setTimeout(() => showFeedback(isCorrect, correctAnswer), FLASH_DURATION);
}

function showFeedback(isCorrect, correctAnswer) {
  if (isCorrect) {
    els.feedbackIcon.textContent = '✅';
    els.feedbackLabel.textContent = 'Correct!';
    els.feedbackLabel.className = 'feedback-label correct';
  } else {
    els.feedbackIcon.textContent = '❌';
    els.feedbackLabel.textContent = 'Wrong!';
    els.feedbackLabel.className = 'feedback-label wrong';
  }

  els.correctAnswerText.textContent = correctAnswer;

  const isLast = state.currentIndex === TOTAL_QUESTIONS - 1;
  els.btnNext.textContent = isLast ? 'See Results' : 'Next Question';

  showScreen('feedback');
}

function nextQuestion() {
  state.currentIndex++;

  if (state.currentIndex < TOTAL_QUESTIONS) {
    showScreen('question');
    displayQuestion();
  } else {
    showFinalScore();
  }
}

function showFinalScore() {
  const pct = state.score / TOTAL_QUESTIONS;
  let message;

  if (pct === 1)        message = "Perfect score! You're a trivia genius!";
  else if (pct >= 0.8)  message = 'Great job! Nearly flawless.';
  else if (pct >= 0.6)  message = 'Solid performance. Room to improve!';
  else if (pct >= 0.4)  message = 'Not bad! Keep practicing.';
  else                   message = 'Better luck next time!';

  els.scoreValue.textContent = state.score;
  els.finalMessage.textContent = message;

  els.nameInput.value = '';
  els.saveScoreGroup.style.display = 'flex';
  els.btnSave.disabled = false;
  els.btnSave.textContent = 'Save Score';
  els.thankYou.textContent = '';
  els.btnPlayAgain.disabled = false;
  els.btnEnd.disabled = false;

  showScreen('final');
}

/* ============================================================
   Score Saving
   ============================================================ */
function saveScore() {
  const name = els.nameInput.value.trim();

  if (!name) {
    els.nameInput.style.borderColor = 'var(--wrong)';
    els.nameInput.focus();
    setTimeout(() => {
      els.nameInput.style.borderColor = '';
    }, 1000);
    return;
  }

  updateLeaderboard({ name, score: state.score });

  els.saveScoreGroup.style.display = 'none';
  els.thankYou.textContent = `Score saved! Great game, ${name}.`;
}

/* ============================================================
   Event Listeners & Init
   ============================================================ */
function init() {
  // Difficulty selector
  els.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      els.diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = btn.dataset.difficulty;
    });
  });

  // Start game
  els.btnStart.addEventListener('click', initGame);

  // Next question
  els.btnNext.addEventListener('click', nextQuestion);

  // Save score
  els.btnSave.addEventListener('click', saveScore);

  // Save on Enter key in name field
  els.nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveScore();
  });

  // Play Again
  els.btnPlayAgain.addEventListener('click', () => {
    els.btnStart.disabled = false;
    els.btnStart.textContent = 'Start Game';
    document.querySelector('.error-msg')?.remove();
    updateLeaderboard();
    showScreen('welcome');
  });

  // End
  els.btnEnd.addEventListener('click', () => {
    els.thankYou.textContent = 'Thanks for playing! Come back soon.';
    els.saveScoreGroup.style.display = 'none';
    els.btnPlayAgain.disabled = true;
    els.btnEnd.disabled = true;
  });

  // Render initial leaderboard
  updateLeaderboard();
}

init();
