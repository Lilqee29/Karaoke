// ========== PIXEL ENGINE CORE (v3.0) ==========
// Sprite-based, tile collision, camera, combat, animation system
// Free sprite packs used: LPC (liberated pixel cup) — opengameart.org

const Engine = {
    canvas: null,
    ctx: null,
    W: 320, H: 240,
    tileSize: 32,
    camera: { x:0, y:0 },
    keys: {},
    gameObjects: { enemies:[], npcs:[], items:[], particles:[] },
    currentLevel: null,
    tilemap: [],
    frame: 0,
    paused: false,
    screenShake: 0,

    player: {
        x:100, y:100, vx:0, vy:0,
        w:14, h:16,
        hp:100, maxHp:100,
        xp:0, level:1,
        facing: 'down',
        state: 'idle',          // idle | walk | roll | attack | hurt | dead
        stateTimer: 0,
        rollCooldown: 0,
        attackCooldown: 0,
        invincible: 0,
        animFrame: 0,
        animTimer: 0,
        speed: 1.8,
        inventory: [],
        equipped: { weapon: null }
    },

    // ── Sprite sheet definitions (LPC-compatible pixel art drawn via canvas) ─
    sprites: {
        player: null,
        slime: null,
        goblin: null,
        elder: null
    },

    // ── Setup ────────────────────────────────────────────────────────────────
    setup: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx    = this.canvas.getContext('2d');
        this.canvas.width  = this.W;
        this.canvas.height = this.H;
        this.ctx.imageSmoothingEnabled = false;

        this._buildSprites();
        this._bindInput();

        // --- Retro Boy OS Bridge ---
        window.addEventListener('message', (e) => {
            const data = e.data;
            if (!data) return;
            if (data.type === 'input') {
                this._handleKey(data.key, data.down);
            } else if (data.type === 'cycleMode') {
                this._cycleVisuals();
            }
        });

        this.loop();
    },

    _buildSprites: function() {
        this.sprites.player = this._makePlayerSprite();
        this.sprites.slime  = this._makeSlimeSprite();
        this.sprites.goblin = this._makeGoblinSprite();
        this.sprites.elder  = this._makeElderSprite();
    },

    _offscreen: function(w, h) {
        const oc  = document.createElement('canvas');
        oc.width  = w; oc.height = h;
        return oc;
    },

    _makePlayerSprite: function() {
        const oc  = this._offscreen(7*16, 20);
        const c   = oc.getContext('2d');
        const drawFrame = (ox, frames) => { frames(); };
        const frames = [
            // idle-down
            () => {
                c.fillStyle='#e8c87a'; c.fillRect(4,0,8,8);
                c.fillStyle='#3a7bd5'; c.fillRect(3,8,10,8);
                c.fillStyle='#2a5aa5'; c.fillRect(3,16,4,4);
                c.fillStyle='#2a5aa5'; c.fillRect(9,16,4,4);
                c.fillStyle='#e8c87a'; c.fillRect(1,9,2,6);
                c.fillStyle='#e8c87a'; c.fillRect(13,9,2,6);
                c.fillStyle='#1a1a1a'; c.fillRect(5,3,2,2);
                c.fillStyle='#1a1a1a'; c.fillRect(9,3,2,2);
                c.fillStyle='#c8a050'; c.fillRect(5,0,6,3);
            },
            // idle-up
            () => {
                const ox=16;
                c.fillStyle='#e8c87a'; c.fillRect(4+ox,0,8,8);
                c.fillStyle='#3a7bd5'; c.fillRect(3+ox,8,10,8);
                c.fillStyle='#2a5aa5'; c.fillRect(3+ox,16,4,4);
                c.fillStyle='#2a5aa5'; c.fillRect(9+ox,16,4,4);
                c.fillStyle='#e8c87a'; c.fillRect(1+ox,9,2,6);
                c.fillStyle='#e8c87a'; c.fillRect(13+ox,9,2,6);
                c.fillStyle='#c8a050'; c.fillRect(5+ox,0,6,3);
            },
            // walk1
            () => {
                const ox=2*16;
                c.fillStyle='#e8c87a'; c.fillRect(4+ox,1,8,8);
                c.fillStyle='#3a7bd5'; c.fillRect(3+ox,9,10,8);
                c.fillStyle='#2a5aa5'; c.fillRect(3+ox,17,3,3);
                c.fillStyle='#2a5aa5'; c.fillRect(10+ox,15,3,5);
                c.fillStyle='#1a1a1a'; c.fillRect(5+ox,4,2,2);
                c.fillStyle='#1a1a1a'; c.fillRect(9+ox,4,2,2);
            },
            // walk2
            () => {
                const ox=3*16;
                c.fillStyle='#e8c87a'; c.fillRect(4+ox,1,8,8);
                c.fillStyle='#3a7bd5'; c.fillRect(3+ox,9,10,8);
                c.fillStyle='#2a5aa5'; c.fillRect(3+ox,15,3,5);
                c.fillStyle='#2a5aa5'; c.fillRect(10+ox,17,3,3);
            },
            // side/roll
            () => {
                const ox=4*16;
                c.fillStyle='#e8c87a'; c.fillRect(5+ox,1,7,8);
                c.fillStyle='#3a7bd5'; c.fillRect(4+ox,9,9,8);
                c.fillStyle='#2a5aa5'; c.fillRect(4+ox,15,3,5);
            },
            // attack
            () => {
                const ox=5*16;
                c.fillStyle='#e8c87a'; c.fillRect(4+ox,0,8,8);
                c.fillStyle='#3a7bd5'; c.fillRect(3+ox,8,10,8);
                c.fillStyle='#ccc';   c.fillRect(13+ox,2,3,10);
            },
            // hurt
            () => {
                const ox=6*16;
                c.fillStyle='#ff6060'; c.fillRect(4+ox,0,8,8);
                c.fillStyle='#ff4040'; c.fillRect(3+ox,8,10,10);
            }
        ];
        frames.forEach(f => f());
        return oc;
    },

    _makeSlimeSprite: function() {
        const oc=this._offscreen(4*16,16);
        const c=oc.getContext('2d');
        const colors=['#44cc44','#33bb33','#22aa22','#ff4444'];
        [0,1,2,3].forEach(i=>{
            const ox=i*16;
            c.fillStyle=colors[i];
            c.beginPath(); c.ellipse(ox+8,10,7,6,0,0,Math.PI*2); c.fill();
            c.fillStyle='#1a1a1a';
            c.fillRect(ox+5,8,2,2); c.fillRect(ox+9,8,2,2);
        });
        return oc;
    },

    _makeGoblinSprite: function() {
        const oc=this._offscreen(5*16,20);
        const c=oc.getContext('2d');
        const draw=(ox, col)=>{
            c.fillStyle=col;
            c.fillRect(ox+4,0,8,7);
            c.fillRect(ox+3,7,10,9);
            c.fillStyle='#5a9030';
            c.fillRect(ox+2,8,2,8);
            c.fillRect(ox+12,8,2,8);
            c.fillStyle='#f22'; c.fillRect(ox+5,2,2,2); c.fillRect(ox+9,2,2,2);
        };
        draw(0,'#7ab840'); draw(16,'#7ab840'); draw(32,'#7ab840'); draw(48,'#7ab840'); draw(64,'#f44');
        return oc;
    },

    _makeElderSprite: function() {
        const oc=this._offscreen(16,20);
        const c=oc.getContext('2d');
        c.fillStyle='#d4b896'; c.fillRect(4,0,8,8);
        c.fillStyle='#eeeeee'; c.fillRect(2,8,12,12);
        c.fillStyle='#888888'; c.fillRect(13,12,2,10);
        c.fillStyle='#bbbbbb'; c.fillRect(3,0,10,4);
        c.fillStyle='#1a1a1a'; c.fillRect(5,2,2,2); c.fillRect(9,2,2,2);
        return oc;
    },

    _drawTile: function(type, screenX, screenY) {
        const c  = this.ctx;
        const ts = this.tileSize;
        switch(type) {
            case 0: // Grass/Floor
                c.fillStyle=this.currentLevel.theme==='dungeon'?'#2a1a1a':'#4a9e4a';
                c.fillRect(screenX,screenY,ts,ts);
                // Grass tufts
                c.fillStyle='rgba(0,0,0,0.1)';
                c.fillRect(screenX+4, screenY+10, 2, 4);
                c.fillRect(screenX+20, screenY+20, 2, 4);
                break;
            case 1: // Platform / Stone
                c.fillStyle='#888080'; c.fillRect(screenX,screenY,ts,ts);
                c.fillStyle='#999090'; c.fillRect(screenX,screenY,ts,4);
                // Cracks
                c.strokeStyle='rgba(0,0,0,0.2)'; c.beginPath();
                c.moveTo(screenX+10, screenY+10); c.lineTo(screenX+20, screenY+25); c.stroke();
                break;
            case 2: // Wall
                c.fillStyle='#444040'; c.fillRect(screenX,screenY,ts,ts);
                // Brick patterns
                c.fillStyle='#555050';
                c.fillRect(screenX+2, screenY+4, 12, 6);
                c.fillRect(screenX+16, screenY+4, 12, 6);
                c.fillRect(screenX+8, screenY+16, 14, 6);
                break;
            case 3: // Tree / Obstacle
                c.fillStyle='#3a2a1a'; c.fillRect(screenX+12, screenY+20, 8, 12); // Trunk
                c.fillStyle='#2a7a2a'; // Bushy top
                c.beginPath(); c.arc(screenX+ts/2, screenY+12, 12, 0, Math.PI*2); c.fill();
                c.beginPath(); c.arc(screenX+8, screenY+18, 8, 0, Math.PI*2); c.fill();
                c.beginPath(); c.arc(screenX+24, screenY+18, 8, 0, Math.PI*2); c.fill();
                break;
            case 4: // Exit Portal
                const pulse = Math.sin(this.frame*0.1)*0.3+0.7;
                c.fillStyle='#1a1a1a'; c.fillRect(screenX,screenY,ts,ts);
                c.shadowBlur = 10; c.shadowColor = '#0af';
                c.fillStyle=`rgba(100,200,255,${pulse})`;
                c.beginPath(); c.ellipse(screenX+ts/2, screenY+ts/2, 8, 12, Math.sin(this.frame*0.05)*0.2, 0, Math.PI*2); c.fill();
                c.shadowBlur = 0;
                break;
        }
    },

    _bindInput: function() {
        window.addEventListener('keydown', e => {
            if (this._handleKey(e.key, true)) e.preventDefault();
        });
        window.addEventListener('keyup', e => {
            this._handleKey(e.key, false);
        });
    },

    _handleKey: function(key, down) {
        const keyMap = { 
            'z':'attack', 'Z':'attack', 'Enter':'attack',
            'x':'roll',   'X':'roll',
            'e':'action', 'E':'action', ' ':'action'
        };
        const mapped = keyMap[key] || key;
        this.keys[key] = down;
        if (down) {
            if (mapped === 'attack') this._tryAttack();
            if (mapped === 'roll')   this._tryRoll();
            if (mapped === 'action') this._tryInteract();
        }
        return ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(key);
    },

    _tryRoll: function() {
        const p = this.player;
        if (p.rollCooldown > 0 || p.state==='dead') return;
        p.state='roll'; p.stateTimer=20; p.invincible=25; p.rollCooldown=60;
        const dx = (this.keys['ArrowRight']) ? 1 : (this.keys['ArrowLeft']) ?-1 : 0;
        const dy = (this.keys['ArrowDown'])  ? 1 : (this.keys['ArrowUp'])   ?-1 : 0;
        p.vx = dx * 5; p.vy = dy * 5;
    },

    _tryAttack: function() {
        const p = this.player;
        if (p.attackCooldown > 0 || p.state==='dead' || p.state==='roll') return;
        p.state='attack'; p.stateTimer=18; p.attackCooldown=30;
        this.gameObjects.enemies.forEach(en => {
            if (en.dead) return;
            const dist = Math.hypot(p.x-(en.x*this.tileSize+16), p.y-(en.y*this.tileSize+16));
            if (dist < 32) this._hitEnemy(en);
        });
        this._spawnParticle(p.x+8, p.y+8, '#ffffaa', 6);
    },

    _tryInteract: function() {
        const tx = Math.round(this.player.x/this.tileSize), ty = Math.round(this.player.y/this.tileSize);
        this.gameObjects.npcs.forEach(npc => { if (Math.abs(npc.x-tx)+Math.abs(npc.y-ty) <= 2) this._startDialog(npc); });
        this.gameObjects.items.forEach(item => { if (!item.collected && Math.abs(item.x-tx)+Math.abs(item.y-ty) <= 1) this._collectItem(item); });
    },

    loop: function() {
        requestAnimationFrame(() => this.loop());
        if (!this.tilemap || !this.tilemap[0]) return; // Safety: wait for level load
        if (this.paused && !this.dialogActive) { this._renderPaused(); return; }
        this.frame++;
        if (!this.paused) this._update();
        this._render();
    },

    _update: function() {
        const p = this.player;
        if (p.rollCooldown > 0) p.rollCooldown--;
        if (p.attackCooldown > 0) p.attackCooldown--;
        if (p.invincible > 0) p.invincible--;
        if (p.stateTimer > 0) p.stateTimer--;
        else if (['attack','roll','hurt'].includes(p.state)) p.state='idle';

        if (p.state !== 'attack' && p.state !== 'dead') {
            const moveR=this.keys['ArrowRight'], moveL=this.keys['ArrowLeft'], moveU=this.keys['ArrowUp'], moveD=this.keys['ArrowDown'];
            if (p.state !== 'roll') {
                p.vx = moveR?p.speed : moveL?-p.speed:0;
                p.vy = moveD?p.speed : moveU?-p.speed:0;
            }
            if(p.vx>0) p.facing='right'; if(p.vx<0) p.facing='left'; if(p.vy>0) p.facing='down'; if(p.vy<0) p.facing='up';
            if(p.state!=='roll') p.state = (p.vx!==0||p.vy!==0)?'walk':'idle';
        }

        this._moveWithCollision(p, p.vx, 0);
        this._moveWithCollision(p, 0, p.vy);
        if(p.state==='roll'){ p.vx*=0.85; p.vy*=0.85; }

        p.animTimer++;
        if (p.animTimer > (p.state==='walk'?8:14)) { p.animTimer=0; p.animFrame=(p.animFrame+1)%2; }

        const mapW = this.tilemap[0].length * this.tileSize;
        const mapH = this.tilemap.length * this.tileSize;
        this.camera.x = Math.max(0, Math.min(p.x-this.W/2, mapW-this.W));
        this.camera.y = Math.max(0, Math.min(p.y-this.H/2, mapH-this.H));

        if (this.screenShake > 0) this.screenShake *= 0.9;
        this._updateEnemies();
        this._updateParticles();

        const tx = Math.floor(p.x/this.tileSize), ty = Math.floor(p.y/this.tileSize);
        if (this.tilemap[ty] && this.tilemap[ty][tx]===4) GameState.nextLevel();
    },

    _isSolid: function(tx, ty) {
        return !this.tilemap[ty] || [1,2].includes(this.tilemap[ty][tx]);
    },

    _moveWithCollision: function(obj, dx, dy) {
        const ts=this.tileSize; obj.x+=dx; obj.y+=dy;
        const x1=Math.floor(obj.x/ts), x2=Math.floor((obj.x+obj.w-1)/ts);
        const y1=Math.floor(obj.y/ts), y2=Math.floor((obj.y+obj.h-1)/ts);
        if(dx>0 && (this._isSolid(x2,y1)||this._isSolid(x2,y2))){ obj.x=x2*ts-obj.w; obj.vx=0; }
        if(dx<0 && (this._isSolid(x1,y1)||this._isSolid(x1,y2))){ obj.x=(x1+1)*ts; obj.vx=0; }
        if(dy>0 && (this._isSolid(x1,y2)||this._isSolid(x2,y2))){ obj.y=y2*ts-obj.h; obj.vy=0; }
        if(dy<0 && (this._isSolid(x1,y1)||this._isSolid(x2,y1))){ obj.y=(y1+1)*ts; obj.vy=0; }
    },

    _updateEnemies: function() {
        const p=this.player, ts=this.tileSize;
        this.gameObjects.enemies.forEach(en => {
            if(en.dead) return;
            const dist = Math.hypot(p.x-(en.x*ts+16), p.y-(en.y*ts+16));
            if(dist<80){
                const dx=p.x-(en.x*ts+16), dy=p.y-(en.y*ts+16);
                const spd=en.type==='goblin'?0.04:0.025;
                en.x+=dx/dist*spd; en.y+=dy/dist*spd;
            }
            if(dist<14 && p.invincible<=0){
                p.hp-=10; p.invincible=60; p.state='hurt'; p.stateTimer=20; this.shake(5);
                if(p.hp<=0) this._onPlayerDeath();
            }
        });
    },

    _hitEnemy: function(en) {
        en.hp-=25; en._hurt=10; this.shake(8); this._spawnParticle(en.x*this.tileSize+16,en.y*this.tileSize+16,'#ffaa00',6);
        if(en.hp<=0){ en.dead=true; this.player.xp+=20; }
    },

    _collectItem: function(item) {
        item.collected=true;
        if(item.type==='herb') this.player.hp=Math.min(this.player.maxHp, this.player.hp+20);
    },

    _startDialog: function(npc) {
        this.dialogActive=true; this.activeNPC=npc; this.dialogQueue=npc.dialog; this.dialogIndex=0; this.paused=true;
    },

    _advanceDialog: function() {
        if(++this.dialogIndex>=this.dialogQueue.length){ this.dialogActive=false; this.paused=false; }
    },

    _onPlayerDeath: function() {
        this.paused=true; setTimeout(()=>{ location.reload(); }, 1500);
    },

    _spawnParticle: function(x,y,c,n) {
        for(let i=0;i<n;i++) this.gameObjects.particles.push({x,y,color:c,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3-1,life:30});
    },

    _updateParticles: function() {
        for(let i=this.gameObjects.particles.length-1;i>=0;i--){
            const pt=this.gameObjects.particles[i]; pt.x+=pt.vx; pt.y+=pt.vy; pt.vy+=0.1;
            if(--pt.life<=0) this.gameObjects.particles.splice(i,1);
        }
    },

    _render: function() {
        const ctx=this.ctx, cam=this.camera, ts=this.tileSize;
        
        // Final Screen filters
        ctx.filter = 'none';
        if (this._visualMode === 2) ctx.filter = 'grayscale(1) contrast(1.2) brightness(0.9)';
        if (this._visualMode === 3) ctx.filter = 'sepia(1) hue-rotate(60deg) saturate(2) brightness(0.8)';

        ctx.fillStyle=this.currentLevel?.bgColor||'#3a7d44'; ctx.fillRect(0,0,this.W,this.H);
        ctx.save();
        const sx=(Math.random()-0.5)*this.screenShake, sy=(Math.random()-0.5)*this.screenShake;
        ctx.translate(-Math.round(cam.x)+sx, -Math.round(cam.y)+sy);
        for(let y=0;y<this.tilemap.length;y++) for(let x=0;x<this.tilemap[y].length;x++) this._drawTile(this.tilemap[y][x], x*ts, y*ts);
        this.gameObjects.items.forEach(it=>{ 
            if(!it.collected) { 
                const bounce = Math.sin(this.frame*0.1)*3;
                ctx.fillStyle='#ffd700'; ctx.shadowBlur=8; ctx.shadowColor='#fff';
                ctx.beginPath(); ctx.arc(it.x*ts+ts/2, it.y*ts+ts/2+bounce, 6, 0, Math.PI*2); ctx.fill();
                ctx.shadowBlur=0;
            } 
        });
        this.gameObjects.npcs.forEach(npc=>{ 
            const bounce = Math.sin(this.frame*0.05)*2;
            ctx.drawImage(this.sprites.elder, 0,0,16,20, npc.x*ts+8,npc.y*ts+4+bounce,16,20); 
        });
        this.gameObjects.enemies.forEach(en=>{ if(!en.dead) ctx.drawImage(this.sprites[en.type], 0,0,16,16, en.x*ts+8,en.y*ts+8,16,16); });
        this._renderPlayer(ctx);
        this.gameObjects.particles.forEach(pt=>{ ctx.fillStyle=pt.color; ctx.fillRect(pt.x,pt.y,2,2); });
        ctx.restore();

        // Overlay scanlines for Retro Mode
        if (this._visualMode === 1) {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for(let i=0; i<this.H; i+=2) ctx.fillRect(0, i, this.W, 1);
        }

        this._renderHUD(ctx);
        if(this.dialogActive) this._renderDialog(ctx);
        
        ctx.filter = 'none'; // reset
    },

    _renderPlayer: function(ctx) {
        if (this.player.invincible % 4 > 2) return; // Blinking if hurt
        ctx.drawImage(this.sprites.player, 0,0,16,20, this.player.x,this.player.y-4,16,20);
    },

    _renderHUD: function(ctx) {
        if (!this._startTime) this._startTime = Date.now();
        const elapsed = Math.floor((Date.now() - this._startTime)/1000);
        const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
        const ss = String(elapsed%60).padStart(2,'0');

        // HP Bar Glass-morphism
        ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(10,10,104,14);
        ctx.fillStyle='#333'; ctx.fillRect(12,12,100,10);
        const hpGrad = ctx.createLinearGradient(12,0,112,0);
        hpGrad.addColorStop(0, '#f22'); hpGrad.addColorStop(1, '#f88');
        ctx.fillStyle=hpGrad; ctx.fillRect(12,12,Math.max(0, this.player.hp),10);
        
        ctx.fillStyle='#fff'; ctx.font='bold 10px "Press Start 2P"';
        ctx.fillText("HP", 120, 22);

        // Timer
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(10,30,60,12);
        ctx.fillStyle='#fff'; ctx.font='6px "Press Start 2P"';
        ctx.fillText(`TIME ${mm}:${ss}`, 15, 39);

        // Button Help (GB Style)
        ctx.font='6px "Press Start 2P"';
        // B Button
        ctx.fillStyle='#8b2e8b'; ctx.beginPath(); ctx.arc(this.W-70, 20, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.fillText("B: ROLL", this.W-60, 22);
        // A Button
        ctx.fillStyle='#8b2e8b'; ctx.beginPath(); ctx.arc(this.W-70, 35, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.fillText("A: ATTK", this.W-60, 37);
    },

    _renderDialog: function(ctx) {
        ctx.fillStyle='rgba(0,0,0,0.85)';
        ctx.strokeStyle='#fff'; ctx.lineWidth=2;
        ctx.fillRect(20, 160, this.W-40, 60);
        ctx.strokeRect(20, 160, this.W-40, 60);
        ctx.fillStyle='#fff'; ctx.font='10px "Press Start 2P"';
        const msg = this.dialogQueue[this.dialogIndex];
        ctx.fillText(msg, 35, 195);
    },

    _renderPaused: function() {
        this.ctx.fillStyle='rgba(0,0,0,0.5)'; this.ctx.fillRect(0,0,this.W,this.H);
        this.ctx.fillStyle='#fff'; this.ctx.textAlign='center'; this.ctx.fillText("PAUSED",this.W/2,this.H/2);
    },

    _visualMode: 0, // 0: Standard, 1: Retro, 2: Noir, 3: GB
    _cycleVisuals: function() {
        this._visualMode = (this._visualMode + 1) % 4;
        const modes = ["STANDARD", "RETRO CRT", "NOIR", "GAMEBOY"];
        this.shake(5);
        // Show temporary mode indicator
        const oldMsg = this.dialogActive;
        this.dialogActive = true;
        this.dialogQueue = ["MODE: " + modes[this._visualMode]];
        this.dialogIndex = 0;
        setTimeout(() => { if(!oldMsg) this.dialogActive = false; }, 1000);
    },

    loadLevelData: function(data) {
        this.currentLevel=data; this.tilemap=data.tiles; this.tileSize=data.tileSize;
        this.player.x=data.spawn.x*32; this.player.y=data.spawn.y*32;
        this.gameObjects.enemies=data.enemies.map(e=>({...e,hp:50,dead:false}));
        this.gameObjects.npcs=data.npcs||[]; this.gameObjects.items=data.items||[];
    },

    shake: function(amt) {
        this.screenShake = amt;
    }
};