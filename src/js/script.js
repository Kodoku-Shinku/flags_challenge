// script.js

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
const flagName = document.getElementById('flagName'); // Assuming this element exists

let currentFlagIndex = 0;
let currentPlayer = null;
let scores = { player1: 0, player2: 0 };
let isGameActive = false;
let hasAnswered = { player1: false, player2: false };
let availableFlags = [...flags]; // Create a copy of the flags array

startButton.addEventListener('click', () => {
    gameArea.style.display = 'block';
    loadNextFlag();
});

player1Button.addEventListener('click', () => handlePlayerClick(1));
player2Button.addEventListener('click', () => handlePlayerClick(2));
submitAnswerButton.addEventListener('click', checkAnswer);
nextFlagButton.addEventListener('click', loadNextFlag);

// Add event listener for Enter key in the answer input field
answerInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the default form submission behavior
        checkAnswer(); // Call the function to check the answer
    }
});

// Add event listener for keyboard keys
document.addEventListener('keydown', function(event) {
    if (event.key === 'a') {
        handlePlayerClick(1);
    } else if (event.key === 'l') {
        handlePlayerClick(2);
    }
});

function loadNextFlag() {
    if (availableFlags.length === 0) {
        result.innerHTML = 'No hay más banderas!';
        return;
    }

    currentFlagIndex = Math.floor(Math.random() * availableFlags.length);
    flagImage.src = availableFlags[currentFlagIndex].url;
    flagName.textContent = ''; // Clear the flag name
    result.textContent = '';
    answerInput.value = '';
    answerInput.disabled = true;
    
    player1Button.classList.remove('active', 'disabled');
    player2Button.classList.remove('active', 'disabled');
    player1Button.disabled = false;
    player2Button.disabled = false;

    // Hide the next flag button at the start of a new round
    nextFlagButton.style.display = 'none';

    hasAnswered = { player1: false, player2: false };
    isGameActive = true;
    currentPlayer = null;
}

function handlePlayerClick(player) {
    if (currentPlayer === null && isGameActive) {
        currentPlayer = player;
        const button = player === 1 ? player1Button : player2Button;
        button.classList.add('active');
        answerInput.disabled = false;
        answerInput.focus();
    }
}

function removeAccents(str) {
    return str.normalize('NFD')  // Normalize to decomposed form
              .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks
              .toLowerCase();  // Convert to lowercase
}

function checkAnswer() {
    if (currentPlayer !== null && isGameActive) {
        const answer = removeAccents(answerInput.value.trim());
        const flag = availableFlags[currentFlagIndex];
        const correctAnswer = removeAccents(flag.name);

        // Input validation
        if (answer === '') {
            result.innerHTML = '<span class="text-danger">Por favor ingrese una respuesta.</span>';
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(answer)) { // Note: Now only allows letters and spaces
            result.innerHTML = '<span class="text-danger">Solo se permiten letras (con acentos) y espacios.</span>';
            return;
        }

        if (answer === correctAnswer) {
            flagName.textContent = flag.name;
            result.innerHTML = '<span class="text-sucess">¡Correcto!</span>';
            if (currentPlayer === 1) {
                scores.player1 += 1;
            } else {
                scores.player2 += 1;
            }
            updateScore();
            availableFlags.splice(currentFlagIndex, 1); // Remove the current flag from the array
            nextFlagButton.style.display = 'block'; // Show next flag button
            answerInput.disabled = true; // Disable the input
            player1Button.classList.remove('active');
            player2Button.classList.remove('active');
            currentPlayer = null; // Reset current player
            isGameActive = false; // End the current round
        } else {
            result.innerHTML = `<span class="text-danger">Incorrecto! Turno del jugador ${currentPlayer === 1 ? 2 : 1}.</span>`;
            flagName.textContent = ''; // Clear the flag name
            answerInput.value = ''; // Clear the input field
            answerInput.disabled = true; // Disable the input

            const currentButton = currentPlayer === 1 ? player1Button : player2Button;
            currentButton.classList.add('disabled'); // Mark the button as disabled
            currentButton.classList.remove('active'); // Remove the active class
            currentButton.disabled = true; // Disable the button

            // Record that the current player has answered
            if (currentPlayer === 1) {
                hasAnswered.player1 = true;
            } else {
                hasAnswered.player2 = true;
            }

            // Check if both players have answered and failed
            if (hasAnswered.player1 && hasAnswered.player2) {
                // Show the correct flag name in black and indicate that both players failed
                result.innerHTML = `<span class="text-danger">Incorrecto! El nombre correcto es: <span class="text-dark">${flag.name}</span>.</span>`;
                nextFlagButton.style.display = 'block'; // Show next flag button
                player1Button.classList.add('disabled'); // Disable player 1 button
                player2Button.classList.add('disabled'); // Disable player 2 button
                player1Button.disabled = true; // Disable player 1 button
                player2Button.disabled = true; // Disable player 2 button
                answerInput.disabled = true; // Disable the input
                availableFlags.splice(currentFlagIndex, 1); // Remove the current flag from the array
                hasAnswered = { player1: false, player2: false }; // Reset answers
                isGameActive = false; // End the current round
            } else {
                // Switch to the other player
                currentPlayer = currentPlayer === 1 ? 2 : 1;
                const nextPlayerButton = currentPlayer === 1 ? player1Button : player2Button;
                nextPlayerButton.classList.add('active');
                answerInput.disabled = false;
                answerInput.focus(); // Focus the input for the next player
            }
        }
    }
}

function updateScore() {
    scoreP1Display.textContent = `${scores.player1}`;
    scoreP2Display.textContent = `${scores.player2}`;

}
