// --- BRAINBRAWL GAME ENGINE (REMATCH & EMOJI EDITION) ---

// Synthetic Web Audio & Haptics System
const audioCtx = window.AudioContext || window.webkitAudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(frequency, duration, type = 'sine') {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function triggerVibrate(pattern) {
    if (navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch(e) {}
    }
}

function soundClick() {
    playTone(400, 0.05, 'triangle');
    triggerVibrate(20);
}

function soundCorrect() {
    playTone(587.33, 0.1);
    setTimeout(() => playTone(880, 0.2), 100);
    triggerVibrate([50, 50, 100]);
}

function soundWrong() {
    playTone(150, 0.2, 'sawtooth');
    triggerVibrate(200);
}

function soundVictory() {
    playTone(523.25, 0.15);
    setTimeout(() => playTone(659.25, 0.15), 150);
    setTimeout(() => playTone(783.99, 0.15), 300);
    setTimeout(() => playTone(1046.50, 0.4), 450);
    triggerVibrate([100, 50, 100, 50, 200]);
}

// Massive Educational & Savage Question Bank
const questions = [
    {
        q: "Did ancient Romans actually use human urine as mouthwash to whiten their teeth?",
        options: ["Yes, ammonia power!", "No, pure myth"],
        answer: 0,
        fact: "True! The ammonia in stale urine was used as a cleaning agent for laundry and teeth."
    },
    {
        q: "Did a medieval war actually start over a stolen wooden bucket in Italy?",
        options: ["Yes, the War of the Bucket", "No, total fiction"],
        answer: 0,
        fact: "True! In 1325, a stolen bucket sparked a war where 2,000 people died."
    },
    {
        q: "Did Queen Elizabeth I own over 300 custom wigs and absolute face makeup made of lead?",
        options: ["True, toxic fashion", "No, natural beauty"],
        answer: 0,
        fact: "True! Her lead-based makeup eventually ruined her skin and health."
    },
    {
        q: "Can diamonds actually rain down from the sky on Saturn and Jupiter?",
        options: ["True, bling storms!", "False, space is dry"],
        answer: 0,
        fact: "True! Lightning turns methane into soot, which hardens into chunks of falling diamond."
    },
    {
        q: "Is a day on Venus longer than a full year on Venus?",
        options: ["True, weird physics", "False, standard orbit"],
        answer: 0,
        fact: "True! Venus rotates so slowly on its axis that it takes longer to spin once than to orbit the Sun."
    },
    {
        q: "Does outer space smell like grilled steak and hot metal to astronauts?",
        options: ["True, space smells meaty", "No, it has zero scent"],
        answer: 0,
        fact: "True! Dying stars emit aromatic compounds that stick to spacesuits."
    },
    {
        q: "Do octopuses have three hearts and blue blood?",
        options: ["Yes, alien biology!", "No, just one heart"],
        answer: 0,
        fact: "True! Two hearts pump blood to the gills, and one pumps it to the rest of the body."
    },
    {
        q: "Is it scientifically correct to classify bananas as berries while strawberries are not?",
        options: ["True, botanical surprise", "No, that's nonsense"],
        answer: 0,
        fact: "True! Botanically, berries must develop from a flower with a single ovary—which fits bananas!"
    },
    {
        q: "Do wombats produce cube-shaped poop to prevent it from rolling away?",
        options: ["True, architectural marvel", "False, normal round poop"],
        answer: 0,
        fact: "True! Their unique intestinal elasticity forms distinct cube shapes to mark territory."
    },
    {
        q: "Did someone actually try to sue God for millions of dollars in a federal lawsuit?",
        options: ["True, an Omaha resident", "No, urban legend"],
        answer: 0,
        fact: "True! In 1971, a senator sued God claiming He caused destructive floods."
    },
    {
        q: "Is Nintendo older than the Ottoman Empire and the Eiffel Tower?",
        options: ["True, founded in 1889", "False, modern company"],
        answer: 0,
        fact: "True! Nintendo started out manufacturing handmade playing cards in Kyoto in 1889."
    }
];

// Game State Variables
let peer = null;
let conn = null;
let myRole = ''; 
let myName = '';
let opponentName = 'Opponent';
let myScore = 0;
let opponentScore = 0;
let currentRound = 1;
const maxRounds = 5;
let currentQuestionIndex = 0;
let timerInterval = null;
let isAnswerLocked = false;
let activeRoomCode = '';

// DOM Elements
const screenMenu = document.getElementById('screen-menu');
const screenLobby = document.getElementById('screen-lobby');
const screenGame = document.getElementById('screen-game');
const screenResults = document.getElementById('screen-results');

const inputPlayerName = document.getElementById('player-name');
const btnCreateRoom = document.getElementById('btn-create-room');
const btnJoinRoom = document.getElementById('btn-join-room');
const inputRoomCode = document.getElementById('room-code-input');
const displayRoomCode = document.getElementById('display-room-code');

const p1Label = document.getElementById('p1-label');
const p2Label = document.getElementById('p2-label');
const p1ScoreElem = document.getElementById('p1-score');
const p2ScoreElem = document.getElementById('p2-score');
const currentRoundElem = document.getElementById('current-round');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const timerFill = document.getElementById('timer-fill');

const resultTitle = document.getElementById('result-title');
const resultSubtitle = document.getElementById('result-subtitle');
const btnShareScore = document.getElementById('btn-share-score');
const btnPlayAgain = document.getElementById('btn-play-again');

function showScreen(screen) {
    [screenMenu, screenLobby, screenGame, screenResults].forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

function generateCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// --- NETWORK INITIALIZATION ---
btnCreateRoom.addEventListener('click', () => {
    soundClick();
    myName = inputPlayerName.value.trim() || 'Player 1';
    p1Label.innerText = myName;
    
    myRole = 'host';
    activeRoomCode = generateCode();
    displayRoomCode.innerText = activeRoomCode;
    showScreen(screenLobby);

    peer = new Peer('bb-' + activeRoomCode);

    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
        conn.on('open', () => {
            conn.send({ type: 'INIT', name: myName });
        });
    });

    peer.on('error', (err) => {
        alert('Connection error: ' + err.type);
        showScreen(screenMenu);
    });
});

btnJoinRoom.addEventListener('click', () => {
    soundClick();
    myName = inputPlayerName.value.trim() || 'Player 2';
    p1Label.innerText = myName;
    
    myRole = 'guest';
    activeRoomCode = inputRoomCode.value.trim().toUpperCase();
    if (activeRoomCode.length < 4) {
        alert('Please enter a valid 4-character room code!');
        return;
    }

    showScreen(screenLobby);
    document.getElementById('screen-lobby').querySelector('.animate-pulse').innerText = 'Connecting to room...';

    peer = new Peer();

    peer.on('open', () => {
        conn = peer.connect('bb-' + activeRoomCode);
        setupConnection();
        conn.on('open', () => {
            conn.send({ type: 'INIT', name: myName });
        });
    });

    peer.on('error', (err) => {
        alert('Could not connect to room. Check code!');
        showScreen(screenMenu);
    });
});

// --- P2P DATA HANDLER ---
function setupConnection() {
    conn.on('data', (data) => {
        if (data.type === 'INIT') {
            opponentName = data.name;
            p2Label.innerText = opponentName;
            if (myRole === 'host') {
                setTimeout(startBattle, 1000);
            }
        } else if (data.type === 'START_GAME') {
            opponentName = data.hostName;
            p2Label.innerText = opponentName;
            startBattleClient(data.questions);
        } else if (data.type === 'ANSWER') {
            handleOpponentAnswer(data.score);
        } else if (data.type === 'NEXT_QUESTION') {
            loadNextQuestion(data.round, data.qIndex);
        } else if (data.type === 'GAME_OVER') {
            showGameOver(data.finalMyScore, data.finalOpponentScore);
        } else if (data.type === 'EMOJI') {
            showFloatingEmoji(data.emoji);
        } else if (data.type === 'REMATCH') {
            if (myRole === 'host') {
                startBattle();
            } else {
                showScreen(screenGame);
            }
        }
    });
}

// --- EMOJI REACTIONS SYSTEM ---
function injectEmojiBar() {
    // Check if emoji bar already exists in game screen
    if (document.getElementById('emoji-bar')) return;
    
    const emojiContainer = document.createElement('div');
    emojiContainer.id = 'emoji-bar';
    emojiContainer.className = 'flex justify-center gap-4 my-2';
    
    const emojis = ['🔥', '💀', '🤡', '🧠', '😂', '🚀'];
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'bg-zinc-900 hover:bg-zinc-800 border border-lime-500/40 p-2 rounded-xl text-lg shadow-[0_0_10px_rgba(57,255,20,0.15)] active:scale-90 transition-transform cursor-pointer';
        btn.innerText = emoji;
        btn.onclick = () => {
            soundClick();
            showFloatingEmoji(emoji);
            if (conn && conn.open) {
                conn.send({ type: 'EMOJI', emoji: emoji });
            }
        };
        emojiContainer.appendChild(btn);
    });

    // Append right below scoreboard or question card
    const gameMain = screenGame;
    gameMain.insertBefore(emojiContainer, gameMain.children[1]);
}

function showFloatingEmoji(emoji) {
    const floatDiv = document.createElement('div');
    floatDiv.innerText = emoji;
    floatDiv.className = 'fixed text-5xl z-50 pointer-events-none animate-bounce drop-shadow-[0_0_15px_rgba(57,255,20,0.8)]';
    
    // Random horizontal position across screen
    const randomX = Math.floor(Math.random() * (window.innerWidth - 100)) + 50;
    floatDiv.style.left = randomX + 'px';
    floatDiv.style.bottom = '100px';
    
    document.body.appendChild(floatDiv);

    // Animate and remove after 1.5 seconds
    setTimeout(() => {
        floatDiv.style.transition = 'all 1s ease-out';
        floatDiv.style.transform = 'translateY(-200px) scale(1.5)';
        floatDiv.style.opacity = '0';
    }, 50);

    setTimeout(() => {
        floatDiv.remove();
    }, 1200);
}

// --- GAME LOGIC ---
let activeQuestionsList = [];

function startBattle() {
    activeQuestionsList = [...questions].sort(() => 0.5 - Math.random()).slice(0, maxRounds);
    
    conn.send({
        type: 'START_GAME',
        hostName: myName,
        questions: activeQuestionsList
    });

    startBattleClient(activeQuestionsList);
}

function startBattleClient(qList) {
    activeQuestionsList = qList;
    currentRound = 1;
    currentQuestionIndex = 0;
    myScore = 0;
    opponentScore = 0;
    p1ScoreElem.innerText = myScore;
    p2ScoreElem.innerText = opponentScore;

    showScreen(screenGame);
    injectEmojiBar();
    renderQuestion();
}

function renderQuestion() {
    isAnswerLocked = false;
    currentRoundElem.innerText = currentRound;
    
    const qData = activeQuestionsList[currentQuestionIndex];
    questionText.innerText = qData.q;
    optionsContainer.innerHTML = '';

    qData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'w-full bg-zinc-900 hover:bg-zinc-800 text-lime-300 font-bold p-4 rounded-xl border-2 border-lime-500/40 shadow-[0_0_10px_rgba(57,255,20,0.15)] transition-all active:scale-95 text-left cursor-pointer flex justify-between items-center';
        btn.innerHTML = `<span>${opt}</span> <span class="text-xs text-lime-500 font-mono">#${index+1}</span>`;
        btn.onclick = () => submitAnswer(index, qData.answer, btn);
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

let timeLeft = 10;
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 10;
    timerFill.style.width = '100%';

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerFill.style.width = (timeLeft * 10) + '%';

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!isAnswerLocked) {
                lockAllAnswersOnTimeout();
            }
        }
    }, 1000);
}

function lockAllAnswersOnTimeout() {
    isAnswerLocked = true;
    soundWrong();
    const qData = activeQuestionsList[currentQuestionIndex];
    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach((b, idx) => {
        if (idx === qData.answer) {
            b.className = 'w-full bg-lime-500/30 border-2 border-lime-400 text-lime-200 font-bold p-4 rounded-xl text-left flex justify-between items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]';
        } else {
            b.className = 'w-full bg-zinc-950 text-lime-700 border border-zinc-900 p-4 rounded-xl text-left opacity-40';
        }
    });

    setTimeout(() => {
        proceedToNextRound();
    }, 2000);
}

function submitAnswer(selectedIndex, correctIndex, btnElement) {
    if (isAnswerLocked) return;
    isAnswerLocked = true;
    clearInterval(timerInterval);

    const isCorrect = (selectedIndex === correctIndex);

    const buttons = optionsContainer.querySelectorAll('button');
    buttons.forEach((b, idx) => {
        if (idx === correctIndex) {
            b.className = 'w-full bg-lime-500/30 border-2 border-lime-400 text-lime-200 font-bold p-4 rounded-xl text-left flex justify-between items-center shadow-[0_0_15px_rgba(57,255,20,0.5)]';
        } else if (idx === selectedIndex && !isCorrect) {
            b.className = 'w-full bg-rose-600/30 border-2 border-rose-500 text-rose-300 font-bold p-4 rounded-xl text-left flex justify-between items-center shadow-[0_0_15px_rgba(244,63,94,0.5)]';
        } else {
            b.className = 'w-full bg-zinc-950 text-lime-700 border border-zinc-900 p-4 rounded-xl text-left opacity-40';
        }
    });

    if (isCorrect) {
        soundCorrect();
        myScore += 100 + (timeLeft * 5);
        p1ScoreElem.innerText = myScore;
    } else {
        soundWrong();
    }

    conn.send({ type: 'ANSWER', score: myScore });

    setTimeout(() => {
        proceedToNextRound();
    }, 2000);
}

function proceedToNextRound() {
    if (currentRound < maxRounds) {
        currentRound++;
        currentQuestionIndex++;
        if (myRole === 'host') {
            conn.send({ type: 'NEXT_QUESTION', round: currentRound, qIndex: currentQuestionIndex });
            renderQuestion();
        }
    } else {
        if (myRole === 'host') {
            setTimeout(() => {
                conn.send({ type: 'GAME_OVER', finalMyScore: myScore, finalOpponentScore: opponentScore });
                showGameOver(myScore, opponentScore);
            }, 500);
        }
    }
}

function handleOpponentAnswer(score) {
    opponentScore = score;
    p2ScoreElem.innerText = opponentScore;
}

function loadNextQuestion(round, qIndex) {
    currentRound = round;
    currentQuestionIndex = qIndex;
    renderQuestion();
}

function showGameOver(myFinal, oppFinal) {
    showScreen(screenResults);
    soundVictory();
    if (myFinal > oppFinal) {
        resultTitle.innerText = "VICTORY! 👑";
        resultSubtitle.innerText = `You dominated ${opponentName} with ${myFinal} points to ${oppFinal}!`;
    } else if (myFinal < oppFinal) {
        resultTitle.innerText = "DEFEATED! 💀";
        resultSubtitle.innerText = `${opponentName} outsmarted you. Time to hit the books!`;
    } else {
        resultTitle.innerText = "IT'S A DRAW! 🤝";
        resultSubtitle.innerText = `Absolute equal intellect. Both scored ${myFinal} points!`;
    }

    // Update Play Again button to function as Rematch
    btnPlayAgain.innerText = "REMATCH";
    btnPlayAgain.onclick = () => {
        soundClick();
        if (conn && conn.open) {
            conn.send({ type: 'REMATCH' });
        }
        if (myRole === 'host') {
            startBattle();
        } else {
            showScreen(screenGame);
        }
    };
}

// --- VIRAL SHARE & REPLAY ---
btnShareScore.addEventListener('click', () => {
    soundClick();
    const shareText = `I just fought a 1v1 trivia duel on BrainBrawl! Score: ${myScore} vs ${opponentName}'s ${opponentScore}. Think you're smarter? Prove it here:`;
    if (navigator.share) {
        navigator.share({
            title: 'BrainBrawl Duel',
            text: shareText,
            url: window.location.href
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(shareText + ' ' + window.location.href);
        alert('Result copied to clipboard! Share it in your group chats!');
    }
});
