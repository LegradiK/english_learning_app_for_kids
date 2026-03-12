// ==================== DATA ====================
const wordSets = {
  1: [
    { word: "cat",  emoji: "🐱" },
    { word: "dog",  emoji: "🐶" },
    { word: "sun",  emoji: "☀️" },
    { word: "book", emoji: "📚" },
    { word: "fish", emoji: "🐟" },
    { word: "tree", emoji: "🌳" },
    { word: "frog", emoji: "🐸" },
    { word: "cake", emoji: "🎂" },
    { word: "ship", emoji: "🚢" },
    { word: "star", emoji: "⭐" },
  ],
  2: [
    { word: "rain",  emoji: "🌧️" },
    { word: "play",  emoji: "🎮" },
    { word: "night", emoji: "🌙" },
    { word: "light", emoji: "💡" },
    { word: "found", emoji: "🔍" },
    { word: "dream", emoji: "💭" },
    { word: "frost", emoji: "❄️" },
    { word: "brave", emoji: "🦁" },
    { word: "graze", emoji: "🐄" },
    { word: "flute", emoji: "🎵" },
  ],
  3: [
    { word: "climbing",    emoji: "🧗" },
    { word: "beautiful",   emoji: "🌸" },
    { word: "carefully",   emoji: "🤏" },
    { word: "hopeless",    emoji: "😔" },
    { word: "darkness",    emoji: "🌑" },
    { word: "unhappy",     emoji: "😢" },
    { word: "quickly",     emoji: "💨" },
    { word: "rainbow",     emoji: "🌈" },
    { word: "disappear",   emoji: "🪄" },
    { word: "backpack",    emoji: "🎒" },
  ],
};

const sentenceSets = {
  4: [
    { full: "The cat sat on the mat",   blanks: [1, 5], emoji: "🐱" },
    { full: "I see a big red ball",      blanks: [3, 4], emoji: "🔴" },
    { full: "She has a little dog",      blanks: [2, 4], emoji: "🐶" },
    { full: "The sun is very hot",       blanks: [1, 4], emoji: "☀️" },
    { full: "My fish can swim fast",     blanks: [1, 3], emoji: "🐟" },
    { full: "We go to the big park",     blanks: [4, 5], emoji: "🌳" },
    { full: "A frog can jump high",      blanks: [1, 3], emoji: "🐸" },
    { full: "I like to eat cake",        blanks: [2, 5], emoji: "🎂" },
  ],
};

// ==================== STATE ====================
// One state object per stage, keyed by stage number
const state = {};

// ==================== SPEECH ====================
function speak(text, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) onEnd(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  u.pitch = 1.1;
  u.lang = 'en-GB';
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

// ==================== SPELLING STAGES (1, 2, 3) ====================
function spellingInit(n) {
  state[n] = { index: 0, score: 0, listened: false, revealed: false };
  const words = wordSets[n];
  renderDots(`s${n}-dots`, words.length, 0);
  spellingUpdateProgress(n);
  spellingResetUI(n);
  document.getElementById(`s${n}-main`).classList.remove('hidden');
  document.getElementById(`s${n}-complete`).classList.remove('show');
  document.getElementById(`s${n}-feedback`).classList.remove('show');
}

function spellingResetUI(n) {
  const reveal = document.getElementById(`s${n}-reveal`);
  reveal.classList.remove('revealed');
  document.getElementById(`s${n}-word-text`).textContent = '';
  document.getElementById(`s${n}-tiles`).innerHTML = '';
  document.getElementById(`s${n}-input`).value = '';
  setBtn(`s${n}-listen-btn`, true);
  setBtn(`s${n}-reveal-btn`, false);
  setBtn(`s${n}-next-btn`, false);
  document.getElementById(`s${n}-instruction`).textContent = 'Press the button to hear a word!';
  document.getElementById(`s${n}-feedback`).classList.remove('show');
  state[n].listened = false;
  state[n].revealed = false;
}

function spellingListen(n) {
  const item = wordSets[n][state[n].index];
  const btn = document.getElementById(`s${n}-listen-btn`);
  btn.classList.add('speaking');
  btn.textContent = '🔊 Listening...';
  speak(item.word, () => {
    btn.classList.remove('speaking');
    btn.innerHTML = '🔊 Hear Again';
    if (!state[n].listened) {
      state[n].listened = true;
      setBtn(`s${n}-reveal-btn`, true);
      document.getElementById(`s${n}-instruction`).textContent = 'Try to spell it! Then reveal 👇';
    }
  });
}

function spellingReveal(n) {
  if (!state[n].listened) return;
  const item = wordSets[n][state[n].index];
  const reveal = document.getElementById(`s${n}-reveal`);
  reveal.classList.add('revealed');

  document.getElementById(`s${n}-word-text`).textContent = item.emoji;

  const tilesDiv = document.getElementById(`s${n}-tiles`);
  tilesDiv.innerHTML = '';
  item.word.split('').forEach((ch, i) => {
    const tile = document.createElement('div');
    tile.className = 'letter-tile';
    tile.textContent = ch.toUpperCase();
    tile.style.animationDelay = (i * 0.08) + 's';
    tilesDiv.appendChild(tile);
  });

  const wordEl = document.createElement('div');
  wordEl.style.cssText = 'font-family:Fredoka One,cursive;font-size:2rem;letter-spacing:4px;color:#2D2D2D;margin-top:8px;';
  wordEl.textContent = item.word.toUpperCase();
  tilesDiv.after(wordEl);

  speak(item.word);
  state[n].revealed = true;
  state[n].score++;
  document.getElementById(`s${n}-score`).textContent = state[n].score;

  const msgs = ['Great work! 🎉', 'Super! ⭐', 'You got it! 🌟', 'Brilliant! 🏆', 'Fantastic! 🦄'];
  showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], 'great');
  launchEmojis(['⭐', '🎊', '✨', '💫']);

  setBtn(`s${n}-reveal-btn`, false);
  setBtn(`s${n}-next-btn`, true);
  markDot(`s${n}-dots`, state[n].index, wordSets[n].length);
  spellingUpdateProgress(n);
}

function spellingNext(n) {
  state[n].index++;
  if (state[n].index >= wordSets[n].length) {
    showCompletion(n);
    return;
  }
  spellingResetUI(n);
  renderDots(`s${n}-dots`, wordSets[n].length, state[n].index);
}

function spellingUpdateProgress(n) {
  document.getElementById(`s${n}-progress`).style.width =
    (state[n].index / wordSets[n].length * 100) + '%';
}

// ==================== SENTENCE STAGE (4) ====================
function sentenceInit(n) {
  state[n] = { index: 0, score: 0, listened: false, revealed: false };
  const sentences = sentenceSets[n];
  renderDots(`s${n}-dots`, sentences.length, 0);
  sentenceUpdateProgress(n);
  sentenceResetUI(n);
  document.getElementById(`s${n}-main`).classList.remove('hidden');
  document.getElementById(`s${n}-complete`).classList.remove('show');
}

function sentenceResetUI(n) {
  document.getElementById(`s${n}-sentence`).innerHTML =
    '<span style="color:#ccc;font-size:1rem;font-family:Nunito;font-weight:700;">Your sentence will appear here...</span>';
  setBtn(`s${n}-listen-btn`, true);
  setBtn(`s${n}-reveal-btn`, false);
  setBtn(`s${n}-next-btn`, false);
  document.getElementById(`s${n}-instruction`).textContent = 'Press the button to hear a sentence!';
  document.getElementById(`s${n}-feedback`).classList.remove('show');
  state[n].listened = false;
  state[n].revealed = false;
}

function sentenceListen(n) {
  const item = sentenceSets[n][state[n].index];
  const btn = document.getElementById(`s${n}-listen-btn`);
  btn.classList.add('speaking');
  btn.textContent = '🔊 Listening...';
  speak(item.full, () => {
    btn.classList.remove('speaking');
    btn.innerHTML = '🔊 Hear Again';
    if (!state[n].listened) {
      state[n].listened = true;
      renderSentence(n, false);
      setBtn(`s${n}-reveal-btn`, true);
      document.getElementById(`s${n}-instruction`).textContent = 'Can you guess the missing words? 👇';
    }
  });
}

function renderSentence(n, revealed) {
  const item = sentenceSets[n][state[n].index];
  const words = item.full.split(' ');
  const container = document.getElementById(`s${n}-sentence`);
  container.innerHTML = '';
 
  // Each word is a flex item — gap in CSS handles spacing
  words.forEach((w, i) => {
    const span = document.createElement('span');
    if (item.blanks.includes(i)) {
      span.className = 'blank-word' + (revealed ? ' revealed' : '');
    } else {
      span.className = 'sentence-word';
    }
    span.textContent = w;
    container.appendChild(span);
  });
}

function sentenceReveal(n) {
  if (!state[n].listened) return;
  renderSentence(n, true);
  speak(sentenceSets[n][state[n].index].full);
  state[n].revealed = true;
  state[n].score++;
  document.getElementById(`s${n}-score`).textContent = state[n].score;

  const msgs = ["Well done! 🎉", "You're a star! ⭐", "Amazing! 🌟", "Keep it up! 🏆", "Wonderful! 🦄"];
  showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], 'great');
  launchEmojis(['🌟', '🎊', '💫', '✨', '🌈']);

  setBtn(`s${n}-reveal-btn`, false);
  setBtn(`s${n}-next-btn`, true);
  markDot(`s${n}-dots`, state[n].index, sentenceSets[n].length);
  sentenceUpdateProgress(n);
}

function sentenceNext(n) {
  state[n].index++;
  if (state[n].index >= sentenceSets[n].length) {
    showCompletion(n);
    return;
  }
  sentenceResetUI(n);
  renderDots(`s${n}-dots`, sentenceSets[n].length, state[n].index);
}

function sentenceUpdateProgress(n) {
  document.getElementById(`s${n}-progress`).style.width =
    (state[n].index / sentenceSets[n].length * 100) + '%';
}

// ==================== UTILS ====================
function setBtn(id, enabled) {
  const btn = document.getElementById(id);
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? '1' : '0.4';
}

function showFeedback(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'feedback show ' + type;
}

function renderDots(id, total, current) {
  const container = document.getElementById(id);
  container.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < current ? ' done' : i === current ? ' current' : '');
    container.appendChild(d);
  }
}

function markDot(id, index, total) {
  renderDots(id, total, index);
  const dots = document.querySelectorAll('#' + id + ' .dot');
  if (dots[index]) {
    dots[index].classList.remove('current');
    dots[index].classList.add('done');
  }
}

function launchEmojis(emojis) {
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'emoji-float';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (20 + Math.random() * 60) + 'vw';
      el.style.top = (30 + Math.random() * 40) + 'vh';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }, i * 150);
  }
}

function showCompletion(n) {
  document.getElementById(`s${n}-main`).classList.add('hidden');
  document.getElementById(`s${n}-complete`).classList.add('show');
  document.getElementById(`s${n}-stars`).textContent = '⭐⭐⭐⭐⭐';
  launchEmojis(['🎉', '🌟', '🏆', '🦄', '🎊', '💫', '🌈']);
  speak('Congratulations! You are a Word Wizard!');
}

function restartStage(n) {
  if (wordSets[n]) spellingInit(n);
  else if (sentenceSets[n]) sentenceInit(n);
}

// ==================== STAGE TABS ====================
function switchStage(n) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === n - 1));
  document.querySelectorAll('.stage-panel').forEach((p, i) => p.classList.toggle('active', i === n - 1));
  window.speechSynthesis && window.speechSynthesis.cancel();
}

// ==================== INIT ====================
spellingInit(1);
spellingInit(2);
spellingInit(3);
sentenceInit(4);