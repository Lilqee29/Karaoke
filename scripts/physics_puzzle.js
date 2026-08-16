// ========== PHYSICS PUZZLE GAME v2.0 ==========
// 50 levels, 3 difficulties, D-pad/A/B controls, rotatable objects, card puzzles

const PW = 300, PH = 240;
let pCtx, pCanvas;
let pLevel = 0, pMoves = 0, pStars = 0, pDifficulty = 'normal';
let pTool = 'ball', pToolAngle = 0; // angle for ramps/fans
let pRunning = false, pObjects = [], pBall = null, pGoal = null, pWalls = [];
let pAnimId = null, pCursorX = 150, pCursorY = 120;
let pSelectedIdx = -1; // selected placed object for rotation/deletion
let pMode = 'menu'; // menu, play, card, win

// ── Object types ────────────────────────────────────────────────────────
const OBJ_TYPES = {
    ball:       { name: '⚽ BALL',   color: '#9bbc0f', desc: 'Bouncy ball' },
    box:        { name: '📦 BOX',    color: '#8b4513', desc: 'Solid block' },
    ramp:       { name: '📐 RAMP',   color: '#666',    desc: 'Angled surface (A/B to rotate)' },
    trampoline: { name: '🟩 BOUNCE', color: '#00aa00', desc: 'Super bounce pad' },
    fan:        { name: '💨 FAN',    color: '#4488ff', desc: 'Blows ball sideways' },
    ice:        { name: '🧊 ICE',    color: '#88ccff', desc: 'Slippery surface' },
    portal:     { name: '🌀 PORTAL', color: '#aa44ff', desc: 'Teleports ball' },
    card:       { name: '🃏 CARD',   color: '#ffaa00', desc: 'Matches pair to open gate' },
};

// ── Physics constants per difficulty ────────────────────────────────────
const DIFF = {
    easy:   { gravity: 0.10, bounce: 0.7, friction: 0.995, maxObjects: 8 },
    normal: { gravity: 0.15, bounce: 0.6, friction: 0.99,  maxObjects: 6 },
    hard:   { gravity: 0.22, bounce: 0.5, friction: 0.985, maxObjects: 4 },
};

// ── 50 Levels ──────────────────────────────────────────────────────────
// { w: [[x,y,w,h]], goal: [x,y], ball: [x,y], hint, cardPairs?, gates? }
const LEVELS = [
    // === EASY (1-15) ===
    { w:[[0,230,300,10]], goal:[260,215], ball:[30,30], hint:'Place a ramp to guide the ball ⭐' },
    { w:[[0,230,300,10]], goal:[260,215], ball:[30,80], hint:'Ball is mid-air — catch it!' },
    { w:[[0,230,120,10],[180,230,120,10]], goal:[250,215], ball:[30,30], hint:'Bridge the gap with boxes' },
    { w:[[0,230,300,10]], goal:[150,215], ball:[30,30], hint:'Guide ball to the center star' },
    { w:[[0,230,300,10],[140,180,20,50]], goal:[250,215], ball:[30,30], hint:'Use a trampoline to bounce over!' },
    { w:[[0,230,80,10],[120,230,60,10],[200,230,100,10]], goal:[260,215], ball:[20,20], hint:'Multiple gaps — be creative!' },
    { w:[[0,230,300,10]], goal:[260,215], ball:[150,20], hint:'Ball drops from above' },
    { w:[[0,230,300,10],[0,0,300,10]], goal:[250,20], ball:[30,220], hint:'Bounce off the ceiling!' },
    { w:[[0,230,300,10],[60,200,80,10]], goal:[260,185], ball:[20,30], hint:'Step up to the platform' },
    { w:[[0,230,300,10],[120,160,60,10]], goal:[145,145], ball:[20,30], hint:'Reach the high platform' },
    { w:[[0,230,300,10],[100,190,100,10]], goal:[260,175], ball:[20,30], hint:'Long platform — need momentum' },
    { w:[[0,230,300,10]], goal:[270,215], ball:[20,100], hint:'Drop and roll!' },
    { w:[[0,230,300,10],[180,200,10,30]], goal:[260,185], ball:[20,30], hint:'Small wall — jump over it' },
    { w:[[0,230,300,10],[80,180,10,50],[200,180,10,50]], goal:[260,165], ball:[20,30], hint:'Two walls to clear' },
    { w:[[0,230,300,10]], goal:[260,215], ball:[20,200], hint:'Quick flip upward!' },

    // === MEDIUM (16-35) ===
    { w:[[0,230,300,10],[80,180,20,50],[180,130,20,100]], goal:[260,115], ball:[20,30], hint:'Zigzag climb' },
    { w:[[0,230,300,10],[0,0,300,10],[150,120,10,110]], goal:[260,20], ball:[30,220], hint:'Split room — find the gap' },
    { w:[[0,230,80,10],[140,230,160,10]], goal:[260,215], ball:[20,20], hint:'Wide gap — use fan to blow across' },
    { w:[[0,230,300,10],[60,170,60,10],[180,120,60,10]], goal:[210,105], ball:[20,30], hint:'Staircase up' },
    { w:[[0,230,300,10],[120,150,60,10]], goal:[145,135], ball:[200,20], hint:'Drop onto the platform' },
    { w:[[0,230,300,10],[0,0,100,10],[200,0,100,10]], goal:[150,10], ball:[30,220], hint:'Ceiling gaps — bounce through!' },
    { w:[[0,230,300,10],[100,200,100,10]], goal:[50,185], ball:[250,30], hint:'Go left!' },
    { w:[[0,230,300,10],[50,180,10,50],[150,140,10,90],[250,180,10,50]], goal:[270,215], ball:[20,30], hint:'Three walls — pick your path' },
    { w:[[0,230,300,10],[0,0,300,10]], goal:[150,20], ball:[20,220], hint:'Bounce between floors' },
    { w:[[0,230,300,10],[100,170,20,60],[200,120,20,110]], goal:[260,105], ball:[20,30], hint:'Increasing walls' },
    { w:[[0,230,300,10],[0,100,300,10]], goal:[260,85], ball:[20,220], hint:'Squeezed between floors' },
    { w:[[0,230,300,10],[80,180,10,50],[160,130,10,100],[240,80,10,150]], goal:[270,65], ball:[20,30], hint:'Tall walls — need trampoline' },
    { w:[[0,230,100,10],[200,230,100,10]], goal:[260,215], ball:[50,20], hint:'Drop through the gap' },
    { w:[[0,230,300,10],[150,200,10,30]], goal:[200,185], ball:[30,30], hint:'Curved path' },
    { w:[[0,230,300,10],[60,200,60,10],[180,160,60,10]], goal:[210,145], ball:[20,190], hint:'Step up right side' },
    { w:[[0,230,300,10],[0,0,300,10],[80,100,140,10]], goal:[40,10], ball:[20,220], hint:'Navigate the maze' },
    { w:[[0,230,300,10]], goal:[260,215], ball:[150,100], hint:'Free fall — guide the landing' },
    { w:[[0,230,300,10],[100,170,100,10]], goal:[50,155], ball:[250,30], hint:'Cross the platform left' },
    { w:[[0,230,300,10],[0,0,300,10],[50,120,10,110],[240,0,10,120]], goal:[150,10], ball:[20,220], hint:'Spiral path upward' },
    { w:[[0,230,300,10],[80,190,80,10],[200,150,80,10]], goal:[230,135], ball:[20,30], hint:'Alternating platforms' },

    // === HARD (36-50) ===
    { w:[[0,230,300,10],[0,0,300,10],[75,120,150,10]], goal:[260,20], ball:[20,220], hint:'Tiny gap at top' },
    { w:[[0,230,300,10],[50,180,10,50],[120,130,10,100],[190,80,10,150],[260,130,10,100]], goal:[270,215], ball:[20,30], hint:'Five walls — precision needed' },
    { w:[[0,230,300,10],[0,0,300,10],[100,80,100,10],[100,160,100,10]], goal:[50,10], ball:[250,220], hint:'Wind through the tunnel' },
    { w:[[0,230,300,10],[80,200,10,30],[160,160,10,70],[240,120,10,110]], goal:[270,105], ball:[20,100], hint:'Staggered walls from mid-height' },
    { w:[[0,230,300,10],[0,0,300,10]], goal:[150,20], ball:[150,220], hint:'Direct bounce up — timing!' },
    { w:[[0,230,300,10],[60,190,10,40],[120,150,10,80],[180,110,10,120],[240,70,10,160]], goal:[270,55], ball:[20,30], hint:'Staircase of walls' },
    { w:[[0,230,80,10],[140,200,20,30],[220,230,80,10]], goal:[260,215], ball:[20,20], hint:'Precision drop through gap' },
    { w:[[0,230,300,10],[0,0,300,10],[0,120,120,10],[180,120,120,10]], goal:[150,10], ball:[20,220], hint:'Middle barrier with gap' },
    { w:[[0,230,300,10],[40,180,40,10],[120,140,40,10],[200,100,40,10]], goal:[220,85], ball:[10,30], hint:'Ascending steps — no room for error' },
    { w:[[0,230,300,10],[150,0,10,100]], goal:[200,10], ball:[30,220], hint:'Split room — go right' },
    { w:[[0,230,300,10],[0,0,300,10],[60,80,60,10],[180,160,60,10]], goal:[210,10], ball:[30,220], hint:'Zigzag between ceilings' },
    { w:[[0,230,300,10],[100,200,100,10]], goal:[150,185], ball:[30,30], hint:'Tight space above platform' },
    { w:[[0,230,300,10],[0,0,300,10],[75,60,150,10],[75,180,150,10]], goal:[260,10], ball:[20,220], hint:'Narrow horizontal tunnel' },
    { w:[[0,230,300,10],[50,190,10,40],[100,150,10,80],[150,110,10,120],[200,70,10,160],[250,110,10,120]], goal:[270,215], ball:[20,30], hint:'Five staggered walls' },
    { w:[[0,230,300,10],[0,0,300,10],[100,100,100,10]], goal:[50,10], ball:[250,220], hint:'Mirror the ball path' },
];

// ── Card Puzzle Levels (special) ────────────────────────────────────────
const CARD_LEVELS = [
    { pairs: 3, w:[[0,230,300,10],[100,150,100,10]], goal:[260,135], ball:[20,30], hint:'Match 3 card pairs to open the gate!' },
    { pairs: 4, w:[[0,230,300,10],[80,180,10,50],[200,180,10,50]], goal:[260,215], ball:[20,30], hint:'Match 4 pairs! Cards teleport the ball' },
    { pairs: 5, w:[[0,230,300,10],[0,0,300,10],[150,120,10,110]], goal:[260,20], ball:[20,220], hint:'Match 5 pairs to unlock the path!' },
];

// ── Card state ──────────────────────────────────────────────────────────
let cardDeck = [], cardFlipped = [], cardMatched = [], cardPairsNeeded = 0;

// ══════════════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════════════
function physInit() {
    pCanvas = document.getElementById('physCanvas');
    if(!pCanvas) return;
    pCtx = pCanvas.getContext('2d');
    pCanvas.width = PW; pCanvas.height = PH;
    pCanvas.onclick = physClick;
    pMode = 'menu';
    physDrawMenu();
    physSetupControls();
}

// ── D-pad / A / B Controls ──────────────────────────────────────────────
function physSetupControls() {
    // These are called by the gameboy D-pad/A/B system
    window.physDpad = function(dir) {
        if(pMode !== 'play') return;
        const speed = 8;
        if(dir === 'up')    pCursorY = Math.max(10, pCursorY - speed);
        if(dir === 'down')  pCursorY = Math.min(PH - 10, pCursorY + speed);
        if(dir === 'left')  pCursorX = Math.max(10, pCursorX - speed);
        if(dir === 'right') pCursorX = Math.min(PW - 10, pCursorX + speed);
        physDraw();
    };
    window.physBtnA = function() {
        if(pMode === 'menu') { pMode = 'play'; physLoadLevel(pLevel); return; }
        if(pMode === 'card') { physCardClick(); return; }
        if(pMode !== 'play' || pRunning) return;
        // Place object at cursor
        physPlaceAt(pCursorX, pCursorY);
    };
    window.physBtnB = function() {
        if(pMode !== 'play') return;
        if(pRunning) return;
        // B = rotate selected object OR rotate tool angle
        if(pSelectedIdx >= 0 && pObjects[pSelectedIdx]) {
            pObjects[pSelectedIdx].angle = ((pObjects[pSelectedIdx].angle || 0) + 45) % 360;
            pSelectedIdx = -1;
        } else {
            pToolAngle = (pToolAngle + 45) % 360;
        }
        physDraw();
    };
    window.physBtnSelect = function() {
        if(pMode !== 'play') return;
        // Cycle tool
        const tools = Object.keys(OBJ_TYPES);
        const idx = tools.indexOf(pTool);
        pTool = tools[(idx + 1) % tools.length];
        pSelectedIdx = -1;
        physDraw();
    };
    window.physBtnStart = function() {
        if(pMode === 'menu') { pMode = 'play'; physLoadLevel(pLevel); return; }
        if(pMode !== 'play') return;
        if(pRunning) { physReset(); } else { physPlay(); }
    };
}

// ══════════════════════════════════════════════════════════════════════
// MENU
// ══════════════════════════════════════════════════════════════════════
function physDrawMenu() {
    if(!pCtx) return;
    const ctx = pCtx;
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PW, PH);
    
    // Title
    ctx.fillStyle = '#9bbc0f';
    ctx.font = 'bold 14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PHYSICS PUZZLE', PW/2, 40);
    
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('v2.0 — 50 LEVELS', PW/2, 55);
    
    // Difficulty selector
    const diffs = ['easy', 'normal', 'hard'];
    const diffY = 85;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('DIFFICULTY', PW/2, diffY);
    
    diffs.forEach((d, i) => {
        const x = 50 + i * 90;
        const selected = d === pDifficulty;
        ctx.fillStyle = selected ? '#9bbc0f' : '#306230';
        ctx.fillRect(x - 30, diffY + 8, 60, 20);
        ctx.fillStyle = selected ? '#0f380f' : '#9bbc0f';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText(d.toUpperCase(), x, diffY + 22);
    });
    
    // Mode buttons
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('SELECT MODE', PW/2, 140);
    
    // Physics mode
    ctx.fillStyle = '#306230';
    ctx.fillRect(30, 150, 120, 30);
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('🧩 PUZZLE', 90, 170);
    
    // Card mode
    ctx.fillStyle = '#306230';
    ctx.fillRect(160, 150, 120, 30);
    ctx.fillStyle = '#9bbc0f';
    ctx.fillText('🃏 CARDS', 220, 170);
    
    // Level info
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('D-PAD: MOVE  A: SELECT  B: ROTATE', PW/2, 205);
    ctx.fillText('START: PLAY  SELECT: CHANGE TOOL', PW/2, 218);
    ctx.textAlign = 'left';
}

// ══════════════════════════════════════════════════════════════════════
// LEVEL LOADING
// ══════════════════════════════════════════════════════════════════════
function physLoadLevel(idx) {
    if(pAnimId) cancelAnimationFrame(pAnimId);
    pRunning = false; pObjects = []; pWalls = []; pMoves = 0;
    pSelectedIdx = -1; pToolAngle = 0;
    
    const diff = DIFF[pDifficulty];
    
    // Check if it's a card level
    if(idx >= 50) {
        const ci = idx - 50;
        if(ci < CARD_LEVELS.length) {
            physLoadCardLevel(ci);
            return;
        }
    }
    
    const level = LEVELS[idx % LEVELS.length];
    level.w.forEach(w => pWalls.push({ x:w[0], y:w[1], w:w[2], h:w[3] }));
    pBall = { x:level.ball[0], y:level.ball[1], vx:0, vy:0, r:6, placed:true };
    pGoal = { x:level.goal[0], y:level.goal[1] };
    pCursorX = level.ball[0]; pCursorY = level.ball[1];
    pMode = 'play';
    physUpdateUI();
    physDraw();
}

function physLoadCardLevel(idx) {
    const level = CARD_LEVELS[idx];
    level.w.forEach(w => pWalls.push({ x:w[0], y:w[1], w:w[2], h:w[3] }));
    pBall = { x:level.ball[0], y:level.ball[1], vx:0, vy:0, r:6, placed:true };
    pGoal = { x:level.goal[0], y:level.goal[1] };
    
    // Create card deck
    cardPairsNeeded = level.pairs;
    cardDeck = [];
    cardFlipped = [];
    cardMatched = [];
    const symbols = ['🍎','🍋','💎','🌟','🔥','❄️','🎵','🌙','☀️','🌈'];
    const chosen = symbols.slice(0, cardPairsNeeded);
    const deck = [...chosen, ...chosen]; // pairs
    // Shuffle
    for(let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    cardDeck = deck;
    pCursorX = 40; pCursorY = 60;
    pMode = 'card';
    physUpdateUI();
    physDrawCard();
}

// ══════════════════════════════════════════════════════════════════════
// PLACEMENT
// ══════════════════════════════════════════════════════════════════════
function physClick(e) {
    if(pMode === 'menu') {
        const rect = pCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (PW / rect.width);
        const y = (e.clientY - rect.top) * (PH / rect.height);
        // Check difficulty buttons
        const diffs = ['easy', 'normal', 'hard'];
        diffs.forEach((d, i) => {
            const bx = 50 + i * 90;
            if(x > bx-30 && x < bx+30 && y > 93 && y < 113) pDifficulty = d;
        });
        // Check mode buttons
        if(x > 30 && x < 150 && y > 150 && y < 180) { pMode = 'play'; physLoadLevel(pLevel); }
        if(x > 160 && x < 280 && y > 150 && y < 180) { physLoadCardLevel(0); }
        physDrawMenu();
        return;
    }
    if(pMode === 'card') {
        physCardClick(e);
        return;
    }
    if(pMode !== 'play' || pRunning) return;
    const rect = pCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (PW / rect.width);
    const y = (e.clientY - rect.top) * (PH / rect.height);
    pCursorX = x; pCursorY = y;
    physPlaceAt(x, y);
}

function physPlaceAt(x, y) {
    const diff = DIFF[pDifficulty];
    if(pObjects.length >= diff.maxObjects) return;
    
    // Don't place on ball or goal
    if(pBall && Math.hypot(x - pBall.x, y - pBall.y) < 20) return;
    if(pGoal && Math.hypot(x - pGoal.x, y - pGoal.y) < 20) return;
    
    pObjects.push({ type: pTool, x, y, angle: pToolAngle });
    pMoves++;
    physUpdateUI();
    physDraw();
}

// ══════════════════════════════════════════════════════════════════════
// PHYSICS SIMULATION
// ══════════════════════════════════════════════════════════════════════
function physPlay() {
    if(pRunning || !pBall) return;
    pRunning = true;
    pBall.vx = 0; pBall.vy = 0;
    physLoop();
}

function physReset() {
    if(pAnimId) cancelAnimationFrame(pAnimId);
    pRunning = false;
    physLoadLevel(pLevel);
}

function physLoop() {
    if(!pRunning) return;
    const diff = DIFF[pDifficulty];
    
    pBall.vy += diff.gravity;
    pBall.x += pBall.vx;
    pBall.y += pBall.vy;
    pBall.vx *= diff.friction;
    
    // Wall collisions
    pWalls.forEach(w => {
        if(pBall.x+pBall.r > w.x && pBall.x-pBall.r < w.x+w.w &&
           pBall.y+pBall.r > w.y && pBall.y-pBall.r < w.y+w.h) {
            const oL = (pBall.x+pBall.r)-w.x, oR = (w.x+w.w)-(pBall.x-pBall.r);
            const oT = (pBall.y+pBall.r)-w.y, oB = (w.y+w.h)-(pBall.y-pBall.r);
            const m = Math.min(oL,oR,oT,oB);
            if(m===oL){pBall.x=w.x-pBall.r;pBall.vx=-pBall.vx*diff.bounce;}
            else if(m===oR){pBall.x=w.x+w.w+pBall.r;pBall.vx=-pBall.vx*diff.bounce;}
            else if(m===oT){pBall.y=w.y-pBall.r;pBall.vy=-pBall.vy*diff.bounce;}
            else{pBall.y=w.y+w.h+pBall.r;pBall.vy=-pBall.vy*diff.bounce;}
        }
    });
    
    // Object interactions
    pObjects.forEach(obj => {
        const dx = pBall.x - obj.x, dy = pBall.y - obj.y;
        const dist = Math.hypot(dx, dy);
        const ang = (obj.angle || 0) * Math.PI / 180;
        
        if(obj.type === 'box' && dist < 12) {
            if(Math.abs(dx)>Math.abs(dy)){pBall.x=obj.x+(dx>0?12:-12);pBall.vx=-pBall.vx*diff.bounce;}
            else{pBall.y=obj.y+(dy>0?12:-12);pBall.vy=-pBall.vy*diff.bounce;}
        }
        else if(obj.type === 'ramp' && dist < 20) {
            // Ramp with rotation — push ball along angle
            const force = 0.4;
            pBall.vx += Math.cos(ang) * force;
            pBall.vy -= Math.sin(ang) * force * 0.5;
        }
        else if(obj.type === 'trampoline' && dist < 15 && pBall.vy > 0) {
            pBall.vy = -4.5;
            pBall.vx += (dx > 0 ? 0.3 : -0.3);
        }
        else if(obj.type === 'fan' && dist < 40) {
            // Fan blows in angle direction
            const strength = 0.08 * (1 - dist/40);
            pBall.vx += Math.cos(ang) * strength * 8;
            pBall.vy -= Math.sin(ang) * strength * 4;
        }
        else if(obj.type === 'ice' && dist < 15) {
            // Ice = slippery (reduce friction temporarily)
            pBall.vx *= 1.02;
            pBall.vy *= 1.01;
        }
        else if(obj.type === 'portal' && dist < 12) {
            // Teleport to random safe position
            pBall.x = 20 + Math.random() * (PW - 40);
            pBall.y = 20 + Math.random() * 60;
            pBall.vx = 0; pBall.vy = 0;
        }
        else if(obj.type === 'ball' && dist < 10) {
            pBall.vx += dx * 0.05;
            pBall.vy += dy * 0.05;
        }
    });
    
    // Boundaries
    if(pBall.x<pBall.r){pBall.x=pBall.r;pBall.vx=-pBall.vx*diff.bounce;}
    if(pBall.x>PW-pBall.r){pBall.x=PW-pBall.r;pBall.vx=-pBall.vx*diff.bounce;}
    if(pBall.y<pBall.r){pBall.y=pBall.r;pBall.vy=-pBall.vy*diff.bounce;}
    if(pBall.y>PH-pBall.r){pBall.y=PH-pBall.r;pBall.vy=-pBall.vy*diff.bounce;}
    
    // Goal check
    if(pGoal && Math.hypot(pBall.x-pGoal.x, pBall.y-pGoal.y) < 15) {
        pRunning = false;
        pStars++;
        physUpdateUI();
        physDraw();
        setTimeout(() => {
            if(pLevel < LEVELS.length + CARD_LEVELS.length - 1) {
                pLevel++;
                physLoadLevel(pLevel);
            } else {
                physDrawWin();
            }
        }, 600);
        return;
    }
    
    // Stop if barely moving
    if(Math.abs(pBall.vx)<0.01 && Math.abs(pBall.vy)<0.01 && pBall.y>=PH-pBall.r-2) {
        pBall.vx=0; pBall.vy=0;
    }
    
    physDraw();
    pAnimId = requestAnimationFrame(physLoop);
}

// ══════════════════════════════════════════════════════════════════════
// CARD PUZZLE
// ══════════════════════════════════════════════════════════════════════
function physCardClick(e) {
    let x, y;
    if(e) {
        const rect = pCanvas.getBoundingClientRect();
        x = (e.clientX - rect.left) * (PW / rect.width);
        y = (e.clientY - rect.top) * (PH / rect.height);
    } else {
        x = pCursorX; y = pCursorY;
    }
    
    // Grid layout for cards
    const cols = Math.min(cardDeck.length, 4);
    const rows = Math.ceil(cardDeck.length / cols);
    const cw = 50, ch = 50, ox = (PW - cols * cw) / 2, oy = 50;
    
    for(let i = 0; i < cardDeck.length; i++) {
        if(cardMatched.includes(i) || cardFlipped.includes(i)) continue;
        const col = i % cols, row = Math.floor(i / cols);
        const cx = ox + col * cw, cy = oy + row * ch;
        if(x >= cx && x < cx + cw - 4 && y >= cy && y < cy + ch - 4) {
            cardFlipped.push(i);
            if(cardFlipped.length === 2) {
                const [a, b] = cardFlipped;
                if(cardDeck[a] === cardDeck[b]) {
                    cardMatched.push(a, b);
                    cardFlipped = [];
                    // Check if all matched
                    if(cardMatched.length === cardDeck.length) {
                        pStars++;
                        setTimeout(() => {
                            pLevel++;
                            if(pLevel < LEVELS.length + CARD_LEVELS.length) {
                                physLoadLevel(pLevel);
                            } else {
                                physDrawWin();
                            }
                        }, 800);
                    }
                } else {
                    setTimeout(() => { cardFlipped = []; physDrawCard(); }, 600);
                }
                physDrawCard();
                return;
            }
            physDrawCard();
            return;
        }
    }
}

function physDrawCard() {
    if(!pCtx) return;
    const ctx = pCtx;
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PW, PH);
    
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🃏 CARD MATCH — PAIRS: ' + cardPairsNeeded, PW/2, 25);
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('MATCHED: ' + (cardMatched.length/2) + '/' + cardPairsNeeded, PW/2, 40);
    
    const cols = Math.min(cardDeck.length, 4);
    const cw = 50, ch = 50, ox = (PW - cols * cw) / 2, oy = 50;
    
    for(let i = 0; i < cardDeck.length; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const cx = ox + col * cw, cy = oy + row * ch;
        const matched = cardMatched.includes(i);
        const flipped = cardFlipped.includes(i);
        
        if(matched) {
            ctx.fillStyle = '#306230';
            ctx.fillRect(cx, cy, cw - 4, ch - 4);
            ctx.fillStyle = '#9bbc0f';
            ctx.font = '18px serif';
            ctx.fillText(cardDeck[i], cx + cw/2 - 2, cy + ch/2 + 6);
        } else if(flipped) {
            ctx.fillStyle = '#9bbc0f';
            ctx.fillRect(cx, cy, cw - 4, ch - 4);
            ctx.fillStyle = '#0f380f';
            ctx.font = '18px serif';
            ctx.fillText(cardDeck[i], cx + cw/2 - 2, cy + ch/2 + 6);
        } else {
            // Card back
            ctx.fillStyle = '#306230';
            ctx.fillRect(cx, cy, cw - 4, ch - 4);
            ctx.strokeStyle = '#9bbc0f';
            ctx.lineWidth = 1;
            ctx.strokeRect(cx + 2, cy + 2, cw - 8, ch - 8);
            ctx.fillStyle = '#9bbc0f';
            ctx.font = '14px serif';
            ctx.fillText('?', cx + cw/2 - 2, cy + ch/2 + 5);
        }
    }
    
    // Cursor highlight
    const cursorCol = Math.floor((pCursorX - ox) / cw);
    const cursorRow = Math.floor((pCursorY - oy) / ch);
    if(cursorCol >= 0 && cursorCol < cols && cursorRow >= 0) {
        const ci = cursorRow * cols + cursorCol;
        if(ci < cardDeck.length && !cardMatched.includes(ci) && !cardFlipped.includes(ci)) {
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.strokeRect(ox + cursorCol * cw - 1, oy + cursorRow * ch - 1, cw + 1, ch + 1);
        }
    }
    
    ctx.textAlign = 'left';
}

// ══════════════════════════════════════════════════════════════════════
// DRAWING
// ══════════════════════════════════════════════════════════════════════
function physUpdateUI() {
    const lvl = document.getElementById('physLevel');
    const mov = document.getElementById('physMoves');
    const stars = document.getElementById('physStars');
    if(lvl) lvl.textContent = pLevel + 1;
    if(mov) mov.textContent = pMoves + '/' + DIFF[pDifficulty].maxObjects;
    if(stars) stars.textContent = pStars;
}

function physDraw() {
    if(!pCtx || pMode !== 'play') return;
    const ctx = pCtx;
    const diff = DIFF[pDifficulty];
    
    // Background
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PW, PH);
    
    // Grid
    ctx.strokeStyle = 'rgba(155,188,15,0.08)';
    ctx.lineWidth = 0.5;
    for(let x=0;x<PW;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,PH);ctx.stroke();}
    for(let y=0;y<PH;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(PW,y);ctx.stroke();}
    
    // Walls
    ctx.fillStyle = '#306230';
    pWalls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
    
    // Objects
    pObjects.forEach((obj, i) => {
        const t = OBJ_TYPES[obj.type];
        const ang = (obj.angle || 0) * Math.PI / 180;
        
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(ang);
        
        if(obj.type === 'box') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(-8, -8, 16, 16);
        } else if(obj.type === 'ramp') {
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(-12, 8); ctx.lineTo(12, 8); ctx.lineTo(12, -8);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#999';
            ctx.stroke();
        } else if(obj.type === 'trampoline') {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(-12, -3, 24, 6);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-10, -2, 20, 2);
        } else if(obj.type === 'fan') {
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.moveTo(0, -8); ctx.lineTo(8, 8); ctx.lineTo(-8, 8);
            ctx.closePath(); ctx.fill();
            // Wind lines
            ctx.strokeStyle = 'rgba(68,136,255,0.5)';
            ctx.lineWidth = 1;
            for(let l = -6; l <= 6; l += 4) {
                ctx.beginPath(); ctx.moveTo(l, 10); ctx.lineTo(l, 20); ctx.stroke();
            }
        } else if(obj.type === 'ice') {
            ctx.fillStyle = '#88ccff';
            ctx.fillRect(-10, -3, 20, 6);
            ctx.strokeStyle = '#aaeeff';
            ctx.strokeRect(-10, -3, 20, 6);
        } else if(obj.type === 'portal') {
            ctx.fillStyle = '#aa44ff';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#dd88ff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if(obj.type === 'ball') {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Selection indicator
        if(i === pSelectedIdx) {
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 2;
            ctx.strokeRect(-14, -14, 28, 28);
        }
        
        ctx.restore();
    });
    
    // Goal
    if(pGoal) {
        ctx.fillStyle = '#ffdd00';
        ctx.font = '14px serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', pGoal.x, pGoal.y + 5);
        ctx.textAlign = 'left';
    }
    
    // Ball
    if(pBall && pBall.placed) {
        ctx.fillStyle = pRunning ? '#ff4444' : '#9bbc0f';
        ctx.beginPath();
        ctx.arc(pBall.x, pBall.y, pBall.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Cursor
    if(!pRunning) {
        ctx.strokeStyle = 'rgba(155,188,15,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(pCursorX - 10, pCursorY - 10, 20, 20);
        ctx.setLineDash([]);
        
        // Tool preview
        ctx.fillStyle = 'rgba(155,188,15,0.4)';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(OBJ_TYPES[pTool].name, pCursorX + 14, pCursorY - 4);
        if(pToolAngle !== 0) {
            ctx.fillText('ANG:' + pToolAngle + '°', pCursorX + 14, pCursorY + 8);
        }
    }
    
    // HUD
    ctx.fillStyle = 'rgba(15,56,15,0.8)';
    ctx.fillRect(0, 0, PW, 18);
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('LV' + (pLevel+1) + ' ' + pDifficulty.toUpperCase() + ' ⭐' + pStars + ' OBJ:' + pObjects.length + '/' + diff.maxObjects, 5, 12);
    
    // Hint
    if(!pRunning && pLevel < LEVELS.length) {
        ctx.fillStyle = 'rgba(155,188,15,0.5)';
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(LEVELS[pLevel].hint, PW/2, PH - 5);
        ctx.textAlign = 'left';
    }
}

function physDrawWin() {
    if(!pCtx) return;
    const ctx = pCtx;
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PW, PH);
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ALL CLEAR! 🎉', PW/2, PH/2 - 30);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('STARS: ' + pStars + '/' + (LEVELS.length + CARD_LEVELS.length), PW/2, PH/2);
    ctx.fillText('DIFFICULTY: ' + pDifficulty.toUpperCase(), PW/2, PH/2 + 15);
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('TAP TO PLAY AGAIN', PW/2, PH/2 + 35);
    ctx.textAlign = 'left';
    pMode = 'win';
    pCanvas.onclick = () => { pLevel = 0; pStars = 0; pMode = 'menu'; physDrawMenu(); pCanvas.onclick = physClick; };
}

// ══════════════════════════════════════════════════════════════════════
// APP LAUNCH
// ══════════════════════════════════════════════════════════════════════
window.initAdventure = function() {
    physInit();
    // Bind keyboard for physics puzzle
    physBindKeyboard();
};

// Keyboard listener — hooked into gameboy D-pad/A/B dispatching
let _physKeyHandler = null;
function physBindKeyboard() {
    // Remove old listener if any
    if(_physKeyHandler) document.removeEventListener('keydown', _physKeyHandler);
    _physKeyHandler = function(e) {
        if(typeof window.currentScreen === 'undefined' || currentScreen !== 'adventure') return;
        if(pMode === 'menu') {
            if(e.key === 'Enter' || e.key === 'z' || e.key === 'a') { pMode = 'play'; physLoadLevel(pLevel); e.preventDefault(); return; }
            if(e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const diffs = ['easy','normal','hard'];
                const ci = diffs.indexOf(pDifficulty);
                pDifficulty = e.key === 'ArrowUp' ? diffs[Math.max(0,ci-1)] : diffs[Math.min(2,ci+1)];
                physDrawMenu(); e.preventDefault(); return;
            }
            if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Toggle between puzzle/card mode indicator
                e.preventDefault(); return;
            }
            return;
        }
        if(pMode === 'card') {
            const cols = Math.min(cardDeck.length, 4);
            const cw = 50, ch = 50, ox = (PW - cols * cw) / 2, oy = 50;
            if(e.key === 'ArrowUp')    { pCursorY = Math.max(oy, pCursorY - ch); physDrawCard(); e.preventDefault(); }
            if(e.key === 'ArrowDown')  { pCursorY = Math.min(PH - 10, pCursorY + ch); physDrawCard(); e.preventDefault(); }
            if(e.key === 'ArrowLeft')  { pCursorX = Math.max(ox, pCursorX - cw); physDrawCard(); e.preventDefault(); }
            if(e.key === 'ArrowRight') { pCursorX = Math.min(PW - 10, pCursorX + cw); physDrawCard(); e.preventDefault(); }
            if(e.key === 'z' || e.key === 'a' || e.key === 'Enter') { physCardClick(); e.preventDefault(); }
            return;
        }
        if(pMode === 'play') {
            if(e.key === 'ArrowUp')    { window.physDpad('up'); e.preventDefault(); }
            if(e.key === 'ArrowDown')  { window.physDpad('down'); e.preventDefault(); }
            if(e.key === 'ArrowLeft')  { window.physDpad('left'); e.preventDefault(); }
            if(e.key === 'ArrowRight') { window.physDpad('right'); e.preventDefault(); }
            if(e.key === 'z' || e.key === 'a') { window.physBtnA(); e.preventDefault(); }
            if(e.key === 'x' || e.key === 'b') { window.physBtnB(); e.preventDefault(); }
            if(e.key === 'Enter') { window.physBtnStart(); e.preventDefault(); }
            if(e.key === 'Backspace' || e.key === 'Escape') { pMode = 'menu'; physDrawMenu(); e.preventDefault(); }
        }
    };
    document.addEventListener('keydown', _physKeyHandler);
}

// Hook into gameboy controls
window.onDpadPress = window.onDpadPress || function(dir) {
    if(currentScreen === 'adventure' && typeof window.physDpad === 'function') window.physDpad(dir);
};
window.onBtnAPress = window.onBtnAPress || function() {
    if(currentScreen === 'adventure' && typeof window.physBtnA === 'function') window.physBtnA();
};
window.onBtnBPress = window.onBtnBPress || function() {
    if(currentScreen === 'adventure' && typeof window.physBtnB === 'function') window.physBtnB();
};
