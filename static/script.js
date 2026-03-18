// ==================== DATA (from Flask via Jinja2) ====================
const usedWords = { stage1: {}, stage2: {}, stage3: {}, stage4: {} };

const difficultyLabels = {
    default: { reception: 'Reception', year1: 'Year 1', year2: 'Year 2' },
    stage3:  { reception: 'Top 100',   year1: 'Top 200', year2: 'Top 300' }
};

// ==================== UTILS ====================
function getActiveDifficulty(n) {
    const btn = document.querySelector('.diff-btn.active');
    const difficulty = btn ? btn.dataset.difficulty : 'reception';
    if (n === 3) {
        const map = { reception: 'top_100', year1: 'top_200', year2: 'top_300' };
        return map[difficulty] || 'top_100';
    }
    return difficulty;
}

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

function updateProgress(n, index, total) {
    document.getElementById(`s${n}-progress`).style.width = (index / total * 100) + '%';
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
    launchEmojis(['🎉', '🌟', '🏆', '🎊', '💫']);
    speak('Congratulations! You are a Word Wizard!');
}

function restartStage(n) {
    usedWords[`stage${n}`] = {};
    stageInit(n);
}

// ==================== STATE ====================
const state = {};

// ==================== SPEECH ====================
let activeVoice = 'Amy';

function switchVoices(event, gender) {
    document.querySelectorAll('.speech-voice-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.speech-voice-btn').classList.add('active');
    activeVoice = gender === 'man' ? 'Brian' : 'Amy';
}

function speak(text, onEnd) {
    if (window.puter) {
        puter.ai.txt2speech(text, { voice: activeVoice, engine: 'neural', language: 'en-GB' })
            .then((audio) => {
                if (onEnd) audio.onended = onEnd;
                audio.play();
            })
            .catch(() => browserSpeak(text, onEnd));
    } else {
        browserSpeak(text, onEnd);
    }
}

function browserSpeak(text, onEnd) {
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
    const difficulty = getActiveDifficulty(n);
    const stageId = `stage${n}`;
    const picked = pickWord(stageId, difficulty);
    const all = getWords(stageId, difficulty);

    const word   = n === 4 ? picked.quiz_sentence   : picked;
    const full   = n === 4 ? picked.answer_sentence : picked;
    const answer = n === 4 ? picked.answer          : picked;

    state[n] = {
        score: 0,
        listened: false,
        revealed: false,
        current: { word, full, answer, blanks: [], emoji: "", index: 0, total: all.length }
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
        btn.textContent = 'Listen to Word';
        if (!state[n].listened) {
            state[n].listened = true;
            setBtn(`s${n}-reveal-btn`, true);
            document.getElementById(`s${n}-instruction`).textContent = 'Try to spell it! Then reveal below';
        }
    });
}

function renderInputComparison(n) {
    const item = state[n].current;
    const input = document.getElementById(`s${n}-input`).value.trim().toLowerCase();
    const answer = item.answer.toLowerCase();

    const tilesDiv = document.getElementById(`s${n}-tiles`);
    tilesDiv.innerHTML = '';

    const maxLen = Math.max(input.length, answer.length);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:' + `repeat(${maxLen}, 44px)` + ';gap:6px;justify-content:center;';

    const makeLabel = (text) => {
        const l = document.createElement('div');
        l.style.cssText = `grid-column:1 / -1;font-size:0.7rem;font-weight:800;color:#aaa;letter-spacing:0.05em;font-family:Nunito;`;
        l.textContent = text;
        return l;
    };

    grid.appendChild(makeLabel('YOUR ANSWER'));
    for (let i = 0; i < maxLen; i++) {
        const userChar = input[i];
        const correctChar = answer[i];
        const isCorrect = userChar === correctChar;
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = userChar ? userChar.toUpperCase() : '';
        tile.style.color = isCorrect ? '#74d771' : '#FF6B6B';
        tile.style.borderColor = isCorrect ? '#ccc' : '#FF6B6B';
        tile.style.background = isCorrect ? '#fff' : '#fff0f0';
        tile.style.animationDelay = (i * 0.08) + 's';
        grid.appendChild(tile);
    }

    grid.appendChild(makeLabel('CORRECT'));
    for (let i = 0; i < maxLen; i++) {
        const correctChar = answer[i];
        const tile = document.createElement('div');
        tile.className = 'letter-tile';
        tile.textContent = correctChar ? correctChar.toUpperCase() : '';
        tile.style.color = '#222';
        tile.style.borderColor = '#ccc';
        tile.style.background = '#fff';
        tile.style.animationDelay = (i * 0.08) + 's';
        grid.appendChild(tile);
    }

    tilesDiv.appendChild(grid);
}

function spellingReveal(n) {
    if (!state[n].listened) return;
    const item = state[n].current;
    const reveal = document.getElementById(`s${n}-reveal`);
    reveal.classList.add('revealed');
    document.getElementById(`s${n}-word-text`).textContent = item.emoji;

    renderInputComparison(n);

    speak(item.word);
    state[n].revealed = true;
    state[n].score++;
    document.getElementById(`s${n}-score`).textContent = state[n].score;

    const input = document.getElementById(`s${n}-input`).value.trim().toLowerCase();
    const correct = input === item.answer.toLowerCase();

    const msgs = correct
        ? ['Perfect spelling!', 'Nailed it!', 'Spot on!', 'Brilliant!', 'You got it!']
        : ['Good try!', 'Nearly there!', 'Keep practising!', 'Almost!'];
    showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], correct ? 'great' : 'keep-going');
    launchEmojis(correct ? ['⭐', '🎊', '✨', '💫'] : ['💪', '📝', '🌟']);

    setBtn(`s${n}-reveal-btn`, false);
    setBtn(`s${n}-next-btn`, true);

    const index = usedWords[`stage${n}`][getActiveDifficulty(n)].length;
    const total = state[n].current.total;
    markDot(`s${n}-dots`, index - 1, total);
    updateProgress(n, index, total);
}

function spellingNext(n) {
    const difficulty = getActiveDifficulty(n);
    const stageId = `stage${n}`;
    const index = usedWords[stageId][difficulty] ? usedWords[stageId][difficulty].length : 0;
    const total = getWords(stageId, difficulty).length;

    if (index >= total) {
        showCompletion(n);
        return;
    }

    const word = pickWord(stageId, difficulty);
    state[n].current = { word, full: word, answer: word, blanks: [], emoji: "", index, total };
    spellingResetUI(n);
    renderDots(`s${n}-dots`, total, index);
}

// ==================== SENTENCE STAGE (4) ====================
function sentenceResetUI(n) {
    document.getElementById(`s${n}-sentence`).innerHTML =
        '<span style="color:#ccc;font-size:1rem;font-family:Nunito;font-weight:700;">A sentence will appear here...</span>';
    document.getElementById(`s${n}-tiles`).innerHTML = '';
    document.getElementById(`s${n}-input`).value = '';
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
        btn.textContent = '🔊 Listen to Sentence';
        if (!state[n].listened) {
            state[n].listened = true;
            const container = document.getElementById(`s${n}-sentence`);
            container.innerHTML = '';
            const span = document.createElement('span');
            span.style.cssText = 'font-size:1.2rem;font-family:Nunito;font-weight:700;color:#333;line-height:1.6;';
            span.textContent = item.word;
            container.appendChild(span);
            setBtn(`s${n}-reveal-btn`, true);
            document.getElementById(`s${n}-instruction`).textContent = 'Type the missing word!';
        }
    });
}

function sentenceReveal(n) {
    if (!state[n].listened) return;

    const item = state[n].current;
    const input = document.getElementById(`s${n}-input`).value.trim().toLowerCase();
    const correct = input === item.answer.toLowerCase();

    const container = document.getElementById(`s${n}-sentence`);
    container.innerHTML = '';
    const span = document.createElement('span');
    span.style.cssText = 'font-size:1.2rem;font-family:Nunito;font-weight:700;color:#333;line-height:1.6;';
    span.textContent = item.full;
    container.appendChild(span);

    renderInputComparison(n);
    speak(item.answer);

    state[n].revealed = true;
    state[n].score++;
    document.getElementById(`s${n}-score`).textContent = state[n].score;

    const msgs = correct
        ? ['Perfect spelling!', 'Nailed it!', 'Spot on!', 'Brilliant!', 'You got it!']
        : ['Good try!', 'Nearly there!', 'Keep practising!', 'Almost!'];
    showFeedback(`s${n}-feedback`, msgs[Math.floor(Math.random() * msgs.length)], correct ? 'great' : 'keep-going');
    launchEmojis(correct ? ['⭐', '🎊', '✨', '💫'] : ['💪', '📝', '🌟']);

    setBtn(`s${n}-reveal-btn`, false);
    setBtn(`s${n}-next-btn`, true);

    const index = usedWords[`stage${n}`][getActiveDifficulty(n)].length;
    const total = state[n].current.total;
    markDot(`s${n}-dots`, index - 1, total);
    updateProgress(n, index, total);
}

function sentenceNext(n) {
    const difficulty = getActiveDifficulty(n);
    const stageId = `stage${n}`;
    const index = usedWords[stageId][difficulty] ? usedWords[stageId][difficulty].length : 0;
    const total = getWords(stageId, difficulty).length;

    if (index >= total) {
        showCompletion(n);
        return;
    }

    const picked = pickWord(stageId, difficulty);
    state[n].current = {
        word:   picked.quiz_sentence,
        full:   picked.answer_sentence,
        answer: picked.answer,
        blanks: [], emoji: "", index, total
    };
    sentenceResetUI(n);
    renderDots(`s${n}-dots`, total, index);
}

// ==================== STAGE TABS ====================
function switchStage(n) {
    document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === n - 1));
    document.querySelectorAll('.stage-panel').forEach((p, i) => p.classList.toggle('active', i === n - 1));
    window.speechSynthesis && window.speechSynthesis.cancel();

    const labels = n === 3 ? difficultyLabels.stage3 : difficultyLabels.default;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        const key = btn.dataset.difficulty;
        if (labels[key]) btn.textContent = labels[key];
    });

    const allBtn = document.querySelector('.diff-btn[data-difficulty="all"]');
    if (allBtn) allBtn.style.display = n === 3 ? 'none' : '';

    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    const firstVisible = document.querySelector('.diff-btn:not([style*="display: none"])');
    if (firstVisible) firstVisible.classList.add('active');

    stageInit(n);
}

// ==================== DIFFICULTY TABS ====================
function switchDifficulty(event, difficulty) {
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    const clicked = document.querySelector(`.diff-btn[data-difficulty="${difficulty}"]`);
    if (clicked) clicked.classList.add('active');

    usedWords.stage1 = {};
    usedWords.stage2 = {};
    usedWords.stage3 = {};
    usedWords.stage4 = {};
    [1, 2, 3, 4].forEach(n => stageInit(n));
}

// ==================== INIT ====================
switchStage(1);