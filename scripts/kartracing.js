// ========== KARTRACING — Top-Down Arcade Racer ==========
// D-pad: Up=accelerate, Down=brake, Left/Right=steer
// A button: use item | B button: drift/brake

const KRCanvas = document.getElementById('chameleonCanvas') || document.createElement('canvas');
let krCtx = KRCanvas.getContext('2d');

// ── Game State ────────────────────────────────────────────────────────
let krRunning = false;
let krRAF = null;
let krPhase = 'menu'; // menu | countdown | race | results

const KW = 320, KH = 240;

// Track definition (oval with curves)
const TRACK = {
    outerR: 130,
    innerR: 70,
    cx: KW / 2,
    cy: KH / 2 + 10,
    startAngle: -Math.PI / 2,
};

// ── Input ─────────────────────────────────────────────────────────────
let krKeys = {};
function krBindInput() {
    document.addEventListener('keydown', (e) => {
        if (typeof currentScreen === 'undefined' || currentScreen !== 'kart') return;
        krKeys[e.key] = true;
        if (e.key === 'z' || e.key === 'a' || e.key === 'Enter') krUseItem();
        if (e.key === 'x' || e.key === 'b') krDrift = true;
        e.preventDefault();
    });
    document.addEventListener('keyup', (e) => {
        if (typeof currentScreen === 'undefined' || currentScreen !== 'kart') return;
        krKeys[e.key] = false;
        if (e.key === 'x' || e.key === 'b') krDrift = false;
    });
}
krBindInput();

// ── Player & AI ───────────────────────────────────────────────────────
const CAR_COLORS = ['#ff3333', '#3399ff', '#33cc33', '#ffcc00'];
const CAR_NAMES = ['YOU', 'BLUE', 'GREEN', 'GOLD'];

function createCar(color, name, isPlayer) {
    return {
        x: TRACK.cx,
        y: TRACK.cy - TRACK.outerR + 15,
        angle: Math.PI / 2,
        speed: 0,
        maxSpeed: isPlayer ? 3.2 : 2.9,
        accel: 0.06,
        friction: 0.97,
        turnSpeed: 0.045,
        color,
        name,
        isPlayer,
        lap: 0,
        checkpoint: 0,
        item: null,
        itemTimer: 0,
        hitTimer: 0,
        boostTimer: 0,
        finished: false,
        finishTime: 0,
        driftAngle: 0,
    };
}

let krCars = [];
let krPlayer = null;
let krRaceTime = 0;
let krCountdown = 3;
let krDrift = false;
let krLastTime = 0;
const TOTAL_LAPS = 3;
const NUM_CPS = 12; // checkpoints around the track

// ── Track Helpers ─────────────────────────────────────────────────────
function trackPoint(angle, radius) {
    return {
        x: TRACK.cx + Math.cos(angle) * radius,
        y: TRACK.cy + Math.sin(angle) * radius,
    };
}

function trackAngleAt(angle) {
    // Tangent direction at angle on circle
    return angle + Math.PI / 2;
}

function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function onTrack(x, y) {
    const dx = x - TRACK.cx;
    const dy = y - TRACK.cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    return d >= TRACK.innerR - 5 && d <= TRACK.outerR + 5;
}

function getCheckpointAngle(cpIndex) {
    return (cpIndex / NUM_CPS) * Math.PI * 2 - Math.PI / 2;
}

function normalizeAngle(a) {
    while (a < -Math.PI) a += Math.PI * 2;
    while (a > Math.PI) a -= Math.PI * 2;
    return a;
}

// ── Items ─────────────────────────────────────────────────────────────
const ITEM_TYPES = ['shell', 'banana', 'star', 'mushroom'];

function randomItem() {
    return ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
}

function krUseItem() {
    if (!krPlayer || !krPlayer.item || krPlayer.hitTimer > 0) return;
    const item = krPlayer.item;
    krPlayer.item = null;
    if (window.sounds) sounds.click();

    if (item === 'shell') {
        // Fire shell forward
        spawnShell(krPlayer.x, krPlayer.y, krPlayer.angle, krPlayer);
    } else if (item === 'banana') {
        spawnBanana(krPlayer.x, krPlayer.y, krPlayer);
    } else if (item === 'star') {
        krPlayer.boostTimer = 300;
    } else if (item === 'mushroom') {
        krPlayer.speed = Math.min(krPlayer.maxSpeed + 1.5, krPlayer.speed + 2);
        krPlayer.boostTimer = 60;
    }
}

let krShells = [];
let krBananas = [];

function spawnShell(x, y, angle, owner) {
    krShells.push({ x, y, angle, speed: 4, owner, life: 300 });
}

function spawnBanana(x, y, owner) {
    krBananas.push({ x, y, owner, life: 600 });
}

// ── AI Logic ──────────────────────────────────────────────────────────
function aiDrive(car) {
    if (car.hitTimer > 0) return;

    // Target next checkpoint
    const cpAngle = getCheckpointAngle(car.checkpoint);
    const target = trackPoint(cpAngle, TRACK.innerR + 20 + (car.checkpoint % 3) * 15);
    const toTarget = Math.atan2(target.y - car.y, target.x - car.x);
    const diff = normalizeAngle(toTarget - car.angle);

    // Steer toward target
    if (diff > 0.1) car.angle += car.turnSpeed * 0.9;
    else if (diff < -0.1) car.angle -= car.turnSpeed * 0.9;

    // Accelerate
    if (Math.abs(diff) < 0.6) {
        car.speed = Math.min(car.maxSpeed, car.speed + car.accel);
    } else {
        car.speed *= 0.95;
    }

    // Use item randomly
    if (car.item && Math.random() < 0.02) {
        if (car.item === 'shell') {
            spawnShell(car.x, car.y, car.angle, car);
        } else if (car.item === 'banana') {
            spawnBanana(car.x, car.y, car);
        } else if (car.item === 'mushroom') {
            car.speed = Math.min(car.maxSpeed + 1.5, car.speed + 2);
            car.boostTimer = 60;
        } else if (car.item === 'star') {
            car.boostTimer = 300;
        }
        car.item = null;
    }
}

// ── Update ────────────────────────────────────────────────────────────
function krUpdate(dt) {
    if (krPhase === 'countdown') {
        krCountdown -= dt;
        if (krCountdown <= 0) {
            krPhase = 'race';
            krCountdown = 0;
            if (window.sounds) sounds.launch();
        }
        return;
    }
    if (krPhase !== 'race') return;

    krRaceTime += dt;

    // Player input
    if (krPlayer && !krPlayer.finished) {
        if (krPlayer.hitTimer > 0) {
            krPlayer.hitTimer--;
            krPlayer.speed *= 0.9;
        } else {
            // Accelerate
            if (krKeys['ArrowUp'] || krKeys['w']) {
                let max = krPlayer.maxSpeed;
                if (krPlayer.boostTimer > 0) max += 1.5;
                krPlayer.speed = Math.min(max, krPlayer.speed + krPlayer.accel);
            } else {
                krPlayer.speed *= krPlayer.friction;
            }
            // Brake / reverse
            if (krKeys['ArrowDown'] || krKeys['s']) {
                krPlayer.speed = Math.max(-1, krPlayer.speed - 0.08);
            }
            // Steer
            const steerMult = Math.min(1, krPlayer.speed / 1.5);
            if (krKeys['ArrowLeft'] || krKeys['a']) {
                krPlayer.angle -= krPlayer.turnSpeed * steerMult;
            }
            if (krKeys['ArrowRight'] || krKeys['d']) {
                krPlayer.angle += krPlayer.turnSpeed * steerMult;
            }
            // Drift boost
            if (krDrift && krPlayer.speed > 1.5) {
                krPlayer.angle += (krKeys['ArrowLeft'] ? -0.02 : 0) + (krKeys['ArrowRight'] ? 0.02 : 0);
            }
        }
        if (krPlayer.boostTimer > 0) krPlayer.boostTimer--;
    }

    // Update all cars
    for (const car of krCars) {
        if (car.isPlayer) continue;
        aiDrive(car);

        // Move
        car.x += Math.cos(car.angle) * car.speed;
        car.y += Math.sin(car.angle) * car.speed;

        // Keep on track
        if (!onTrack(car.x, car.y)) {
            car.speed *= 0.5;
            const dx = car.x - TRACK.cx;
            const dy = car.y - TRACK.cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > TRACK.outerR + 10) {
                car.x = TRACK.cx + (dx / d) * (TRACK.outerR + 2);
                car.y = TRACK.cy + (dy / d) * (TRACK.outerR + 2);
            } else if (d < TRACK.innerR - 10) {
                car.x = TRACK.cx + (dx / d) * (TRACK.innerR - 2);
                car.y = TRACK.cy + (dy / d) * (TRACK.innerR - 2);
            }
        }

        if (car.boostTimer > 0) car.boostTimer--;
        if (car.hitTimer > 0) car.hitTimer--;
    }

    // Player movement
    if (krPlayer && !krPlayer.finished) {
        krPlayer.x += Math.cos(krPlayer.angle) * krPlayer.speed;
        krPlayer.y += Math.sin(krPlayer.angle) * krPlayer.speed;
        // Keep on track
        if (!onTrack(krPlayer.x, krPlayer.y)) {
            krPlayer.speed *= 0.5;
            const dx = krPlayer.x - TRACK.cx;
            const dy = krPlayer.y - TRACK.cy;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > TRACK.outerR + 10) {
                krPlayer.x = TRACK.cx + (dx / d) * (TRACK.outerR + 2);
                krPlayer.y = TRACK.cy + (dy / d) * (TRACK.outerR + 2);
            } else if (d < TRACK.innerR - 10) {
                krPlayer.x = TRACK.cx + (dx / d) * (TRACK.innerR - 2);
                krPlayer.y = TRACK.cy + (dy / d) * (TRACK.innerR - 2);
            }
        }
    }

    // Checkpoint detection
    for (const car of krCars) {
        if (car.finished) continue;
        const nextCp = (car.checkpoint + 1) % NUM_CPS;
        const cpAngle = getCheckpointAngle(nextCp);
        const cpPt = trackPoint(cpAngle, TRACK.innerR + 25);
        if (dist(car, cpPt) < 25) {
            car.checkpoint = nextCp;
            // Lap completion
            if (nextCp === 0 && car.checkpoint === 0) {
                car.lap++;
                if (car.isPlayer && window.sounds) sounds.coin();
                if (car.lap >= TOTAL_LAPS) {
                    car.finished = true;
                    car.finishTime = krRaceTime;
                    if (car.isPlayer) {
                        setTimeout(() => { krPhase = 'results'; }, 500);
                    }
                }
            }
            // Random item pickup at some checkpoints
            if (!car.item && (nextCp === 3 || nextCp === 7 || nextCp === 10)) {
                car.item = randomItem();
            }
        }
    }

    // Item pickup boxes
    for (const car of krCars) {
        if (!car.item) {
            for (let i = 0; i < NUM_CPS; i++) {
                const a = getCheckpointAngle(i);
                const boxPt = trackPoint(a, TRACK.innerR + 25);
                if (dist(car, boxPt) < 18) {
                    car.item = randomItem();
                    break;
                }
            }
        }
    }

    // Shell collision
    for (let i = krShells.length - 1; i >= 0; i--) {
        const s = krShells[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.life--;
        if (s.life <= 0 || !onTrack(s.x, s.y)) { krShells.splice(i, 1); continue; }
        for (const car of krCars) {
            if (car === s.owner && s.life > 280) continue;
            if (dist(s, car) < 12) {
                car.speed = 0;
                car.hitTimer = 60;
                krShells.splice(i, 1);
                if (window.sounds) sounds.back();
                break;
            }
        }
    }

    // Banana collision
    for (let i = krBananas.length - 1; i >= 0; i--) {
        const b = krBananas[i];
        b.life--;
        if (b.life <= 0) { krBananas.splice(i, 1); continue; }
        for (const car of krCars) {
            if (car === b.owner) continue;
            if (dist(b, car) < 10) {
                car.speed = 0;
                car.hitTimer = 40;
                krBananas.splice(i, 1);
                if (window.sounds) sounds.back();
                break;
            }
        }
    }
}

// ── Render ────────────────────────────────────────────────────────────
function krRender() {
    krCtx.fillStyle = '#1a1a2e';
    krCtx.fillRect(0, 0, KW, KH);

    if (krPhase === 'menu') {
        krRenderMenu();
        return;
    }

    // Draw track
    krCtx.fillStyle = '#2d5a27';
    krCtx.fillRect(0, 0, KW, KH);

    // Track surface
    krCtx.beginPath();
    krCtx.arc(TRACK.cx, TRACK.cy, TRACK.outerR, 0, Math.PI * 2);
    krCtx.fillStyle = '#555';
    krCtx.fill();

    // Grass center
    krCtx.beginPath();
    krCtx.arc(TRACK.cx, TRACK.cy, TRACK.innerR, 0, Math.PI * 2);
    krCtx.fillStyle = '#2d5a27';
    krCtx.fill();

    // Track edges
    krCtx.beginPath();
    krCtx.arc(TRACK.cx, TRACK.cy, TRACK.outerR, 0, Math.PI * 2);
    krCtx.strokeStyle = '#fff';
    krCtx.lineWidth = 1.5;
    krCtx.stroke();
    krCtx.beginPath();
    krCtx.arc(TRACK.cx, TRACK.cy, TRACK.innerR, 0, Math.PI * 2);
    krCtx.stroke();

    // Start/finish line
    const sfAngle = -Math.PI / 2;
    const sf1 = trackPoint(sfAngle, TRACK.innerR);
    const sf2 = trackPoint(sfAngle, TRACK.outerR);
    krCtx.beginPath();
    krCtx.moveTo(sf1.x, sf1.y);
    krCtx.lineTo(sf2.x, sf2.y);
    krCtx.strokeStyle = '#fff';
    krCtx.lineWidth = 3;
    krCtx.setLineDash([4, 4]);
    krCtx.stroke();
    krCtx.setLineDash([]);

    // Checkpoint dots (subtle)
    for (let i = 0; i < NUM_CPS; i++) {
        const a = getCheckpointAngle(i);
        const p = trackPoint(a, TRACK.innerR + 25);
        krCtx.beginPath();
        krCtx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        krCtx.fillStyle = 'rgba(255,255,255,0.15)';
        krCtx.fill();
    }

    // Bananas
    for (const b of krBananas) {
        krCtx.fillStyle = '#ffcc00';
        krCtx.beginPath();
        krCtx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        krCtx.fill();
    }

    // Shells
    for (const s of krShells) {
        krCtx.fillStyle = '#33cc33';
        krCtx.beginPath();
        krCtx.arc(s.x, s.y, 4, 0, Math.PI * 2);
        krCtx.fill();
    }

    // Draw cars
    for (const car of krCars) {
        krCtx.save();
        krCtx.translate(car.x, car.y);
        krCtx.rotate(car.angle);

        // Car body
        krCtx.fillStyle = car.hitTimer > 0 ? '#fff' : car.color;
        krCtx.fillRect(-7, -4, 14, 8);

        // Windshield
        krCtx.fillStyle = '#222';
        krCtx.fillRect(3, -3, 3, 6);

        // Speed lines when boosting
        if (car.boostTimer > 0) {
            krCtx.strokeStyle = '#ff6600';
            krCtx.lineWidth = 1;
            krCtx.beginPath();
            krCtx.moveTo(-8, -2);
            krCtx.lineTo(-14, -2);
            krCtx.moveTo(-8, 2);
            krCtx.lineTo(-14, 2);
            krCtx.stroke();
        }

        krCtx.restore();

        // Item indicator
        if (car.item) {
            krCtx.fillStyle = '#fff';
            krCtx.font = '7px monospace';
            krCtx.textAlign = 'center';
            const icon = { shell: '🔴', banana: '🍌', star: '⭐', mushroom: '🍄' }[car.item] || '?';
            krCtx.fillText(icon, car.x, car.y - 8);
        }
    }

    // Countdown
    if (krPhase === 'countdown') {
        krCtx.fillStyle = '#fff';
        krCtx.font = 'bold 40px monospace';
        krCtx.textAlign = 'center';
        krCtx.fillText(Math.ceil(krCountdown).toString(), KW / 2, KH / 2 + 12);
    }

    // HUD
    krRenderHUD();

    if (krPhase === 'results') {
        krRenderResults();
    }
}

function krRenderMenu() {
    krCtx.fillStyle = '#1a1a2e';
    krCtx.fillRect(0, 0, KW, KH);

    krCtx.fillStyle = '#ff3333';
    krCtx.font = 'bold 18px monospace';
    krCtx.textAlign = 'center';
    krCtx.fillText('KART RACING', KW / 2, 50);

    krCtx.fillStyle = '#ffcc00';
    krCtx.font = '10px monospace';
    krCtx.fillText('Top-Down Arcade Racer', KW / 2, 70);

    // Animated car
    const t = Date.now() / 1000;
    krCtx.fillStyle = '#ff3333';
    krCtx.fillRect(KW / 2 - 7 + Math.sin(t * 2) * 20, 90, 14, 8);
    krCtx.fillStyle = '#3399ff';
    krCtx.fillRect(KW / 2 - 7 + Math.cos(t * 2) * 25, 110, 14, 8);

    krCtx.fillStyle = '#aaa';
    krCtx.font = '8px monospace';
    krCtx.fillText('D-PAD = Steer & Accelerate', KW / 2, 150);
    krCtx.fillText('A = Use Item  |  B = Brake', KW / 2, 165);
    krCtx.fillText('3 Laps around the oval track', KW / 2, 180);

    krCtx.fillStyle = '#fff';
    krCtx.font = 'bold 10px monospace';
    const blink = Math.sin(Date.now() / 300) > 0;
    if (blink) krCtx.fillText('PRESS A TO START', KW / 2, 210);
}

function krRenderHUD() {
    // Position
    const positions = krCars
        .map((c, i) => ({ idx: i, lap: c.lap, cp: c.checkpoint, dist: c.finished ? c.finishTime : 0 }))
        .sort((a, b) => b.lap - a.lap || b.cp - a.cp);

    const playerPos = positions.findIndex(p => p.idx === 0) + 1;

    krCtx.fillStyle = 'rgba(0,0,0,0.6)';
    krCtx.fillRect(0, 0, KW, 22);

    krCtx.fillStyle = '#fff';
    krCtx.font = 'bold 10px monospace';
    krCtx.textAlign = 'left';
    krCtx.fillText(`POS: ${playerPos}/${krCars.length}`, 5, 14);

    krCtx.textAlign = 'center';
    krCtx.fillText(`LAP: ${Math.min(krPlayer.lap + 1, TOTAL_LAPS)}/${TOTAL_LAPS}`, KW / 2, 14);

    krCtx.textAlign = 'right';
    const mins = Math.floor(krRaceTime / 60);
    const secs = Math.floor(krRaceTime % 60);
    krCtx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, KW - 5, 14);

    // Item box
    if (krPlayer && krPlayer.item) {
        krCtx.fillStyle = 'rgba(0,0,0,0.6)';
        krCtx.fillRect(KW - 28, KH - 28, 26, 26);
        krCtx.strokeStyle = '#fff';
        krCtx.strokeRect(KW - 28, KH - 28, 26, 26);
        krCtx.font = '14px serif';
        krCtx.textAlign = 'center';
        const icon = { shell: '🔴', banana: '🍌', star: '⭐', mushroom: '🍄' }[krPlayer.item] || '?';
        krCtx.fillText(icon, KW - 15, KH - 10);
    }

    // Speed bar
    if (krPlayer) {
        const spd = Math.abs(krPlayer.speed) / (krPlayer.maxSpeed + 1.5);
        krCtx.fillStyle = 'rgba(0,0,0,0.6)';
        krCtx.fillRect(5, KH - 12, 60, 8);
        krCtx.fillStyle = spd > 0.8 ? '#ff3333' : spd > 0.5 ? '#ffcc00' : '#33cc33';
        krCtx.fillRect(6, KH - 11, 58 * spd, 6);
    }
}

function krRenderResults() {
    krCtx.fillStyle = 'rgba(0,0,0,0.7)';
    krCtx.fillRect(40, 50, KW - 80, 140);

    krCtx.fillStyle = '#ffcc00';
    krCtx.font = 'bold 14px monospace';
    krCtx.textAlign = 'center';
    krCtx.fillText('RACE COMPLETE!', KW / 2, 75);

    const positions = krCars
        .map((c, i) => ({ name: c.name, color: c.color, time: c.finishTime || 999 }))
        .sort((a, b) => a.time - b.time);

    krCtx.font = '9px monospace';
    positions.forEach((p, i) => {
        const mins = Math.floor(p.time / 60);
        const secs = (p.time % 60).toFixed(1);
        krCtx.fillStyle = p.name === 'YOU' ? '#fff' : '#aaa';
        krCtx.fillText(`${i + 1}. ${p.name}  ${mins}:${secs.padStart(5, '0')}`, KW / 2, 100 + i * 16);
    });

    krCtx.fillStyle = '#fff';
    krCtx.font = '8px monospace';
    const blink = Math.sin(Date.now() / 300) > 0;
    if (blink) krCtx.fillText('PRESS A TO CONTINUE', KW / 2, 175);
}

// ── Game Loop ─────────────────────────────────────────────────────────
function krLoop(ts) {
    if (!krRunning) return;
    const dt = Math.min((ts - krLastTime) / 1000, 0.05);
    krLastTime = ts;

    krUpdate(dt * 60);
    krRender();

    // A button on results -> back to menu
    if (krPhase === 'results' && (krKeys['z'] || krKeys['a'] || krKeys['Enter'])) {
        krPhase = 'menu';
        krKeys = {};
    }

    // A button on menu -> start race
    if (krPhase === 'menu' && (krKeys['z'] || krKeys['a'] || krKeys['Enter'])) {
        krStartRace();
        krKeys = {};
    }

    krRAF = requestAnimationFrame(krLoop);
}

function krStartRace() {
    krCars = [];
    for (let i = 0; i < 4; i++) {
        const car = createCar(CAR_COLORS[i], CAR_NAMES[i], i === 0);
        // Stagger start positions
        const startAngle = -Math.PI / 2 + (i * 0.15);
        const radius = TRACK.innerR + 20 + (i % 2) * 12;
        car.x = TRACK.cx + Math.cos(startAngle) * radius;
        car.y = TRACK.cy + Math.sin(startAngle) * radius;
        car.angle = Math.PI / 2;
        krCars.push(car);
    }
    krPlayer = krCars[0];
    krRaceTime = 0;
    krCountdown = 3;
    krPhase = 'countdown';
    krShells = [];
    krBananas = [];
    if (window.sounds) sounds.click();
}

// ── Init ──────────────────────────────────────────────────────────────
window.initKart = function() {
    const screen = document.getElementById('chameleonScreen');
    if (screen) {
        screen.innerHTML = '';
        KRCanvas.width = KW;
        KRCanvas.height = KH;
        KRCanvas.style.width = '100%';
        KRCanvas.style.height = 'auto';
        KRCanvas.style.imageRendering = 'pixelated';
        KRCanvas.style.borderRadius = '4px';
        screen.appendChild(KRCanvas);
    }
    krPhase = 'menu';
    krRunning = true;
    krLastTime = performance.now();
    if (krRAF) cancelAnimationFrame(krRAF);
    krRAF = requestAnimationFrame(krLoop);
    if (window.sounds) sounds.launch();
};

window.stopKart = function() {
    krRunning = false;
    if (krRAF) cancelAnimationFrame(krRAF);
};
