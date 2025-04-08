const socket = io();
const board = document.getElementById('game-board');
const scoreboard = document.getElementById('scoreboard');
const resetBtn = document.getElementById('resetBtn');
const themeBtn = document.getElementById('themeBtn');
const volumeSlider = document.getElementById('volumeControl');

let cards = [];
let flippedCards = [];
let myPlayerNumber = 0;
let currentTurn = 0;
let myName = '';
let playerNames = ['', ''];

// Load sounds
const flipSound = new Audio('sounds/flip.mp3');
const matchSound = new Audio('sounds/match.mp3');
const wrongSound = new Audio('sounds/wrong.mp3');
const winSound = new Audio('sounds/win.mp3');

// Set initial volume
[flipSound, matchSound, wrongSound, winSound].forEach(s => s.volume = volumeSlider.value);

// Volume control
volumeSlider.addEventListener('input', () => {
    [flipSound, matchSound, wrongSound, winSound].forEach(s => {
        s.volume = volumeSlider.value;
    });
});

myName = prompt("Enter your name:");
socket.emit('playerName', myName);

function buildBoard(cards) {
    board.innerHTML = '';
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        board.appendChild(card);
    });
}

board.addEventListener('click', e => {
    if (myPlayerNumber !== currentTurn) return;

    const card = e.target;
    if (!card.classList.contains('card') || card.classList.contains('flipped') || flippedCards.length === 2) return;

    flipSound.play();
    flipCard(card);
    socket.emit('cardFlip', {
        index: card.dataset.index,
        emoji: card.dataset.emoji
    });

    flippedCards.push(card);
    if (flippedCards.length === 2) {
        setTimeout(() => {
            flippedCards = [];
        }, 1000);
    }
});

function flipCard(card) {
    card.textContent = card.dataset.emoji;
    card.classList.add('flipped');
}

function unflipCard(card) {
    card.textContent = '';
    card.classList.remove('flipped');
}

function updateScore(scores) {
    scoreboard.innerHTML = `${playerNames[0]}: ${scores[0]} | ${playerNames[1]}: ${scores[1]}`;
    matchSound.play();
}

socket.on('playerNumber', num => {
    myPlayerNumber = num - 1;
});

socket.on('startGame', data => {
    playerNames = data.players.map(p => p.name);
    currentTurn = data.currentTurn;
    cards = data.cards;

    updateScore([0, 0]);
    buildBoard(cards);
    alert(`${playerNames[currentTurn]}'s turn!`);
});

socket.on('cardFlip', data => {
    const card = document.querySelector(`.card[data-index='${data.index}']`);
    if (card && !card.classList.contains('flipped')) {
        card.textContent = data.emoji;
        card.classList.add('flipped');
    }
});

socket.on('unflipCards', indexes => {
    wrongSound.play();
    indexes.forEach(i => {
        const card = document.querySelector(`.card[data-index="${i}"]`);
        if (card && !card.classList.contains('matched')) {
            unflipCard(card);
        }
    });
});

socket.on('switchTurn', turn => {
    currentTurn = turn;
    alert(`${playerNames[turn]}'s turn!`);
});

socket.on('updateScore', scores => {
    updateScore(scores);
});

socket.on('gameOver', winner => {
    winSound.play();
    alert(`Game Over! Winner: ${winner}`);
});

socket.on('resetGame', () => {
    window.location.reload();
});

socket.on('playerLeft', () => {
    alert('Player left the game. Refresh to restart.');
    board.innerHTML = '';
    scoreboard.innerHTML = '';
});

// Theme toggle
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
});

// Reset game
resetBtn.addEventListener('click', () => {
    socket.emit('resetGame');
});
