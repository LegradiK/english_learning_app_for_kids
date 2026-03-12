// ==================== DATA ====================
const stage1Words = [
  { word: "cat",    emoji: "🐱" },
  { word: "dog",    emoji: "🐶" },
  { word: "sun",    emoji: "☀️" },
  { word: "book",   emoji: "📚" },
  { word: "fish",   emoji: "🐟" },
  { word: "tree",   emoji: "🌳" },
  { word: "frog",   emoji: "🐸" },
  { word: "cake",   emoji: "🎂" },
  { word: "ship",   emoji: "🚢" },
  { word: "star",   emoji: "⭐" },
];

const stage2Sentences = [
  { full: "The cat sat on the mat",    blanks: [1, 5],   emoji: "🐱" },
  { full: "I see a big red ball",       blanks: [3, 4],   emoji: "🔴" },
  { full: "She has a little dog",       blanks: [2, 4],   emoji: "🐶" },
  { full: "The sun is very hot",        blanks: [1, 4],   emoji: "☀️" },
  { full: "My fish can swim fast",      blanks: [1, 3],   emoji: "🐟" },
  { full: "We go to the big park",      blanks: [4, 5],   emoji: "🌳" },
  { full: "A frog can jump high",       blanks: [1, 3],   emoji: "🐸" },
  { full: "I like to eat cake",         blanks: [2, 5],   emoji: "🎂" },
];

// ==================== STATE ====================
let s1 = { index: 0, score: 0, listened: false, revealed: false };
let s2 = { index: 0, score: 0, listened: false, revealed: false };

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

// ==================== STAGE 1 ====================
function s1Init() {
  s1 = { index: 0, score: 0, listened: false, revealed: false };
  renderDots('s1-dots', stage1Words.length, 0);
  s1UpdateProgress();
  s1ResetUI();
  document.getElementById('s1-main').classList.remove('hidden');
  document.getElementById('s1-complete').classList.remove('show');
  document.getElementById('s1-feedback').classList.remove('show');
}

function s1ResetUI() {
  const reveal = document.getElementById('s1-reveal');
  reveal.classList.remove('revealed');
  document.getElementById('s1-word-text').textContent = '';
  document.getElementById('s1-tiles').innerHTML = '';
  setBtn('s1-listen-btn', true);
  setBtn('s1-reveal-btn', false);
  setBtn('s1-next-btn', false);
  document.getElementById('s1-instruction').textContent = 'Press the button to hear a word!';
  document.getElementById('s1-feedback').classList.remove('show');
  s1.listened = false;
  s1.revealed = false;
}

function s1Listen() {
  const item = stage1Words[s1.index];
  const btn = document.getElementById('s1-listen-btn');
  btn.classList.add('speaking');
  btn.textContent = '🔊 Listening...';
  speak(item.word, () => {
    btn.classList.remove('speaking');
    btn.innerHTML = '🔊 Hear Again';
    if (!s1.listened) {
      s1.listened = true;
      setBtn('s1-reveal-btn', true);
      document.getElementById('s1-instruction').textContent = 'Try to spell it! Then reveal 👇';
    }
  });
}

function s1Reveal() {
  if (!s1.listened) return;
  const item = stage1Words[s1.index];
  const reveal = document.getElementById('s1-reveal');
  reveal.classList.add('revealed');

  document.getElementById('s1-word-text').textContent = item.emoji;

  const tilesDiv = document.getElementById('s1-tiles');
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
  s1.revealed = true;
  s1.score++;
  document.getElementById('s1-score').textContent = s1.score;

  const msgs = ['Great work! 🎉','Super! ⭐','You got it! 🌟','Brilliant! 🏆','Fantastic! 🦄'];
  showFeedback('s1-feedback', msgs[Math.floor(Math.random()*msgs.length)], 'great');
  launchEmojis(['⭐','🎊','✨','💫']);

  setBtn('s1-reveal-btn', false);
  setBtn('s1-next-btn', true);
  markDot('s1-dots', s1.index, stage1Words.length);
  s1UpdateProgress();
}

function s1Next() {
  s1.index++;
  if (s1.index >= stage1Words.length) {
    showCompletion(1);
    return;
  }
  s1ResetUI();
  renderDots('s1-dots', stage1Words.length, s1.index);
}

function s1UpdateProgress() {
  document.getElementById('s1-progress').style.width = (s1.index / stage1Words.length * 100) + '%';
}

// ==================== STAGE 2 ====================
function s2Init() {
  s2 = { index: 0, score: 0, listened: false, revealed: false };
  renderDots('s2-dots', stage2Sentences.length, 0);
  s2UpdateProgress();
  s2ResetUI();
  document.getElementById('s2-main').classList.remove('hidden');
  document.getElementById('s2-complete').classList.remove('show');
}

function s2ResetUI() {
  document.getElementById('s2-sentence').innerHTML = '<span style="color:#ccc;font-size:1rem;font-family:Nunito;font-weight:700;">Your sentence will appear here...</span>';
  setBtn('s2-listen-btn', true);
  setBtn('s2-reveal-btn', false);
  setBtn('s2-next-btn', false);
  document.getElementById('s2-instruction').textContent = 'Press the button to hear a sentence!';
  document.getElementById('s2-feedback').classList.remove('show');
  s2.listened = false;
  s2.revealed = false;
}

function s2Listen() {
  const item = stage2Sentences[s2.index];
  const btn = document.getElementById('s2-listen-btn');
  btn.classList.add('speaking');
  btn.textContent = '🔊 Listening...';
  speak(item.full, () => {
    btn.classList.remove('speaking');
    btn.innerHTML = '🔊 Hear Again';
    if (!s2.listened) {
      s2.listened = true;
      renderSentence(false);
      setBtn('s2-reveal-btn', true);
      document.getElementById('s2-instruction').textContent = 'Can you guess the missing words? 👇';
    }
  });
}

function renderSentence(revealed) {
  const item = stage2Sentences[s2.index];
  const words = item.full.split(' ');
  const container = document.getElementById('s2-sentence');
  container.innerHTML = '';

  words.forEach((w, i) => {
    if (item.blanks.includes(i)) {
      const span = document.createElement('span');
      span.className = 'blank-word' + (revealed ? ' revealed' : '');
      span.textContent = w;
      container.appendChild(span);
    } else {
      const span = document.createElement('span');
      span.textContent = w;
      container.appendChild(span);
    }
    if (i < words.length - 1) {
      container.appendChild(document.createTextNode(' '));
    }
  });
}

function s2Reveal() {
  if (!s2.listened) return;
  renderSentence(true);
  speak(stage2Sentences[s2.index].full);
  s2.revealed = true;
  s2.score++;
  document.getElementById('s2-score').textContent = s2.score;

  const msgs = ['Well done! 🎉','You\'re a star! ⭐','Amazing! 🌟','Keep it up! 🏆','Wonderful! 🦄'];
  showFeedback('s2-feedback', msgs[Math.floor(Math.random()*msgs.length)], 'great');
  launchEmojis(['🌟','🎊','💫','✨','🌈']);

  setBtn('s2-reveal-btn', false);
  setBtn('s2-next-btn', true);
  markDot('s2-dots', s2.index, stage2Sentences.length);
  s2UpdateProgress();
}

function s2Next() {
  s2.index++;
  if (s2.index >= stage2Sentences.length) {
    showCompletion(2);
    return;
  }
  s2ResetUI();
  renderDots('s2-dots', stage2Sentences.length, s2.index);
}

function s2UpdateProgress() {
  document.getElementById('s2-progress').style.width = (s2.index / stage2Sentences.length * 100) + '%';
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

function showCompletion(stage) {
  const mainId = stage === 1 ? 's1-main' : 's2-main';
  const completeId = stage === 1 ? 's1-complete' : 's2-complete';
  const starsId = stage === 1 ? 's1-stars' : 's2-stars';
  document.getElementById(mainId).classList.add('hidden');
  document.getElementById(completeId).classList.add('show');
  document.getElementById(starsId).textContent = '⭐⭐⭐⭐⭐';
  launchEmojis(['🎉','🌟','🏆','🦄','🎊','💫','🌈']);
  speak('Congratulations! You are a Word Wizard!');
}

function restartStage(stage) {
  if (stage === 1) s1Init();
  else s2Init();
}

// ==================== STAGE TABS ====================
function switchStage(n) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === n - 1));
  document.querySelectorAll('.stage-panel').forEach((p, i) => p.classList.toggle('active', i === n - 1));
  window.speechSynthesis && window.speechSynthesis.cancel();
}

// ==================== INIT ====================
s1Init();
s2Init();