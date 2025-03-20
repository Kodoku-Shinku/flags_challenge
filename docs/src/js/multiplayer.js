// multiplayer.js

// Import the flags array from flags.js
import { flags } from './flags.js';

// Variables
const startButton = document.getElementById('startButton');
const gameArea = document.getElementById('gameArea');
const flagImage = document.getElementById('flagImage');
const player1Button = document.getElementById('player1Button');
const player2Button = document.getElementById('player2Button');
const answerInput = document.getElementById('answerInput');
const submitAnswerButton = document.getElementById('submitAnswerButton');
const result = document.getElementById('result');
const scoreP1Display = document.getElementById('scoreP1');
const scoreP2Display = document.getElementById('scoreP2');
const nextFlagButton = document.getElementById('nextFlagButton');
const flagName = document.getElementById('flagName');
const correctAnswerAudio = document.getElementById('correctAnswerAudio');

let currentFlagIndex = 0;
let currentPlayer = null;
let scores = { player1: 0, player2: 0 };
let isGameActive = false;
let hasAnswered = { player1: false, player2: false };
let availableFlags = [...flags]; // Create a copy of the flags array

// Event Listeners
startButton.addEventListener('click', () => {
    gameArea.style.display = 'block'; // Show the game area
    loadNextFlag(); // Load the first flag for the game
});

player1Button.addEventListener('click', () => handlePlayerClick(1)); // Handle player 1's turn
player2Button.addEventListener('click', () => handlePlayerClick(2)); // Handle player 2's turn
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
    if (event.key === 'a') handlePlayerClick(1); // Handle player 1's turn with the 'a' key
    if (event.key === 'l') handlePlayerClick(2); // Handle player 2's turn with the 'l' key
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

    player1Button.classList.remove('active', 'disabled');
    player2Button.classList.remove('active', 'disabled');
    player1Button.disabled = false;
    player2Button.disabled = false;

    nextFlagButton.style.display = 'none';

    hasAnswered = { player1: false, player2: false };
    isGameActive = true;
    currentPlayer = null;
}

/**
 * Handles a player clicking their button to start their turn.
 * Enables the answer input for the selected player and sets the current player.
 * @param {number} player - The player number (1 or 2).
 */
function handlePlayerClick(player) {
    if (currentPlayer === null && isGameActive) {
        currentPlayer = player;
        const button = player === 1 ? player1Button : player2Button;
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
 * Checks the player's answer against the current flag's name.
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

    if (currentPlayer === 1) {
        scores.player1 += 1;
        pedroAnimation(1); // Call animation for player 1
    } else {
        scores.player2 += 1;
        pedroAnimation(2); // Call animation for player 1
    }

    updateScore();
    availableFlags.splice(currentFlagIndex, 1); // Remove the current flag
    nextFlagButton.style.display = 'block'; // Show next flag button
    answerInput.disabled = true;
    resetPlayer();
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

    const currentButton = currentPlayer === 1 ? player1Button : player2Button;
    currentButton.classList.add('disabled');
    currentButton.classList.remove('active');
    currentButton.disabled = true;

    hasAnswered[currentPlayer === 1 ? 'player1' : 'player2'] = true;

    if (hasAnswered.player1 && hasAnswered.player2) {
        result.innerHTML = `<span class="text-danger">Incorrecto! El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
        nextFlagButton.style.display = 'block';
        player1Button.classList.add('disabled');
        player2Button.classList.add('disabled');
        player1Button.disabled = true;
        player2Button.disabled = true;
        answerInput.disabled = true;
        availableFlags.splice(currentFlagIndex, 1);
        hasAnswered = { player1: false, player2: false };
        isGameActive = false;
    } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        const nextPlayerButton = currentPlayer === 1 ? player1Button : player2Button;
        nextPlayerButton.classList.add('active');
        answerInput.disabled = false;
        answerInput.focus();
    }
}

/**
 * Updates the displayed scores for both players.
 */
function updateScore() {
    scoreP1Display.textContent = `${scores.player1}`;
    scoreP2Display.textContent = `${scores.player2}`;
}

/**
 * Resets the current player's turn and UI state.
 */
function resetPlayer() {
    player1Button.classList.remove('active');
    player2Button.classList.remove('active');
    currentPlayer = null;
}

/**
 * Plays an animation and sound effect for a specified player when they answer correctly.
 * 
 * This function:
 * - Resets and plays a sound effect.
 * - Temporarily removes the glow animation from the player's element and adds a new animation.
 * - Restores the glow animation and stops the sound effect after 6 seconds.
 * 
 * @param {number} playerNumber - The number of the player (e.g., 1 or 2) whose animation will be triggered.
 */
function pedroAnimation(playerNumber) {

    const playerElement = document.getElementById(`player${playerNumber}`);
    
    if (!playerElement || !correctAnswerAudio) return;

    // Reset the audio to the beginning and play it
    correctAnswerAudio.currentTime = 0;
    correctAnswerAudio.play();

    playerElement.classList.remove('glow');
    playerElement.classList.add('animation-active');

    // After 6 seconds, stop the animation and sound
    setTimeout(() => {

        correctAnswerAudio.pause();
        correctAnswerAudio.currentTime = 0;
        playerElement.classList.add('glow');
        playerElement.classList.remove('animation-active');
    }, 6000);
}

