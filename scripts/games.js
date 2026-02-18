// ========== GAMES MODULE (v2.0 - FIXED) ==========

// ── Shared: clean overlay instead of alert() ────────────────────────────────
function showGameOver(message, onRestart) {
    let existing = document.getElementById('gameOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'gameOverlay';
    overlay.style.cssText = `
        position:absolute; inset:0; z-index:100;
        background:rgba(0,0,0,0.82);
        display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:8px;
        font-family:'Press Start 2P', monospace;
    `;
    overlay.innerHTML = `
        <div style="font-size:8px; color:#9bbc0f; text-align:center; line-height:1.8;">${message}</div>
        <button id="gameOverBtn" style="
            font-size:6px; padding:4px 10px; margin-top:4px;
            background:#0f380f; color:#9bbc0f;
            border:1px solid #9bbc0f; cursor:pointer;
            font-family:'Press Start 2P', monospace;">
            RESTART
        </button>
    `;
    // Mount inside the active canvas parent
    const activeScreen = document.querySelector('.game-screen.active') || document.body;
    activeScreen.style.position = 'relative';
    activeScreen.appendChild(overlay);
    document.getElementById('gameOverBtn').onclick = () => { overlay.remove(); onRestart(); };
}

// ── Utility: safe event listener registry to prevent stacking ───────────────
const _listeners = {};
function addGameListener(key, target, event, fn) {
    if (_listeners[key]) target.removeEventListener(event, _listeners[key]);
    _listeners[key] = fn;
    target.addEventListener(event, fn);
}
function removeGameListener(key, target, event) {
    if (_listeners[key]) { target.removeEventListener(event, _listeners[key]); delete _listeners[key]; }
}

// ============================================================
// SNAKE
// ============================================================
let snakeGame = null;
function initSnake() {
    if (snakeGame) { clearInterval(snakeGame); snakeGame = null; }

    const canvas = document.getElementById('snakeCanvas');
    const ctx    = canvas.getContext('2d');
    const box    = 20;
    const xMax   = Math.floor(canvas.width  / box);
    const yMax   = Math.floor(canvas.height / box);

    let snake        = [{ x: 7 * box, y: 6 * box }];
    let food         = spawnFood();
    let score        = 0;
    let d            = null;
    let gameInterval = null;
    let started      = false;

    document.getElementById('score').textContent     = score;
    document.getElementById('highScore').textContent = state.highScore;

    drawSnakeFrame();

    function spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * (xMax - 2) + 1) * box,
                y: Math.floor(Math.random() * (yMax - 2) + 1) * box
            };
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    function drawSnakeFrame() {
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth   = 1;
        ctx.strokeStyle = 'rgba(15,56,15,0.1)';
        for (let x = 0; x < canvas.width;  x += box) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += box) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y);  ctx.stroke(); }

        snake.forEach(s => { ctx.fillStyle = '#0f380f'; ctx.fillRect(s.x+1, s.y+1, box-2, box-2); });
        ctx.fillStyle = '#306230';
        ctx.fillRect(food.x+2, food.y+2, box-4, box-4);

        if (!started) {
            ctx.fillStyle    = 'rgba(15,56,15,0.7)';
            ctx.fillRect(0, canvas.height/2 - 14, canvas.width, 22);
            ctx.fillStyle    = '#9bbc0f';
            ctx.font         = '7px "Press Start 2P"';
            ctx.textAlign    = 'center';
            ctx.fillText('PRESS A / ENTER TO START', canvas.width/2, canvas.height/2);
        }
    }

    function draw() {
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth   = 1;
        ctx.strokeStyle = 'rgba(15,56,15,0.1)';
        for (let x = 0; x < canvas.width;  x += box) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += box) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y);  ctx.stroke(); }

        snake.forEach(s => { ctx.fillStyle = '#0f380f'; ctx.fillRect(s.x+1, s.y+1, box-2, box-2); });
        ctx.fillStyle = '#306230';
        ctx.fillRect(food.x+2, food.y+2, box-4, box-4);

        if (!d) return;

        let hx = snake[0].x + (d==='LEFT'?-box : d==='RIGHT'?box : 0);
        let hy = snake[0].y + (d==='UP'  ?-box : d==='DOWN' ?box : 0);

        if (hx < 0 || hx >= canvas.width || hy < 0 || hy >= canvas.height || collision({x:hx,y:hy}, snake)) {
            clearInterval(gameInterval); snakeGame = null;
            removeGameListener('snake', document, 'keydown');
            if (score > state.highScore) { state.highScore = score; saveState(); }
            sounds.back();
            showGameOver(`GAME OVER\nSCORE: ${score}\nGEMS: +${score*5}`, initSnake);
            return;
        }

        if (hx === food.x && hy === food.y) {
            score++;
            addGems(5);
            if(window.trackQuest) trackQuest('snake', 1);
            food = spawnFood();
            sounds.select();
        } else {
            snake.pop();
        }

        snake.unshift({x:hx, y:hy});
        document.getElementById('score').textContent = score;
    }

    function collision(head, arr) {
        return arr.some(s => s.x === head.x && s.y === head.y);
    }

    addGameListener('snake', document, 'keydown', (e) => {
        if ((e.key===' '||e.key==='a'||e.key==='z'||e.key==='Enter') && !started) {
            started = true;
            gameInterval = setInterval(draw, 180);
            snakeGame = gameInterval;
        }
        if (e.key==='ArrowLeft'  && d!=='RIGHT') d='LEFT';
        if (e.key==='ArrowUp'    && d!=='DOWN')  d='UP';
        if (e.key==='ArrowRight' && d!=='LEFT')  d='RIGHT';
        if (e.key==='ArrowDown'  && d!=='UP')    d='DOWN';
    });
}

// ============================================================
// FLAPPY BIRD
// ============================================================
let flappyRAF = null;
function initFlappy() {
    if (flappyRAF) { cancelAnimationFrame(flappyRAF); flappyRAF = null; }

    const canvas = document.getElementById('flappyCanvas');
    const ctx    = canvas.getContext('2d');

    let bird        = { x:50, y:canvas.height/2, velocity:0, size:8 };
    let pipes       = [];
    let score       = 0;
    let gameRunning = false;
    let frameCount  = 0;

    const gravity   = 0.35;
    const jumpPower = -6;
    const pipeW     = 30;
    const pipeGap   = 80;
    const pipeSpeed = 1.8;

    document.getElementById('flappyScore').textContent = score;
    drawStartScreen();

    function drawStartScreen() {
        ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#228b22'; ctx.fillRect(0,canvas.height-20,canvas.width,20);
        ctx.fillStyle = '#000';
        ctx.font = '7px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('PRESS A TO START', canvas.width/2, canvas.height/2);
    }

    addGameListener('flappy', document, 'keydown', (e) => {
        if (e.key===' '||e.key==='ArrowUp'||e.key==='a'||e.key==='z'||e.key==='Enter') {
            if (!gameRunning) { gameRunning = true; gameLoop(); }
            bird.velocity = jumpPower;
            sounds.click();
        }
    });

    function gameLoop() {
        if (!gameRunning) return;

        ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,canvas.width,canvas.height);

        bird.velocity += gravity;
        bird.y        += bird.velocity;

        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI*2); ctx.fill();
        // Wing
        ctx.fillStyle = '#ffa500';
        ctx.beginPath(); ctx.ellipse(bird.x-4, bird.y+2, 5, 3, 0.4, 0, Math.PI*2); ctx.fill();

        frameCount++;
        if (frameCount % 80 === 0) {
            const min = 40, max = canvas.height - pipeGap - 40;
            const top = Math.floor(Math.random()*(max-min)+min);
            pipes.push({x:canvas.width, top, scored:false});
        }

        ctx.fillStyle = '#228b22';
        for (let i = pipes.length-1; i >= 0; i--) {
            const p = pipes[i];
            p.x -= pipeSpeed;

            // Draw pipes with caps
            ctx.fillRect(p.x, 0, pipeW, p.top);
            ctx.fillRect(p.x, p.top+pipeGap, pipeW, canvas.height);
            ctx.fillStyle = '#2ea82e';
            ctx.fillRect(p.x-2, p.top-8, pipeW+4, 8);
            ctx.fillRect(p.x-2, p.top+pipeGap, pipeW+4, 8);
            ctx.fillStyle = '#228b22';

            if (bird.x+bird.size > p.x && bird.x-bird.size < p.x+pipeW) {
                if (bird.y-bird.size < p.top || bird.y+bird.size > p.top+pipeGap) {
                    endFlappy(); return;
                }
            }

            if (!p.scored && p.x+pipeW < bird.x) {
                p.scored = true; score++; addGems(2);
                if(window.trackQuest) trackQuest('flappy', 1);
                document.getElementById('flappyScore').textContent = score;
                sounds.select();
            }

            if (p.x+pipeW < 0) pipes.splice(i,1);
        }

        // Ground
        ctx.fillStyle = '#228b22'; ctx.fillRect(0, canvas.height-10, canvas.width, 10);

        if (bird.y-bird.size < 0 || bird.y+bird.size > canvas.height-10) { endFlappy(); return; }

        flappyRAF = requestAnimationFrame(gameLoop);
    }

    function endFlappy() {
        gameRunning = false;
        cancelAnimationFrame(flappyRAF); flappyRAF = null;
        removeGameListener('flappy', document, 'keydown');
        sounds.back();
        showGameOver(`GAME OVER\nSCORE: ${score}\nGEMS: +${score*2}`, initFlappy);
    }
}

// ============================================================
// BREAKOUT
// ============================================================
let breakoutRAF = null;
function initBreakout() {
    if (breakoutRAF) { cancelAnimationFrame(breakoutRAF); breakoutRAF = null; }

    const canvas = document.getElementById('breakoutCanvas');
    const ctx    = canvas.getContext('2d');

    const COLS       = 8;
    const ROWS       = 5;
    const brickW     = (canvas.width - (COLS+1)*3) / COLS;
    const brickH     = 12;
    const paddle     = { w:50, h:8, x:canvas.width/2-25, speed:5 };
    const ball       = { x:canvas.width/2, y:canvas.height-40, dx:2.5, dy:-2.5, r:4 };
    let bricks       = [];
    let score        = 0;
    let gameRunning  = false;
    let keys         = {};

    for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
        bricks.push({ x: 3 + c*(brickW+3), y: 28 + r*(brickH+4), active:true, row:r });
    }

    document.getElementById('breakoutScore').textContent = score;

    addGameListener('breakoutKey', document, 'keydown', (e) => {
        keys[e.key] = true;
        if ((e.key===' '||e.key==='a'||e.key==='z'||e.key==='Enter') && !gameRunning) {
            gameRunning = true;
            gameLoop();
        }
    });
    addGameListener('breakoutKeyUp', document, 'keyup', (e) => { keys[e.key] = false; });

    // Draw start screen
    ctx.fillStyle='#0f380f'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#9bbc0f'; ctx.font='7px "Press Start 2P"'; ctx.textAlign='center';
    ctx.fillText('PRESS A TO START', canvas.width/2, canvas.height/2);

    function gameLoop() {
        if (!gameRunning) return;

        ctx.fillStyle = '#0f380f'; ctx.fillRect(0,0,canvas.width,canvas.height);

        // Paddle movement (smooth)
        if (keys['ArrowLeft'])  paddle.x = Math.max(0, paddle.x - paddle.speed);
        if (keys['ArrowRight']) paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.speed);

        // Ball
        ball.x += ball.dx; ball.y += ball.dy;

        if (ball.x-ball.r < 0 || ball.x+ball.r > canvas.width)  ball.dx *= -1;
        if (ball.y-ball.r < 0)                                    ball.dy *= -1;

        // Paddle collision
        if (ball.y+ball.r > canvas.height-paddle.h-2 &&
            ball.x > paddle.x && ball.x < paddle.x+paddle.w &&
            ball.dy > 0) {
            const hit  = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
            ball.dx    = hit * 3.5;
            ball.dy    = -Math.abs(ball.dy);
            sounds.click();
        }

        // Brick collision
        for (const b of bricks) {
            if (!b.active) continue;
            if (ball.x+ball.r > b.x && ball.x-ball.r < b.x+brickW &&
                ball.y+ball.r > b.y && ball.y-ball.r < b.y+brickH) {
                ball.dy *= -1; b.active = false;
                score++; addGems(1);
                if(window.trackQuest) trackQuest('breakout', 1);
                document.getElementById('breakoutScore').textContent = score;
                sounds.select();
                break; // one brick per frame
            }
        }

        // Draw bricks
        const rowColors = ['#ff6347','#ff8c00','#ffd700','#adff2f','#00ced1'];
        bricks.forEach(b => {
            if (!b.active) return;
            ctx.fillStyle = rowColors[b.row % rowColors.length];
            ctx.fillRect(b.x, b.y, brickW, brickH);
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(b.x, b.y, brickW, 3);
        });

        // Draw paddle
        ctx.fillStyle = '#9bbc0f';
        ctx.fillRect(paddle.x, canvas.height-paddle.h-2, paddle.w, paddle.h);

        // Draw ball
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();

        // Ball lost
        if (ball.y+ball.r > canvas.height) {
            gameRunning = false;
            removeGameListener('breakoutKey',   document, 'keydown');
            removeGameListener('breakoutKeyUp', document, 'keyup');
            sounds.back();
            showGameOver(`GAME OVER\nSCORE: ${score}`, initBreakout);
            return;
        }

        // Win
        if (bricks.every(b => !b.active)) {
            gameRunning = false;
            removeGameListener('breakoutKey',   document, 'keydown');
            removeGameListener('breakoutKeyUp', document, 'keyup');
            addGems(50); sounds.launch();
            showGameOver(`YOU WIN!\n+50 GEMS!\nSCORE: ${score}`, initBreakout);
            return;
        }

        breakoutRAF = requestAnimationFrame(gameLoop);
    }
}

// ============================================================
// MEMORY MATCH
// ============================================================
let memoryGame = { cards: [], flipped: [], matched: [], canFlip: true };
let memoryFlipTimeout = null;

window.initMemory = function initMemory() {
    if (memoryFlipTimeout !== null) {
        clearTimeout(memoryFlipTimeout);
        memoryFlipTimeout = null;
    }

    const symbols = ['🎮','🎯','🎲','🎨','🎭','🎪','🎸','🎺'];
    const deck    = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    memoryGame    = { cards: deck, flipped: [], matched: [], canFlip: true };

    // FIX: only render if the grid element actually exists in the DOM yet
    if (document.getElementById('memoryGrid')) renderMemory();
}

function renderMemory() {
    const grid = document.getElementById('memoryGrid');
    if (!grid) return; // FIX: guard against missing element
    grid.innerHTML = '';
    memoryGame.cards.forEach((symbol, i) => {
        const isMatched = memoryGame.matched.includes(i);
        const isFlipped = memoryGame.flipped.includes(i) || isMatched;

        const card = document.createElement('div');
        card.style.cssText = `
            width:38px; height:38px;
            background:${isMatched ? '#2a6e2a' : isFlipped ? 'var(--gb-screen)' : 'var(--gb-text)'};
            border-radius:5px; cursor:${isMatched ? 'default' : 'pointer'};
            display:flex; align-items:center; justify-content:center;
            font-size:${isFlipped ? '20px' : '14px'};
            color:${isFlipped ? 'inherit' : 'var(--gb-screen)'};
            transition:background 0.2s;
            border: 1px solid rgba(255,255,255,0.1);
            user-select:none;
        `;
        card.textContent = isFlipped ? symbol : '?';

        // FIX: reference via window so it works regardless of scope
        if (!isMatched) {
            card.onclick = () => window.flipCard(i);
        }

        grid.appendChild(card);
    });

    document.getElementById('memoryScore').textContent = memoryGame.matched.length / 2;
}

window.flipCard = function flipCard(i) {
    if (!memoryGame.canFlip || memoryGame.flipped.includes(i) ||
        memoryGame.matched.includes(i) || memoryGame.flipped.length >= 2) return;

    memoryGame.flipped.push(i);
    sounds.click();
    renderMemory();

    if (memoryGame.flipped.length === 2) {
        memoryGame.canFlip = false;
        const [a, b] = memoryGame.flipped;

        if (memoryGame.cards[a] === memoryGame.cards[b]) {
            memoryGame.matched.push(a, b);
            memoryGame.flipped  = [];
            memoryGame.canFlip  = true;
            addGems(3); sounds.select();
            renderMemory();

            if (memoryGame.matched.length === memoryGame.cards.length) {
                setTimeout(() => {
                    addGems(20); sounds.launch();
                    showGameOver('YOU WIN!\n+20 GEMS!', initMemory);
                }, 300);
            }
        } else {
            memoryFlipTimeout = setTimeout(() => {
                memoryFlipTimeout = null;
                memoryGame.flipped = [];
                memoryGame.canFlip = true;
                renderMemory();
            }, 700);
        }
    }
}

// ============================================================
// TETRIS
// ============================================================
let tetrisRAF      = null;
let tetrisDropInt  = null;

function initTetris() {
    // Clean up previous session
    if (tetrisRAF)     { cancelAnimationFrame(tetrisRAF); tetrisRAF = null; }
    if (tetrisDropInt) { clearInterval(tetrisDropInt);    tetrisDropInt = null; }
    removeGameListener('tetris', document, 'keydown');

    const canvas = document.getElementById('tetrisCanvas');
    const ctx    = canvas.getContext('2d');

    const ROWS  = 20, COLS = 12, BS = Math.floor(canvas.width / COLS);
    canvas.height = ROWS * BS;

    const SHAPES = [
        [[1,1,1,1]],
        [[1,1],[1,1]],
        [[0,1,0],[1,1,1]],
        [[1,0,0],[1,1,1]],
        [[0,0,1],[1,1,1]],
        [[0,1,1],[1,1,0]],
        [[1,1,0],[0,1,1]]
    ];
    const COLORS = ['#44cc44','#33aa33','#228822','#116611','#004400','#55ee55','#22ff22'];

    let board   = Array.from({length:ROWS}, () => Array(COLS).fill(0));
    let piece   = null, px = 0, py = 0, pc = 0;
    let score   = 0, lines = 0, level = 1;
    let running = false;

    document.getElementById('tetrisScore').textContent = score;
    document.getElementById('tetrisLines').textContent = lines;

    function newPiece() {
        const si = Math.floor(Math.random() * SHAPES.length);
        piece = SHAPES[si].map(r => [...r]);
        pc    = si;
        px    = Math.floor(COLS/2) - Math.floor(piece[0].length/2);
        py    = 0;
        if (collides()) { endTetris(); }
    }

    function collides(ox=0, oy=0, p=piece) {
        for (let y=0; y<p.length; y++) for (let x=0; x<p[y].length; x++) {
            if (!p[y][x]) continue;
            const nx=px+x+ox, ny=py+y+oy;
            if (nx<0||nx>=COLS||ny>=ROWS) return true;
            if (ny>=0 && board[ny][nx])   return true;
        }
        return false;
    }

    function merge() {
        piece.forEach((row,y) => row.forEach((v,x) => {
            if (v && py+y >= 0) board[py+y][px+x] = pc+1;
        }));
    }

    function clearLines() {
        let cleared = 0;
        for (let y=ROWS-1; y>=0; y--) {
            if (board[y].every(c => c)) {
                board.splice(y,1);
                board.unshift(Array(COLS).fill(0));
                cleared++; y++;
            }
        }
        if (cleared) {
            lines += cleared; score += cleared*100*level;
            level  = Math.floor(lines/10)+1;
            addGems(cleared*10); sounds.select();
            document.getElementById('tetrisScore').textContent = score;
            document.getElementById('tetrisLines').textContent = lines;
            // Update drop speed
            clearInterval(tetrisDropInt);
            tetrisDropInt = setInterval(drop, Math.max(100, 1000 - (level-1)*80));
        }
    }

    function rotatePiece() {
        const rotated = piece[0].map((_,i) => piece.map(r => r[i]).reverse());
        if (!collides(0,0,rotated)) { piece = rotated; sounds.click(); }
    }

    function drop() {
        if (!running) return;
        py++;
        if (collides()) { py--; merge(); clearLines(); newPiece(); }
    }

    function draw() {
        if (!running) return;

        ctx.fillStyle = '#0f380f';
        ctx.fillRect(0,0,canvas.width,canvas.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(15,56,15,0.4)'; ctx.lineWidth = 0.5;
        for (let x=0;x<COLS;x++) { ctx.beginPath(); ctx.moveTo(x*BS,0); ctx.lineTo(x*BS,canvas.height); ctx.stroke(); }
        for (let y=0;y<ROWS;y++) { ctx.beginPath(); ctx.moveTo(0,y*BS); ctx.lineTo(canvas.width,y*BS); ctx.stroke(); }

        // Board
        board.forEach((row,y) => row.forEach((v,x) => {
            if (v) {
                ctx.fillStyle = COLORS[v-1];
                ctx.fillRect(x*BS+1, y*BS+1, BS-2, BS-2);
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(x*BS+1, y*BS+1, BS-2, 3);
            }
        }));

        // Ghost piece
        let ghostY = 0;
        while (!collides(0, ghostY+1)) ghostY++;
        if (ghostY > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            piece.forEach((row,y) => row.forEach((v,x) => {
                if (v) ctx.fillRect((px+x)*BS+1, (py+ghostY+y)*BS+1, BS-2, BS-2);
            }));
        }

        // Active piece
        ctx.fillStyle = COLORS[pc];
        piece.forEach((row,y) => row.forEach((v,x) => {
            if (v) {
                ctx.fillRect((px+x)*BS+1, (py+y)*BS+1, BS-2, BS-2);
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.fillRect((px+x)*BS+1, (py+y)*BS+1, BS-2, 3);
                ctx.fillStyle = COLORS[pc];
            }
        }));

        tetrisRAF = requestAnimationFrame(draw);
    }

    function endTetris() {
        running = false;
        clearInterval(tetrisDropInt); tetrisDropInt = null;
        cancelAnimationFrame(tetrisRAF); tetrisRAF = null;
        removeGameListener('tetris', document, 'keydown');
        sounds.back();
        showGameOver(`GAME OVER\nSCORE: ${score}\nLINES: ${lines}`, initTetris);
    }

    addGameListener('tetris', document, 'keydown', (e) => {
        if (!running) return;
        if (e.key==='ArrowLeft')  { px--; if(collides()) px++; draw(); }
        if (e.key==='ArrowRight') { px++; if(collides()) px--; draw(); }
        if (e.key==='ArrowDown')  { drop(); draw(); }
        if (e.key==='ArrowUp')    { rotatePiece(); draw(); }
        if (e.key===' ') {          // Hard drop
            while (!collides(0,1)) py++;
            drop(); draw();
        }
    });

    // Start
    running = true;
    newPiece();
    draw();
    tetrisDropInt = setInterval(drop, Math.max(100, 1000 - (level-1)*80));
}

// ============================================================
// MINESWEEPER
// ============================================================
function initMines() {
    if (window.minesTimer) { clearInterval(window.minesTimer); window.minesTimer = null; }

    const grid     = document.getElementById('minesGrid');
    const timeEl   = document.getElementById('minesTime');
    const flagsEl  = document.getElementById('minesFlags');
    const statusEl = document.getElementById('minesStatus');

    const SIZE  = 10;
    const BOMBS = 10;
    let flags      = BOMBS;
    let time       = 0;
    let gameActive = true;
    let firstClick = true;
    let board      = Array.from({length:SIZE*SIZE}, () => ({
        isBomb:false, isRevealed:false, isFlagged:false, neighborCount:0
    }));

    statusEl.textContent = '';
    statusEl.style.color = '';
    timeEl.textContent   = 'TIME: 0';
    flagsEl.textContent  = `FLAGS: ${flags}`;

    function placeBombs(safeIdx) {
        let placed = 0;
        while (placed < BOMBS) {
            const idx = Math.floor(Math.random() * SIZE*SIZE);
            if (!board[idx].isBomb && idx !== safeIdx) {
                board[idx].isBomb = true; placed++;
            }
        }
        for (let i=0; i<board.length; i++) {
            if (board[i].isBomb) continue;
            const row=Math.floor(i/SIZE), col=i%SIZE;
            let cnt=0;
            for (let r=-1;r<=1;r++) for (let c=-1;c<=1;c++) {
                const nr=row+r, nc=col+c;
                if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE&&board[nr*SIZE+nc].isBomb) cnt++;
            }
            board[i].neighborCount = cnt;
        }
    }

    function render() {
        grid.innerHTML='';
        board.forEach((cell,idx) => {
            const div = document.createElement('div');
            div.style.cssText=`
                background:${cell.isRevealed ? '#8bac0f' : '#0f380f'};
                border:1px solid #306230;
                display:flex; align-items:center; justify-content:center;
                font-size:7px; cursor:pointer; user-select:none;
                transition:background 0.1s;
            `;
            const numColors = ['','#00f','#008000','#f00','#000080','#800000','#008080','#000','#808080'];

            if (cell.isRevealed) {
                if (cell.isBomb) { div.textContent='💣'; div.style.background='#c00'; }
                else if (cell.neighborCount > 0) {
                    div.textContent  = cell.neighborCount;
                    div.style.color  = numColors[cell.neighborCount] || '#000';
                    div.style.fontWeight = 'bold';
                }
            } else {
                div.textContent = cell.isFlagged ? '🚩' : '';
            }

            div.onclick = () => reveal(idx);
            div.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(idx); };

            let pressTimer;
            div.ontouchstart = () => { pressTimer = setTimeout(()=>toggleFlag(idx), 500); };
            div.ontouchend   = () => clearTimeout(pressTimer);

            grid.appendChild(div);
        });
        flagsEl.textContent = `FLAGS: ${flags}`;
    }

    function reveal(idx) {
        if (!gameActive || board[idx].isFlagged || board[idx].isRevealed) return;

        // Place bombs on first click, guaranteeing safe first cell
        if (firstClick) { placeBombs(idx); firstClick = false; }

        board[idx].isRevealed = true;

        if (board[idx].isBomb) { gameOver(false); return; }

        if (board[idx].neighborCount === 0) {
            const queue = [idx];
            while (queue.length) {
                const curr=queue.pop(), row=Math.floor(curr/SIZE), col=curr%SIZE;
                for (let r=-1;r<=1;r++) for (let c=-1;c<=1;c++) {
                    const nr=row+r, nc=col+c;
                    if (nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE) {
                        const ni=nr*SIZE+nc;
                        if (!board[ni].isRevealed && !board[ni].isFlagged) {
                            board[ni].isRevealed=true;
                            if (board[ni].neighborCount===0 && !board[ni].isBomb) queue.push(ni);
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
        if (!gameActive || board[idx].isRevealed) return;
        if (!board[idx].isFlagged && flags > 0) { board[idx].isFlagged=true; flags--; }
        else if (board[idx].isFlagged)           { board[idx].isFlagged=false; flags++; }
        sounds.select();
        render();
    }

    function checkWin() {
        if (board.filter(c=>!c.isBomb).every(c=>c.isRevealed)) gameOver(true);
    }

    function gameOver(win) {
        gameActive=false;
        clearInterval(window.minesTimer); window.minesTimer=null;
        if (win) {
            statusEl.textContent='YOU WIN! +20 💎'; statusEl.style.color='#0f0';
            sounds.launch(); addGems(20);
        } else {
            statusEl.textContent='GAME OVER'; statusEl.style.color='#f00';
            board.forEach(c => { if(c.isBomb) c.isRevealed=true; });
            sounds.back();
            render();
        }
    }

    window.minesTimer = setInterval(() => {
        if (gameActive) { time++; timeEl.textContent=`TIME: ${time}`; }
    }, 1000);

    render();
}

// ============================================================
// 2048
// ============================================================
function init2048() {
    const gridEl  = document.getElementById('2048Grid');
    const scoreEl = document.getElementById('2048Score');

    let board = Array(16).fill(0);
    let score = 0;
    let best  = parseInt(localStorage.getItem('2048best')) || 0;

    spawn(); spawn(); render();

    addGameListener('2048', document, 'keydown', (e) => {
        if (!document.getElementById('2048Screen') ||
            !document.getElementById('2048Screen').classList.contains('active')) return;

        const moves = {
            'ArrowLeft' : moveLeft,
            'ArrowRight': moveRight,
            'ArrowUp'   : moveUp,
            'ArrowDown' : moveDown
        };
        if (!moves[e.key]) return;
        e.preventDefault();

        const moved = moves[e.key]();
        if (moved) { spawn(); render(); check2048(); sounds.select(); }
    });

    // Swipe
    let tx=0, ty=0;
    gridEl.ontouchstart = (e) => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; e.preventDefault(); };
    gridEl.ontouchend   = (e) => {
        const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
        const key = Math.abs(dx)>Math.abs(dy)
            ? (dx>0?'ArrowRight':'ArrowLeft')
            : (dy>0?'ArrowDown':'ArrowUp');
        document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
        e.preventDefault();
    };

    function spawn() {
        const empty = board.map((v,i) => v===0?i:null).filter(v=>v!==null);
        if (empty.length) board[empty[Math.floor(Math.random()*empty.length)]] = Math.random()<0.9?2:4;
    }

    function render() {
        gridEl.innerHTML='';
        board.forEach(val => {
            const cell = document.createElement('div');
            cell.style.cssText=`
                display:flex; align-items:center; justify-content:center;
                font-weight:bold; border-radius:3px; font-size:${val>999?'8px':'10px'};
                background:${getColor(val)};
                color:${val>4?'#fff':'#776e65'};
                font-family:'Press Start 2P',monospace;
            `;
            cell.textContent = val || '';
            gridEl.appendChild(cell);
        });
        if (score > best) { best=score; localStorage.setItem('2048best', best); }
        scoreEl.textContent = `SCORE: ${score}  BEST: ${best}`;
    }

    function getColor(v) {
        const c = {
            0:'rgba(15,56,15,0.15)', 2:'#eee4da', 4:'#ede0c8', 8:'#f2b179',
            16:'#f59563', 32:'#f67c5f', 64:'#f65e3b', 128:'#edcf72',
            256:'#edcc61', 512:'#edc850', 1024:'#edc53f', 2048:'#edc22e'
        };
        return c[v] || '#3c3a32';
    }

    function rot2048(times) {
        while (times--) {
            const n=[];
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) n[c*4+(3-r)]=board[r*4+c];
            board=n;
        }
    }

    function slideLeft() {
        let moved=false;
        for (let r=0;r<4;r++) {
            let row = board.slice(r*4,r*4+4).filter(v=>v);
            for (let i=0;i<row.length-1;i++) {
                if (row[i]===row[i+1]) {
                    row[i]*=2; score+=row[i];
                    row.splice(i+1,1); moved=true;
                }
            }
            while (row.length<4) row.push(0);
            for (let c=0;c<4;c++) { if(board[r*4+c]!==row[c]) moved=true; board[r*4+c]=row[c]; }
        }
        return moved;
    }

    function moveLeft()  { return slideLeft(); }
    function moveRight() { rot2048(2); const m=slideLeft(); rot2048(2); return m; }
    function moveUp()    { rot2048(3); const m=slideLeft(); rot2048(1); return m; }
    function moveDown()  { rot2048(1); const m=slideLeft(); rot2048(3); return m; }

    function check2048() {
        if (board.includes(2048)) {
            addGems(100); sounds.launch();
            showGameOver('2048!\nYOU WIN!\n+100 GEMS!', init2048);
            return;
        }
        if (!board.includes(0)) {
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
                const i=r*4+c;
                if (c<3&&board[i]===board[i+1]) return;
                if (r<3&&board[i]===board[i+4]) return;
            }
            sounds.back();
            showGameOver(`GAME OVER\nSCORE: ${score}`, init2048);
        }
    }
}

// ============================================================
// EXPORTS
// ============================================================
window.initSnake    = initSnake;
window.initFlappy   = initFlappy;
window.initBreakout = initBreakout;
// initMemory and flipCard already assigned to window at definition
window.initTetris   = initTetris;
window.initMines    = initMines;
window.init2048     = init2048;