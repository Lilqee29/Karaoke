// ========== CHAMELEON — PAINT SYSTEM ==========
// Eye-dropper, color picker, patterns, poses for hider camouflage

// ── Pose Definitions ────────────────────────────────────────────────────
const CHM_POSES = {
    stand:  { name: 'Stand',  w: 10, h: 16, shadow: 1.0 },
    crouch: { name: 'Crouch', w: 10, h: 12, shadow: 0.7 },
    leanL:  { name: 'Lean ←', w: 12, h: 14, shadow: 0.85 },
    leanR:  { name: 'Lean →', w: 12, h: 14, shadow: 0.85 },
    flat:   { name: 'Flat',   w: 14, h: 8,  shadow: 0.5 },
};

// ── Pattern Definitions ─────────────────────────────────────────────────
const CHM_PATTERNS = {
    solid:   { name: 'Solid',   fn: (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); } },
    stripe:  { name: 'Stripes', fn: (ctx, x, y, w, h, c) => {
        ctx.fillStyle = c; ctx.fillRect(x,y,w,h);
        ctx.fillStyle = chmDarken(c, 0.2);
        for(let i = 0; i < h; i += 4) ctx.fillRect(x, y+i, w, 2);
    }},
    dots:    { name: 'Dots',    fn: (ctx, x, y, w, h, c) => {
        ctx.fillStyle = c; ctx.fillRect(x,y,w,h);
        ctx.fillStyle = chmLighten(c, 0.2);
        for(let py = y+2; py < y+h; py += 5)
            for(let px = x+2; px < x+w; px += 5)
                ctx.fillRect(px, py, 2, 2);
    }},
    gradient:{ name: 'Gradient', fn: (ctx, x, y, w, h, c) => {
        const g = ctx.createLinearGradient(x, y, x, y+h);
        g.addColorStop(0, chmLighten(c, 0.15));
        g.addColorStop(0.5, c);
        g.addColorStop(1, chmDarken(c, 0.15));
        ctx.fillStyle = g; ctx.fillRect(x,y,w,h);
    }},
};

// ── Paint State ─────────────────────────────────────────────────────────
let chmPaintMenuOpen = false;
let chmSelectedColor = '#808080';
let chmSelectedPattern = 'solid';
let chmSelectedPose = 'stand';
let chmSampledColors = ['#808080', '#606060', '#a0a0a0', '#404040'];
let chmBrushSize = 1; // 1=small, 2=medium, 3=large

// ── Color Utilities ─────────────────────────────────────────────────────
function chmHexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return { r, g, b };
}

function chmRgbToHex(r, g, b) {
    return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
}

function chmDarken(hex, amount) {
    const { r, g, b } = chmHexToRgb(hex);
    return chmRgbToHex(r*(1-amount), g*(1-amount), b*(1-amount));
}

function chmLighten(hex, amount) {
    const { r, g, b } = chmHexToRgb(hex);
    return chmRgbToHex(r+(255-r)*amount, g+(255-g)*amount, b+(255-b)*amount);
}

function chmColorDistance(c1, c2) {
    const a = chmHexToRgb(c1), b = chmHexToRgb(c2);
    return Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2);
}

function chmBlendColors(c1, c2, t) {
    const a = chmHexToRgb(c1), b = chmHexToRgb(c2);
    return chmRgbToHex(
        a.r + (b.r - a.r) * t,
        a.g + (b.g - a.g) * t,
        a.b + (b.b - a.b) * t
    );
}

// ── Eye-Dropper ─────────────────────────────────────────────────────────
function chmEyeDrop(mapKey, px, py) {
    const colors = chmGetSurroundingColors(mapKey, px, py);
    if(colors.length > 0) {
        chmSampledColors = colors.slice(0, 4);
        chmSelectedColor = colors[0]; // Most common nearby color
        return colors[0];
    }
    return null;
}

// ── Draw Humanoid Body ──────────────────────────────────────────────────
function chmDrawBody(ctx, x, y, color, pattern, pose, isHider, isFrozen, isFound) {
    const p = CHM_POSES[pose] || CHM_POSES.stand;
    const pat = CHM_PATTERNS[pattern] || CHM_PATTERNS.solid;
    
    const bx = x - p.w/2;
    const by = y - p.h;
    
    ctx.save();
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, p.w * 0.4 * p.shadow, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    if(isFound) {
        // Found = bright red flash
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(bx, by, p.w, p.h);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, p.w, p.h);
    } else if(isHider && isFrozen) {
        // Frozen hider — draw with camouflage
        pat.fn(ctx, bx, by, p.w, p.h, color);
        
        // Subtle outline (what seekers look for)
        ctx.strokeStyle = chmDarken(color, 0.3);
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, p.w, p.h);
        
        // Eye dots (subtle giveaway)
        ctx.fillStyle = chmDarken(color, 0.5);
        ctx.fillRect(x - 2, by + 3, 2, 2);
        ctx.fillRect(x + 1, by + 3, 2, 2);
    } else if(isHider) {
        // Hider during prep — white body with color preview
        pat.fn(ctx, bx, by, p.w, p.h, color);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, p.w, p.h);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 2, by + 3, 2, 2);
        ctx.fillRect(x + 1, by + 3, 2, 2);
    } else {
        // Seeker — dark outfit with wand
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(bx, by, p.w, p.h);
        ctx.strokeStyle = '#c9a84c';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, p.w, p.h);
        
        // Eyes (red glow)
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x - 2, by + 3, 2, 2);
        ctx.fillRect(x + 1, by + 3, 2, 2);
        
        // Wand
        ctx.fillStyle = '#c9a84c';
        ctx.fillRect(x + p.w/2, by + 5, 6, 2);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(x + p.w/2 + 5, by + 4, 3, 4);
    }
    
    // Frozen indicator
    if(isFrozen && isHider) {
        ctx.fillStyle = 'rgba(100,200,255,0.3)';
        ctx.fillRect(bx - 1, by - 1, p.w + 2, p.h + 2);
    }
    
    ctx.restore();
}

// ── Draw Paint Menu (on-canvas HUD) ─────────────────────────────────────
function chmDrawPaintMenu(ctx, canvasW, canvasH) {
    if(!chmPaintMenuOpen) return;
    
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    const mw = 200, mh = 180;
    const mx = (canvasW - mw) / 2;
    const my = (canvasH - mh) / 2;
    
    // Menu background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);
    
    // Title
    ctx.fillStyle = '#c9a84c';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 PAINT MODE', mx + mw/2, my + 14);
    
    // Current color preview
    ctx.fillStyle = chmSelectedColor;
    ctx.fillRect(mx + 10, my + 24, 20, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(mx + 10, my + 24, 20, 20);
    
    // Sampled colors
    ctx.fillStyle = '#aaa';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SAMPLED:', mx + 38, my + 32);
    chmSampledColors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(mx + 38 + i * 22, my + 36, 18, 10);
        if(c === chmSelectedColor) {
            ctx.strokeStyle = '#ffdd00';
            ctx.lineWidth = 1;
            ctx.strokeRect(mx + 37 + i * 22, my + 35, 20, 12);
        }
    });
    
    // Patterns
    ctx.fillStyle = '#aaa';
    ctx.fillText('PATTERN:', mx + 10, my + 62);
    const pats = Object.keys(CHM_PATTERNS);
    pats.forEach((p, i) => {
        const px = mx + 10 + i * 48;
        const py = my + 68;
        ctx.fillStyle = p === chmSelectedPattern ? '#c9a84c' : '#333';
        ctx.fillRect(px, py, 44, 14);
        ctx.fillStyle = p === chmSelectedPattern ? '#000' : '#aaa';
        ctx.font = '4px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(CHM_PATTERNS[p].name, px + 22, py + 10);
    });
    
    // Poses
    ctx.fillStyle = '#aaa';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('POSE:', mx + 10, my + 96);
    const poses = Object.keys(CHM_POSES);
    poses.forEach((p, i) => {
        const px = mx + 10 + i * 38;
        const py = my + 102;
        ctx.fillStyle = p === chmSelectedPose ? '#c9a84c' : '#333';
        ctx.fillRect(px, py, 34, 14);
        ctx.fillStyle = p === chmSelectedPose ? '#000' : '#aaa';
        ctx.font = '4px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(CHM_POSES[p].name, px + 17, py + 10);
    });
    
    // Color wheel (simplified)
    ctx.fillStyle = '#aaa';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CUSTOM:', mx + 10, my + 130);
    const wheelColors = ['#ff0000','#ff8800','#ffff00','#00ff00','#00ffff','#0088ff','#8800ff','#ff00ff',
                          '#ffffff','#cccccc','#888888','#444444','#000000','#8b4513','#228b22','#4169e1'];
    wheelColors.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(mx + 10 + (i % 8) * 22, my + 134 + Math.floor(i/8) * 12, 18, 10);
    });
    
    // Instructions
    ctx.fillStyle = '#666';
    ctx.font = '4px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('B:CLOSE  A:SELECT  D-PAD:PICK', mx + mw/2, my + mh - 6);
    
    ctx.textAlign = 'left';
}

// ── Handle Paint Menu Input ─────────────────────────────────────────────
function chmPaintInput(key) {
    if(!chmPaintMenuOpen) return false;
    
    if(key === 'x' || key === 'b') {
        chmPaintMenuOpen = false;
        return true;
    }
    
    if(key === 'z' || key === 'a' || key === 'Enter') {
        // Select nearest color wheel color based on cursor position
        return true;
    }
    
    if(key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        // Cycle through patterns or poses
        const pats = Object.keys(CHM_PATTERNS);
        const poses = Object.keys(CHM_POSES);
        if(key === 'ArrowLeft') {
            const i = pats.indexOf(chmSelectedPattern);
            chmSelectedPattern = pats[(i - 1 + pats.length) % pats.length];
        } else if(key === 'ArrowRight') {
            const i = pats.indexOf(chmSelectedPattern);
            chmSelectedPattern = pats[(i + 1) % pats.length];
        } else if(key === 'ArrowUp') {
            const i = poses.indexOf(chmSelectedPose);
            chmSelectedPose = poses[(i - 1 + poses.length) % poses.length];
        } else if(key === 'ArrowDown') {
            const i = poses.indexOf(chmSelectedPose);
            chmSelectedPose = poses[(i + 1) % poses.length];
        }
        return true;
    }
    
    return false;
}

// ── Open/close paint menu ───────────────────────────────────────────────
function chmTogglePaintMenu(mapKey, playerX, playerY) {
    chmPaintMenuOpen = !chmPaintMenuOpen;
    if(chmPaintMenuOpen) {
        // Auto eye-drop current position
        chmEyeDrop(mapKey, playerX, playerY);
    }
}

// ── Apply paint to player state ─────────────────────────────────────────
function chmApplyPaint(player) {
    player.paintColor = chmSelectedColor;
    player.paintPattern = chmSelectedPattern;
    player.paintPose = chmSelectedPose;
    player.painted = true;
}

// ── Calculate camouflage score (how well player matches environment) ────
function chmCamouflageScore(mapKey, playerX, playerY, playerColor) {
    const colors = chmGetSurroundingColors(mapKey, playerX, playerY);
    if(colors.length === 0) return 0;
    
    // Find closest matching color
    let bestDist = Infinity;
    colors.forEach(c => {
        const d = chmColorDistance(playerColor, c);
        if(d < bestDist) bestDist = d;
    });
    
    // Score: 100 = perfect match, 0 = completely different
    return Math.max(0, 100 - (bestDist / 4.41)); // 4.41 = max possible distance / 100
}
