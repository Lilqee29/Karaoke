// ========== CHAMELEON — CORE ENGINE ==========
// Parallax rendering, game phases, player management, canvas rendering

// ── Game State ──────────────────────────────────────────────────────────
let chmCanvas, chmCtx;
let chmPlayers = {};        // { id: { x, y, color, pose, painted, role, alive, frozen } }
let chmLocalPlayer = null;  // Our player ID
let chmCurrentMap = 'mansion';
let chmPhase = 'lobby';     // lobby, prep, hunt, reveal, ended
let chmTimer = 0;
let chmPrepTimer = 30;
let chmHuntTimer = 120;
let chmMyRole = null;       // 'hider' or 'seeker'
let chmGameMode = 'basic';  // basic, infection, double
let chmNumSeekers = 1;
let chmCamera = { x: 0, y: 0 }; // For parallax scrolling
let chmWandProjectiles = [];
let chmFoundEffects = [];
let chmIsHost = false;
let chmGameStarted = false;
let chmScores = {};
let chmRound = 1;
let chmIsPainting = false;
let chmSelectedObj = null;

// ── Parallax Layers ─────────────────────────────────────────────────────
const CHM_LAYERS = {
    bg:    { speed: 0.3, name: 'Background' },
    walls: { speed: 0.6, name: 'Walls' },
    objects: { speed: 0.8, name: 'Objects' },
    players: { speed: 1.0, name: 'Players' },
    fg:    { speed: 1.2, name: 'Foreground' },
};

// ── Initialize Game ─────────────────────────────────────────────────────
function chmInit() {
    chmCanvas = document.getElementById('chameleonCanvas');
    if(!chmCanvas) return;
    chmCtx = chmCanvas.getContext('2d');
    chmCanvas.width = 320;
    chmCanvas.height = 240;
    chmCanvas.style.imageRendering = 'pixelated';
    
    // Set up input handlers
    chmSetupInput();
    
    // Initialize P2P sync
    if(typeof chmSyncInit === 'function') chmSyncInit();
    
    // Draw intro
    chmDrawIntro();
}

// ── Input Setup ─────────────────────────────────────────────────────────
function chmSetupInput() {
    // Keyboard for testing
    document.addEventListener('keydown', (e) => {
        if(chmPhase === 'lobby') {
            if(e.key === 'Enter') chmStartGame();
            if(e.key === 'ArrowUp') chmChangeSeekers(1);
            if(e.key === 'ArrowDown') chmChangeSeekers(-1);
        }
        if(chmPhase === 'prep' && chmMyRole === 'hider') {
            if(e.key === 'b' || e.key === 'B') {
                chmTogglePaintMenu(chmCurrentMap, chmPlayers[chmLocalPlayer]?.x || 150, chmPlayers[chmLocalPlayer]?.y || 120);
                e.preventDefault();
            }
            if(e.key === 'Enter') chmReadyUp();
        }
        if(chmPhase === 'hunt' && chmMyRole === 'seeker') {
            if(e.key === 'z' || e.key === 'a') chmShootWand();
            if(e.key === 'x' || e.key === 'b') chmSniff();
        }
    });
    
    // Canvas click for testing
    chmCanvas.addEventListener('click', (e) => {
        if(chmPhase === 'lobby') {
            chmStartGame();
            return;
        }
        if(chmPhase === 'prep' && chmMyRole === 'hider') {
            const rect = chmCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (320 / rect.width);
            const y = (e.clientY - rect.top) * (240 / rect.height);
            if(chmPaintMenuOpen) {
                // Click in paint menu
                chmPaintMenuClick(x, y);
            } else {
                // Eye-dropper
                chmEyeDrop(chmCurrentMap, x, y);
            }
        }
        if(chmPhase === 'hunt' && chmMyRole === 'seeker') {
            chmShootWand();
        }
    });
}

// ── Start Game ──────────────────────────────────────────────────────────
function chmStartGame() {
    if(!chmGameStarted) {
        chmGameStarted = true;
        chmPhase = 'prep';
        chmPrepTimer = 30;
        chmAssignRoles();
        chmStartPrepPhase();
    }
}

// ── Assign Roles ────────────────────────────────────────────────────────
function chmAssignRoles() {
    const playerIds = Object.keys(chmPlayers);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    
    // Assign seekers
    for(let i = 0; i < chmNumSeekers && i < shuffled.length; i++) {
        chmPlayers[shuffled[i]].role = 'seeker';
        chmPlayers[shuffled[i]].alive = true;
    }
    
    // Rest are hiders
    for(let i = chmNumSeekers; i < shuffled.length; i++) {
        chmPlayers[shuffled[i]].role = 'hider';
        chmPlayers[shuffled[i]].alive = true;
        chmPlayers[shuffled[i]].painted = false;
        chmPlayers[shuffled[i]].frozen = false;
    }
    
    // Set local player role
    if(chmPlayers[chmLocalPlayer]) {
        chmMyRole = chmPlayers[chmLocalPlayer].role;
    }
    
    // Broadcast role assignment
    if(typeof chmSyncSend === 'function') {
        chmSyncSend({ type: 'roles', players: chmPlayers });
    }
}

// ── Change seekers count ────────────────────────────────────────────────
function chmChangeSeekers(delta) {
    chmNumSeekers = Math.max(1, Math.min(3, chmNumSeekers + delta));
}

// ── Prep Phase ──────────────────────────────────────────────────────────
function chmStartPrepPhase() {
    // Seeker screen goes black
    // Hiders can move, paint, choose pose
    
    const interval = setInterval(() => {
        chmPrepTimer--;
        if(chmPrepTimer <= 0) {
            clearInterval(interval);
            chmStartHuntPhase();
        }
        chmDraw();
    }, 1000);
    
    chmDraw();
}

// ── Hunt Phase ──────────────────────────────────────────────────────────
function chmStartHuntPhase() {
    chmPhase = 'hunt';
    chmHuntTimer = 120;
    
    // Freeze all hiders
    for(const id in chmPlayers) {
        if(chmPlayers[id].role === 'hider') {
            chmPlayers[id].frozen = true;
        }
    }
    
    const interval = setInterval(() => {
        chmHuntTimer--;
        if(chmHuntTimer <= 0) {
            clearInterval(interval);
            chmEndGame('hiders');
        }
        chmUpdateHunt();
        chmDraw();
    }, 1000);
    
    chmDraw();
}

// ── Update Hunt ─────────────────────────────────────────────────────────
function chmUpdateHunt() {
    // Update wand projectiles
    chmWandProjectiles.forEach((p, i) => {
        p.x += Math.cos(p.angle) * 8;
        p.y += Math.sin(p.angle) * 8;
        p.life--;
        
        // Check collision with hiders
        if(p.life > 0) {
            for(const id in chmPlayers) {
                const pl = chmPlayers[id];
                if(pl.role === 'hider' && pl.alive && pl.frozen) {
                    const dist = Math.hypot(p.x - pl.x, p.y - pl.y);
                    if(dist < 12) {
                        pl.alive = false;
                        chmFoundEffects.push({ x: pl.x, y: pl.y, life: 30 });
                        chmWandProjectiles.splice(i, 1);
                        
                        // Infection mode: found hider becomes seeker
                        if(chmGameMode === 'infection') {
                            pl.role = 'seeker';
                            pl.alive = true;
                            pl.frozen = false;
                        }
                        
                        // Broadcast
                        if(typeof chmSyncSend === 'function') {
                            chmSyncSend({ type: 'found', hiderId: id, x: pl.x, y: pl.y });
                        }
                        break;
                    }
                }
            }
        }
        
        if(p.life <= 0 || p.x < 0 || p.x > 320 || p.y < 0 || p.y > 240) {
            chmWandProjectiles.splice(i, 1);
        }
    });
    
    // Update found effects
    chmFoundEffects.forEach((e, i) => {
        e.life--;
        if(e.life <= 0) chmFoundEffects.splice(i, 1);
    });
    
    // Check win condition
    const aliveHiders = Object.values(chmPlayers).filter(p => p.role === 'hider' && p.alive).length;
    if(aliveHiders === 0) {
        clearInterval(window.chmHuntInterval);
        chmEndGame('seekers');
    }
}

// ── Shoot Wand ──────────────────────────────────────────────────────────
function chmShootWand() {
    if(chmPhase !== 'hunt' || chmMyRole !== 'seeker') return;
    
    const player = chmPlayers[chmLocalPlayer];
    if(!player) return;
    
    // Determine direction (for now, shoot right)
    const angle = 0; // Could be based on player facing direction
    
    chmWandProjectiles.push({
        x: player.x + 10,
        y: player.y,
        angle: angle,
        life: 30,
        owner: chmLocalPlayer
    });
    
    // Broadcast
    if(typeof chmSyncSend === 'function') {
        chmSyncSend({ type: 'shoot', x: player.x, y: player.y, angle });
    }
}

// ── Sniff ───────────────────────────────────────────────────────────────
function chmSniff() {
    if(chmPhase !== 'hunt' || chmMyRole !== 'seeker') return;
    
    // Find nearest hider
    let nearest = null, nearestDist = Infinity;
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        if(pl.role === 'hider' && pl.alive) {
            const dist = Math.hypot(pl.x - chmPlayers[chmLocalPlayer].x, pl.y - chmPlayers[chmLocalPlayer].y);
            if(dist < nearestDist) {
                nearestDist = dist;
                nearest = pl;
            }
        }
    }
    
    if(nearest) {
        // Show arrow pointing to nearest hider
        chmFoundEffects.push({
            x: nearest.x,
            y: nearest.y,
            life: 60,
            type: 'arrow'
        });
    }
}

// ── End Game ────────────────────────────────────────────────────────────
function chmEndGame(winner) {
    chmPhase = 'reveal';
    
    // Calculate scores
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        if(pl.role === 'hider') {
            // Score based on survival time and camouflage
            const timeScore = Math.floor((120 - chmHuntTimer) * 0.5);
            const camoScore = pl.painted ? Math.floor(chmCamouflageScore(chmCurrentMap, pl.x, pl.y, pl.paintColor || '#808080') / 2) : 0;
            chmScores[id] = timeScore + camoScore;
        } else {
            // Seeker score = hiders found
            chmScores[id] = Object.values(chmPlayers).filter(p => p.role === 'hider' && !p.alive).length * 20;
        }
    }
    
    // Draw reveal screen
    chmDrawReveal();
}

// ── Ready Up ────────────────────────────────────────────────────────────
function chmReadyUp() {
    // For now, just start the game
    if(chmPhase === 'prep') {
        chmStartHuntPhase();
    }
}

// ══════════════════════════════════════════════════════════════════════
// RENDERING
// ══════════════════════════════════════════════════════════════════════

// ── Draw Intro Screen ───────────────────────────────────────────────────
function chmDrawIntro() {
    const ctx = chmCtx;
    if(!ctx) return;
    
    // Background
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, 0, 320, 240);
    
    // Title
    ctx.fillStyle = '#9bbc0f';
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🦎 CHAMELEON', 160, 60);
    
    ctx.fillStyle = '#c9a84c';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText('Paint. Hide. Seek.', 160, 80);
    
    // Menu
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('[HOST GAME]', 160, 120);
    ctx.fillText('[JOIN GAME]', 160, 135);
    ctx.fillText('[SETTINGS]', 160, 150);
    
    // Controls hint
    ctx.fillStyle = '#666';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillText('D-PAD: MOVE  A: ACTION  B: CANCEL', 160, 210);
    ctx.fillText('START: CONFIRM  SELECT: PAUSE', 160, 225);
    
    ctx.textAlign = 'left';
}

// ── Draw Lobby ──────────────────────────────────────────────────────────
function chmDrawLobby() {
    const ctx = chmCtx;
    if(!ctx) return;
    
    // Background with parallax
    chmDrawBackground(ctx, 0, 0);
    
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 320, 240);
    
    // Title
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🦎 CHAMELEON LOBBY', 160, 30);
    
    // Settings
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('MODE: ' + chmGameMode.toUpperCase(), 160, 55);
    ctx.fillText('MAP: ' + CHM_MAPS[chmCurrentMap]?.name || 'Mansion', 160, 68);
    ctx.fillText('SEEKERS: ' + chmNumSeekers, 160, 81);
    ctx.fillText('TIMER: 2:00', 160, 94);
    
    // Player list
    ctx.fillStyle = '#aaa';
    ctx.fillText('PLAYERS (' + Object.keys(chmPlayers).length + '/8):', 160, 120);
    
    let i = 0;
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        const isMe = id === chmLocalPlayer;
        ctx.fillStyle = isMe ? '#ffdd00' : '#9bbc0f';
        ctx.fillText((isMe ? '★ ' : '') + (pl.nick || 'PLAYER ' + (i+1)), 160, 135 + i * 12);
        i++;
    }
    
    // Start button (host only)
    if(chmIsHost) {
        ctx.fillStyle = '#306230';
        ctx.fillRect(90, 180, 140, 24);
        ctx.fillStyle = '#9bbc0f';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.fillText('START GAME', 160, 195);
    } else {
        ctx.fillStyle = '#666';
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.fillText('WAITING FOR HOST...', 160, 195);
    }
    
    ctx.fillStyle = '#666';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillText('UP/DOWN: SEEKERS  ENTER: START', 160, 225);
    
    ctx.textAlign = 'left';
}

// ── Draw Game (Parallax) ────────────────────────────────────────────────
function chmDraw() {
    const ctx = chmCtx;
    if(!ctx || chmPhase === 'lobby' || chmPhase === 'ended') return;
    
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 320, 240);
    
    // Draw parallax layers
    chmDrawLayer(ctx, 'bg', 0);
    chmDrawLayer(ctx, 'walls', 1);
    chmDrawLayer(ctx, 'objects', 2);
    chmDrawLayer(ctx, 'players', 3);
    chmDrawLayer(ctx, 'fg', 4);
    
    // Draw HUD
    chmDrawHUD(ctx);
    
    // Draw paint menu if open
    if(chmPaintMenuOpen) {
        chmDrawPaintMenu(ctx, 320, 240);
    }
}

// ── Draw Parallax Layer ─────────────────────────────────────────────────
function chmDrawLayer(ctx, layerName, layerIdx) {
    const layer = CHM_LAYERS[layerName];
    if(!layer) return;
    
    const parallaxX = chmCamera.x * (layer.speed - 1) * 0.3;
    const parallaxY = chmCamera.y * (layer.speed - 1) * 0.3;
    
    ctx.save();
    ctx.translate(parallaxX, parallaxY);
    
    if(layerName === 'bg') {
        chmDrawBackground(ctx, parallaxX, parallaxY);
    } else if(layerName === 'walls') {
        chmDrawWalls(ctx);
    } else if(layerName === 'objects') {
        chmDrawObjects(ctx);
    } else if(layerName === 'players') {
        chmDrawPlayers(ctx);
    } else if(layerName === 'fg') {
        chmDrawForeground(ctx);
    }
    
    ctx.restore();
}

// ── Draw Background ─────────────────────────────────────────────────────
function chmDrawBackground(ctx, offsetX, offsetY) {
    const pal = CHM_PALETTES[chmCurrentMap];
    if(!pal) return;
    
    // Sky/ceiling gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 80);
    grad.addColorStop(0, pal.wallTop || '#3a3a5a');
    grad.addColorStop(1, pal.wallDark || '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(-offsetX * 0.3, -offsetY * 0.3, 320 + offsetX * 0.6, 240 + offsetY * 0.6);
    
    // Ceiling texture
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for(let i = 0; i < 320; i += 20) {
        ctx.fillRect(i - offsetX * 0.3, 0, 1, 80);
    }
}

// ── Draw Walls ──────────────────────────────────────────────────────────
function chmDrawWalls(ctx) {
    const map = CHM_MAPS[chmCurrentMap];
    if(!map) return;
    const pal = CHM_PALETTES[chmCurrentMap];
    
    for(let y = 0; y < CHM_ROWS; y++) {
        for(let x = 0; x < CHM_COLS; x++) {
            const tile = map.tiles[y][x];
            if(tile === 1) { // Wall
                ctx.fillStyle = y < 2 ? pal.wallTop : pal.wall;
                ctx.fillRect(x * CHM_TILE, y * CHM_TILE, CHM_TILE, CHM_TILE);
                
                // Wall texture
                ctx.strokeStyle = chmDarken(ctx.fillStyle, 0.1);
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x * CHM_TILE, y * CHM_TILE, CHM_TILE, CHM_TILE);
            }
        }
    }
}

// ── Draw Floor ──────────────────────────────────────────────────────────
function chmDrawFloor(ctx) {
    const map = CHM_MAPS[chmCurrentMap];
    if(!map) return;
    const pal = CHM_PALETTES[chmCurrentMap];
    
    for(let y = 0; y < CHM_ROWS; y++) {
        for(let x = 0; x < CHM_COLS; x++) {
            const tile = map.tiles[y][x];
            if(tile === 0 || tile === 3 || tile === 4 || tile === 5) {
                const color = chmGetTileColor(chmCurrentMap, x, y);
                ctx.fillStyle = color;
                ctx.fillRect(x * CHM_TILE, y * CHM_TILE, CHM_TILE, CHM_TILE);
                
                // Floor texture
                ctx.strokeStyle = chmDarken(color, 0.05);
                ctx.lineWidth = 0.3;
                ctx.strokeRect(x * CHM_TILE, y * CHM_TILE, CHM_TILE, CHM_TILE);
            }
        }
    }
}

// ── Draw Objects ────────────────────────────────────────────────────────
function chmDrawObjects(ctx) {
    const map = CHM_MAPS[chmCurrentMap];
    if(!map) return;
    const pal = CHM_PALETTES[chmCurrentMap];
    
    // Draw floor first
    chmDrawFloor(ctx);
    
    // Draw objects
    map.objects.forEach(obj => {
        const render = CHM_OBJ_RENDER[obj.type];
        if(!render) return;
        
        const x = obj.x * CHM_TILE;
        const y = obj.y * CHM_TILE;
        const w = obj.w * CHM_TILE;
        const h = obj.h * CHM_TILE;
        
        // Draw object
        ctx.fillStyle = render.color;
        ctx.fillRect(x, y, w, h);
        
        // Accent
        ctx.fillStyle = render.accent;
        ctx.fillRect(x, y, w, 4);
        
        // Object-specific details
        if(obj.type === 'bookshelf') {
            for(let i = 0; i < 3; i++) {
                ctx.fillStyle = render.accent;
                ctx.fillRect(x + 2, y + 6 + i * 4, w - 4, 2);
            }
        } else if(obj.type === 'desk') {
            ctx.fillStyle = render.accent;
            ctx.fillRect(x + 2, y + 2, w - 4, 2);
        } else if(obj.type === 'bed') {
            ctx.fillStyle = '#4080a0';
            ctx.fillRect(x + 2, y + 2, w - 4, 4);
        } else if(obj.type === 'fountain') {
            ctx.fillStyle = '#4a8aba';
            ctx.fillRect(x + w/2 - 3, y + 2, 6, 6);
        } else if(obj.type === 'tree') {
            ctx.fillStyle = '#2a6a1a';
            ctx.beginPath();
            ctx.arc(x + w/2, y + 4, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if(obj.type === 'chalkboard') {
            ctx.fillStyle = '#1a3a1a';
            ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x, y + h, w, 3);
    });
}

// ── Draw Players ────────────────────────────────────────────────────────
function chmDrawPlayers(ctx) {
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        if(!pl.alive && pl.role === 'hider') continue;
        
        // Draw player body
        const color = pl.painted ? pl.paintColor : '#ffffff';
        const pattern = pl.painted ? pl.paintPattern : 'solid';
        const pose = pl.painted ? pl.paintPose : 'stand';
        
        const isLocal = id === chmLocalPlayer;
        const isFound = !pl.alive;
        
        chmDrawBody(ctx, pl.x, pl.y, color, pattern, pose, 
            pl.role === 'hider', 
            pl.frozen || chmPhase === 'hunt',
            isFound);
        
        // Player name tag
        ctx.fillStyle = isLocal ? '#ffdd00' : '#9bbc0f';
        ctx.font = '4px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(pl.nick || 'P' + id.slice(0,3), pl.x, pl.y - 16);
    }
    
    // Draw wand projectiles
    chmWandProjectiles.forEach(p => {
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(p.x - 2, p.y - 2, 4, 4);
    });
    
    // Draw found effects
    chmFoundEffects.forEach(e => {
        if(e.type === 'arrow') {
            ctx.fillStyle = 'rgba(255,221,0,0.7)';
            ctx.font = '8px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('↑', e.x, e.y - 10);
        } else {
            ctx.fillStyle = 'rgba(255,68,68,0.5)';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 15 - e.life, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.textAlign = 'left';
}

// ── Draw Foreground ─────────────────────────────────────────────────────
function chmDrawForeground(ctx) {
    // Could add rain, snow, or other foreground effects
    const pal = CHM_PALETTES[chmCurrentMap];
    if(!pal) return;
    
    // Subtle vignette
    const grad = ctx.createRadialGradient(160, 120, 100, 160, 120, 180);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 320, 240);
}

// ── Draw HUD ────────────────────────────────────────────────────────────
function chmDrawHUD(ctx) {
    // Top bar
    ctx.fillStyle = 'rgba(15,56,15,0.8)';
    ctx.fillRect(0, 0, 320, 18);
    
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    
    // Phase indicator
    const phaseText = {
        prep: 'PREP PHASE',
        hunt: 'HUNT PHASE',
        reveal: 'REVEAL',
    }[chmPhase] || '';
    ctx.fillText(phaseText, 5, 12);
    
    // Timer
    ctx.textAlign = 'center';
    let timer = chmPhase === 'prep' ? chmPrepTimer : chmHuntTimer;
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, 160, 12);
    
    // Role
    ctx.textAlign = 'right';
    ctx.fillText(chmMyRole === 'seeker' ? '🔍 SEEKER' : '🎨 HIDER', 315, 12);
    
    // Bottom bar (seeker only)
    if(chmMyRole === 'seeker' && chmPhase === 'hunt') {
        ctx.fillStyle = 'rgba(15,56,15,0.8)';
        ctx.fillRect(0, 222, 320, 18);
        ctx.fillStyle = '#9bbc0f';
        ctx.font = '5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('A: SHOOT  B: SNIFF', 160, 234);
    }
    
    // Minimap
    chmDrawMinimap(ctx);
    
    ctx.textAlign = 'left';
}

// ── Draw Minimap ────────────────────────────────────────────────────────
function chmDrawMinimap(ctx) {
    const mw = 60, mh = 45;
    const mx = 250, my = 150;
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#9bbc0f';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    
    // Mini map
    const map = CHM_MAPS[chmCurrentMap];
    if(!map) return;
    
    const scaleX = mw / (CHM_COLS * CHM_TILE);
    const scaleY = mh / (CHM_ROWS * CHM_TILE);
    
    for(let y = 0; y < CHM_ROWS; y++) {
        for(let x = 0; x < CHM_COLS; x++) {
            const tile = map.tiles[y][x];
            if(tile === 1) {
                ctx.fillStyle = '#306230';
                ctx.fillRect(mx + x * CHM_TILE * scaleX, my + y * CHM_TILE * scaleY, CHM_TILE * scaleX, CHM_TILE * scaleY);
            } else if(tile === 2) {
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(mx + x * CHM_TILE * scaleX, my + y * CHM_TILE * scaleY, CHM_TILE * scaleX, CHM_TILE * scaleY);
            }
        }
    }
    
    // Players on minimap
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        const px = mx + pl.x * scaleX;
        const py = my + pl.y * scaleY;
        
        if(pl.role === 'seeker') {
            ctx.fillStyle = '#ff4444';
        } else if(!pl.alive) {
            ctx.fillStyle = '#ff0000';
        } else if(pl.frozen) {
            ctx.fillStyle = '#00aa00';
        } else {
            ctx.fillStyle = '#00ffff';
        }
        
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ── Draw Reveal Screen ──────────────────────────────────────────────────
function chmDrawReveal() {
    const ctx = chmCtx;
    if(!ctx) return;
    
    // Draw final state
    chmDraw();
    
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, 320, 240);
    
    // Results
    ctx.fillStyle = '#c9a84c';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 ROUND OVER 🎉', 160, 40);
    
    const winner = Object.values(chmPlayers).some(p => p.role === 'hider' && p.alive) ? 'Hiders Win!' : 'Seekers Win!';
    ctx.fillStyle = '#9bbc0f';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(winner, 160, 65);
    
    // Scores
    ctx.fillStyle = '#aaa';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.fillText('SCORES:', 160, 90);
    
    let i = 0;
    for(const id in chmPlayers) {
        const pl = chmPlayers[id];
        const score = chmScores[id] || 0;
        ctx.fillStyle = id === chmLocalPlayer ? '#ffdd00' : '#9bbc0f';
        ctx.fillText(`${pl.nick || 'P'+(i+1)}: ${score}`, 160, 105 + i * 12);
        i++;
    }
    
    ctx.fillStyle = '#666';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillText('PRESS START FOR LOBBY', 160, 220);
    
    ctx.textAlign = 'left';
}

// ══════════════════════════════════════════════════════════════════════
// GAME CONTROLS (called by app.js or keyboard)
// ══════════════════════════════════════════════════════════════════════

// ── D-pad movement ──────────────────────────────────────────────────────
window.chmDpad = function(dir) {
    if(chmPhase !== 'prep' || chmMyRole !== 'hider') return;
    if(chmPaintMenuOpen) return;
    
    const player = chmPlayers[chmLocalPlayer];
    if(!player || !player.alive) return;
    
    const speed = 2;
    const map = CHM_MAPS[chmCurrentMap];
    if(!map) return;
    
    let nx = player.x, ny = player.y;
    if(dir === 'up') ny -= speed;
    if(dir === 'down') ny += speed;
    if(dir === 'left') nx -= speed;
    if(dir === 'right') nx += speed;
    
    // Collision check
    const tx = Math.floor(nx / CHM_TILE);
    const ty = Math.floor(ny / CHM_TILE);
    if(!chmIsSolid(chmCurrentMap, tx, ty)) {
        player.x = nx;
        player.y = ny;
        
        // Update camera to follow
        chmCamera.x = player.x - 160;
        chmCamera.y = player.y - 120;
        
        // Broadcast
        if(typeof chmSyncSend === 'function') {
            chmSyncSend({ type: 'move', x: player.x, y: player.y });
        }
        
        chmDraw();
    }
};

// ── A button ────────────────────────────────────────────────────────────
window.chmBtnA = function() {
    if(chmPhase === 'lobby') {
        chmStartGame();
        return;
    }
    if(chmPhase === 'prep' && chmMyRole === 'hider') {
        if(chmPaintMenuOpen) {
            // Select color in paint menu
            chmPaintMenuClick(chmPlayers[chmLocalPlayer]?.x || 150, chmPlayers[chmLocalPlayer]?.y || 120);
        } else {
            // Eye-dropper
            const player = chmPlayers[chmLocalPlayer];
            if(player) {
                chmEyeDrop(chmCurrentMap, player.x, player.y);
                chmDraw();
            }
        }
    }
    if(chmPhase === 'hunt' && chmMyRole === 'seeker') {
        chmShootWand();
    }
};

// ── B button ────────────────────────────────────────────────────────────
window.chmBtnB = function() {
    if(chmPhase === 'prep' && chmMyRole === 'hider') {
        if(chmPaintMenuOpen) {
            chmPaintMenuOpen = false;
        } else {
            chmTogglePaintMenu(chmCurrentMap, chmPlayers[chmLocalPlayer]?.x || 150, chmPlayers[chmLocalPlayer]?.y || 120);
        }
        chmDraw();
    }
};

// ── START button ────────────────────────────────────────────────────────
window.chmBtnStart = function() {
    if(chmPhase === 'lobby') chmStartGame();
    if(chmPhase === 'prep') chmReadyUp();
    if(chmPhase === 'reveal') {
        chmPhase = 'lobby';
        chmGameStarted = false;
        chmDrawLobby();
    }
};

// ── SELECT button ───────────────────────────────────────────────────────
window.chmBtnSelect = function() {
    if(chmPhase === 'lobby') {
        // Cycle game mode
        const modes = ['basic', 'infection', 'double'];
        const i = modes.indexOf(chmGameMode);
        chmGameMode = modes[(i + 1) % modes.length];
        chmNumSeekers = chmGameMode === 'double' ? 2 : 1;
        chmDrawLobby();
    }
};

// ── Paint Menu Click ────────────────────────────────────────────────────
function chmPaintMenuClick(x, y) {
    // Simplified: cycle through sampled colors
    const idx = chmSampledColors.indexOf(chmSelectedColor);
    chmSelectedColor = chmSampledColors[(idx + 1) % chmSampledColors.length];
    
    // Apply to player
    const player = chmPlayers[chmLocalPlayer];
    if(player) {
        chmApplyPaint(player);
    }
    chmDraw();
}

// ══════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════
window.chmInit = chmInit;
window.chmDraw = chmDraw;
window.chmDrawLobby = chmDrawLobby;
window.chmDrawIntro = chmDrawIntro;
window.chmPlayers = chmPlayers;
window.chmCurrentMap = chmCurrentMap;
window.chmPhase = chmPhase;

// Main init function called by launchApp('chameleon')
window.initChameleon = function() {
    chmInit();
    chmSetupInput();
};
