const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = [];
let currentTurn = 0;
let scores = [0, 0];
let flippedCards = [];

const emojis = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🍑', '🥝'];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let shuffledCards = shuffle([...emojis, ...emojis]);

io.on('connection', socket => {
    console.log('A user connected');

    socket.on('playerName', name => {
        if (players.length >= 2) return;

        players.push({ id: socket.id, name });
        const playerNumber = players.length;

        socket.emit('playerNumber', playerNumber);

        if (players.length === 2) {
            io.emit('startGame', {
                players,
                currentTurn,
                cards: shuffledCards
            });
        }
    });

    socket.on('cardFlip', data => {
        io.emit('cardFlip', {
            index: data.index,
            emoji: data.emoji
        });

        flippedCards.push({ ...data, socketId: socket.id });

        if (flippedCards.length === 2) {
            const [first, second] = flippedCards;

            setTimeout(() => {
                if (first.emoji === second.emoji) {
                    const playerIndex = players.findIndex(p => p.id === first.socketId);
                    if (playerIndex !== -1) scores[playerIndex]++;
                    io.emit('updateScore', scores);

                    if (scores[0] + scores[1] === 8) {
                        const winner = scores[0] > scores[1] ? players[0].name : players[1].name;
                        io.emit('gameOver', winner);
                    }
                } else {
                    io.emit('unflipCards', [first.index, second.index]);
                    currentTurn = (currentTurn + 1) % 2;
                    io.emit('switchTurn', currentTurn);
                }
                flippedCards = [];
            }, 1000);
        }
    });

    socket.on('resetGame', () => {
        players = [];
        currentTurn = 0;
        scores = [0, 0];
        flippedCards = [];
        shuffledCards = shuffle([...emojis, ...emojis]);
        io.emit('resetGame');
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        io.emit('playerLeft');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
