// ==================== DATA (from Flask via Jinja2) ====================
const usedWords = { stage1: {}, stage2: {}, stage3: {}, stage4: {} };

function getWords(stageId, difficulty) {
    return quizData[stageId][difficulty] || [];
}

function pickWord(stageId, difficulty) {
    const all = getWords(stageId, difficulty);
    if (!usedWords[stageId][difficulty]) usedWords[stageId][difficulty] = [];

    let remaining = all.filter(w => !usedWords[stageId][difficulty].includes(w));
    if (!remaining.length) {
        usedWords[stageId][difficulty] = [];
        remaining = all;
    }

    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    usedWords[stageId][difficulty].push(chosen);
    return chosen;
}

// ==================== STATE ====================
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

// ==================== INIT ====================
function stageInit(n) {
    const difficulty = getActiveDifficulty();
    const stageId = `stage${n}`;
    const word = pickWord(stageId, difficulty);
    const all = getWords(stageId, difficulty);

    state[n] = {
        score: 0,
        listened: false,
        revealed: false,
        current: { word: word, full: word, blanks: [], emoji: "", index: 0, total: all.length }
    };

    renderDots(`s${n}-dots`, all.length, 0);
    updateProgress(n, 0, all.length);

    if (n === 4) sentenceResetUI(n);
    else spellingResetUI(n);

    document.getElementById(`s${n}-main`).classList.remove('hidden');
    document.getElementById(`s${n}-complete`).classList.remove('show');
}

// ==================== SPELLING STAGES (1, 2, 3) ====================
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
    const item = state[n].current;
    const btn = document.getElementById(`s${n}-listen-btn`);
    btn.classList.add('speaking');
    btn.textContent = 'Listening...';
    speak(item.word, () => {
        btn.classList.remove('speaking');
        btn.textContent = 'Hear Again';
        if (!state[n].listened) {
            state[n].listened = true;
            setBtn(`s${n}-reveal-btn`, true);
            document.getElementById(`s${n}-instruction`).textContent = 'Try to spell it! Then reveal below';
        }
    });
}

function spellingReveal(n) {
    if (!state[n].listened) return;
    const item = state[n].current;
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

    speak(item.word);
    state[n].revealed = true;
    state[n].score++;
    document.getElementById(`s${n}-score`).textContent = state[n].score;

    const msgs = ['Great work!', 'Super!', 'You got it!', 'Brilliant!', 'Fantastic!'];
    showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], 'great');
    launchEmojis(['⭐', '🎊', '✨', '💫']);

    setBtn(`s${n}-reveal-btn`, false);
    setBtn(`s${n}-next-btn`, true);

    const index = usedWords[`stage${n}`][getActiveDifficulty()].length;
    const total = state[n].current.total;
    markDot(`s${n}-dots`, index - 1, total);
    updateProgress(n, index, total);
}

function spellingNext(n) {
    const difficulty = getActiveDifficulty();
    const stageId = `stage${n}`;
    const index = usedWords[stageId][difficulty] ? usedWords[stageId][difficulty].length : 0;
    const total = getWords(stageId, difficulty).length;

    if (index >= total) {
        showCompletion(n);
        return;
    }

    const word = pickWord(stageId, difficulty);
    state[n].current = { word: word, full: word, blanks: [], emoji: "", index, total };
    spellingResetUI(n);
    renderDots(`s${n}-dots`, total, index);
}

// ==================== SENTENCE STAGE (4) ====================
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
    const item = state[n].current;
    const btn = document.getElementById(`s${n}-listen-btn`);
    btn.classList.add('speaking');
    btn.textContent = 'Listening...';
    speak(item.full, () => {
        btn.classList.remove('speaking');
        btn.textContent = 'Hear Again';
        if (!state[n].listened) {
            state[n].listened = true;
            renderSentence(n, false);
            setBtn(`s${n}-reveal-btn`, true);
            document.getElementById(`s${n}-instruction`).textContent = 'Can you guess the missing words?';
        }
    });
}

function renderSentence(n, revealed) {
    const item = state[n].current;
    const words = item.full.split(' ');
    const container = document.getElementById(`s${n}-sentence`);
    container.innerHTML = '';
    words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = item.blanks.includes(i)
            ? 'blank-word' + (revealed ? ' revealed' : '')
            : 'sentence-word';
        span.textContent = w;
        container.appendChild(span);
    });
}

function sentenceReveal(n) {
    if (!state[n].listened) return;
    renderSentence(n, true);
    speak(state[n].current.full);
    state[n].revealed = true;
    state[n].score++;
    document.getElementById(`s${n}-score`).textContent = state[n].score;

    const msgs = ['Well done!', "You're a star!", 'Amazing!', 'Keep it up!', 'Wonderful!'];
    showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], 'great');
    launchEmojis(['⭐', '🎊', '✨', '💫']);

    setBtn(`s${n}-reveal-btn`, false);
    setBtn(`s${n}-next-btn`, true);

    const index = usedWords[`stage${n}`][getActiveDifficulty()].length;
    const total = state[n].current.total;
    markDot(`s${n}-dots`, index - 1, total);
    updateProgress(n, index, total);
}

function sentenceNext(n) {
    const difficulty = getActiveDifficulty();
    const stageId = `stage${n}`;
    const index = usedWords[stageId][difficulty] ? usedWords[stageId][difficulty].length : 0;
    const total = getWords(stageId, difficulty).length;

    if (index >= total) {
        showCompletion(n);
        return;
    }

    const word = pickWord(stageId, difficulty);
    state[n].current = { word: word, full: word, blanks: [], emoji: "", index, total };
    sente