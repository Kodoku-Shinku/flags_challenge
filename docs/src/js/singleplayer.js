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

let currentFlagIndex = 0;
let currentPlayer = null;
let score = { player: 0 };
let isGameActive = false;
let hasAnswered = { player: false };
let availableFlags = [...flags]; // Create a copy of the flags array

// Event Listeners
startButton.addEventListener('click', () => {
    gameArea.style.display = 'block'; // Show the game area
    loadNextFlag(); // Load the first flag for the game
    startButton.style.visibility = 'hidden';
});

playerButton.addEventListener('click', () => handlePlayerClick(1)); // Handle player 1's turn
submitAnswerButton.addEventListener('click', checkAnswer); // Check the player's answer
nextFlagButton.addEventListener('click', loadNextFlag); // Load the next flag

// Enter key handling in the answer input
answerInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default action
        checkAnswer(); // Check the answer when Enter is pressed
    }
});

// Keyboard keys handling
document.addEventListener('keydown', event => {
    if (event.key === ' ') handlePlayerClick(1); // Handle player 1's turn with the 'a' key
});

/**
 * Loads the next flag for the game.
 * Randomly selects a flag from the available flags and displays it.
 * Resets the game state and prepares the UI for the next round.
 */
function loadNextFlag() {
    if (availableFlags.length === 0) {
        result.innerHTML = 'No hay más banderas!';
        return;
    }

    currentFlagIndex = Math.floor(Math.random() * availableFlags.length);
    const flag = availableFlags[currentFlagIndex];
    flagImage.src = flag.url;
    flagName.textContent = '';
    result.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;

    playerButton.classList.remove('active', 'disabled');
    playerButton.disabled = false;

    nextFlagButton.style.display = 'none';

    hasAnswered = { player: false };
    isGameActive = true;
    currentPlayer = null;
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
        answerInput.focus();
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
 * Checks the player answer against the current flag's name.
 * Updates the game state based on whether the answer is correct or incorrect.
 */
function checkAnswer() {
    if (currentPlayer !== null && isGameActive) {
        const answer = removeAccents(answerInput.value.trim());
        const flag = availableFlags[currentFlagIndex];
        const correctAnswer = removeAccents(flag.name);

        if (answer === '') {
            result.innerHTML = '<span class="text-danger">Por favor ingrese una respuesta.</span>';
            return;
        }

        if (!/^[a-zA-Z\s]+$/.test(answer)) {
            result.innerHTML = '<span class="text-danger">Solo se permiten letras y espacios.</span>';
            return;
        }

        if (answer === correctAnswer) {
            handleCorrectAnswer(flag);
        } else {
            handleIncorrectAnswer(flag);
        }
    }
}

/**
 * Handles the case where the player's answer is correct.
 * Updates the score, displays the correct answer, and prepares for the next flag.
 * @param {Object} flag - The flag object with the correct answer.
 */
function handleCorrectAnswer(flag) {
    flagName.textContent = flag.name;
    result.innerHTML = '<span class="text-success">¡Correcto!</span>';

    score.player += 1;
    
    updateScore();
    availableFlags.splice(currentFlagIndex, 1); // Remove the current flag
    nextFlagButton.style.display = 'block'; // Show next flag button
    answerInput.disabled = true;
    resetPlayer();
    pedroAnimation();
    isGameActive = false;

    
}

/**
 * Handles the case where the player's answer is incorrect.
 * Provides feedback on the incorrect answer and manages the game state.
 * @param {Object} flag - The flag object with the correct answer.
 */
function handleIncorrectAnswer(flag) {
    result.innerHTML = `<span class="text-danger">Incorrecto! Turno del jugador ${currentPlayer === 1 ? 2 : 1}.</span>`;
    flagName.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;

    const currentButton = playerButton;
    currentButton.classList.add('disabled');
    currentButton.classList.remove('active');
    currentButton.disabled = true;

    hasAnswered['player'] = true;

    result.innerHTML = `<span class="text-danger">Incorrecto! El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
    nextFlagButton.style.display = 'block';
    playerButton.classList.add('disabled');
    playerButton.disabled = true;
    availableFlags.splice(currentFlagIndex, 1);
    hasAnswered = { player: false };
    isGameActive = false;
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

function pedroAnimation() {
    correctAnswerAudio.currentTime = 0;
    correctAnswerAudio.play();

    //Remove glow animation
    player.classList.remove('glow');
    // Add the animation class
    player.classList.add('animation-active');

    // Remove the animation class and stop audio after 5 seconds
    setTimeout(() => {
        correctAnswerAudio.pause();
        correctAnswerAudio.currentTime = 0;
        player.classList.add('glow');
        player.classList.remove('animation-active');
    }, 6000);
}