// ========== PHYSICS PUZZLE GAME ==========
// Place objects to guide the ball to the star ⭐

const PHYS_W = 300, PHYS_H = 240;
const GRAVITY = 0.15;
const BOUNCE = 0.6;
const FRICTION = 0.99;

let physCtx, physCanvas;
let physCurrentLevel = 0;
let physMoves = 0;
let physStars = 0;
let physTool = 'ball';
let physRunning = false;
let physObjects = [];
let physBall = null;
let physGoal = null;
let physWalls = [];
let physAnimId = null;

// Level definitions: { walls: [[x,y,w,h]], goal: [x,y], ball: [x,y], objects: [[type,x,y]], hint: '' }
const PHYS_LEVELS = [
    // Level 1: Simple drop
    { walls: [[0,230,300,10]], goal: [250,215], ball: [50,30], objects: [], hint: 'Place a ramp to guide the ball ⭐' },
    // Level 2: Gap to cross
    { walls: [[0,230,120,10],[180,230,120,10]], goal: [250,215], ball: [30,30], objects: [], hint: 'Bridge the gap with boxes!' },
    // Level 3: Wall to bounce over
    { walls: [[0,230,300,10],[140,180,20,50]], goal: [250,215], ball: [30,30], objects: [], hint: 'Use a trampoline to bounce over!' },
    // Level 4: Zigzag
    { walls: [[0,230,300,10],[80,180,20,50],[160,130,20,50],[240,180,20,50]], goal: [270,215], ball: [20,30], objects: [], hint: 'Navigate the maze!' },
    // Level 5: High platform
    { walls: [[0,230,300,10],[200,150,80,10]], goal: [230,135], ball: [30,30], objects: [], hint: 'Build up to reach the star!' },
    // Level 6: Multiple gaps
    { walls: [[0,230,80,10],[120,230,60,10],[200,230,100,10]], goal: [260,215], ball: [20,20], objects: [], hint: 'Bridge multiple gaps!' },
    // Level 7: Bounce house
    { walls: [[0,230,300,10],[0,0,300,10]], goal: [250,20], ball: [30,220], objects: [], hint: 'Bounce off the ceiling!' },
    // Level 8: Narrow passage
    { walls: [[0,230,300,10],[100,100,100,10],[100,160,100,10]], goal: [260,215], ball: [20,50], objects: [], hint: 'Thread through the gap!' },
    // Level 9: Staircase
    { walls: [[0,230,300,10],[50,200,60,10],[120,170,60,10],[190,140,60,10]], goal: [260,125], ball: [20,220], objects: [], hint: 'Climb the stairs!' },
    // Level 10: Trampoline park
    { walls: [[0,230,300,10]], goal: [150,20], ball: [20,220], objects: [], hint: 'Bounce to the top!' },
    // Level 11: The gauntlet
    { walls: [[0,230,300,10],[60,200,10,30],[120,170,10,30],[180,140,10,30],[240,110,10,30]], goal: [270,95], ball: [20,220], objects: [], hint: 'Past all the barriers!' },
    // Level 12: Final challenge
    { walls: [[0,230,300,10],[0,0,300,10],[150,100,10,130]], goal: [260,20], ball: [20,220], objects: [], hint: 'The ultimate puzzle!' },
];

function physInit() {
    physCanvas = document.getElementById('physCanvas');
    if(!physCanvas) return;
    physCtx = physCanvas.getContext('2d');
    physCanvas.width = PHYS_W;
    physCanvas.height = PHYS_H;
    physCanvas.onclick = physPlaceObject;
    physLoadLevel(physCurrentLevel);
}

function physLoadLevel(idx) {
    if(physAnimId) cancelAnimationFrame(physAnimId);
    physRunning = false;
    physObjects = [];
    physWalls = [];
    physMoves = 0;
    
    const level = PHYS_LEVELS[idx % PHYS_LEVELS.length];
    
    // Create walls
    level.walls.forEach(w => physWalls.push({ x: w[0], y: w[1], w: w[2], h: w[3] }));
    
    // Create ball
    physBall = { x: level.ball[0], y: level.ball[1], vx: 0, vy: 0, r: 6, placed: true };
    
    // Create goal
    physGoal = { x: level.goal[0], y: level.goal[1] };
    
    // Add any pre-placed objects
    level.objects.forEach(o => physObjects.push({ type: o[0], x: o[1], y: o[2] }));
    
    physUpdateUI();
    physDraw();
}

function physUpdateUI() {
    const lvl = document.getElementById('physLevel');
    const mov = document.getElementById('physMoves');
    const stars = document.getElementById('physStars');
    if(lvl) lvl.textContent = physCurrentLevel + 1;
    if(mov) mov.textContent = physMoves;
    if(stars) stars.textContent = physStars;
}

function physSelectTool(tool) {
    physTool = tool;
    document.querySelectorAll('#physToolbar button').forEach(b => b.style.background = '');
    const btn = document.getElementById('physBtn' + tool.charAt(0).toUpperCase() + tool.slice(1));
    if(btn) btn.style.background = '#306230';
}

function physPlaceObject(e) {
    if(physRunning) return;
    const rect = physCanvas.getBoundingClientRect();
    const scaleX = PHYS_W / rect.width;
    const scaleY = PHYS_H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Don't place on ball or goal
    if(physBall && Math.hypot(x - physBall.x, y - physBall.y) < 20) return;
    if(physGoal && Math.hypot(x - physGoal.x, y - physGoal.y) < 20) return;
    
    physObjects.push({ type: physTool, x, y });
    physMoves++;
    physUpdateUI();
    physDraw();
}

function physPlay() {
    if(physRunning || !physBall) return;
    physRunning = true;
    physBall.vx = 0;
    physBall.vy = 0;
    physLoop();
}

function physReset() {
    if(physAnimId) cancelAnimationFrame(physAnimId);
    physRunning = false;
    physLoadLevel(physCurrentLevel);
}

function physLoop() {
    if(!physRunning) return;
    
    // Apply gravity
    physBall.vy += GRAVITY;
    
    // Apply velocity
    physBall.x += physBall.vx;
    physBall.y += physBall.vy;
    
    // Friction
    physBall.vx *= FRICTION;
    
    // Wall collisions
    physWalls.forEach(w => {
        if(physBall.x + physBall.r > w.x && physBall.x - physBall.r < w.x + w.w &&
           physBall.y + physBall.r > w.y && physBall.y - physBall.r < w.y + w.h) {
            // Determine collision side
            const overlapLeft = (physBall.x + physBall.r) - w.x;
            const overlapRight = (w.x + w.w) - (physBall.x - physBall.r);
            const overlapTop = (physBall.y + physBall.r) - w.y;
            const overlapBottom = (w.y + w.h) - (physBall.y - physBall.r);
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if(minOverlap === overlapLeft) { physBall.x = w.x - physBall.r; physBall.vx = -physBall.vx * BOUNCE; }
            else if(minOverlap === overlapRight) { physBall.x = w.x + w.w + physBall.r; physBall.vx = -physBall.vx * BOUNCE; }
            else if(minOverlap === overlapTop) { physBall.y = w.y - physBall.r; physBall.vy = -physBall.vy * BOUNCE; }
            else { physBall.y = w.y + w.h + physBall.r; physBall.vy = -physBall.vy * BOUNCE; }
        }
    });
    
    // Object interactions
    physObjects.forEach(obj => {
        const dx = physBall.x - obj.x;
        const dy = physBall.y - obj.y;
        const dist = Math.hypot(dx, dy);
        
        if(obj.type === 'box' && dist < 12) {
            // Box: solid block
            if(Math.abs(dx) > Math.abs(dy)) {
                physBall.x = obj.x + (dx > 0 ? 12 : -12);
                physBall.vx = -physBall.vx * BOUNCE;
            } else {
                physBall.y = obj.y + (dy > 0 ? 12 : -12);
                physBall.vy = -physBall.vy * BOUNCE;
            }
        } else if(obj.type === 'ramp' && dist < 20) {
            // Ramp: angled surface (simplified as a slope)
            physBall.vy -= 0.3;
            physBall.vx += (dx > 0 ? 0.5 : -0.5);
        } else if(obj.type === 'trampoline' && dist < 15 && physBall.vy > 0) {
            // Trampoline: strong upward bounce
            physBall.vy = -4;
            physBall.vx += (dx > 0 ? 0.3 : -0.3);
        } else if(obj.type === 'ball' && dist < 10) {
            // Ball: another ball (pushes)
            physBall.vx += dx * 0.05;
            physBall.vy += dy * 0.05;
        }
    });
    
    // Ball-ball collision (if placed multiple balls)
    // ... keep it simple for now
    
    // Boundaries
    if(physBall.x < physBall.r) { physBall.x = physBall.r; physBall.vx = -physBall.vx * BOUNCE; }
    if(physBall.x > PHYS_W - physBall.r) { physBall.x = PHYS_W - physBall.r; physBall.vx = -physBall.vx * BOUNCE; }
    if(physBall.y < physBall.r) { physBall.y = physBall.r; physBall.vy = -physBall.vy * BOUNCE; }
    if(physBall.y > PHYS_H - physBall.r) { physBall.y = PHYS_H - physBall.r; physBall.vy = -physBall.vy * BOUNCE; }
    
    // Check goal
    if(physGoal && Math.hypot(physBall.x - physGoal.x, physBall.y - physGoal.y) < 15) {
        physRunning = false;
        physStars++;
        physUpdateUI();
        physDraw();
        
        // Level complete!
        setTimeout(() => {
            if(physCurrentLevel < PHYS_LEVELS.length - 1) {
                physCurrentLevel++;
                physLoadLevel(physCurrentLevel);
            } else {
                physDrawWin();
            }
        }, 500);
        return;
    }
    
    // Stop if barely moving
    if(Math.abs(physBall.vx) < 0.01 && Math.abs(physBall.vy) < 0.01 && physBall.y >= PHYS_H - physBall.r - 2) {
        physBall.vx = 0;
        physBall.vy = 0;
    }
    
    physDraw();
    physAnimId = requestAnimationFrame(physLoop);
}

function physDraw() {
    if(!physCtx) return;
    const ctx = physCtx;
    
    // Background
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PHYS_W, PHYS_H);
    
    // Grid
    ctx.strokeStyle = 'rgba(155,188,15,0.1)';
    ctx.lineWidth = 0.5;
    for(let x = 0; x < PHYS_W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,PHYS_H); ctx.stroke(); }
    for(let y = 0; y < PHYS_H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(PHYS_W,y); ctx.stroke(); }
    
    // Walls
    ctx.fillStyle = '#306230';
    physWalls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
    
    // Objects
    physObjects.forEach(obj => {
        if(obj.type === 'box') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(obj.x - 8, obj.y - 8, 16, 16);
            ctx.strokeStyle = '#654321';
            ctx.strokeRect(obj.x - 8, obj.y - 8, 16, 16);
        } else if(obj.type === 'ramp') {
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.moveTo(obj.x - 12, obj.y + 8);
            ctx.lineTo(obj.x + 12, obj.y + 8);
            ctx.lineTo(obj.x + 12, obj.y - 8);
            ctx.closePath();
            ctx.fill();
        } else if(obj.type === 'trampoline') {
            ctx.fillStyle = '#00aa00';
            ctx.fillRect(obj.x - 12, obj.y - 3, 24, 6);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(obj.x - 10, obj.y - 2, 20, 2);
        } else if(obj.type === 'ball') {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Goal (star)
    if(physGoal) {
        ctx.fillStyle = '#ffdd00';
        ctx.font = '14px serif';
        ctx.fillText('⭐', physGoal.x - 7, physGoal.y + 5);
    }
    
    // Ball
    if(physBall && physBall.placed) {
        ctx.fillStyle = physRunning ? '#ff4444' : '#9bbc0f';
        ctx.beginPath();
        ctx.arc(physBall.x, physBall.y, physBall.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Hint text
    if(!physRunning && physCurrentLevel < PHYS_LEVELS.length) {
        ctx.fillStyle = 'rgba(155,188,15,0.6)';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(PHYS_LEVELS[physCurrentLevel].hint, PHYS_W/2, 50);
        ctx.textAlign = 'left';
    }
}

function physDrawWin() {
    if(!physCtx) return;
    const ctx = physCtx;
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, PHYS_W, PHYS_H);
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ALL LEVELS CLEAR! 🎉', PHYS_W/2, PHYS_H/2 - 20);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('STARS: ' + physStars + '/' + PHYS_LEVELS.length, PHYS_W/2, PHYS_H/2 + 10);
    ctx.fillText('TAP TO REPLAY', PHYS_W/2, PHYS_H/2 + 30);
    ctx.textAlign = 'left';
    
    physCanvas.onclick = () => {
        physCurrentLevel = 0;
        physStars = 0;
        physLoadLevel(0);
        physCanvas.onclick = physPlaceObject;
    };
}

// Init on app launch
window.initAdventure = function() {
    physInit();
};
