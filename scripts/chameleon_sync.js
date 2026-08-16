// ========== CHAMELEON — P2P SYNC LAYER ==========
// Host-authoritative multiplayer sync for 8 players via BitChat P2P

// ── Sync State ──────────────────────────────────────────────────────────
let chmSyncHost = false;
let chmSyncPeers = {};    // { id: connection }
let chmSyncPlayerId = null;
let chmSyncPlayerNick = 'PLAYER';
let chmSyncTickRate = 15; // 15fps state broadcast
let chmSyncTickInterval = null;
let chmSyncInputBuffer = [];

// ── Initialize Sync ─────────────────────────────────────────────────────
function chmSyncInit() {
    // Get player ID and nick from BitChat
    chmSyncPlayerId = window.gb_freq || 'anon-' + Math.random().toString(36).slice(2, 8);
    chmSyncPlayerNick = document.getElementById('chatNick')?.value || 'PLAYER';
    
    // Register as player
    chmSyncRegisterPlayer();
    
    // Set up message handler
    window.onP2PGameData = function(payload) {
        if(!payload || !payload.type) return;
        
        switch(payload.type) {
            case 'join':
                chmSyncHandleJoin(payload);
                break;
            case 'state':
                chmSyncHandleState(payload);
                break;
            case 'input':
                chmSyncHandleInput(payload);
                break;
            case 'roles':
                chmSyncHandleRoles(payload);
                break;
            case 'found':
                chmSyncHandleFound(payload);
                break;
            case 'shoot':
                chmSyncHandleShoot(payload);
                break;
            case 'paint':
                chmSyncHandlePaint(payload);
                break;
            case 'start':
                chmSyncHandleStart(payload);
                break;
            case 'settings':
                chmSyncHandleSettings(payload);
                break;
        }
    };
    
    // If we're the host, start broadcasting
    if(chmSyncHost) {
        chmSyncStartBroadcast();
    }
}

// ── Register Player ─────────────────────────────────────────────────────
function chmSyncRegisterPlayer() {
    // Add self to players list
    chmPlayers[chmSyncPlayerId] = {
        id: chmSyncPlayerId,
        nick: chmSyncPlayerNick,
        x: 150,
        y: 120,
        role: null,
        alive: true,
        frozen: false,
        painted: false,
        color: '#ffffff',
        pose: 'stand',
        pattern: 'solid',
        ready: false
    };
    
    chmLocalPlayer = chmSyncPlayerId;
    
    // Broadcast join to all peers
    chmSyncSend({
        type: 'join',
        id: chmSyncPlayerId,
        nick: chmSyncPlayerNick,
        x: 150,
        y: 120
    });
}

// ── Send Message to All Peers ───────────────────────────────────────────
function chmSyncSend(payload) {
    if(!window.gbConns || window.gbConns.length === 0) {
        // No peers — solo mode
        return;
    }
    
    // Send to all connected peers
    window.gbConns.forEach(conn => {
        if(conn.open) {
            conn.send({ type: 'p2p-game', payload: payload });
        }
    });
}

// ── Start Broadcasting State (Host only) ────────────────────────────────
function chmSyncStartBroadcast() {
    if(chmSyncTickInterval) clearInterval(chmSyncTickInterval);
    
    chmSyncTickInterval = setInterval(() => {
        if(chmPhase === 'lobby' || chmPhase === 'prep' || chmPhase === 'hunt') {
            chmSyncBroadcastState();
        }
    }, 1000 / chmSyncTickRate);
}

// ── Broadcast Game State ────────────────────────────────────────────────
function chmSyncBroadcastState() {
    const state = {
        type: 'state',
        phase: chmPhase,
        timer: chmPhase === 'prep' ? chmPrepTimer : chmHuntTimer,
        players: {},
        projectiles: chmWandProjectiles,
        effects: chmFoundEffects,
        map: chmCurrentMap,
        round: chmRound
    };
    
    // Serialize players (remove functions)
    for(const id in chmPlayers) {
        const p = chmPlayers[id];
        state.players[id] = {
            id: p.id,
            nick: p.nick,
            x: p.x,
            y: p.y,
            role: p.role,
            alive: p.alive,
            frozen: p.frozen,
            painted: p.painted,
            color: p.paintColor || p.color,
            pattern: p.paintPattern || 'solid',
            pose: p.paintPose || 'stand',
            ready: p.ready
        };
    }
    
    chmSyncSend(state);
}

// ── Handle Incoming State ───────────────────────────────────────────────
function chmSyncHandleState(payload) {
    // Update local state from host
    if(payload.players) {
        for(const id in payload.players) {
            if(id !== chmSyncPlayerId) {
                chmPlayers[id] = payload.players[id];
            }
        }
    }
    
    // Update phase and timer
    chmPhase = payload.phase;
    if(chmPhase === 'prep') chmPrepTimer = payload.timer;
    if(chmPhase === 'hunt') chmHuntTimer = payload.timer;
    chmCurrentMap = payload.map;
    chmRound = payload.round;
    
    // Update projectiles and effects
    chmWandProjectiles = payload.projectiles || [];
    chmFoundEffects = payload.effects || [];
    
    // Redraw
    if(typeof chmDraw === 'function') chmDraw();
}

// ── Handle Join ─────────────────────────────────────────────────────────
function chmSyncHandleJoin(payload) {
    if(payload.id === chmSyncPlayerId) return; // Ignore self
    
    // Add new player
    chmPlayers[payload.id] = {
        id: payload.id,
        nick: payload.nick,
        x: payload.x,
        y: payload.y,
        role: null,
        alive: true,
        frozen: false,
        painted: false,
        color: '#ffffff',
        pose: 'stand',
        ready: false
    };
    
    // Broadcast existing players to new player
    if(chmSyncHost) {
        chmSyncSend({
            type: 'sync-players',
            players: chmPlayers
        });
    }
}

// ── Handle Input ────────────────────────────────────────────────────────
function chmSyncHandleInput(payload) {
    if(payload.id === chmSyncPlayerId) return; // Ignore self
    
    const player = chmPlayers[payload.id];
    if(!player) return;
    
    // Apply input (host validates)
    if(payload.dir) {
        const speed = 2;
        if(payload.dir === 'up') player.y -= speed;
        if(payload.dir === 'down') player.y += speed;
        if(payload.dir === 'left') player.x -= speed;
        if(payload.dir === 'right') player.x += speed;
    }
    
    if(payload.btnA) {
        // Handle A button actions
    }
    
    if(payload.btnB) {
        // Handle B button actions
    }
}

// ── Handle Roles ────────────────────────────────────────────────────────
function chmSyncHandleRoles(payload) {
    for(const id in payload.players) {
        if(chmPlayers[id]) {
            chmPlayers[id].role = payload.players[id].role;
            chmPlayers[id].alive = payload.players[id].alive;
            chmPlayers[id].frozen = payload.players[id].frozen;
        }
    }
    chmMyRole = chmPlayers[chmSyncPlayerId]?.role || null;
}

// ── Handle Found ────────────────────────────────────────────────────────
function chmSyncHandleFound(payload) {
    if(chmPlayers[payload.hiderId]) {
        chmPlayers[payload.hiderId].alive = false;
        chmFoundEffects.push({ x: payload.x, y: payload.y, life: 30 });
    }
}

// ── Handle Shoot ────────────────────────────────────────────────────────
function chmSyncHandleShoot(payload) {
    chmWandProjectiles.push({
        x: payload.x,
        y: payload.y,
        angle: payload.angle,
        life: 30,
        owner: payload.id
    });
}

// ── Handle Paint ────────────────────────────────────────────────────────
function chmSyncHandlePaint(payload) {
    if(chmPlayers[payload.id]) {
        chmPlayers[payload.id].paintColor = payload.color;
        chmPlayers[payload.id].paintPattern = payload.pattern;
        chmPlayers[payload.id].paintPose = payload.pose;
        chmPlayers[payload.id].painted = true;
    }
}

// ── Handle Start ────────────────────────────────────────────────────────
function chmSyncHandleStart(payload) {
    chmPhase = 'prep';
    chmPrepTimer = 30;
    chmCurrentMap = payload.map;
    chmGameMode = payload.mode;
    chmNumSeekers = payload.seekers;
    chmAssignRoles();
    chmStartPrepPhase();
}

// ── Handle Settings ─────────────────────────────────────────────────────
function chmSyncHandleSettings(payload) {
    chmGameMode = payload.mode;
    chmCurrentMap = payload.map;
    chmNumSeekers = payload.seekers;
    chmHuntTimer = payload.timer;
}

// ── Send Input (Client → Host) ───────────────────────────────────────────
function chmSyncSendInput(dir, btnA, btnB) {
    chmSyncSend({
        type: 'input',
        id: chmSyncPlayerId,
        dir: dir,
        btnA: btnA,
        btnB: btnB
    });
}

// ── Send Paint (Client → Host) ───────────────────────────────────────────
function chmSyncSendPaint(color, pattern, pose) {
    chmSyncSend({
        type: 'paint',
        id: chmSyncPlayerId,
        color: color,
        pattern: pattern,
        pose: pose
    });
}

// ── Send Found (Seeker → All) ────────────────────────────────────────────
function chmSyncSendFound(hiderId, x, y) {
    chmSyncSend({
        type: 'found',
        hiderId: hiderId,
        x: x,
        y: y
    });
}

// ── Send Shoot (Seeker → All) ───────────────────────────────────────────
function chmSyncSendShoot(x, y, angle) {
    chmSyncSend({
        type: 'shoot',
        id: chmSyncPlayerId,
        x: x,
        y: y,
        angle: angle
    });
}

// ── Check if connected to peers ─────────────────────────────────────────
function chmSyncIsConnected() {
    return window.gbConns && window.gbConns.some(c => c.open);
}

// ── Get player count ────────────────────────────────────────────────────
function chmSyncPlayerCount() {
    return Object.keys(chmPlayers).length;
}

// ── Set host ────────────────────────────────────────────────────────────
function chmSyncSetHost(isHost) {
    chmSyncHost = isHost;
    if(isHost) {
        chmSyncStartBroadcast();
    }
}

// ══════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════
window.chmSyncInit = chmSyncInit;
window.chmSyncSend = chmSyncSend;
window.chmSyncSendInput = chmSyncSendInput;
window.chmSyncSendPaint = chmSyncSendPaint;
window.chmSyncSendFound = chmSyncSendFound;
window.chmSyncSendShoot = chmSyncSendShoot;
window.chmSyncIsConnected = chmSyncIsConnected;
window.chmSyncPlayerCount = chmSyncPlayerCount;
window.chmSyncSetHost = chmSyncSetHost;
