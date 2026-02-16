// ========== BIT-VOID: ENHANCED EDITION (v5.0 FULL AMONG US MECHANICS) ==========
// Complete social deduction with smooth movement, tasks, vents, sabotage, and advanced AI. Refactored for Physical Console Keys.

const VOID_COLORS = [
    { name: 'RED', primary: '#C51111', shadow: '#7A0838', dark: '#3F0E15' },
    { name: 'BLUE', primary: '#132ED1', shadow: '#09158E', dark: '#0A0E2B' },
    { name: 'GREEN', primary: '#117F2D', shadow: '#0A4D2E', dark: '#0B2818' },
    { name: 'PINK', primary: '#ED54BA', shadow: '#A8166E', dark: '#42092B' },
    { name: 'ORANGE', primary: '#F07D0D', shadow: '#B33E15', dark: '#3D1F0F' },
    { name: 'YELLOW', primary: '#F5F557', shadow: '#C38823', dark: '#423919' },
    { name: 'PURPLE', primary: '#6B2FBB', shadow: '#3B177C', dark: '#1E0B3D' },
    { name: 'CYAN', primary: '#38FEDC', shadow: '#24A8BE', dark: '#13424A' }
];

const VOID_MAP = {
    width: 800,
    height: 600,
    rooms: [
        { 
            name: 'CAFETERIA', x: 250, y: 200, w: 180, h: 140, 
            color: '#3d4d1a', tasks: ['TRASH', 'WIRES'], 
            doors: [{x: 340, y: 200, w: 20, h: 5, to: 'UPPER_HALL'}],
            emergency: { x: 340, y: 270 }
        },
        { 
            name: 'WEAPONS', x: 560, y: 200, w: 120, h: 100, 
            color: '#4d1a3d', tasks: ['ASTEROIDS'],
            doors: [{x: 560, y: 250, w: 5, h: 20, to: 'UPPER_HALL'}],
            vent: { x: 600, y: 250 }
        },
        { 
            name: 'O2', x: 560, y: 350, w: 120, h: 100, 
            color: '#1a4d4d', tasks: ['FILTER'],
            doors: [{x: 560, y: 400, w: 5, h: 20, to: 'LOWER_HALL'}],
            vent: { x: 600, y: 400 }
        },
        { 
            name: 'NAV', x: 560, y: 80, w: 120, h: 80, 
            color: '#1a4d2e', tasks: ['CHART', 'STEER'],
            doors: [{x: 560, y: 120, w: 5, h: 20, to: 'UPPER_HALL'}]
        },
        { 
            name: 'SHIELDS', x: 560, y: 490, w: 120, h: 90, 
            color: '#1a1a4d', tasks: ['PRIME'],
            doors: [{x: 560, y: 530, w: 5, h: 20, to: 'LOWER_HALL'}],
            vent: { x: 600, y: 530 }
        },
        { 
            name: 'COMMS', x: 80, y: 350, w: 120, h: 100, 
            color: '#1a4d2e', tasks: ['DOWNLOAD'],
            doors: [{x: 200, y: 400, w: 5, h: 20, to: 'LOWER_HALL'}]
        },
        { 
            name: 'STORAGE', x: 80, y: 490, w: 120, h: 90, 
            color: '#1a3d4d', tasks: ['FUEL'],
            doors: [{x: 200, y: 530, w: 5, h: 20, to: 'LOWER_HALL'}]
        },
        { 
            name: 'REACTOR', x: 80, y: 200, w: 120, h: 100, 
            color: '#4d1a1a', tasks: ['MANIFOLD', 'UNLOCK'],
            doors: [{x: 200, y: 250, w: 5, h: 20, to: 'UPPER_HALL'}],
            vent: { x: 120, y: 250 }
        },
        { 
            name: 'MEDBAY', x: 80, y: 80, w: 120, h: 80, 
            color: '#1a4d2e', tasks: ['SCAN', 'SAMPLE'],
            doors: [{x: 200, y: 120, w: 5, h: 20, to: 'UPPER_HALL'}]
        }
    ],
    corridors: [
        { name: 'UPPER_HALL', points: [200, 80, 560, 80, 560, 340, 430, 340, 430, 200, 200, 200] },
        { name: 'LOWER_HALL', points: [200, 340, 560, 340, 560, 580, 200, 580] }
    ],
    ventNetwork: [
        ['REACTOR', 'WEAPONS'],
        ['WEAPONS', 'O2'],
        ['O2', 'SHIELDS'],
        ['SHIELDS', 'REACTOR']
    ]
};

const VOID_TASKS = {
    TRASH: { type: 'hold', duration: 3000, icon: '🗑️' },
    WIRES: { type: 'sequence', codes: ['RED', 'BLUE', 'YELLOW'], duration: 4000, icon: '🔌' },
    ASTEROIDS: { type: 'skill', targets: 10, duration: 8000, icon: '🎯' },
    FILTER: { type: 'hold', duration: 4000, icon: '💨' },
    CHART: { type: 'instant', duration: 1500, icon: '🗺️' },
    STEER: { type: 'hold', duration: 2500, icon: '🎮' },
    PRIME: { type: 'sequence', codes: [1,2,3], duration: 3000, icon: '🛡️' },
    DOWNLOAD: { type: 'progress', duration: 7000, icon: '📥' },
    FUEL: { type: 'hold', duration: 3500, icon: '⛽' },
    MANIFOLD: { type: 'sequence', codes: [1,2,3,4], duration: 4000, icon: '⚙️' },
    UNLOCK: { type: 'hold', duration: 5000, icon: '🔓' },
    SCAN: { type: 'progress', duration: 8000, icon: '🔬' },
    SAMPLE: { type: 'instant', duration: 2000, icon: '🧪' }
};

let voidState = {
    x: 340, y: 270,
    velocityX: 0, velocityY: 0,
    facing: 'right',
    currentRoom: 'CAFETERIA',
    isAlive: true,
    myRole: 'DECODER',
    myColor: null,
    killCooldown: 0,
    players: [],
    deadBodies: [],
    taskProgress: { completed: 0, total: 0 },
    myTasks: [],
    activeTask: null,
    meetingActive: false,
    meetingTimer: 0,
    votes: {},
    hasVoted: false,
    inVent: false,
    ventLocation: null,
    animFrame: 0,
    cameraX: 0, cameraY: 0,
    visiblePlayers: new Set(),
    aiInterval: null,
    moveSpeed: 3,
    friction: 0.85,
    keys: {}
};

window.initVoid = function() {
    P2PGameEngine.launch('void', 'BIT-VOID');
};

window.startVoid = function() {
    document.getElementById('voidIntro').style.display = 'flex';
};

window.hideVoidIntro = function() {
    document.getElementById('voidIntro').style.display = 'none';
    initVoidGame();
};

function initVoidGame() {
    const canvas = document.getElementById('voidCanvas');
    if (!canvas) return;

    voidState.x = 340; voidState.y = 270;
    voidState.isAlive = true;
    voidState.meetingActive = false;
    voidState.inVent = false;
    voidState.deadBodies = [];
    voidState.killCooldown = 0;

    const myNick = document.getElementById('chatNick')?.value || 'PLAYER';
    voidState.myColor = VOID_COLORS[Math.floor(Math.random() * VOID_COLORS.length)];
    
    voidState.players = [{
        name: myNick, x: 340, y: 270, color: voidState.myColor,
        isAlive: true, isMe: true, role: 'DECODER', facing: 'right', currentRoom: 'CAFETERIA'
    }];

    assignPlayerTasks();

    if (P2PGameEngine.isSolo) {
        initSoloAI();
    } else {
        setupP2PSync();
    }

    setupEnhancedControls();

    if (voidState.aiInterval) clearInterval(voidState.aiInterval);
    voidState.aiInterval = setInterval(updateGameLogic, 100);

    requestAnimationFrame(enhancedGameLoop);
    updateVoidUI();
    logVoid("MISSION START: SYSTEM ONLINE.");
}

function assignPlayerTasks() {
    const available = [];
    VOID_MAP.rooms.forEach(room => {
        if (room.tasks) room.tasks.forEach(t => available.push({ name: t, room: room.name, completed: false }));
    });
    voidState.myTasks = available.sort(() => Math.random() - 0.5).slice(0, 5);
    voidState.taskProgress.total = voidState.myTasks.length;
    voidState.taskProgress.completed = 0;
}

function setupEnhancedControls() {
    document.addEventListener('keydown', (e) => {
        voidState.keys[e.key] = true;
        
        // Physical Buttons Mapping
        // A -> 'z', B -> 'x' (from app.js dispatch)
        if (e.key === 'z') { // A Button: Task / Kill / Vent Use / Vote
            if (voidState.meetingActive) {
                // Voting handled in render loop click or key selection
                // For simplicity, we keep click for voting or use D-pad to select
            } else {
                const task = checkNearbyTask();
                if (task) startTask(task);
                else if (voidState.myRole === 'GLITCH') {
                    if (voidState.inVent) toggleVent();
                    else {
                        const nearVent = checkNearVent();
                        if (nearVent) toggleVent();
                        else attemptKill();
                    }
                }
            }
        }
        
        if (e.key === 'x') { // B Button: Report / Cancel
            if (voidState.meetingActive) {
                // Cancel/Skip
            } else {
                attemptReport();
                attemptEmergency();
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        voidState.keys[e.key] = false;
    });
}

function updateGameLogic() {
    if (!voidState.isAlive || voidState.meetingActive || voidState.activeTask) return;

    // Movement
    let ax = 0, ay = 0;
    if (voidState.keys['ArrowUp']) ay -= voidState.moveSpeed;
    if (voidState.keys['ArrowDown']) ay += voidState.moveSpeed;
    if (voidState.keys['ArrowLeft']) { ax -= voidState.moveSpeed; voidState.facing = 'left'; }
    if (voidState.keys['ArrowRight']) { ax += voidState.moveSpeed; voidState.facing = 'right'; }

    voidState.velocityX = ax;
    voidState.velocityY = ay;

    const nx = voidState.x + voidState.velocityX;
    const ny = voidState.y + voidState.velocityY;

    if (canMoveTo(nx, ny)) {
        voidState.x = nx;
        voidState.y = ny;
        updateCurrentRoom();
        broadcastPosition();
    }

    // Camera
    voidState.cameraX = Math.max(0, Math.min(VOID_MAP.width - 640, voidState.x - 320));
    voidState.cameraY = Math.max(0, Math.min(VOID_MAP.height - 480, voidState.y - 240));

    // Cooldowns
    if (voidState.killCooldown > 0) voidState.killCooldown -= 0.1;

    // AI Logic (Moving units)
    if (P2PGameEngine.isSolo) {
        voidState.players.forEach(p => {
            if (p.isMe || !p.isAlive) return;
            p.x += (Math.random() - 0.5) * 5;
            p.y += (Math.random() - 0.5) * 5;
            p.x = Math.max(40, Math.min(760, p.x));
            p.y = Math.max(40, Math.min(560, p.y));
        });
    }
}

function canMoveTo(x, y) {
    if (x < 20 || x > VOID_MAP.width - 20 || y < 20 || y > VOID_MAP.height - 20) return false;
    const inRoom = VOID_MAP.rooms.some(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
    const inHall = VOID_MAP.corridors.some(c => pointInPolygon(x, y, c.points));
    return inRoom || inHall;
}

function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
        if (((points[i+1] > y) !== (points[j+1] > y)) && (x < (points[j] - points[i]) * (y - points[i+1]) / (points[j+1] - points[i+1]) + points[i])) inside = !inside;
    }
    return inside;
}

function updateCurrentRoom() {
    const room = VOID_MAP.rooms.find(r => voidState.x >= r.x && voidState.x <= r.x + r.w && voidState.y >= r.y && voidState.y <= r.y + r.h);
    voidState.currentRoom = room ? room.name : 'CORRIDOR';
    document.getElementById('voidLocation').textContent = voidState.currentRoom;
}

function broadcastPosition() {
    const me = voidState.players.find(p => p.isMe);
    if (me) { me.x = voidState.x; me.y = voidState.y; me.facing = voidState.facing; me.room = voidState.currentRoom; }
    P2PGameEngine.send({ type: 'void-pos', x: voidState.x, y: voidState.y, facing: voidState.facing, room: voidState.currentRoom });
}

function enhancedGameLoop() {
    const canvas = document.getElementById('voidCanvas');
    if (!canvas || typeof currentScreen === 'undefined' || currentScreen !== 'void') return;
    const ctx = canvas.getContext('2d');
    voidState.animFrame++;

    ctx.fillStyle = '#111'; ctx.fillRect(0,0,640,480);
    ctx.save();
    ctx.translate(-voidState.cameraX, -voidState.cameraY);

    // Render Corridor & Rooms
    VOID_MAP.corridors.forEach(c => {
        ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.moveTo(c.points[0], c.points[1]);
        for(let i=2; i<c.points.length; i+=2) ctx.lineTo(c.points[i], c.points[i+1]);
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#333'; ctx.stroke();
    });
    VOID_MAP.rooms.forEach(r => {
        ctx.fillStyle = r.color; ctx.globalAlpha = 0.3; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0f8'; ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#0ff'; ctx.font = '8px monospace'; ctx.fillText(r.name, r.x+5, r.y+10);
        if(r.emergency) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(r.emergency.x, r.emergency.y, 10, 0, 7); ctx.fill(); }
    });

    // Dead Bodies
    voidState.deadBodies.forEach(b => drawDeadBody(ctx, b.x, b.y, b.color));

    // Players
    voidState.players.forEach(p => {
        if(!p.isAlive) return;
        if(p.room === voidState.currentRoom || !voidState.isAlive || p.isMe) {
            drawEnhancedPlayer(ctx, p);
        }
    });

    ctx.restore();
    drawHUD(ctx);
    requestAnimationFrame(enhancedGameLoop);
}

function drawEnhancedPlayer(ctx, p) {
    ctx.fillStyle = p.color.primary; ctx.fillRect(p.x-8, p.y-10, 16, 20);
    ctx.fillStyle = '#66ccff'; ctx.fillRect(p.facing==='right'?p.x:p.x-12, p.y-6, 12, 6);
    ctx.fillStyle = '#fff'; ctx.font = '6px monospace'; ctx.textAlign='center'; ctx.fillText(p.name, p.x, p.y-15);
}

function drawDeadBody(ctx, x, y, color) {
    ctx.fillStyle = color.primary; ctx.fillRect(x-8, y, 16, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(x-2, y-6, 4, 12);
}

function drawHUD(ctx) {
    if(voidState.myRole === 'DECODER') {
        ctx.fillStyle = 'lime'; ctx.fillRect(10, 10, (voidState.taskProgress.completed / voidState.taskProgress.total) * 100, 10);
    }
    if(voidState.killCooldown > 0) {
        ctx.fillStyle = 'white'; ctx.fillText(`KILL: ${Math.ceil(voidState.killCooldown)}s`, 550, 20);
    }
}

function checkNearbyTask() {
    return voidState.myTasks.find(t => !t.completed && t.room === voidState.currentRoom && Math.hypot(voidState.x - (VOID_MAP.rooms.find(r=>r.name===t.room).x + 50), voidState.y - (VOID_MAP.rooms.find(r=>r.name===t.room).y + 50)) < 100);
}

function startTask(task) {
    voidState.activeTask = task;
    logVoid(`TASK STARTED: ${task.name}`);
    setTimeout(() => {
        task.completed = true;
        voidState.taskProgress.completed++;
        voidState.activeTask = null;
        logVoid(`TASK COMPLETE!`);
        sounds.coin();
    }, 2000);
}

function attemptKill() {
    if(voidState.killCooldown > 0) return;
    const target = voidState.players.find(p => !p.isMe && p.isAlive && p.room === voidState.currentRoom && Math.hypot(voidState.x - p.x, voidState.y - p.y) < 50);
    if(target) {
        target.isAlive = false;
        voidState.deadBodies.push({ x: target.x, y: target.y, color: target.color, room: target.room });
        voidState.killCooldown = 30;
        P2PGameEngine.send({ type: 'void-kill', target: target.name, x: target.x, y: target.y });
        logVoid("ELIMINATED TARGET.");
    }
}

function attemptReport() {
    const body = voidState.deadBodies.find(b => b.room === voidState.currentRoom && Math.hypot(voidState.x - b.x, voidState.y - b.y) < 60);
    if(body) triggerMeeting(body.name, "BODY DISCOVERED.");
}

function attemptEmergency() {
    const r = VOID_MAP.rooms.find(rm => rm.emergency && Math.hypot(voidState.x - rm.emergency.x, voidState.y - rm.emergency.y) < 40);
    if(r) triggerMeeting(null, "EMERGENCY MEETING.");
}

function triggerMeeting(body, reason) {
    voidState.meetingActive = true;
    voidState.meetingTimer = 30;
    const ui = document.getElementById('voidDebate');
    ui.style.display = 'flex';
    document.getElementById('voidDebateLog').innerHTML = `--- ${reason} ---`;
    voidState.timer = 15;
    setTimeout(() => {
        voidState.meetingActive = false;
        ui.style.display = 'none';
        logVoid("MEETING ADJOURNED.");
    }, 15000);
}

function logVoid(m) {
    const l = document.getElementById('voidLog');
    if(l) l.innerHTML = `> ${m}<br>` + l.innerHTML;
}

function checkNearVent() {
    return VOID_MAP.rooms.find(r => r.vent && Math.hypot(voidState.x - r.vent.x, voidState.y - r.vent.y) < 50);
}

function toggleVent() {
    if(!voidState.inVent) {
        const r = checkNearVent();
        if(r) { voidState.inVent = true; voidState.ventLocation = r.name; logVoid("IN VENT."); }
    } else {
        voidState.inVent = false; logVoid("OUT OF VENT.");
    }
}

function setupP2PSync() {
    P2PGameEngine.activeGame = {
        onSync: (d) => {
            if(d.type === 'void-pos') {
                const p = voidState.players.find(x => x.name === d.from);
                if(p) { p.x = d.x; p.y = d.y; p.facing = d.facing; p.room = d.room; }
            } else if(d.type === 'void-kill') {
                const p = voidState.players.find(x => x.name === d.target);
                if(p) { p.isAlive = false; voidState.deadBodies.push({x: d.x, y: d.y, color: p.color, room: p.room}); }
                if(d.target === (document.getElementById('chatNick')?.value || 'PLAYER')) voidState.isAlive = false;
            }
        }
    };
}

window.voidDoTask = function() {
    if (voidState.activeTask) return;
    const task = checkNearbyTask();
    if (task) startTask(task);
};

window.voidKill = attemptKill;
window.voidReport = attemptReport;

window.voidSendDebate = function() {
    const input = document.getElementById('voidDebateInput');
    const myNick = document.getElementById('chatNick')?.value || 'PLAYER';
    if (!input || !input.value) return;
    
    appendDebate(myNick, input.value);
    P2PGameEngine.send({ type: 'void-msg', from: myNick, text: input.value });
    input.value = '';
};

function updateVoidUI() {
    const roleEl = document.getElementById('voidRoleDisplay');
    if (roleEl) {
        roleEl.textContent = voidState.myRole;
        roleEl.style.color = voidState.myRole === 'GLITCH' ? '#ff3333' : '#33ffff';
    }
    
    const killBtn = document.getElementById('voidBtnKill');
    if (killBtn) {
        killBtn.style.display = (voidState.myRole === 'GLITCH' && voidState.isAlive) ? 'block' : 'none';
    }
    
    const taskBtn = document.getElementById('voidBtnTask');
    if (taskBtn) {
        taskBtn.style.display = (voidState.myRole === 'DECODER' && voidState.isAlive) ? 'block' : 'none';
    }
}

function appendDebate(from, text) {
    const log = document.getElementById('voidDebateLog');
    if (log) {
        log.innerHTML += `<div style="margin-bottom: 5px;"><span style="color: #0ff;">[${from}]</span> ${text}</div>`;
        log.scrollTop = log.scrollHeight;
    }
}

function initSoloAI() {
    const totalPlayers = 4;
    const glitchIndex = Math.floor(Math.random() * totalPlayers);
    
    if (glitchIndex === 0) voidState.myRole = 'GLITCH';
    else voidState.myRole = 'DECODER';

    ['SIGMA', 'DELTA', 'OMEGA'].forEach((n, i) => {
        const isGlitch = (glitchIndex === i + 1);
        voidState.players.push({ 
            name: n, 
            x: 200 + i*100, y: 150, 
            color: VOID_COLORS[i+1], 
            isAlive: true, isMe: false, 
            role: isGlitch ? 'GLITCH' : 'DECODER', 
            room: 'CAFETERIA' 
        });
    });
}
