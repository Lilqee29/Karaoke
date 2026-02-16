// ========== TROLL ENGINE (v3.0) ==========
// 1000 procedurally generated levels of troll logic
// Features: platforms, moving traps, fake exits, fake floors,
//           coins, multiple trap types, death counter, win screen,
//           pause, touch input, level themes, GB palette

const TrollEngine = {

    // ── State ────────────────────────────────────────────────────────────────
    canvas:  null,
    ctx:     null,
    level:   1,
    deaths:  0,
    paused:  false,
    won:     false,
    frame:   0,
    rafId:   null,

    // Palette (swaps per theme)
    pal: {
        bg:      '#9bbc0f',
        light:   '#8bac0f',
        mid:     '#306230',
        dark:    '#0f380f',
        accent:  '#e8003d',
        accent2: '#f0a000'
    },

    player: {
        x: 20, y: 0, vx: 0, vy: 0,
        w: 7,  h: 8,
        onGround: false,
        dead: false,
        deathTimer: 0,
        coins: 0
    },

    keys: {},   // keyboard
    touch: {},  // touch bridge

    platforms: [],
    traps:     [],
    coins:     [],
    particles: [],
    exit:      { x: 148, y: 0, fake: false },
    messages:  [],   // troll messages queue
    msgTimer:  0,
    currentMsg: '',

    GRAVITY:   0.40,
    JUMP:     -8.2,
    SPEED:     2.0,

    // ── Boot ─────────────────────────────────────────────────────────────────
    init: function() {
        this.canvas = document.getElementById('screen');
        // Keep internal resolution fixed for pixel-perfect logic
        this.canvas.width  = 160;
        this.canvas.height = 144;
        
        this.ctx    = this.canvas.getContext('2d');

        window.addEventListener('keydown', (e) => {
            if (!this.handleKey(e.key, true)) return;
            e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.handleKey(e.key, false);
        });

        // Bridge from parent shell
        window.addEventListener('message', (e) => {
            const data = e.data;
            if (!data) return;
            if (data.type === 'input') {
                this.handleKey(data.key, data.down);
            } else if (data.type === 'jump') {
                this.loadLevel(data.level);
            }
        });

        // Expose for HTML
        window.loadTrollLevel = (lvl) => { this.level = lvl; this.loadLevel(lvl); };

        this.loadLevel(this.level);
        this.loop();
    },

    handleKey: function(key, down) {
        // Map common keys to standard names
        const keyMap = { 'ArrowUp':'up', 'ArrowDown':'down', 'ArrowLeft':'left', 'ArrowRight':'right', 'z':'jump', 'x':'b', ' ':'jump' };
        const mapped = keyMap[key] || key;
        
        this.keys[key] = down;
        
        if (down) {
            if (mapped === 'up' || mapped === 'jump') this.tryJump();
            if (key === 'Escape') this.togglePause();
            if (key === 'r') this.restart();
        }

        // Return true if we should prevent default
        return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key);
    },

    // ── Touch Input ──────────────────────────────────────────────────────────
    touchInput: function(key, pressed) {
        this.touch[key] = pressed;
        if (pressed && (key === 'jump' || key === 'up')) this.tryJump();
    },

    tryJump: function() {
        if (this.player.onGround && !this.player.dead && !this.paused) {
            this.player.vy      = this.JUMP;
            this.player.onGround = false;
            this.spawnParticles(this.player.x + this.player.w/2, this.player.y + this.player.h, '#8bac0f', 3);
        }
    },

    // ── Pause / Restart ───────────────────────────────────────────────────────
    togglePause: function() {
        if (this.won) return;
        this.paused = !this.paused;
    },

    restart: function() {
        this.deaths = 0;
        this.level  = 1;
        this.won    = false;
        this.loadLevel(1);
        this.updateHUD();
    },

    // ── Level Generator ───────────────────────────────────────────────────────
    // Deterministic RNG per level seed so same level always generates the same
    rng: function(seed) {
        let s = seed;
        return function() {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    },

    loadLevel: function(lvl) {
        this.paused    = false;
        this.won       = false;
        this.platforms = [];
        this.traps     = [];
        this.coins     = [];
        this.particles = [];
        this.messages  = [];
        this.currentMsg = '';
        this.msgTimer  = 0;
        this.frame     = 0;

        const r   = this.rng(lvl * 999983 + 7);
        const W   = 160, H = 144;
        const GY  = Math.round(H * 0.82); // Raised ground for better visibility

        // ── Theme (changes every 50 levels) ────────────────────────────────
        const themes = [
            { bg:'#9bbc0f', light:'#8bac0f', mid:'#306230', dark:'#0f380f', accent:'#e8003d',  accent2:'#f0a000' },
            { bg:'#c4cfa1', light:'#a8b86c', mid:'#5a6e3a', dark:'#2a3a18', accent:'#0055e8',  accent2:'#00c8f0' },
            { bg:'#d0b080', light:'#b89050', mid:'#805828', dark:'#3a2010', accent:'#e83000',  accent2:'#f8c000' },
            { bg:'#80a8d0', light:'#5880b0', mid:'#284878', dark:'#102040', accent:'#e80060',  accent2:'#00f0a0' },
            { bg:'#b8a0d0', light:'#9070b8', mid:'#503880', dark:'#201038', accent:'#f0c000',  accent2:'#00e8a0' },
            { bg:'#a8c8a0', light:'#78a870', mid:'#386830', dark:'#183010', accent:'#e83800',  accent2:'#e8c800' },
        ];
        this.pal = themes[Math.floor((lvl-1) / 100) % themes.length];

        // ── Ground ─────────────────────────────────────────────────────────
        this.platforms.push({ x:0, y:GY, w:W, h:H-GY, solid:true, fake:false, type:'ground' });

        // ── Procedural Platforms ─────────────────────────────────────────
        const numPlat = 2 + Math.floor(r() * Math.min(5, 1 + lvl/80));
        let lastX = 24;
        for (let i=0; i<numPlat; i++) {
            const pw = 20 + Math.floor(r() * 30);
            const px = lastX + 14 + Math.floor(r() * 22);
            const py = GY - 25 - Math.floor(r() * 30); // Max height limited for headroom
            const isFake = lvl > 8 && r() < 0.12; 
            const isMoving = lvl > 20 && r() < 0.3;
            this.platforms.push({
                x: px, y: py, w: pw, h: 6,
                solid: true, fake: isFake, type:'platform',
                moving: isMoving,
                mx: px, mRange: 18 + Math.floor(r()*18), mSpeed: 0.4 + r()*0.7,
                mOffset: r() * Math.PI * 2
            });
            lastX = px + pw;
        }

        // ── Traps ──────────────────────────────────────────────────────────
        const trapTypes = this._getTrapTypes(lvl);
        const numTraps  = 2 + Math.floor(r() * Math.min(10, 2 + lvl/30));
        for (let i=0; i<numTraps; i++) {
            const type = trapTypes[Math.floor(r() * trapTypes.length)];
            this._placeTrap(type, r, GY, lvl, W);
        }

        // ── Coins ──────────────────────────────────────────────────────────
        const numCoins = 1 + Math.floor(r() * 4);
        for (let i=0; i<numCoins; i++) {
            this.coins.push({
                x: 20 + Math.floor(r() * 120),
                y: GY - 14 - Math.floor(r() * 60),
                w: 5, h: 5,
                collected: false, fake: lvl > 50 && r() < 0.2
            });
        }

        // ── Exit ───────────────────────────────────────────────────────────
        const exitFake  = lvl > 30 && r() < Math.min(lvl/300, 0.35);
        const trueExit  = { x: 138 + Math.floor(r()*12), y: GY-10, fake:false };
        const fakeExit  = exitFake ? { x: 20+Math.floor(r()*60), y: GY-10, fake:true } : null;
        this.exit  = fakeExit && r() < 0.5 ? fakeExit : trueExit;
        this.exit2 = fakeExit ? (this.exit === fakeExit ? trueExit : fakeExit) : null;

        // ── Player spawn ────────────────────────────────────────────────────
        this.player.x        = 6;
        this.player.y        = GY - this.player.h;
        this.player.vx       = 0;
        this.player.vy       = 0;
        this.player.onGround = true;
        this.player.dead     = false;
        this.player.deathTimer = 0;

        // ── Troll messages for this level ──────────────────────────────────
        this.messages = this._getTrollMessages(lvl, r);
        if (this.messages.length) {
            this.currentMsg = this.messages.shift();
            this.msgTimer   = 90;
        }

        this.updateHUD();
    },

    _getTrapTypes: function(lvl) {
        const base = ['spike'];
        if (lvl >=  5) base.push('hidden-spike');
        if (lvl >= 10) base.push('blinking-spike');
        if (lvl >= 15) base.push('moving-spike');
        if (lvl >= 20) base.push('falling-spike');
        if (lvl >= 30) base.push('pop-spike');
        if (lvl >= 45) base.push('gravity-flip');
        if (lvl >= 70) base.push('bounce-pad');
        if (lvl >= 100) base.push('teleport-trap');
        return base;
    },

    _placeTrap: function(type, r, GY, lvl, W) {
        const trap = {
            x:  16 + Math.floor(r() * (W - 32)),
            y:  GY - 8,
            w:  8, h: 8,
            type: type,
            active:    true,
            visible:   type !== 'hidden-spike' && type !== 'pop-spike',
            triggered: false,
            timer:     0,
            speed:     0.6 + r() * 1.2,
            dir:       r() < 0.5 ? 1 : -1,
            range:     12 + Math.floor(r() * 20),
            ox:        0
        };
        trap.ox = trap.x;

        // Place on a platform sometimes
        if (r() < 0.3 && this.platforms.length > 1) {
            const plat = this.platforms[1 + Math.floor(r() * (this.platforms.length-1))];
            trap.x  = plat.x + Math.floor(r() * Math.max(1, plat.w-8));
            trap.y  = plat.y - 8;
            trap.ox = trap.x;
        }

        this.traps.push(trap);
    },

    _getTrollMessages: function(lvl, r) {
        const pools = [
            ["almost there...", "so close!", "trust me bro", "this way →", "safe zone ahead"],
            ["lol", "nice try", "skill issue", "you had one job", "...really?"],
            ["the exit is behind you", "jump here →", "don't jump here", "trust the spike"],
            ["level " + lvl + " huh", "git gud", "touch grass", "bro woke up and chose violence"],
            ["← exit", "just walk forward", "the floor is safe", "100% not a trap"],
            ["almost 1000...", "you will never finish", "go home", "the troll wins again"],
        ];
        const pool = pools[Math.floor(r() * pools.length)];
        const n    = 1 + Math.floor(r() * 2);
        const out  = [];
        for (let i=0; i<n; i++) out.push(pool[Math.floor(r() * pool.length)]);
        return out;
    },

    // ── Main Loop ─────────────────────────────────────────────────────────────
    loop: function() {
        this.rafId = requestAnimationFrame(() => this.loop());
        if (!this.paused) { this.update(); }
        this.draw();
    },

    // ── Update ───────────────────────────────────────────────────────────────
    update: function() {
        this.frame++;
        const p = this.player;

        if (p.dead) {
            p.deathTimer--;
            this.updateParticles();
            if (p.deathTimer <= 0) {
                this.deaths++;
                this.updateHUD();
                this.loadLevel(this.level);
            }
            return;
        }

        // ── Input ──────────────────────────────────────────────────────────
        const moveL = this.keys['ArrowLeft']  || this.touch['left'];
        const moveR = this.keys['ArrowRight'] || this.touch['right'];

        let targetVx = 0;
        if (moveL) targetVx = -this.SPEED;
        if (moveR) targetVx =  this.SPEED;

        // Ice modifier — some high levels
        p.vx += (targetVx - p.vx) * 0.25;
        if (Math.abs(p.vx) < 0.05) p.vx = 0;

        // ── Physics ────────────────────────────────────────────────────────
        p.vy      += this.GRAVITY;
        p.x       += p.vx;
        p.y       += p.vy;
        p.onGround = false;

        // ── Platform collision ─────────────────────────────────────────────
        this.platforms.forEach(plat => {
            // Move platforms
            if (plat.moving) {
                plat.x = plat.mx + Math.sin(this.frame * plat.mSpeed * 0.04 + plat.mOffset) * plat.mRange;
            }
            if (plat.fake) return; // fake platforms: visible but you fall through

            // AABB + one-way (land from above)
            if (p.x + p.w > plat.x && p.x < plat.x + plat.w &&
                p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + 8 &&
                p.vy >= 0) {
                p.y        = plat.y - p.h;
                p.vy       = 0;
                p.onGround = true;
                // Carry on moving platforms
                if (plat.moving) p.x += Math.cos(this.frame * plat.mSpeed * 0.04 + plat.mOffset) * plat.mSpeed * 0.5;
            }
        });

        // ── Clamp horizontal ───────────────────────────────────────────────
        if (p.x < 0)            { p.x = 0; p.vx = 0; }
        if (p.x + p.w > 160)   { p.x = 160 - p.w; p.vx = 0; }

        // ── Fell off screen ────────────────────────────────────────────────
        if (p.y > 160) { this.die('fell'); return; }

        // ── Trap updates + collision ───────────────────────────────────────
        this.traps.forEach(t => {
            const dist = Math.abs(p.x - t.x);
            const f    = this.frame;

            // ── Trap Movement/State Updates ──

            // Moving spike
            if (t.type === 'moving-spike') {
                t.x = t.ox + Math.sin(f * t.speed * 0.05) * t.range;
            }

            // Blinking spike: toggles every 1.5 seconds (90 frames)
            if (t.type === 'blinking-spike') {
                const cycle = Math.floor(f / 90) % 2;
                t.active = (cycle === 0);
                t.visible = true; // Stay visible but ghosted in draw()
            }

            // Falling spike: drops when player is under
            if (t.type === 'falling-spike') {
                if (!t.triggered && Math.abs(p.x - t.x) < 20 && p.y > t.y) {
                    t.triggered = true;
                    t.vy = 0;
                }
                if (t.triggered) {
                    t.vy += 0.3;
                    t.y += t.vy;
                }
            }

            // Hidden spike: reveal when close
            if (t.type === 'hidden-spike' && dist < 18) t.visible = true;

            // Pop spike: appears after a delay when player is nearby
            if (t.type === 'pop-spike') {
                if (dist < 30) { 
                    t.timer++; 
                    if (t.timer > 40) t.visible = t.active = true; 
                } else { 
                    t.timer = 0; 
                    t.visible = t.active = false; 
                }
            }

            // ── Final Collision Check ──
            if (!t.visible || !t.active) return;

            // Collision
            if (p.x + p.w > t.x && p.x < t.x + t.w &&
                p.y + p.h > t.y && p.y < t.y + t.h) {

                if (t.type === 'bounce-pad') {
                    // Looks helpful, kills above level 80
                    if (this.level >= 80) { this.die('bounce'); return; }
                    else { p.vy = this.JUMP * 1.4; return; }
                }

                if (t.type === 'gravity-flip') {
                    // Sends player flying up into ceiling
                    p.vy = this.JUMP * 1.6; return;
                }

                if (t.type === 'teleport-trap') {
                    p.x = 4; p.vy = 0;    // teleport back to start
                    this.spawnMsg("lol teleported");
                    return;
                }

                this.die(t.type);
            }
        });

        // ── Coins ──────────────────────────────────────────────────────────
        this.coins.forEach(c => {
            if (c.collected) return;
            if (p.x + p.w > c.x && p.x < c.x + c.w &&
                p.y + p.h > c.y && p.y < c.y + c.h) {
                c.collected = true;
                if (c.fake) { this.die('fake-coin'); return; }
                p.coins++;
                this.spawnParticles(c.x, c.y, this.pal.accent2, 5);
                if (typeof addGems === 'function') addGems(1);
            }
        });

        // ── Exit check ─────────────────────────────────────────────────────
        [this.exit, this.exit2].forEach(ex => {
            if (!ex) return;
            if (p.x + p.w > ex.x && p.x < ex.x + 10 &&
                p.y + p.h > ex.y && p.y < ex.y + 14) {
                if (ex.fake) { this.die('fake-exit'); }
                else         { this.nextLevel(); }
            }
        });

        // ── Troll message timer ─────────────────────────────────────────────
        if (this.msgTimer > 0) {
            this.msgTimer--;
            if (this.msgTimer === 0 && this.messages.length) {
                this.currentMsg = this.messages.shift();
                this.msgTimer   = 80;
            } else if (this.msgTimer === 0) {
                this.currentMsg = '';
            }
        }

        // ── Particles ──────────────────────────────────────────────────────
        this.updateParticles();
    },

    spawnMsg: function(msg) {
        this.currentMsg = msg;
        this.msgTimer   = 70;
    },

    // ── Death ─────────────────────────────────────────────────────────────────
    die: function(reason) {
        if (this.player.dead) return;
        this.player.dead      = true;
        this.player.deathTimer = 45;
        this.player.vx = 0; this.player.vy = -5;

        this.spawnParticles(
            this.player.x + this.player.w/2,
            this.player.y + this.player.h/2,
            this.pal.accent, 12
        );

        const msgs = {
            'spike':       ['ouch', 'pointy', 'rip'],
            'hidden-spike':['gotcha', 'sneaky spike', 'lol'],
            'moving-spike':['keep up', 'timing issue'],
            'pop-spike':   ['SURPRISE', 'boo!'],
            'fell':        ['gravity works', 'floor is lava irl'],
            'fake-exit':   ['not the exit', 'haha exit go brrr'],
            'fake-coin':   ['that was a trap coin', 'rip'],
            'bounce':      ['bounced to death lol'],
            'gravity-flip':['defying death badly']
        };
        const pool = msgs[reason] || ['rip'];
        this.spawnMsg(pool[Math.floor(Math.random() * pool.length)]);

        // Flash the GB frame
        const frame = document.getElementById('gbFrame');
        if (frame) {
            frame.classList.remove('death-flash');
            void frame.offsetWidth;
            frame.classList.add('death-flash');
            frame.addEventListener('animationend', () => frame.classList.remove('death-flash'), {once:true});
        }
    },

    // ── Next level ────────────────────────────────────────────────────────────
    nextLevel: function() {
        if (this.level >= 1000) {
            this.won = true;
            return;
        }

        // Win flash
        const frame = document.getElementById('gbFrame');
        if (frame) {
            frame.classList.remove('win-flash');
            void frame.offsetWidth;
            frame.classList.add('win-flash');
            frame.addEventListener('animationend', () => frame.classList.remove('win-flash'), {once:true});
        }

        this.level++;
        this.loadLevel(this.level);
    },

    // ── Particles ─────────────────────────────────────────────────────────────
    spawnParticles: function(x, y, color, count) {
        for (let i=0; i<count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5) * 3,
                vy: (Math.random()-0.5) * 3 - 1,
                life: 20 + Math.floor(Math.random()*20),
                maxLife: 40,
                color
            });
        }
    },

    updateParticles: function() {
        for (let i=this.particles.length-1; i>=0; i--) {
            const pt = this.particles[i];
            pt.x  += pt.vx;
            pt.y  += pt.vy;
            pt.vy += 0.15;
            pt.life--;
            if (pt.life <= 0) this.particles.splice(i,1);
        }
    },

    // ── HUD ───────────────────────────────────────────────────────────────────
    updateHUD: function() {
        // Update parent window (main Retro OS shell) if exists
        try {
            const pDoc = window.parent.document;
            const pl = pDoc.getElementById('mainTrollLevel');
            const pd = pDoc.getElementById('mainTrollDeaths');
            if (pl) pl.textContent = `LVL: ${this.level}`;
            if (pd) pd.textContent = `☠ ${this.deaths}`;
        } catch(e) {}

        // Internal Fallback
        const lb = document.getElementById('levelBadge');
        const db = document.getElementById('deathBadge');
        if (lb) lb.textContent = `LVL ${this.level}`;
        if (db) db.textContent = `☠ ${this.deaths}`;
    },

    // ── Draw ──────────────────────────────────────────────────────────────────
    draw: function() {
        const ctx = this.ctx;
        const p = this.player;
        const W = this.canvas.width;   // ← was hardcoded 160
        const H = this.canvas.height;  // ← was hardcoded 144
       

        // Background
        ctx.fillStyle = this.pal.bg;
        ctx.fillRect(0, 0, W, H);

        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y=0; y<H; y+=2) ctx.fillRect(0, y, W, 1);

        // ── Platforms ─────────────────────────────────────────────────────
        this.platforms.forEach(plat => {
            if (plat.fake) {
                // Fake platform: blink or ghost
                ctx.globalAlpha = 0.3 + Math.sin(this.frame * 0.1) * 0.2;
                ctx.fillStyle = this.pal.light;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = this.pal.bg;
                for (let dx=0; dx<plat.w; dx+=4) ctx.fillRect(plat.x+dx, plat.y, 2, 2);
            } else if (plat.type === 'ground') {
                ctx.fillStyle = this.pal.mid;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                // Ground top strip
                ctx.fillStyle = this.pal.dark;
                ctx.fillRect(plat.x, plat.y, plat.w, 2);
            } else {
                ctx.fillStyle = this.pal.mid;
                ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
                ctx.fillStyle = this.pal.light;
                ctx.fillRect(plat.x, plat.y, plat.w, 2);
            }
        });

        // ── Exit(s) ───────────────────────────────────────────────────────
        [this.exit, this.exit2].forEach(ex => {
            if (!ex) return;
            // Door shape
            ctx.fillStyle = ex.fake ? this.pal.accent : this.pal.dark;
            ctx.fillRect(ex.x, ex.y, 10, 14);
            ctx.fillStyle = ex.fake ? '#ff8080' : this.pal.mid;
            ctx.fillRect(ex.x+1, ex.y+1, 8, 12);
            // Knob
            ctx.fillStyle = this.pal.accent2;
            ctx.fillRect(ex.x+7, ex.y+7, 2, 2);
            // Arrow pointing to real exit (subtle)
            if (!ex.fake) {
                ctx.fillStyle = this.pal.dark;
                ctx.font      = '5px monospace';
                ctx.fillText('EXIT', ex.x-2, ex.y-2);
            }
        });

        // ── Coins ─────────────────────────────────────────────────────────
        this.coins.forEach(c => {
            if (c.collected) return;
            const pulse = Math.sin(this.frame * 0.1 + c.x) * 0.5 + 0.5;
            ctx.fillStyle = c.fake ? this.pal.accent : this.pal.accent2;
            ctx.beginPath();
            ctx.arc(c.x + 2, c.y + 2, 2.5 + pulse*0.5, 0, Math.PI*2);
            ctx.fill();
        });

        // ── Traps ─────────────────────────────────────────────────────────
        this.traps.forEach(t => {
            if (!t.visible && t.type !== 'bounce-pad') return;
            ctx.fillStyle = this.pal.dark;

            switch(t.type) {
                case 'spike':
                case 'hidden-spike':
                case 'moving-spike':
                case 'pop-spike':
                case 'blinking-spike':
                case 'falling-spike':
                    if (t.type === 'blinking-spike' && !t.active) {
                        ctx.globalAlpha = 0.2; // Show ghost spike
                    }
                    ctx.beginPath();
                    ctx.moveTo(t.x,          t.y + t.h);
                    ctx.lineTo(t.x + t.w/2,  t.y);
                    ctx.lineTo(t.x + t.w,    t.y + t.h);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                    break;

                case 'bounce-pad':
                    // Looks like a spring/platform — green and friendly
                    ctx.fillStyle = this.level >= 80 ? this.pal.accent : '#00c040';
                    ctx.fillRect(t.x, t.y+4, t.w, 4);
                    ctx.fillStyle = this.level >= 80 ? '#ff8080' : '#00ff60';
                    ctx.fillRect(t.x+1, t.y+5, t.w-2, 2);
                    break;

                case 'gravity-flip':
                    // Looks like an upward arrow / boost pad
                    ctx.fillStyle = this.pal.accent2;
                    ctx.beginPath();
                    ctx.moveTo(t.x + t.w/2, t.y);
                    ctx.lineTo(t.x,          t.y + t.h);
                    ctx.lineTo(t.x + t.w,    t.y + t.h);
                    ctx.fill();
                    break;

                case 'teleport-trap':
                    // Looks like a glowing portal
                    const pulse = Math.abs(Math.sin(this.frame * 0.08));
                    ctx.fillStyle = `rgba(100,0,200,${0.5 + pulse*0.5})`;
                    ctx.beginPath();
                    ctx.ellipse(t.x + t.w/2, t.y + t.h/2, t.w/2, t.h/2 * 0.6, 0, 0, Math.PI*2);
                    ctx.fill();
                    break;

                case 'ice':
                    ctx.fillStyle = '#a0d8ff';
                    ctx.fillRect(t.x, t.y+6, t.w, 2);
                    break;

                default:
                    ctx.beginPath();
                    ctx.moveTo(t.x,         t.y + t.h);
                    ctx.lineTo(t.x + t.w/2, t.y);
                    ctx.lineTo(t.x + t.w,   t.y + t.h);
                    ctx.fill();
            }
        });

        // ── Player ────────────────────────────────────────────────────────
        if (!p.dead || this.frame % 4 < 2) {
            // Body
            ctx.fillStyle = this.pal.dark;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            // Eyes
            ctx.fillStyle = this.pal.bg;
            const eyeX = p.vx >= 0 ? p.x+4 : p.x+1;
            ctx.fillRect(eyeX, p.y+2, 2, 2);
            // Legs animate while moving
            if (p.onGround && Math.abs(p.vx) > 0.1) {
                const leg = Math.floor(this.frame / 4) % 2;
                ctx.fillStyle = this.pal.mid;
                ctx.fillRect(p.x + (leg?0:4), p.y + p.h, 3, 2);
            }
        }

        // ── Particles ─────────────────────────────────────────────────────
        this.particles.forEach(pt => {
            const a = pt.life / pt.maxLife;
            ctx.globalAlpha = a;
            ctx.fillStyle   = pt.color;
            ctx.fillRect(pt.x, pt.y, 2, 2);
        });
        ctx.globalAlpha = 1;

        // ── HUD (on-canvas) ───────────────────────────────────────────────
        ctx.fillStyle = this.pal.dark;
        ctx.font      = '6px monospace';
        ctx.fillText(`${this.level}/1000`, 2, 8);

        const pct = Math.round(this.level/10);
        ctx.fillStyle = this.pal.mid;
        ctx.fillRect(2, 10, 60, 3);
        ctx.fillStyle = this.pal.accent2;
        ctx.fillRect(2, 10, Math.min(pct, 60), 3);

        // ── Troll message ─────────────────────────────────────────────────
        if (this.currentMsg && this.msgTimer > 0) {
            const alpha = Math.min(1, this.msgTimer / 20);
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 56, W, 14);
            ctx.fillStyle   = this.pal.bg;
            ctx.font        = '5px monospace';
            ctx.textAlign   = 'center';
            ctx.fillText(this.currentMsg, W/2, 66);
            ctx.textAlign   = 'left';
            ctx.globalAlpha = 1;
        } else if (!this.paused && !this.won) {
            // Button Hints
            ctx.fillStyle = this.pal.mid;
            ctx.font = '4px monospace';
            ctx.fillText('A:JUMP', 130, 138);
            ctx.fillText('SEL:HOME', 2, 138);
        }

        // ── Pause screen ──────────────────────────────────────────────────
        if (this.paused) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = this.pal.bg;
            ctx.font      = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', W/2, H/2 - 8);
            ctx.font      = '5px monospace';
            ctx.fillText('SELECT to resume', W/2, H/2 + 6);
            ctx.textAlign = 'left';
        }

        // ── Win screen ────────────────────────────────────────────────────
        if (this.won) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.font      = '7px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = this.pal.accent2;
            ctx.fillText('YOU WIN??', W/2, 50);
            ctx.fillStyle = this.pal.bg;
            ctx.font      = '5px monospace';
            ctx.fillText('ALL 1000 LEVELS', W/2, 64);
            ctx.fillText(`DEATHS: ${this.deaths}`, W/2, 76);
            ctx.fillText('you are the troll now', W/2, 92);
            ctx.textAlign = 'left';
        }
    }
};

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TrollEngine.init());
} else {
    TrollEngine.init();
}