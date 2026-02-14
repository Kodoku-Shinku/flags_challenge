// multiplayer.js

// Import the flags array from flags.js
import { flags } from './flags.js';

// Variables
const startButton = document.getElementById('startButton');
const gameArea = document.getElementById('gameArea');
const flagImage = document.getElementById('flagImage');
const player = document.getElementById('player1');
const playerButton = document.getElementById('playerButton');
const answerInput = document.getElementById('answerInput');
const submitAnswerButton = document.getElementById('submitAnswerButton');
const result = document.getElementById('result');
const scoreDisplay = document.getElementById('score');
const nextFlagButton = document.getElementById('nextFlagButton');
const flagName = document.getElementById('flagName');
const correctAnswerAudio = document.getElementById('correctAnswerAudio');
// Temporizador: barra y texto superpuesto
const timerBar = document.getElementById('timerBar');
const timerText = document.getElementById('timerText');
const skipFlagButton = document.getElementById('skipFlagButton');
const timerBarContainer = document.getElementById('timerBarContainer');
const difficultySelect = document.getElementById('difficultySelect');
const pauseButton = document.getElementById('pauseButton');
const hintButton = document.getElementById('hintButton');
const sessionSummary = document.getElementById('sessionSummary');

// Estadísticas básicas
let totalFlags = 0;
let correctFlags = 0;
let bestStreak = 0;
let currentStreak = 0;

// Pausa
let paused = false;
let pausedRemainingMs = 0;

let currentFlagIndex = 0;
let currentPlayer = null;
let score = { player: 0 };
let isGameActive = false;
let hasAnswered = { player: false };
let availableFlags = [...flags]; // Create a copy of the flags array

// Mejora: temporizador por pregunta
let timerId = null;
let countdownEnd = null; // marca de tiempo objetivo
let timePerFlagMs = 15000; // 15 segundos en milisegundos

// Event Listeners
startButton.addEventListener('click', () => {
    // Reiniciar estado para nueva partida
    score.player = 0;
    updateScore();
    availableFlags = [...flags];

    gameArea.style.display = 'block'; // Show the game area
    startButton.style.visibility = 'hidden';
    result.textContent = '';
    loadNextFlag(); // Load the first flag for the game
});

playerButton.addEventListener('click', () => handlePlayerClick(1)); // Handle player 1's turn
submitAnswerButton.addEventListener('click', checkAnswer); // Check the player's answer
nextFlagButton.addEventListener('click', loadNextFlag); // Load the next flag
skipFlagButton.addEventListener('click', skipCurrentFlag);

difficultySelect.addEventListener('change', () => {
    const val = difficultySelect.value;
    if (val === 'easy') timePerFlagMs = 20000;
    else if (val === 'hard') timePerFlagMs = 10000;
    else timePerFlagMs = 15000;
});

pauseButton.addEventListener('click', () => {
    if (!isGameActive || currentPlayer === null || answerInput.disabled) return;
    if (!paused) {
        // Pausar
        pausedRemainingMs = Math.max(0, countdownEnd - Date.now());
        clearTimer();
        paused = true;
        pauseButton.textContent = 'Reanudar';
        result.innerHTML = '<span class="text-info">Pausado.</span>';
    } else {
        // Reanudar
        paused = false;
        pauseButton.textContent = 'Pausar';
        result.textContent = '';
        countdownEnd = Date.now() + pausedRemainingMs;
        startTimer();
    }
});

hintButton.addEventListener('click', () => {
    if (!isGameActive || currentPlayer === null || answerInput.disabled) return;
    const flag = availableFlags[currentFlagIndex];
    if (!flag) return;
    // Pista sencilla: primera letra y continente si estuviera disponible en datos (name only here)
    const firstLetter = flag.name.trim().charAt(0);
    result.innerHTML = `<span class="text-info">Pista: empieza con "${firstLetter}"</span>`;
    // Penalización de tiempo: -3s
    countdownEnd = Math.max(Date.now(), countdownEnd - 3000);
    updateTimerDisplay();
    // Deshabilitar múltiples pistas por bandera (opcional)
    hintButton.disabled = true;
});

// Enter key handling in the answer input (usar keydown para consistencia)
answerInput.addEventListener('keydown', event => {
    // Evitar que atajos globales interfieran mientras escribimos
    event.stopPropagation();
    if (event.key === 'Enter') {
        event.preventDefault();
        checkAnswer();
    }
});

// Keyboard keys handling (atajos globales)
document.addEventListener('keydown', event => {
    const targetIsInput = document.activeElement === answerInput;

    // Si el input tiene foco, no disparamos atajos globales
    if (targetIsInput) return;

    // Espacio: tomar turno si el juego está activo y aún no hay jugador
    if (event.code === 'Space') {
        // Si estamos en estado post-respuesta y el botón de siguiente es visible, permitir avanzar
        if (nextFlagButton.style.display !== 'none' && answerInput.disabled) {
            event.preventDefault();
            loadNextFlag();
            return;
        }
        // En estado de pregunta, permitir que el jugador tome su turno con espacio
        if (isGameActive && currentPlayer === null && !playerButton.disabled) {
            event.preventDefault();
            handlePlayerClick(1);
        }
    }
});

/**
 * Limpia el temporizador si existe
 */
function clearTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
    if (timerBar) {
        timerBar.style.width = '100%';
        timerBar.style.backgroundColor = '#28a745';
        timerBar.classList.remove('timer-stripes','timer-pulse','timer-shake');
    }
    if (timerText) {
        timerText.textContent = '';
        timerText.classList.remove('timer-text-low');
    }
}

/**
 * Inicia el temporizador y actualiza el texto de resultado con la cuenta regresiva.
 * Si el tiempo se acaba, se marca incorrecto automáticamente y se revela la respuesta.
 */
function startTimer() {
    clearTimer();
    // Si por alguna razón no está definido, inicializar ahora
    if (!countdownEnd || countdownEnd <= Date.now()) {
        countdownEnd = Date.now() + timePerFlagMs;
    }
    if (timerBar) timerBar.classList.add('timer-stripes');
    updateTimerDisplay();
    timerId = setInterval(() => {
        const remaining = countdownEnd - Date.now();
        if (remaining > 0 && isGameActive && currentPlayer !== null && !answerInput.disabled && !paused) {
            updateTimerDisplay();
        } else {
            clearTimer();
            const flag = availableFlags[currentFlagIndex];
            if (timerBar) timerBar.classList.remove('timer-stripes','timer-pulse','timer-shake');
            if (timerText) timerText.classList.remove('timer-text-low');
            if (flag && !paused) {
                handleTimeOut(flag);
            }
        }
    }, 100); // refresco suave para barra
}

function formatMmSs(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const remainingMs = Math.max(0, countdownEnd - Date.now());
    const remainingSec = Math.ceil(remainingMs / 1000);
    const ratio = remainingMs / timePerFlagMs;
    const widthPct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
    if (timerBar) timerBar.style.width = `${widthPct}%`;
    if (timerText) timerText.textContent = `Tiempo: ${formatMmSs(remainingMs)}`;
    // Color dinámico
    if (ratio > 2/3) {
        timerBar.style.backgroundColor = '#28a745'; // verde
    } else if (ratio > 1/3) {
        timerBar.style.backgroundColor = '#ffc107'; // amarillo
    } else {
        timerBar.style.backgroundColor = '#dc3545'; // rojo
    }
    // Animaciones condicionales
    if (ratio <= 1/3) {
        timerBar.classList.add('timer-pulse');
    } else {
        timerBar.classList.remove('timer-pulse');
    }
    if (remainingSec <= 3) {
        timerBar.classList.add('timer-shake');
        timerText.classList.add('timer-text-low');
    } else {
        timerBar.classList.remove('timer-shake');
        timerText.classList.remove('timer-text-low');
    }
}

// Al agotar tiempo, comportamiento actual: revelar nombre y permitir siguiente.
function handleTimeOut(flag) {
    result.innerHTML = `<span class="text-danger">Tiempo agotado. El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
    flagName.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;
    playerButton.classList.add('disabled');
    playerButton.disabled = true;
    nextFlagButton.style.display = 'block';
    availableFlags.splice(currentFlagIndex, 1);
    isGameActive = false;
    pauseButton.disabled = true;
    hintButton.disabled = true;
    currentStreak = 0;
}

/**
 * Loads the next flag for the game.
 * Randomly selects a flag from the available flags and displays it.
 * Resets the game state and prepares the UI for the next round.
 */
function loadNextFlag() {
    clearTimer();
    // Reiniciar controles de pausa/pista y temporizador
    paused = false;
    pausedRemainingMs = 0;
    countdownEnd = null; // importante: limpiar fin de cuenta para la siguiente ronda
    pauseButton.textContent = 'Pausar';

    if (availableFlags.length === 0) {
        showSessionSummary();
        result.innerHTML = 'No hay más banderas! Pulsa Inicio para jugar de nuevo.';
        flagImage.src = '';
        flagName.textContent = '';
        answerInput.value = '';
        answerInput.disabled = true;
        playerButton.classList.add('disabled');
        playerButton.disabled = true;
        nextFlagButton.style.display = 'none';
        isGameActive = false;
        startButton.style.visibility = 'visible';
        return;
    }

    currentFlagIndex = Math.floor(Math.random() * availableFlags.length);
    const flag = availableFlags[currentFlagIndex];
    flagImage.src = flag.url;
    flagImage.onload = () => {
        syncTimerWidthToImage();
    };
    syncTimerWidthToImage();
    flagName.textContent = '';
    result.textContent = '';
    if (timerBar) timerBar.style.width = '100%';
    if (timerBar) timerBar.style.backgroundColor = '#28a745';
    if (timerText) timerText.textContent = '';

    answerInput.value = '';
    answerInput.disabled = true;

    playerButton.classList.remove('active', 'disabled');
    playerButton.disabled = false;
    nextFlagButton.style.display = 'none';

    hasAnswered = { player: false };
    isGameActive = true;
    currentPlayer = null;

    hintButton.disabled = false;
    pauseButton.disabled = false;

    totalFlags += 1;
}

/**
 * Handles a player clicking their button to start their turn.
 * Enables the answer input for the selected player and sets the current player.
 * @param {number} player - The player number (1).
 */
function handlePlayerClick(player) {
    if (currentPlayer === null && isGameActive) {
        currentPlayer = player;
        const button = playerButton;
        button.classList.add('active');
        answerInput.disabled = false;
        answerInput.focus({ preventScroll: true });
        // Inicializar un nuevo fin de cuenta para cada turno
        countdownEnd = Date.now() + timePerFlagMs;
        paused = false;
        pausedRemainingMs = 0;
        startTimer();
    }
}

/**
 * Removes accents from a string and converts it to lowercase.
 * Used to normalize and compare flag names.
 * @param {string} str - The string to be normalized.
 * @returns {string} - The normalized string without accents.
 */
function removeAccents(str) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase();
}

/**
 * Normaliza y limpia la respuesta del usuario: quita acentos, espacios extra y caracteres especiales comunes.
 */
function normalizeAnswer(str) {
    const cleaned = removeAccents(str.trim())
        .replace(/[^a-z\s\-']/g, '')
        .replace(/\s+/g, ' ');
    return cleaned;
}

/**
 * Checks the player answer against the current flag's name.
 * Updates the game state based on whether the answer is correct or incorrect.
 */
function checkAnswer() {
    if (currentPlayer !== null && isGameActive) {
        const raw = answerInput.value;
        const answer = normalizeAnswer(raw);
        const flag = availableFlags[currentFlagIndex];
        const correctAnswer = normalizeAnswer(flag.name);

        if (answer === '') {
            result.innerHTML = '<span class="text-danger">Por favor ingrese una respuesta.</span>';
            return;
        }

        if (!/^[a-z\s\-']+$/.test(answer)) {
            result.innerHTML = '<span class="text-danger">Solo se permiten letras, espacios, guiones y apóstrofes.</span>';
            return;
        }

        if (answer === correctAnswer) {
            handleCorrectAnswer(flag);
        } else {
            const remaining = countdownEnd ? countdownEnd - Date.now() : 0;
            if (remaining > 0) {
                result.innerHTML = '<span class="text-warning">Incorrecto: inténtalo de nuevo.</span>';
                answerInput.disabled = false;
            } else {
                handleIncorrectAnswer(flag);
            }
        }
    }
}

/**
 * Handles the case where the player's answer is correct.
 * Updates the score, displays the correct answer, and prepares for the next flag.
 * @param {Object} flag - The flag object with the correct answer.
 */
function handleCorrectAnswer(flag) {
    clearTimer();

    result.innerHTML = `<span class="text-success">¡Correcto! <span class="text-dark">${flag.name}</span></span>`;
    flagName.textContent = '';

    score.player += 1;
    correctFlags += 1;
    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
    
    updateScore();
    availableFlags.splice(currentFlagIndex, 1);
    nextFlagButton.style.display = 'block';
    answerInput.disabled = true;
    resetPlayer();
    pedroAnimation();
    isGameActive = false;
    pauseButton.disabled = true;
    hintButton.disabled = true;
}

/**
 * Handles the case where the player's answer is incorrect.
 * Provides feedback on the incorrect answer and manages the game state.
 * @param {Object} flag - The flag object with the correct answer.
 */
function handleIncorrectAnswer(flag) {
    clearTimer();

    result.innerHTML = `<span class="text-danger">Incorrecto! El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
    flagName.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;

    playerButton.classList.add('disabled');
    playerButton.classList.remove('active');
    playerButton.disabled = true;

    nextFlagButton.style.display = 'block';
    playerButton.classList.add('disabled');
    playerButton.disabled = true;
    availableFlags.splice(currentFlagIndex, 1);
    isGameActive = false;
    pauseButton.disabled = true;
    hintButton.disabled = true;
    currentStreak = 0;
}

/**
 * Updates the displayed scores for both players.
 */
function updateScore() {
    scoreDisplay.textContent = `${score.player}`;
}

/**
 * Resets the current player's turn and UI state.
 */
function resetPlayer() {
    playerButton.classList.remove('active');
    currentPlayer = null;
}

/**
 * Plays an animation and sound effect for the player.
 * 
 * This function:
 * - Resets and plays a sound effect.
 * - Temporarily removes the glow animation from the player's element and adds a new animation.
 * - Restores the glow animation and stops the sound effect after 6 seconds.
 */
function pedroAnimation() {
    
    correctAnswerAudio.currentTime = 0;
    correctAnswerAudio.play();

    player.classList.remove('glow');
    player.classList.add('animation-active');

    // After 6 seconds, stop the animation and sound effect
    setTimeout(() => {
        correctAnswerAudio.pause();
        correctAnswerAudio.currentTime = 0;
        player.classList.add('glow');
        player.classList.remove('animation-active');
    }, 6000);
}

// Nuevo: botón para saltar bandera
function skipCurrentFlag() {
    if (!isGameActive) return;
    if (nextFlagButton.style.display !== 'none') return;

    clearTimer();
    const flag = availableFlags[currentFlagIndex];
    if (!flag) return;

    result.innerHTML = `<span class="text-info">Saltaste esta bandera. El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
    flagName.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;

    playerButton.classList.add('disabled');
    playerButton.classList.remove('active');
    playerButton.disabled = true;
    currentPlayer = null;

    nextFlagButton.style.display = 'block';
    availableFlags.splice(currentFlagIndex, 1);
    isGameActive = false;
    pauseButton.disabled = true;
    hintButton.disabled = true;
    currentStreak = 0;
}

function showSessionSummary() {
    if (!sessionSummary) return;
    const accuracy = totalFlags ? Math.round((correctFlags / totalFlags) * 100) : 0;
    sessionSummary.style.display = 'block';
    sessionSummary.innerHTML = `
      <div class="card p-3 text-start">
        <h5>Resumen de sesión</h5>
        <ul class="mb-0">
          <li>Banderas jugadas: ${totalFlags}</li>
          <li>Aciertos: ${correctFlags}</li>
          <li>Precisión: ${accuracy}%</li>
          <li>Mejor racha: ${bestStreak}</li>
        </ul>
      </div>`;
    totalFlags = 0;
    correctFlags = 0;
    bestStreak = 0;
    currentStreak = 0;
}

function syncTimerWidthToImage() {
    if (!timerBarContainer || !flagImage) return;
    const imgWidth = flagImage.clientWidth || 520;
    const halfWidth = Math.max(160, Math.round(imgWidth * 0.5));
    timerBarContainer.style.maxWidth = `${imgWidth}px`;
    timerBarContainer.style.width = `${halfWidth}px`;
}

window.addEventListener('resize', syncTimerWidthToImage);
