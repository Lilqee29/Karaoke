// ========== GAMES MODULE ==========

// Snake
let snakeGame = null;
function initSnake() {
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const box = 20;
    const xMax = canvas.width / box;
    const yMax = canvas.height / box;

    let snake = [{ x: 7 * box, y: 6 * box }];
    let food = { 
        x: Math.floor(Math.random() * (xMax - 2) + 1) * box, 
        y: Math.floor(Math.random() * (yMax - 2) + 1) * box 
    };
    let score = 0;
    let d = null;
    let gameInterval = null;
    
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = state.highScore;
    
    const direction = (event) => {
        if ((event.key === ' ' || event.key === 'a' || event.key === 'Enter') && !gameInterval) {
            gameInterval = setInterval(draw, 100);
            snakeGame = { stop: () => { clearInterval(gameInterval); document.removeEventListener('keydown', direction); } };
        } else if (event.key === 'ArrowLeft' && d != 'RIGHT') d = 'LEFT';
        else if (event.key === 'ArrowUp' && d != 'DOWN') d = 'UP';
        else if (event.key === 'ArrowRight' && d != 'LEFT') d = 'RIGHT';
        else if (event.key === 'ArrowDown' && d != 'UP') d = 'DOWN';
    };
    
    document.addEventListener('keydown', direction);
    
    function draw() {
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(15, 56, 15, 0.1)';
        for(let x=0; x<canvas.width; x+=box) {
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
        }
        for(let y=0; y<canvas.height; y+=box) {
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
        }

        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = '#0f380f';
            ctx.fillRect(snake[i].x + 1, snake[i].y + 1, box - 2, box - 2);
        }
        
        ctx.fillStyle = '#306230';
        ctx.fillRect(food.x + 2, food.y + 2, box - 4, box - 4);
        
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;
        if (d === 'LEFT') snakeX -= box;
        if (d === 'UP') snakeY -= box;
        if (d === 'RIGHT') snakeX += box;
        if (d === 'DOWN') snakeY += box;

        if (snakeX === food.x && snakeY === food.y) {
            score++;
            addGems(5);
            food = { 
                x: Math.floor(Math.random() * (xMax - 2) + 1) * box, 
                y: Math.floor(Math.random() * (yMax - 2) + 1) * box 
            };
            sounds.select();
        } else {
            snake.pop();
        }
        
        let newHead = { x: snakeX, y: snakeY };
        if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
            clearInterval(gameInterval);
            if (score > state.highScore) {
                state.highScore = score;
                saveState();
            }
            sounds.back();
            alert('GAME OVER! GEMS: ' + (score * 5));
            initSnake();
            return;
        }
        snake.unshift(newHead);
        document.getElementById('score').textContent = score;
    }

    function collision(head, array) {
        for (let i = 0; i < array.length; i++) {
            if (head.x === array[i].x && head.y === array[i].y) return true;
        }
        return false;
    }
}

// Flappy Bird
let flappyGame = null;
function initFlappy() {
    const canvas = document.getElementById('flappyCanvas');
    const ctx = canvas.getContext('2d');
    
    let bird = { x: 50, y: canvas.height / 2, velocity: 0, size: 15 };
    let pipes = [];
    let score = 0;
    let gameRunning = false;
    let frameCount = 0;
    
    const gravity = 0.4;
    const jumpPower = -7;
    const pipeWidth = 40;
    const pipeGap = 100;
    const pipeSpeed = 2;
    
    document.getElementById('flappyScore').textContent = score;
    
    const handleJump = (e) => {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'Enter') {
            if (!gameRunning) {
                gameRunning = true;
                gameLoop();
            }
            bird.velocity = jumpPower;
            sounds.click();
        }
    };
    
    document.addEventListener('keydown', handleJump);
    
    function gameLoop() {
        if (!gameRunning) {
            document.removeEventListener('keydown', handleJump);
            return;
        }
        
        // Clear
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update bird
        bird.velocity += gravity;
        bird.y += bird.velocity;
        
        // Draw bird
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Pipes
        frameCount++;
        if (frameCount % 90 === 0) {
            const minHeight = 50;
            const maxHeight = canvas.height - pipeGap - 50;
            const topHeight = Math.floor(Math.random() * (maxHeight - minHeight) + minHeight);
            pipes.push({ x: canvas.width, top: topHeight, scored: false });
        }
        
        for (let i = pipes.length - 1; i >= 0; i--) {
            const pipe = pipes[i];
            pipe.x -= pipeSpeed;
            
            // Draw pipes
            ctx.fillStyle = '#228b22';
            ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + pipeGap, pipeWidth, canvas.height);
            
            // Check collision
            if (bird.x + bird.size > pipe.x && bird.x - bird.size < pipe.x + pipeWidth) {
                if (bird.y - bird.size < pipe.top || bird.y + bird.size > pipe.top + pipeGap) {
                    gameOver();
                    return;
                }
            }
            
            // Score
            if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
                pipe.scored = true;
                score++;
                addGems(2);
                document.getElementById('flappyScore').textContent = score;
                sounds.select();
            }
            
            // Remove off-screen pipes
            if (pipe.x + pipeWidth < 0) {
                pipes.splice(i, 1);
            }
        }
        
        // Check bounds
        if (bird.y - bird.size < 0 || bird.y + bird.size > canvas.height) {
            gameOver();
            return;
        }
        
        flappyGame = requestAnimationFrame(gameLoop);
    }
    
    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(flappyGame);
        sounds.back();
        alert(`GAME OVER! SCORE: ${score} | GEMS: ${score * 2}`);
        pipes = [];
        bird = { x: 50, y: canvas.height / 2, velocity: 0, size: 15 };
        score = 0;
        frameCount = 0;
        document.getElementById('flappyScore').textContent = score;
        
        // Draw start screen
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS BUTTON A', canvas.width/2, canvas.height/2);
        ctx.fillText('TO START', canvas.width/2, canvas.height/2 + 20);
    }
    
    gameOver(); // Show start screen
}

// Breakout
let breakoutGame = null;
function initBreakout() {
    const canvas = document.getElementById('breakoutCanvas');
    const ctx = canvas.getContext('2d');
    
    const paddle = { width: 60, height: 10, x: canvas.width / 2 - 30, speed: 6 };
    const ball = { x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3, radius: 5 };
    const brickRows = 5;
    const brickCols = 8;
    const brickWidth = canvas.width / brickCols - 5;
    const brickHeight = 15;
    let bricks = [];
    let score = 0;
    let gameRunning = false;
    
    // Create bricks
    for (let r = 0; r < brickRows; r++) {
        for (let c = 0; c < brickCols; c++) {
            bricks.push({ x: c * (brickWidth + 5) + 2, y: r * (brickHeight + 5) + 30, active: true });
        }
    }
    
    document.getElementById('breakoutScore').textContent = score;
    
    const handleControls = (e) => {
        if ((e.key === ' ' || e.key === 'a' || e.key === 'Enter') && !gameRunning) {
            gameRunning = true;
            gameLoop();
        }
        if (e.key === 'ArrowLeft') paddle.x = Math.max(0, paddle.x - paddle.speed);
        if (e.key === 'ArrowRight') paddle.x = Math.min(canvas.width - paddle.width, paddle.x + paddle.speed);
    };
    
    document.addEventListener('keydown', handleControls);
    
    function gameLoop() {
        if (!gameRunning) {
            document.removeEventListener('keydown', handleControls);
            return;
        }
        
        ctx.fillStyle = '#0f380f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Ball
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Wall collision
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) ball.dx *= -1;
        if (ball.y - ball.radius < 0) ball.dy *= -1;
        
        // Paddle collision
        if (ball.y + ball.radius > canvas.height - paddle.height &&
            ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.dy *= -1;
            sounds.click();
        }
        
        // Brick collision
        bricks.forEach(brick => {
            if (brick.active && ball.x > brick.x && ball.x < brick.x + brickWidth &&
                ball.y > brick.y && ball.y < brick.y + brickHeight) {
                ball.dy *= -1;
                brick.active = false;
                score++;
                addGems(1);
                document.getElementById('breakoutScore').textContent = score;
                sounds.select();
            }
        });
        
        // Draw paddle
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
        
        // Draw ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw bricks
        bricks.forEach(brick => {
            if (brick.active) {
                ctx.fillStyle = '#ff6347';
                ctx.fillRect(brick.x, brick.y, brickWidth, brickHeight);
            }
        });
        
        // Game over
        if (ball.y + ball.radius > canvas.height) {
            gameRunning = false;
            sounds.back();
            alert(`GAME OVER! SCORE: ${score}`);
            location.reload();
            return;
        }
        
        // Win
        if (bricks.every(b => !b.active)) {
            gameRunning = false;
            addGems(50);
            sounds.launch();
            alert(`YOU WIN! +50 GEMS!`);
            location.reload();
            return;
        }
        
        breakoutGame = requestAnimationFrame(gameLoop);
    }
    
    // Start screen
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS A TO START', canvas.width/2, canvas.height/2);
}

// Memory Match
let memoryGame = { cards: [], flipped: [], matched: [], canFlip: true };

function initMemory() {
    const symbols = ['🎮', '🎯', '🎲', '🎨', '🎭', '🎪', '🎸', '🎺'];
    const deck = [...symbols, ...symbols];
    memoryGame.cards = deck.sort(() => Math.random() - 0.5);
    memoryGame.flipped = [];
    memoryGame.matched = [];
    memoryGame.canFlip = true;
    
    renderMemory();
}

function renderMemory() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memoryGame.cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.style.cssText = 'width: 60px; height: 60px; background: var(--gb-text); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 30px;';
        
        if (memoryGame.flipped.includes(index) || memoryGame.matched.includes(index)) {
            card.textContent = symbol;
            card.style.background = memoryGame.matched.includes(index) ? '#4caf50' : 'var(--gb-screen)';
        } else {
            card.textContent = '?';
        }
        
        card.onclick = () => flipCard(index);
        grid.appendChild(card);
    });
    
    document.getElementById('memoryScore').textContent = memoryGame.matched.length / 2;
}

function flipCard(index) {
    if (!memoryGame.canFlip || memoryGame.flipped.includes(index) || 
        memoryGame.matched.includes(index) || memoryGame.flipped.length >= 2) return;
    
    memoryGame.flipped.push(index);
    sounds.click();
    renderMemory();
    
    if (memoryGame.flipped.length === 2) {
        memoryGame.canFlip = false;
        const [first, second] = memoryGame.flipped;
        
        if (memoryGame.cards[first] === memoryGame.cards[second]) {
            memoryGame.matched.push(first, second);
            memoryGame.flipped = [];
            memoryGame.canFlip = true;
            addGems(3);
            sounds.select();
            
            if (memoryGame.matched.length === memoryGame.cards.length) {
                setTimeout(() => {
                    addGems(20);
                    sounds.launch();
                    alert('YOU WIN! +20 GEMS!');
                }, 300);
            }
        } else {
            setTimeout(() => {
                memoryGame.flipped = [];
                memoryGame.canFlip = true;
                renderMemory();
            }, 800);
        }
        
        renderMemory();
    }
}

// ========== TETRIS ==========
let tetrisGame = null;

function initTetris() {
    const canvas = document.getElementById('tetrisCanvas');
    const ctx = canvas.getContext('2d');
    
    const ROWS = 20;
    const COLS = 12;
    const BLOCK_SIZE = 15;
    
    const SHAPES = [
        [[1,1,1,1]], // I
        [[1,1],[1,1]], // O
        [[0,1,0],[1,1,1]], // T
        [[1,0,0],[1,1,1]], // L
        [[0,0,1],[1,1,1]], // J
        [[0,1,1],[1,1,0]], // S
        [[1,1,0],[0,1,1]]  // Z
    ];
    
    const COLORS = ['#44cc44', '#33aa33', '#228822', '#116611', '#004400', '#55ee55', '#22ff22'];
    
    let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    let currentPiece = null;
    let currentX = 0;
    let currentY = 0;
    let currentColor = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let gameRunning = false;
    let dropInterval = null;
    
    document.getElementById('tetrisScore').textContent = score;
    document.getElementById('tetrisLines').textContent = lines;
    
    function newPiece() {
        const shapeIndex = Math.floor(Math.random() * SHAPES.length);
        currentPiece = SHAPES[shapeIndex];
        currentColor = shapeIndex;
        currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
        currentY = 0;
        
        if (collision()) {
            gameOver();
        }
    }
    
    function collision() {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    const newX = currentX + x;
                    const newY = currentY + y;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                    if (newY >= 0 && board[newY][newX]) return true;
                }
            }
        }
        return false;
    }
    
    function merge() {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    if (currentY + y >= 0) {
                        board[currentY + y][currentX + x] = currentColor + 1;
                    }
                }
            }
        }
    }
    
    function clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            lines += linesCleared;
            score += linesCleared * 100 * level;
            level = Math.floor(lines / 10) + 1;
            
            addGems(linesCleared * 10);
            if(typeof sounds !== 'undefined' && sounds.select) sounds.select();
            
            document.getElementById('tetrisScore').textContent = score;
            document.getElementById('tetrisLines').textContent = lines;
        }
    }
    
    function rotate() {
        const rotated = currentPiece[0].map((_, i) => 
            currentPiece.map(row => row[i]).reverse()
        );
        const backup = currentPiece;
        currentPiece = rotated;
        
        if (collision()) {
            currentPiece = backup;
        } else {
            if(typeof sounds !== 'undefined' && sounds.click) sounds.click();
        }
    }
    
    function moveDown() {
        currentY++;
        if (collision()) {
            currentY--;
            merge();
            clearLines();
            newPiece();
        }
    }
    
    function moveLeft() {
        currentX--;
        if (collision()) currentX++;
    }
    
    function moveRight() {
        currentX++;
        if (collision()) currentX--;
    }
    
    function draw() {
        ctx.fillStyle = '#0f380f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw board
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (board[y][x]) {
                    ctx.fillStyle = COLORS[board[y][x] - 1];
                    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }
        }
        
        // Draw current piece
        if (currentPiece) {
            ctx.fillStyle = COLORS[currentColor];
            for (let y = 0; y < currentPiece.length; y++) {
                for (let x = 0; x < currentPiece[y].length; x++) {
                    if (currentPiece[y][x]) {
                        ctx.fillRect(
                            (currentX + x) * BLOCK_SIZE,
                            (currentY + y) * BLOCK_SIZE,
                            BLOCK_SIZE - 1,
                            BLOCK_SIZE - 1
                        );
                    }
                }
            }
        }
    }
    
    function gameLoop() {
        if (!gameRunning) return;
        draw();
        tetrisGame = requestAnimationFrame(gameLoop);
    }
    
    function gameOver() {
        gameRunning = false;
        clearInterval(dropInterval);
        cancelAnimationFrame(tetrisGame);
        if(typeof sounds !== 'undefined' && sounds.back) sounds.back();
        alert(`GAME OVER! SCORE: ${score}`);
        goBack();
    }
    
    const handleKeys = (e) => {
        if (!gameRunning) return;
        if (e.key === 'ArrowLeft') moveLeft();
        if (e.key === 'ArrowRight') moveRight();
        if (e.key === 'ArrowDown') moveDown();
        if (e.key === 'ArrowUp') rotate();
        draw();
    };
    
    document.addEventListener('keydown', handleKeys);
    
    function startGame() {
        gameRunning = true;
        newPiece();
        gameLoop();
        dropInterval = setInterval(() => {
            if (gameRunning) {
                moveDown();
                draw();
            }
        }, 1000 / level);
    }
    

    startGame();
}

// ========== MINESWEEPER ==========
let minesGame = null;
function initMines() {
    const grid = document.getElementById('minesGrid');
    const timeEl = document.getElementById('minesTime');
    const flagsEl = document.getElementById('minesFlags');
    const statusEl = document.getElementById('minesStatus');
    
    let size = 10;
    let bombs = 10;
    let flags = 10;
    let time = 0;
    let gameActive = true;
    let board = [];
    let timerInterval = null;
    
    // Clear old timer
    if(window.minesTimer) clearInterval(window.minesTimer);

    // Init Board
    for(let i=0; i<size*size; i++) {
        board.push({
            isBomb: false,
            isRevealed: false,
            isFlagged: false,
            neighborCount: 0
        });
    }

    // Place Bombs
    let bombCount = 0;
    while(bombCount < bombs) {
        let idx = Math.floor(Math.random() * (size*size));
        if(!board[idx].isBomb) {
            board[idx].isBomb = true;
            bombCount++;
        }
    }

    // Calc Neighbors
    for(let i=0; i<board.length; i++) {
        if(board[i].isBomb) continue;
        let count = 0;
        const row = Math.floor(i / size);
        const col = i % size;
        
        for(let r=-1; r<=1; r++) {
            for(let c=-1; c<=1; c++) {
                const nr = row + r;
                const nc = col + c;
                if(nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    const nIdx = nr * size + nc;
                    if(board[nIdx].isBomb) count++;
                }
            }
        }
        board[i].neighborCount = count;
    }

    function render() {
        grid.innerHTML = '';
        board.forEach((cell, idx) => {
            const div = document.createElement('div');
            div.style.background = cell.isRevealed ? '#8bac0f' : '#0f380f';
            div.style.border = '1px solid #306230';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.fontSize = '8px';
            div.style.cursor = 'pointer';
            div.style.userSelect = 'none';

            if(cell.isRevealed) {
                if(cell.isBomb) {
                    div.textContent = '💣';
                    div.style.background = '#f00';
                } else if(cell.neighborCount > 0) {
                    div.textContent = cell.neighborCount;
                    div.style.color = ['#00f', '#008000', '#f00', '#000080'][cell.neighborCount-1] || '#000';
                }
            } else if(cell.isFlagged) {
                div.textContent = '🚩';
            }

            // Controls
            div.onclick = () => reveal(idx);
            div.oncontextmenu = (e) => {
                e.preventDefault();
                toggleFlag(idx);
            };
            
            // Long Press for Mobile Flagging
            let pressTimer;
            div.ontouchstart = () => { pressTimer = setTimeout(() => toggleFlag(idx), 500); };
            div.ontouchend = () => clearTimeout(pressTimer);

            grid.appendChild(div);
        });
        
        flagsEl.textContent = `FLAGS: ${flags}`;
    }

    function reveal(idx) {
        if(!gameActive || board[idx].isFlagged || board[idx].isRevealed) return;
        
        board[idx].isRevealed = true;
        
        if(board[idx].isBomb) {
            gameOver(false);
        } else if(board[idx].neighborCount === 0) {
            // Flood Fill
            const queue = [idx];
            while(queue.length > 0) {
                const curr = queue.pop();
                const row = Math.floor(curr / size);
                const col = curr % size;
                
                for(let r=-1; r<=1; r++) {
                    for(let c=-1; c<=1; c++) {
                        const nr = row + r;
                        const nc = col + c;
                        if(nr >= 0 && nr < size && nc >= 0 && nc < size) {
                            const nIdx = nr * size + nc;
                            if(!board[nIdx].isRevealed && !board[nIdx].isFlagged) {
                                board[nIdx].isRevealed = true;
                                if(board[nIdx].neighborCount === 0) queue.push(nIdx);
                            }
                        }
                    }
                }
            }
        }
        
        sounds.click();
        checkWin();
        render();
    }

    function toggleFlag(idx) {
        if(!gameActive || board[idx].isRevealed) return;
        if(!board[idx].isFlagged && flags > 0) {
            board[idx].isFlagged = true;
            flags--;
        } else if(board[idx].isFlagged) {
            board[idx].isFlagged = false;
            flags++;
        }
        sounds.select();
        render();
    }

    function checkWin() {
        const safeCells = board.filter(c => !c.isBomb);
        if(safeCells.every(c => c.isRevealed)) {
            gameOver(true);
        }
    }

    function gameOver(win) {
        gameActive = false;
        clearInterval(window.minesTimer);
        statusEl.textContent = win ? "YOU WIN! +20 GEMS" : "GAME OVER";
        statusEl.style.color = win ? "#0f0" : "#f00";
        if(win) {
            sounds.launch();
            addGems(20);
        } else {
            sounds.back();
            // Reveal all bombs
            board.forEach(c => { if(c.isBomb) c.isRevealed = true; });
            render();
        }
    }

    // Start Timer
    window.minesTimer = setInterval(() => {
        if(gameActive) {
            time++;
            timeEl.textContent = `TIME: ${time}`;
        }
    }, 1000);

    render();
}

// ========== EXPORT GAMES TO WINDOW ==========
window.initSnake = initSnake;
window.initFlappy = initFlappy;
window.initBreakout = initBreakout;
window.initMemory = initMemory;
window.initTetris = initTetris;
window.initMines = initMines;

// ========== 2048 ==========
let game2048 = null;
function init2048() {
    const gridEl = document.getElementById('2048Grid');
    const scoreEl = document.getElementById('2048Score');
    let board = Array(16).fill(0);
    let score = 0;
    
    // Initial Spawn
    spawn();
    spawn();
    render();
    
    // Input Handling
    document.onkeydown = (e) => {
        if (!document.getElementById('2048Screen').classList.contains('active')) return;
        
        let moved = false;
        const oldBoard = [...board];
        
        if (e.key === 'ArrowLeft') moved = moveLeft();
        if (e.key === 'ArrowRight') moved = moveRight();
        if (e.key === 'ArrowUp') moved = moveUp();
        if (e.key === 'ArrowDown') moved = moveDown();
        
        if (moved) {
            spawn();
            render();
            checkGameOver();
            sounds.select();
        }
    };
    
    // Swipe Handling (Mobile)
    let touchStartX = 0;
    let touchStartY = 0;
    gridEl.ontouchstart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    };
    
    gridEl.ontouchend = (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        } else {
            if (dy > 0) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        }
    };

    function spawn() {
        const empty = board.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
        if (empty.length > 0) {
            const idx = empty[Math.floor(Math.random() * empty.length)];
            board[idx] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    function render() {
        gridEl.innerHTML = '';
        board.forEach(val => {
            const cell = document.createElement('div');
            cell.style.cssText = `
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; border-radius: 4px; font-size: 10px;
                background: ${getColor(val)}; color: ${val > 4 ? '#fff' : '#000'};
            `;
            cell.textContent = val || '';
            gridEl.appendChild(cell);
        });
        scoreEl.textContent = `SCORE: ${score}`;
    }

    function getColor(val) {
        if (!val) return 'rgba(15, 56, 15, 0.1)';
        const colors = {
            2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
            32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
            512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
        };
        return colors[val] || '#3c3a32';
    }

    // Logic Helpers (Simplified for brevity)
    function moveLeft() {
        let moved = false;
        for (let r = 0; r < 4; r++) {
            const row = board.slice(r*4, r*4+4).filter(v => v);
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i+1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i+1, 1);
                    moved = true;
                }
            }
            while (row.length < 4) row.push(0);
            for (let c = 0; c < 4; c++) {
                if (board[r*4+c] !== row[c]) moved = true;
                board[r*4+c] = row[c];
            }
        }
        return moved;
    }
    
    function moveRight() {
        rotate(2);
        const moved = moveLeft();
        rotate(2);
        return moved;
    }
    
    function moveUp() {
        rotate(3);
        const moved = moveLeft();
        rotate(1);
        return moved;
    }
    
    function moveDown() {
        rotate(1);
        const moved = moveLeft();
        rotate(3);
        return moved;
    }

    function rotate(times) {
        while (times--) {
            const newBoard = Array(16).fill(0);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    newBoard[c*4 + (3-r)] = board[r*4+c];
                }
            }
            board = newBoard;
        }
    }

    function checkGameOver() {
        if (!board.includes(0)) {
            // Check if any merges possible
            // If not -> Game Over
            // (Simplified check)
        }
    }
}

// ========== DINO RUNNER ==========
let dinoGame = null;
function initDino() {
    const canvas = document.getElementById('dinoCanvas');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('dinoScore');
    
    let dino = { x: 20, y: 120, w: 20, h: 20, dy: 0, jump: false };
    let obstacle = { x: 300, w: 15, h: 25 };
    let gameSpeed = 3;
    let gravity = 0.6;
    let score = 0;
    let isRunning = true;
    let animationFrame;
    
    // Jump Controls
    const jump = () => {
        if (!dino.jump) {
            dino.dy = -9;
            dino.jump = true;
            sounds.click();
        }
    };
    
    document.addEventListener('keydown', (e) => {
        if ((e.key === ' ' || e.key === 'Enter') && document.getElementById('dinoScreen').classList.contains('active')) jump();
    });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });
    canvas.addEventListener('mousedown', jump);
    
    function loop() {
        if (!isRunning) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ground
        ctx.beginPath();
        ctx.moveTo(0, 140);
        ctx.lineTo(300, 140);
        ctx.stroke();
        
        // Dino Physics
        dino.dy += gravity;
        dino.y += dino.dy;
        
        if (dino.y > 120) {
            dino.y = 120;
            dino.jump = false;
        }
        
        // Draw Dino
        ctx.fillStyle = '#0f380f';
        ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
        
        // Obstacle Logic
        obstacle.x -= gameSpeed;
        if (obstacle.x < -20) {
            obstacle.x = 300;
            score++;
            scoreEl.textContent = `SCORE: ${score}`;
            if (score % 5 === 0) gameSpeed += 0.5;
            sounds.select();
        }
        
        // Draw Obstacle (Cactus)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(obstacle.x, 140 - obstacle.h, obstacle.w, obstacle.h);
        
        // Collision
        if (dino.x < obstacle.x + obstacle.w &&
            dino.x + dino.w > obstacle.x &&
            dino.y + dino.h > 140 - obstacle.h) {
            isRunning = false;
            sounds.back();
            alert(`GAME OVER! SCORE: ${score}`);
        }
        
        animationFrame = requestAnimationFrame(loop);
    }
    
    loop();
}

window.init2048 = init2048;
window.initDino = initDino;
