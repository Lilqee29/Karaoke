// ========== SIGNAL ZERO: A MURDER IN THE DEAD CHANNELS (v6.5 EXPANDED) ==========
// Full Detective Case Files: Suspects, Forensics, P2P Co-Op Clue Sync & Accusations!

const MYSTERY_SUSPECTS = {
    aris: {
        name: "DR. ARIS",
        role: "HEAD QUANTUM PHYSICIST",
        motive: "Stole Tachyon Buffer blueprints to patent time-messaging.",
        location: "Mess Hall (02:30 AM)",
        alibi: "Claims he was talking to Vance in Mess Hall at 02:30 AM.",
        status: "SUSPECT ⚠️"
    },
    carter: {
        name: "ENGINEER CARTER",
        role: "REACTOR & LIFE SUPPORT LEAD",
        motive: "Tampered with reactor voltage grid at 00:50 AM.",
        location: "Reactor Lower Level (01:00 AM)",
        alibi: "Claims he was fixing oxygen scrubbers.",
        status: "SUSPECT ⚠️"
    },
    rex: {
        name: "COMMANDER REX",
        role: "SECURITY CHIEF",
        motive: "Covering up classified Tachyon test failures.",
        location: "Control Deck (01:00 AM)",
        alibi: "Claims he was monitoring array communications.",
        status: "SUSPECT ⚠️"
    },
    vance: {
        name: "DR. EVELYN VANCE",
        role: "VICTIM / CHIEF RESEARCHER",
        motive: "Attempted to destroy Tachyon Buffer to stop time loop.",
        location: "Reactor Core (Found 04:12 AM)",
        alibi: "Autopsy confirms death at 01:00 AM.",
        status: "DECEASED 💀"
    }
};

const MYSTERY_EVIDENCE = [
    { id: "e1", title: "AUTOPSY REPORT", detail: "Death by high-voltage pulse at 01:00 AM. Wristwatch melted at 01:00:14 AM." },
    { id: "e2", title: "KEYCARD CHIP #4092", detail: "Timestamped 03:45 AM (Future Time). Contains encrypted message from your key." },
    { id: "e3", title: "CCTV LOG (MESS HALL)", detail: "Footage at 02:30 AM shows Aris talking to a shimmering holographic projection." },
    { id: "e4", title: "TACHYON BUFFER LOG", detail: "Outgoing 12-second transmission sent to 4 hours in the past by Chief Investigator." }
];

let unlockedClues = new Set(["e1"]);
let activeTab = "STORY";
let currentMysteryNode = "start";

window.initVoid = function() {
    window.startMystery();
};

window.startMystery = function() {
    activeTab = "STORY";
    currentMysteryNode = "start";

    // Asymmetric Clue Assignment for Co-Op mode!
    const isCoOp = window.gbConns && window.gbConns.length > 0;
    const isPeer = P2PGameEngine && P2PGameEngine.isPeer;

    if(isCoOp) {
        if(isPeer) {
            // Player 2 gets Even Clues (Keycard & Tachyon Buffer)
            unlockedClues = new Set(["e2", "e4"]);
        } else {
            // Player 1 (Host) gets Odd Clues (Autopsy & CCTV Log)
            unlockedClues = new Set(["e1", "e3"]);
        }
    } else {
        // Solo Mode: Starts with Autopsy Report, unlocks the rest as story progresses
        unlockedClues = new Set(["e1"]);
    }

    renderMysteryUI();
};

function renderMysteryUI() {
    const screen = document.getElementById('voidScreen');
    if(!screen) return;

    let tabContent = "";
    if(activeTab === "STORY") tabContent = getStoryHTML();
    else if(activeTab === "SUSPECTS") tabContent = getSuspectsHTML();
    else if(activeTab === "FORENSICS") tabContent = getForensicsHTML();
    else if(activeTab === "ACCUSE") tabContent = getAccuseHTML();

    screen.innerHTML = `
        <div style="padding: 8px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #000; color: #0f0; font-family: 'VT323', monospace;">
            <!-- DOSSIER TABS -->
            <div style="display: flex; gap: 2px; margin-bottom: 6px; flex-shrink: 0;">
                <button onclick="switchMysteryTab('STORY')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='STORY'?'#0f0':'#111'}; color: ${activeTab==='STORY'?'#000':'#0f0'}; border: 1px solid #0f0;">📜 STORY</button>
                <button onclick="switchMysteryTab('SUSPECTS')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='SUSPECTS'?'#0f0':'#111'}; color: ${activeTab==='SUSPECTS'?'#000':'#0f0'}; border: 1px solid #0f0;">🕵️ SUSPECTS</button>
                <button onclick="switchMysteryTab('FORENSICS')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='FORENSICS'?'#0f0':'#111'}; color: ${activeTab==='FORENSICS'?'#000':'#0f0'}; border: 1px solid #0f0;">🔬 CLUES (${unlockedClues.size})</button>
                <button onclick="switchMysteryTab('ACCUSE')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='ACCUSE'?'#f00':'#200'}; color: #fff; border: 1px solid #f00;">⚖️ ACCUSE</button>
            </div>

            <div style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
                ${tabContent}
            </div>

            <!-- BITCHAT P2P SHARE FOOTER -->
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #0f04; display: flex; justify-content: space-between; align-align: center; font-size: 6px;">
                <span>P2P LINK: ${window.gbConns && window.gbConns.length > 0 ? 'CONNECTED 🟢' : 'SOLO MODE 🟡'}</span>
                <button onclick="shareCluesP2P()" style="font-size: 5px; padding: 2px 6px; background: transparent; color: #0f0; border: 1px solid #0f0;">📡 SHARE CLUES VIA BITCHAT</button>
            </div>
        </div>
    `;
}

function getStoryHTML() {
    const node = MYSTERY_NODES[currentMysteryNode] || MYSTERY_NODES.start;
    let choicesHtml = node.choices.map((c) => `
        <button onclick="selectMysteryChoice('${c.next}')" style="width: 100%; text-align: left; padding: 6px; font-family: 'VT323', monospace; font-size: 8px; background: rgba(0,255,0,0.1); color: #0f0; border: 1px solid #0f0; margin-bottom: 4px; cursor: pointer;">
            ${c.label}
        </button>
    `).join('');

    return `
        <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid #0f0; padding-bottom: 2px; margin-bottom: 4px;">${node.title}</div>
        <div style="font-size: 6px; opacity: 0.7; margin-bottom: 4px; color: #ffa;">[LOG: ${node.speaker}]</div>
        <div style="font-size: 8px; line-height: 1.3; flex: 1; overflow-y: auto; white-space: pre-wrap; margin-bottom: 6px; background: rgba(0,20,0,0.8); padding: 6px; border: 1px solid #0f03;">
            ${node.text}
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
            ${choicesHtml}
        </div>
    `;
}

function getSuspectsHTML() {
    return Object.values(MYSTERY_SUSPECTS).map(s => `
        <div style="background: rgba(0,30,0,0.8); border: 1px solid #0f0; padding: 6px; margin-bottom: 6px; border-radius: 3px; font-size: 7px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 8px; color: #0f0;">
                <span>${s.name}</span>
                <span style="color: #ffa;">${s.status}</span>
            </div>
            <div style="opacity: 0.8; margin-top: 2px;">ROLE: ${s.role}</div>
            <div style="opacity: 0.8;">ALIBI: ${s.alibi}</div>
            <div style="color: #f88; margin-top: 2px;">MOTIVE: ${s.motive}</div>
        </div>
    `).join('');
}

function getForensicsHTML() {
    const isCoOp = window.gbConns && window.gbConns.length > 0;
    const coOpBanner = isCoOp ? `
        <div style="background: rgba(0,255,0,0.15); border: 1px solid #0f0; padding: 4px; margin-bottom: 6px; font-size: 6px; color: #ffa; text-align: center;">
            📡 <b>ASYMMETRIC CO-OP ACTIVE:</b> You hold 2 clues; your partner holds the other 2! Use the floating 💬 button to compare findings!
        </div>
    ` : '';

    const cluesList = MYSTERY_EVIDENCE.map(e => {
        const isUnlocked = unlockedClues.has(e.id);
        return `
            <div style="background: ${isUnlocked ? 'rgba(0,40,0,0.8)' : 'rgba(20,20,20,0.8)'}; border: 1px solid ${isUnlocked ? '#0f0' : '#444'}; padding: 6px; margin-bottom: 6px; border-radius: 3px; font-size: 7px;">
                <div style="font-weight: bold; font-size: 8px; color: ${isUnlocked ? '#0f0' : '#666'};">
                    ${isUnlocked ? '🔓 ' + e.title : '🔒 LOCKED CLUE'}
                </div>
                <div style="opacity: 0.9; margin-top: 3px; line-height: 1.3;">
                    ${isUnlocked ? e.detail : 'Investigate scene or request clue from Co-Op partner.'}
                </div>
            </div>
        `;
    }).join('');

    return coOpBanner + cluesList;
}

function getAccuseHTML() {
    return `
        <div style="padding: 6px; text-align: center; font-size: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #f00; margin-bottom: 6px;">⚖️ FINAL DEDUCTION TERMINAL</div>
            <div style="margin-bottom: 10px; opacity: 0.8;">SELECT THE CULPRIT RESPONSIBLE FOR THE PARADOX:</div>
            
            <button onclick="accuseCulprit('aris')" style="width: 100%; padding: 8px; margin-bottom: 6px; background: #200; color: #fff; border: 1px solid #f00; font-family: 'VT323';">ACCUSE DR. ARIS (STOLE TACHYON DATA)</button>
            <button onclick="accuseCulprit('carter')" style="width: 100%; padding: 8px; margin-bottom: 6px; background: #200; color: #fff; border: 1px solid #f00; font-family: 'VT323';">ACCUSE ENGINEER CARTER (REACTOR VOLTAGE)</button>
            <button onclick="accuseCulprit('paradox')" style="width: 100%; padding: 8px; background: #040; color: #0f0; border: 1px solid #0f0; font-family: 'VT323';">EXPOSE THE TEMPORAL LOOP (FUTURE SELF)</button>
        </div>
    `;
}

window.switchMysteryTab = function(tab) {
    activeTab = tab;
    renderMysteryUI();
};

window.selectMysteryChoice = function(nextNodeKey) {
    currentMysteryNode = nextNodeKey;
    if(nextNodeKey === "body") unlockedClues.add("e1");
    if(nextNodeKey === "keycard") unlockedClues.add("e2");
    if(nextNodeKey === "cctv") unlockedClues.add("e3");
    if(nextNodeKey === "terminal" || nextNodeKey === "paradox") unlockedClues.add("e4");
    renderMysteryUI();
};

window.accuseCulprit = function(culprit) {
    if(culprit === 'paradox') {
        alert("CORRECT DEDUCTION! 🏆\n\nYou proved Evelyn Vance was killed by a temporal voltage feedback loop caused by your future self's transmission!\n\nCASE RESOLVED: TIME LOOP CLOSED!");
    } else {
        alert("INCORRECT ACCUSATION! ❌\n\nYour accusation caused a paradox cascade! The temporal loop resets...");
        window.startMystery();
    }
};

window.shareCluesP2P = function() {
    if(window.gbConns && window.gbConns.length > 0) {
        window.gbConns.forEach(c => {
            if(c.open) c.send({ type: 'msg', content: `[MYSTERY CLUE SHARE] Unlocked ${unlockedClues.size}/4 clues in Signal Zero!`, nick: 'INVESTIGATOR' });
        });
        alert("CLUES SHARED WITH BITCHAT PEERS! 📡");
    } else {
        alert("NO ACTIVE BITCHAT CONNECTION. LINK DEVICES VIA BITCHAT TO CO-OP!");
    }
};
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
    if (!voidState.isAlive || voidState.meetingActive || voidState.activeTask) {
        if (voidState.meetingActive) {
            voidState.meetingTimer -= 0.1;
            if (voidState.meetingTimer <= 0) finalizeMeeting();
        }
        return;
    }

    // Movement
    let ax = 0, ay = 0;
    if (voidState.keys['ArrowUp'] || voidState.keys['w']) ay -= voidState.moveSpeed;
    if (voidState.keys['ArrowDown'] || voidState.keys['s']) ay += voidState.moveSpeed;
    if (voidState.keys['ArrowLeft'] || voidState.keys['a']) { ax -= voidState.moveSpeed; voidState.facing = 'left'; }
    if (voidState.keys['ArrowRight'] || voidState.keys['d']) { ax += voidState.moveSpeed; voidState.facing = 'right'; }

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
        updateEnhancedAI();
    }
}

function updateEnhancedAI() {
    voidState.players.forEach(p => {
        if (p.isMe || !p.isAlive) return;
        
        // Simulating Movement towards random rooms
        if (!p.targetX || Math.hypot(p.x - p.targetX, p.y - p.targetY) < 10) {
            const room = VOID_MAP.rooms[Math.floor(Math.random() * VOID_MAP.rooms.length)];
            p.targetX = room.x + room.w / 2;
            p.targetY = room.y + room.h / 2;
            p.room = room.name;
        } else {
            const dx = p.targetX - p.x;
            const dy = p.targetY - p.y;
            const dist = Math.hypot(dx, dy);
            p.x += (dx / dist) * 2;
            p.y += (dy / dist) * 2;
            p.facing = dx > 0 ? 'right' : 'left';
        }

        // Glitch Logic: Aggressive Infection
        if (p.role === 'GLITCH' && voidState.killCooldown <= 0) {
            const target = voidState.players.find(other => other !== p && other.isAlive && other.room === p.room && Math.hypot(p.x - other.x, p.y - other.y) < 50);
            if (target) {
                target.isAlive = false;
                voidState.deadBodies.push({ x: target.x, y: target.y, color: target.color, room: target.room });
                if (target.isMe) voidState.isAlive = false;
                logVoid(`${p.name} ELIMINATED ${target.name}.`);
                voidState.killCooldown = 30; // Global cooldown for AI too
            }
        }
        
        // Decoder Logic: Task Simulation
        if (p.role === 'DECODER' && Math.random() < 0.005) {
            voidState.taskProgress.completed = Math.min(voidState.taskProgress.total, voidState.taskProgress.completed + 0.1);
        }
    });

    if (voidState.taskProgress.completed >= voidState.taskProgress.total) {
        logVoid("VICTORY: ALL SYSTEMS STABILIZED.");
        endGame("DECODERS WIN");
    }
}

function finalizeMeeting() {
    voidState.meetingActive = false;
    document.getElementById('voidDebate').style.display = 'none';
    
    // Consensus voting simulation
    const alive = voidState.players.filter(p => p.isAlive);
    const voteTarget = alive[Math.floor(Math.random() * alive.length)];
    
    if (Math.random() > 0.4) {
        logVoid(`${voteTarget.name} WAS EJECTED.`);
        voteTarget.isAlive = false;
        if (voteTarget.isMe) voidState.isAlive = false;
    } else {
        logVoid("NO ONE WAS EJECTED (SKIPPED).");
    }
    
    checkWinConditions();
}

function checkWinConditions() {
    const alive = voidState.players.filter(p => p.isAlive);
    const glitches = alive.filter(p => p.role === 'GLITCH').length;
    const decoders = alive.filter(p => p.role === 'DECODER').length;

    if (glitches === 0) endGame("DECODERS WIN");
    else if (glitches >= decoders) endGame("GLITCH WINS");
}

function endGame(msg) {
    logVoid(`GAME OVER: ${msg}`);
    clearInterval(voidState.aiInterval);
    setTimeout(() => initVoid(), 5000);
}

window.voidSabotage = function() {
    if (voidState.myRole !== 'GLITCH' || !voidState.isAlive) return;
    logVoid("LIGHTS SABOTAGED.");
    voidState.sabotageActive = true;
    setTimeout(() => { voidState.sabotageActive = false; logVoid("LIGHTS RESTORED."); }, 10000);
    P2PGameEngine.send({ type: 'void-sabotage' });
};

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
    // Task Bar
    ctx.fillStyle = '#111'; ctx.fillRect(10, 10, 200, 10);
    ctx.fillStyle = 'lime'; ctx.fillRect(10, 10, (voidState.taskProgress.completed / Math.max(1, voidState.taskProgress.total)) * 200, 10);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 200, 10);
    
    if (voidState.sabotageActive) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0,0,640,480);
        ctx.fillStyle = '#f00'; ctx.font = '10px monospace';
        ctx.fillText("CRITICAL SABOTAGE: LIGHTS OFFLINE", 320, 240);
    }

    if (voidState.killCooldown > 0 && voidState.myRole === 'GLITCH') {
        ctx.fillStyle = 'white'; ctx.textAlign = 'right';
        ctx.fillText(`INFECT CD: ${Math.ceil(voidState.killCooldown)}s`, 630, 20);
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
window.voidEmergency = attemptEmergency;

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
    
    voidState.myRole = (glitchIndex === 0) ? 'GLITCH' : 'DECODER';

    ['SIGMA', 'DELTA', 'OMEGA'].forEach((n, i) => {
        const isGlitch = (glitchIndex === i + 1);
        voidState.players.push({ 
            name: n, 
            x: 200 + i*150, y: 150, 
            color: VOID_COLORS[i+1], 
            isAlive: true, isMe: false, 
            role: isGlitch ? 'GLITCH' : 'DECODER', 
            room: 'CAFETERIA',
            targetX: 0, targetY: 0
        });
    });
}
