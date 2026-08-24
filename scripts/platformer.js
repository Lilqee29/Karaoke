// ================================================================
//  PIXEL PLATFORMER — 10-level retro platformer with boss fight
//  Adapted from stonedhawk/pixel-platformer (MIT) for GameBoy PWA
//  D-pad: Left/Right move, Up = Jump
// ================================================================

let _platCanvas, _platCtx, _platRAF;
let _platRunning = false;

// Audio engine (Web Audio API)
const _platAudio = {
  ctx: null,
  muted: false,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  },
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f0, f1, dur, type = 'sine', g0 = 0.1, g1 = 0.01) {
    if (this.muted || !this.ctx) return;
    try {
      this.resume();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, this.ctx.currentTime);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, this.ctx.currentTime + dur);
      g.gain.setValueAtTime(g0, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(g1, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch(e) {}
  },
  noise(dur, lpf, g0 = 0.1) {
    if (this.muted || !this.ctx) return;
    try {
      this.resume();
      const sz = this.ctx.sampleRate * dur;
      const buf = this.ctx.createBuffer(1, sz, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < sz; i++) d[i] = Math.random() * 2 - 1;
      const s = this.ctx.createBufferSource(); s.buffer = buf;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(lpf, this.ctx.currentTime);
      f.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(g0, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
      s.connect(f); f.connect(g); g.connect(this.ctx.destination);
      s.start(); s.stop(this.ctx.currentTime + dur);
    } catch(e) {}
  },
  jump()  { this.tone(150, 550, 0.15, 'triangle', 0.15, 0.01); },
  coin()  { if (this.muted) return; this.tone(523, 523, 0.08, 'sine', 0.1, 0.01); setTimeout(() => this.tone(659, 659, 0.25, 'sine', 0.1, 0.01), 80); },
  stomp() { this.noise(0.18, 900, 0.2); this.tone(280, 70, 0.18, 'sawtooth', 0.15, 0.01); },
  hit()   { this.noise(0.35, 180, 0.3); this.tone(150, 40, 0.35, 'sawtooth', 0.2, 0.01); },
  lvl()   { if (this.muted) return; [261.63,329.63,392,523.25].forEach((f,i) => setTimeout(() => this.tone(f, f*1.05, 0.12, 'square', 0.08, 0.01), i*90)); },
  win()   { if (this.muted) return; [261.63,329.63,392,523.25,392,523.25,659.25,783.99,1046.5].forEach((f,i) => setTimeout(() => this.tone(f, f, 0.18, 'triangle', 0.1, 0.01), i*70)); },
  over()  { if (this.muted) return; [392,349.23,311.13,246.94].forEach((f,i) => setTimeout(() => this.tone(f, f*0.85, 0.35, 'sawtooth', 0.1, 0.01), i*130)); }
};

// Particles
let _platParticles = [];
function _platSpawnP(x, y, color, count = 10, speed = 3, grav = 0.15, dec = 0.94) {
  for (let i = 0; i < count; i++) {
    _platParticles.push({
      x, y, vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.5)*speed - (grav?1:0),
      color, size: Math.random()*4+2, gravity: grav, decay: dec, alpha: 1, life: Math.random()*20+20
    });
  }
}
function _platUpdateP() {
  for (let i = _platParticles.length-1; i >= 0; i--) {
    const p = _platParticles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.vx *= p.decay; p.vy *= p.decay;
    p.alpha -= 0.025; p.life--;
    if (p.life <= 0 || p.alpha <= 0) _platParticles.splice(i, 1);
  }
}

// Screen shake
let _platShake = 0;

// Input
const _platKeys = { left: false, right: false, jump: false };
let _platGameState = 'TITLE'; // TITLE, PLAYING, LEVEL_COMPLETE, GAME_OVER, WIN
let _platFrameCount = 0;

// Game constants
const PLAT_G = 0.45, PLAT_TV = 8, PLAT_WS = 3.2, PLAT_JV = -10.5, PLAT_TILE = 32;

// Globals
let _platScore = 0, _platCoins = 0, _platLives = 3;
let _platLevelIdx = 0, _platLevelName = '', _platLevelFrames = 0;
let _platEnemiesKilled = 0, _platLevelCoins = 0;

const _platPlayer = {
  x: 100, y: 100, startX: 100, startY: 100,
  width: 32, height: 40, vx: 0, vy: 0,
  grounded: false, invTimer: 0, coyote: 0, facing: 1
};
const _platCam = { x: 0, y: 0 };

// Levels
const PLAT_LVL1 = [
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  ".............................................C.......D........",
  ".......P.....................C...C..........GGG.....GGG.......",
  "......GGG...................GGG.GGG...........................",
  "......................C..................E....................",
  "...G.................GGG................GGG...................",
  ".......S....E.......................G..........S..............",
  "GGGGGGGGGGGGGGGG.GG.GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
  "################.##.##########################################",
  "################.##.##########################################",
  "################.##.##########################################"
];
const PLAT_LVL2 = [
  "..............................................................",
  "..............................................................",
  "............S..........C.....C...................C.......D....",
  "..P........GGG........GGG...GGG..................GGG....GGG...",
  "..G.................C................E........................",
  ".........E.........GG.............GGGGGG...S..................",
  "........GGG..........S....................GGG.................",
  "....C.............GGGGGG.....................C................",
  "..GGG.....................C...S...C.........GGG...............",
  ".......S.......S.........GGGGGGGGGGG.............S....S.......",
  "GGGGGGGGGGGGGGGGGG...GG...............GG...GGGGGGGGGGGGGGGGGG.",
  "##################...##...............##...##################.",
  "##################...##...............##...##################.",
  "##################...##...............##...##################.",
  "##################...##...............##...##################."
];
const PLAT_LVL3 = [
  "..............................................................",
  "...................................................C.....D....",
  ".......................................E..........GGG...GGG...",
  "....................C.........C.......GGG.....................",
  "..P........E.......GGG.......GGG................C.............",
  "..G.......GGG.................................GGGGG...........",
  "......................S........S..............................",
  "....C....C..........GGGGG....GGGGG......E.....................",
  "..GGGGG.GGGGG..........................GGG............S.......",
  "................S.................................GGGGGGG.....",
  "..............GGGGG.........C......C..........................",
  "..........................GGGGG..GGGGG........................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL4 = [
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................C...C...........................",
  "...P.....C............C......GGG.GGG..........................",
  "..GGG...GGG.........EE.............................D..........",
  "...................GGGG.........................GGGG..........",
  ".............S................S.........S.....................",
  "...........GGGGG............GGGGG.....GGGGG...................",
  "..............................................................",
  "........C.........E.......C...................................",
  ".......GGG.......GGG.....GGG..................................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL5 = [
  "##############################################################",
  "#...P........C...S.....S........E..........C.................#",
  "#.GGG.......GGGGGGGGGGGGGG.....GGG........GGG.S.....S....D...#",
  "#........................#.....................GGGGGGGG.GGG..#",
  "#...........E............#....E........C.....................#",
  "#C.......GGGGGG..........#...GGG......GGG....................#",
  "GGG......................#...................................#",
  "#...................C....#..................C.............E..#",
  "#....S.............GGG...#........S........GGGG.........GGGGG#",
  "#.GGGGGG...S.............#.....GGGGGG........................#",
  "#.........GGGGGG.........#.....................S.............#",
  "##########################...#################################",
  "##############################################################",
  "##############################################################",
  "##############################################################"
];
const PLAT_LVL6 = [
  "..............................................................",
  "....................................................C.........",
  "...................................................GGG...D....",
  ".......P............E........C.........E................GGG...",
  "......GGG..........GGG......GGG.......GGG........C............",
  ".................................................GGG..........",
  "...C.......S..............S........C..........................",
  "..GGG....GGGGG..........GGGGG.....GGG.........C...............",
  "..................S..........................GGG..............",
  "................GGGGG.........................................",
  ".............................S................................",
  "...........................GGGGG..............................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL7 = [
  "..............................................................",
  "..............................................................",
  "......P..........................C..............C........D....",
  ".....GGG.........S.....S........GGG............GGG......GGG...",
  "...............GGGGGGGGGGG...............EE...................",
  "..........C..C..........................GGGG..................",
  ".........GGGGGG..............C.......................C........",
  "............................GGG...S.................GGG.......",
  ".................................GGGGG.......S................",
  "....E............E.........................GGGGG..............",
  "...GGG..........GGG...........................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL8 = [
  "..............................................................",
  "...................................C........C.........C....D..",
  ".....P............................GGG......GGG.......GGG..GGG.",
  "....GGG.....S.....S......C....................................",
  "..........GGGGGGGGGGG...GGG.............E.........E...........",
  ".......................................GGG.......GGG..........",
  "........C...E.........S........S..............................",
  ".......GGG.GGG......GGGGG....GGGGG............................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL9 = [
  "..............................................................",
  "...................................................D..........",
  ".........................C...........C............GGG.........",
  "......P.................GGG.........GGG.......................",
  ".....GGG.......E................E...................C.........",
  "..............GGG..............GGG.................GGG........",
  ".......C....C........S.....S................E.................",
  "......GGGGGGGGG....GGGGGGGGGGG.............GGG................",
  "..................................S.....S.....................",
  "................................GGGGGGGGGGG...................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  "..............................................................",
  ".............................................................."
];
const PLAT_LVL10 = [
  "##############################################################",
  "##############################################################",
  "##############################################################",
  "###........................................................###",
  "###........................................................###",
  "###........................................................###",
  "###........................................................###",
  "###.......................................GGG..............###",
  "###..............GGG.......................................###",
  "###...P.............................................B......###",
  "##############################################################",
  "##############################################################",
  "##############################################################",
  "##############################################################",
  "##############################################################"
];

const _platLevels = [PLAT_LVL1,PLAT_LVL2,PLAT_LVL3,PLAT_LVL4,PLAT_LVL5,PLAT_LVL6,PLAT_LVL7,PLAT_LVL8,PLAT_LVL9,PLAT_LVL10];
const _platNames = ['Green Hills','Underground','Sky Fortress','Snowy Peaks','Deep Dungeon','Canopy Jungle','Abandoned Factory','Volcanic Core','The Void','Final Boss'];

let _platMap = [], _platCoinsList = [], _platEnemies = [], _platDoor = null, _platBoss = null;
let _platMapW = 0, _platMapH = 0;

function _platLoadLevel(idx) {
  const data = _platLevels[idx];
  _platLevelName = _platNames[idx];
  _platMap = []; _platCoinsList = []; _platEnemies = [];
  _platParticles.length = 0;
  _platDoor = null; _platBoss = null;
  _platLevelFrames = 0; _platEnemiesKilled = 0; _platLevelCoins = 0;

  _platMapH = data.length; _platMapW = data[0].length;
  for (let y = 0; y < _platMapH; y++) {
    const row = [];
    for (let x = 0; x < _platMapW; x++) {
      let t = data[y][x];
      if (t === 'P') {
        _platPlayer.startX = x * PLAT_TILE;
        _platPlayer.startY = y * PLAT_TILE;
        _platPlayer.x = _platPlayer.startX;
        _platPlayer.y = _platPlayer.startY;
        t = '.';
      } else if (t === 'C') {
        _platCoinsList.push({ x: x*PLAT_TILE, y: y*PLAT_TILE, collected: false, off: Math.random()*100 });
        t = '.';
      } else if (t === 'E') {
        _platEnemies.push({
          x: x*PLAT_TILE+4, y: y*PLAT_TILE+16, width: 24, height: 16,
          vx: -1, state: 'alive', squish: 0,
          type: (x+y)%2===0 ? 'slime' : 'beetle', off: Math.random()*100
        });
        t = '.';
      } else if (t === 'D') {
        _platDoor = { x: x*PLAT_TILE+4, y: y*PLAT_TILE, width: 24, height: 32 };
        t = '.';
      } else if (t === 'B') {
        _platBoss = { x: x*PLAT_TILE, y: y*PLAT_TILE-16, width: 48, height: 48, vx: 3, vy: 0, state: 'alive', hp: 5, inv: 0 };
        t = '.';
      }
      row.push(t);
    }
    _platMap.push(row);
  }
  _platCam.x = Math.max(0, Math.min(_platPlayer.startX + _platPlayer.width/2 - _platCanvas.width/2, _platMapW*PLAT_TILE - _platCanvas.width));
}

function _platSolid(tx, ty) {
  if (tx < 0 || tx >= _platMapW) return true;
  if (ty < 0 || ty >= _platMapH) return false;
  return _platMap[ty][tx] === '#' || _platMap[ty][tx] === 'G';
}

function _platCollide(px, py, pw, ph) {
  const tx1 = Math.floor(px/PLAT_TILE), tx2 = Math.floor((px+pw-0.1)/PLAT_TILE);
  const ty1 = Math.floor(py/PLAT_TILE), ty2 = Math.floor((py+ph-0.1)/PLAT_TILE);
  for (let ty = ty1; ty <= ty2; ty++)
    for (let tx = tx1; tx <= tx2; tx++)
      if (_platSolid(tx, ty)) return true;
  return false;
}

function _platOverlap(a, b) {
  return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
}

function _platKill() {
  if (_platPlayer.invTimer > 0) return;
  _platSpawnP(_platPlayer.x+_platPlayer.width/2, _platPlayer.y+_platPlayer.height/2, '#4488ff', 25, 6, 0.1, 0.95);
  _platSpawnP(_platPlayer.x+_platPlayer.width/2, _platPlayer.y+_platPlayer.height/2, '#ffcc88', 15, 4, 0.1, 0.95);
  _platShake = 12;
  _platAudio.hit();
  _platLives--;
  if (_platLives <= 0) { _platGameState = 'GAME_OVER'; _platAudio.over(); }
  else {
    _platPlayer.x = _platPlayer.startX; _platPlayer.y = _platPlayer.startY;
    _platPlayer.vx = 0; _platPlayer.vy = 0; _platPlayer.invTimer = 60;
    _platCam.x = Math.max(0, Math.min(_platPlayer.startX+_platPlayer.width/2-_platCanvas.width/2, _platMapW*PLAT_TILE-_platCanvas.width));
  }
}

function _platUpdate() {
  _platFrameCount++;
  _platUpdateP();
  if (_platGameState !== 'PLAYING') return;
  _platLevelFrames++;
  if (_platPlayer.invTimer > 0) _platPlayer.invTimer--;

  if (_platPlayer.grounded) _platPlayer.coyote = 6;
  else if (_platPlayer.coyote > 0) _platPlayer.coyote--;

  if (_platKeys.left) _platPlayer.vx = -PLAT_WS;
  else if (_platKeys.right) _platPlayer.vx = PLAT_WS;
  else _platPlayer.vx = 0;

  if (_platPlayer.vx > 0) _platPlayer.facing = 1;
  if (_platPlayer.vx < 0) _platPlayer.facing = -1;

  if (_platKeys.jump && _platPlayer.coyote > 0) {
    _platPlayer.vy = PLAT_JV;
    _platPlayer.grounded = false;
    _platPlayer.coyote = 0;
    _platAudio.jump();
    _platSpawnP(_platPlayer.x+_platPlayer.width/2, _platPlayer.y+_platPlayer.height, '#fff', 8, 2, 0.05, 0.9);
  }

  _platPlayer.vy += PLAT_G;
  if (_platPlayer.vy > PLAT_TV) _platPlayer.vy = PLAT_TV;

  _platPlayer.x += _platPlayer.vx;
  if (_platCollide(_platPlayer.x, _platPlayer.y, _platPlayer.width, _platPlayer.height)) {
    if (_platPlayer.vx > 0) _platPlayer.x = Math.floor((_platPlayer.x+_platPlayer.width)/PLAT_TILE)*PLAT_TILE - _platPlayer.width;
    else if (_platPlayer.vx < 0) _platPlayer.x = Math.floor(_platPlayer.x/PLAT_TILE)*PLAT_TILE + PLAT_TILE;
    _platPlayer.vx = 0;
  }

  const wasGrounded = _platPlayer.grounded;
  _platPlayer.grounded = false;
  _platPlayer.y += _platPlayer.vy;
  if (_platCollide(_platPlayer.x, _platPlayer.y, _platPlayer.width, _platPlayer.height)) {
    if (_platPlayer.vy > 0) {
      _platPlayer.y = Math.floor((_platPlayer.y+_platPlayer.height)/PLAT_TILE)*PLAT_TILE - _platPlayer.height;
      _platPlayer.grounded = true;
      if (!wasGrounded) _platSpawnP(_platPlayer.x+_platPlayer.width/2, _platPlayer.y+_platPlayer.height, '#fff', 5, 1.5, 0.05, 0.9);
    } else if (_platPlayer.vy < 0) {
      _platPlayer.y = Math.floor(_platPlayer.y/PLAT_TILE)*PLAT_TILE + PLAT_TILE;
    }
    _platPlayer.vy = 0;
  }

  if (_platPlayer.y > _platCanvas.height + 100) _platKill();

  // Enemies
  for (const e of _platEnemies) {
    if (e.state === 'dead') continue;
    if (e.state === 'alive') {
      const nx = e.x + e.vx;
      const ntx = Math.floor((e.vx > 0 ? nx+e.width : nx)/PLAT_TILE);
      const cty = Math.floor((e.y+e.height-1)/PLAT_TILE);
      if (_platSolid(ntx, cty) || !_platSolid(ntx, cty+1)) e.vx *= -1;
      else e.x += e.vx;
    } else if (e.state === 'squish') {
      e.squish--;
      if (e.squish <= 0) e.state = 'dead';
    }
  }

  // Coins
  for (const c of _platCoinsList) {
    if (!c.collected && _platOverlap(_platPlayer, { x: c.x+8, y: c.y+8, width: 16, height: 16 })) {
      c.collected = true; _platCoins++; _platLevelCoins++;
      _platScore += 50; _platAudio.coin();
      _platSpawnP(c.x+16, c.y+16, '#ffcc00', 10, 3, 0.05, 0.94);
    }
  }

  // Enemy collision
  for (const e of _platEnemies) {
    if (e.state === 'alive' && _platOverlap(_platPlayer, e)) {
      if (_platPlayer.vy > 0 && _platPlayer.y+_platPlayer.height-_platPlayer.vy <= e.y+8) {
        e.state = 'squish'; e.squish = 30;
        _platPlayer.vy = -8; _platScore += 100; _platEnemiesKilled++;
        _platAudio.stomp();
        _platSpawnP(e.x+e.width/2, e.y+e.height/2, e.type==='slime'?'#e53935':'#78909c', 12, 4, 0.1, 0.95);
        _platShake = 5;
      } else _platKill();
    }
  }

  // Spikes
  const stx1 = Math.floor(_platPlayer.x/PLAT_TILE), stx2 = Math.floor((_platPlayer.x+_platPlayer.width-0.1)/PLAT_TILE);
  const sty1 = Math.floor(_platPlayer.y/PLAT_TILE), sty2 = Math.floor((_platPlayer.y+_platPlayer.height-0.1)/PLAT_TILE);
  for (let ty = sty1; ty <= sty2; ty++)
    for (let tx = stx1; tx <= stx2; tx++)
      if (tx >= 0 && tx < _platMapW && ty >= 0 && ty < _platMapH && _platMap[ty][tx] === 'S') _platKill();

  // Door
  if (_platDoor && _platOverlap(_platPlayer, _platDoor)) {
    const secs = Math.floor(_platLevelFrames/60);
    _platScore += Math.max(0, (60-secs)*10) + 500;
    _platGameState = 'LEVEL_COMPLETE';
    _platAudio.lvl();
  }

  // Boss
  if (_platBoss && _platBoss.state === 'alive') {
    if (_platBoss.inv > 0) _platBoss.inv--;
    _platBoss.vy += PLAT_G; _platBoss.y += _platBoss.vy;
    if (_platCollide(_platBoss.x, _platBoss.y, _platBoss.width, _platBoss.height)) {
      if (_platBoss.vy > 0) { _platBoss.y = Math.floor((_platBoss.y+_platBoss.height)/PLAT_TILE)*PLAT_TILE - _platBoss.height; _platBoss.vy = 0; }
    }
    const bnx = _platBoss.x + _platBoss.vx;
    const btx = Math.floor((_platBoss.vx > 0 ? bnx+_platBoss.width : bnx)/PLAT_TILE);
    const bty = Math.floor((_platBoss.y+_platBoss.height-1)/PLAT_TILE);
    if (_platSolid(btx, bty) || !_platSolid(btx, bty+1)) _platBoss.vx *= -1;
    else _platBoss.x += _platBoss.vx;

    if (_platOverlap(_platPlayer, _platBoss)) {
      if (_platPlayer.vy > 0 && _platPlayer.y+_platPlayer.height-_platPlayer.vy <= _platBoss.y+16) {
        _platPlayer.vy = PLAT_JV * 1.2;
        if (_platBoss.inv <= 0) {
          _platBoss.hp--; _platBoss.inv = 30; _platScore += 500;
          _platAudio.stomp();
          _platSpawnP(_platBoss.x+_platBoss.width/2, _platBoss.y+_platBoss.height/2, '#9c27b0', 20, 5, 0.1, 0.95);
          _platShake = 8;
          if (_platBoss.hp <= 0) {
            _platBoss.state = 'dead'; _platScore += 5000;
            _platDoor = { x: Math.floor(_platMapW/2)*PLAT_TILE+4, y: 9*PLAT_TILE, width: 24, height: 32 };
            _platAudio.win();
            _platSpawnP(_platBoss.x+_platBoss.width/2, _platBoss.y+_platBoss.height/2, '#ffcc00', 40, 6, 0.15, 0.96);
            _platSpawnP(_platBoss.x+_platBoss.width/2, _platBoss.y+_platBoss.height/2, '#d500f9', 30, 5, 0.15, 0.96);
            _platShake = 20;
          }
        }
      } else _platKill();
    }
  }

  // Camera
  let tx = _platPlayer.x + _platPlayer.width/2 - _platCanvas.width/2;
  tx = Math.max(0, Math.min(tx, _platMapW*PLAT_TILE - _platCanvas.width));
  _platCam.x += (tx - _platCam.x) * 0.1;
  _platCam.x = Math.max(0, Math.min(_platCam.x, _platMapW*PLAT_TILE - _platCanvas.width));
}

function _platDrawBg() {
  const ctx = _platCtx;
  const cv = _platCanvas;
  const px = _platCam.x * 0.3;
  const fi = _platLevelIdx;

  if (fi === 0) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#88ccff'); g.addColorStop(1,'#fff');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for(let i=0;i<10;i++){
      let cx=((i*150-px)%1500+1500)%1500-200, cy=50+(i*37)%150;
      ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.arc(cx+25,cy-10,40,0,Math.PI*2); ctx.arc(cx+50,cy,30,0,Math.PI*2); ctx.fill();
    }
  } else if (fi === 1) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#222'); g.addColorStop(1,'#0a0a0a');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#333';
    for(let i=0;i<15;i++){
      let cx=((i*120-px)%1500+1500)%1500-200;
      ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx+40,150+(i*41)%100); ctx.lineTo(cx+80,0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx,cv.height); ctx.lineTo(cx+30,cv.height-100-(i*31)%80); ctx.lineTo(cx+60,cv.height); ctx.fill();
    }
  } else if (fi === 2) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#44bbff'); g.addColorStop(1,'#aaddff');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for(let i=0;i<10;i++){
      let cx=((i*200-px)%1500+1500)%1500-200, cy=100+(i*87)%200;
      ctx.fillRect(cx,cy,100+(i*33)%50,20);
    }
  } else if (fi === 3) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#eef6ff'); g.addColorStop(1,'#fff');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#ccddff';
    for(let i=0;i<8;i++){
      let cx=((i*300-px*0.5)%2000+2000)%2000-300;
      ctx.beginPath(); ctx.moveTo(cx,cv.height); ctx.lineTo(cx+200,100+(i*71)%150); ctx.lineTo(cx+400,cv.height); ctx.fill();
    }
  } else if (fi === 4) {
    ctx.fillStyle = '#1e1e24'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.strokeStyle = '#2a2a30';
    for(let i=0;i<20;i++){
      let ox=((i*100-px)%2000+2000)%2000-100;
      ctx.strokeRect(ox,50,100,300); ctx.strokeRect(ox+50,100,100,300);
    }
  } else if (fi === 5) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#226622'); g.addColorStop(1,'#66aa44');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#114411';
    for(let i=0;i<15;i++){
      let cx=((i*150-px*0.8)%2000+2000)%2000-200;
      ctx.fillRect(cx,0,20+(i*13)%30,cv.height);
    }
  } else if (fi === 6) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#885533'); g.addColorStop(1,'#333');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#222';
    for(let i=0;i<10;i++){
      let cx=((i*250-px*0.4)%2000+2000)%2000-300;
      ctx.fillRect(cx,150+(i*81)%100,100,cv.height);
    }
  } else if (fi === 7) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#110000'); g.addColorStop(1,'#ff3300');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#ffaa00';
    for(let i=0;i<30;i++){
      let cx=((i*70-px)%1500+1500)%1500-50;
      let cy=cv.height-((_platFrameCount*0.5+i*83)%cv.height);
      ctx.fillRect(cx,cy,4,12);
    }
  } else if (fi === 8) {
    ctx.fillStyle = '#050510'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#fff';
    for(let i=0;i<50;i++){
      let cx=((i*50-px*2)%1500+1500)%1500-50;
      let cy=(i*123)%cv.height, sz=(i%3)+1;
      ctx.fillRect(cx,cy,sz,sz);
    }
  } else if (fi === 9) {
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#440000'); g.addColorStop(1,'#110000');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle = '#880000';
    ctx.font = 'bold 40px "Press Start 2P",monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINAL BOSS', cv.width/2-px*0.1, 150);
  }
}

function _platDraw() {
  const ctx = _platCtx;
  const cv = _platCanvas;
  ctx.save();

  if (_platShake > 0.5) {
    ctx.translate((Math.random()-0.5)*_platShake, (Math.random()-0.5)*_platShake);
    _platShake *= 0.85;
  }

  if (_platGameState === 'TITLE') {
    _platFrameCount++;
    let g = ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#1f2833'); g.addColorStop(1,'#0b0c10');
    ctx.fillStyle = g; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.textAlign = 'center';

    // Title
    ctx.font = 'bold 20px "Press Start 2P",monospace';
    ctx.fillStyle = '#000'; ctx.fillText('PIXEL QUEST', cv.width/2+2, 62);
    ctx.fillStyle = '#66fcf1'; ctx.fillText('PIXEL QUEST', cv.width/2, 60);

    // Bobbing player
    ctx.save();
    ctx.translate(cv.width/2, 130 + Math.sin(_platFrameCount*0.08)*6);
    ctx.scale(1.4, 1.4);
    const bx = -16;
    ctx.fillStyle = '#cc1111'; ctx.fillRect(bx+10,-4,18,4); ctx.fillRect(bx+14,-6,12,2);
    ctx.fillStyle = '#ffcc88'; ctx.fillRect(bx+12,0,16,12);
    ctx.fillStyle = '#fff'; ctx.fillRect(bx+22,2,4,4);
    ctx.fillStyle = '#000'; ctx.fillRect(bx+24,2,2,4);
    ctx.fillStyle = '#3366cc'; ctx.fillRect(bx,12,32,20);
    ctx.fillStyle = '#ff4444'; ctx.fillRect(bx,8,32,4); ctx.fillRect(bx+2,12,6,12); ctx.fillRect(bx+24,12,6,12);
    ctx.fillStyle = '#333'; ctx.fillRect(bx+2,32,10,8); ctx.fillRect(bx+20,32,10,8);
    ctx.restore();

    // Controls hint
    ctx.font = '8px "Press Start 2P",monospace';
    ctx.fillStyle = '#8892b0';
    ctx.fillText('← → MOVE    ↑ JUMP', cv.width/2, cv.height - 60);

    // Blink
    ctx.font = '10px "Press Start 2P",monospace';
    ctx.fillStyle = (Math.floor(_platFrameCount/30)%2===0) ? '#66fcf1' : '#45a29e';
    ctx.fillText('PRESS ↑ TO START', cv.width/2, cv.height - 30);
    ctx.restore();
    return;
  }

  _platDrawBg();

  const startX = Math.floor(_platCam.x/PLAT_TILE);
  const endX = Math.floor((_platCam.x+cv.width)/PLAT_TILE);

  // Tiles
  for (let y = 0; y < _platMapH; y++) {
    for (let x = startX; x <= endX; x++) {
      if (x < 0 || x >= _platMapW) continue;
      const t = _platMap[y][x];
      const dx = x*PLAT_TILE - _platCam.x, dy = y*PLAT_TILE;

      if (t === '#' || t === 'G') {
        ctx.fillStyle = '#5c3d24'; ctx.fillRect(dx,dy,PLAT_TILE,PLAT_TILE);
        ctx.strokeStyle = '#3d2514'; ctx.lineWidth = 2; ctx.strokeRect(dx,dy,PLAT_TILE,PLAT_TILE);
        ctx.fillStyle = '#8b5e3c'; ctx.fillRect(dx+4,dy+4,PLAT_TILE-8,PLAT_TILE-8);
      }
      if (t === 'G') {
        ctx.fillStyle = '#2e7d32'; ctx.fillRect(dx,dy,PLAT_TILE,8);
        ctx.fillStyle = '#4caf50';
        for(let i=0;i<PLAT_TILE;i+=6){ ctx.fillRect(dx+i,dy-Math.floor(Math.random()*4+1),3,4); }
      }
      if (t === 'S') {
        ctx.fillStyle = '#aaa';
        for(let i=0;i<PLAT_TILE;i+=8){
          ctx.beginPath();
          ctx.moveTo(dx+i,dy+PLAT_TILE);
          ctx.lineTo(dx+i+4,dy+PLAT_TILE-12);
          ctx.lineTo(dx+i+8,dy+PLAT_TILE);
          ctx.fill();
        }
        ctx.fillStyle = '#ddd';
        for(let i=0;i<PLAT_TILE;i+=8){
          ctx.beginPath();
          ctx.moveTo(dx+i+2,dy+PLAT_TILE);
          ctx.lineTo(dx+i+4,dy+PLAT_TILE-8);
          ctx.lineTo(dx+i+6,dy+PLAT_TILE);
          ctx.fill();
        }
      }
    }
  }

  // Door
  if (_platDoor) {
    const ddx = _platDoor.x - _platCam.x;
    ctx.fillStyle = '#8B4513'; ctx.fillRect(ddx, _platDoor.y, _platDoor.width, _platDoor.height);
    ctx.fillStyle = '#A0522D'; ctx.fillRect(ddx+3, _platDoor.y+3, _platDoor.width-6, _platDoor.height-6);
    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(ddx+_platDoor.width-6, _platDoor.y+_platDoor.height/2, 3, 0, Math.PI*2); ctx.fill();
    // Glow
    ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(_platFrameCount*0.05)*0.15;
    ctx.fillStyle = '#FFD700'; ctx.fillRect(ddx-4,_platDoor.y-4,_platDoor.width+8,_platDoor.height+8);
    ctx.restore();
  }

  // Coins
  for (const c of _platCoinsList) {
    if (c.collected) continue;
    const cx2 = c.x - _platCam.x;
    const pulse = 1 + Math.sin(_platFrameCount*0.1 + c.off)*0.15;
    ctx.save();
    ctx.translate(cx2+16, c.y+16); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFA500'; ctx.beginPath(); ctx.arc(-1,-1,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(-2,-3,2,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Enemies
  for (const e of _platEnemies) {
    if (e.state === 'dead') continue;
    const ex = e.x - _platCam.x;
    if (e.state === 'squish') {
      ctx.save(); ctx.translate(ex+e.width/2, e.y+e.height); ctx.scale(1.3, 0.4);
      ctx.fillStyle = e.type==='slime'?'#e53935':'#78909c';
      ctx.fillRect(-e.width/2,-e.height,e.width,e.height);
      ctx.restore();
    } else {
      const bob = Math.sin(_platFrameCount*0.05+e.off)*2;
      if (e.type === 'slime') {
        ctx.fillStyle = '#e53935'; ctx.fillRect(ex, e.y+bob, e.width, e.height);
        ctx.fillStyle = '#ef5350'; ctx.fillRect(ex+3, e.y+bob+2, e.width-6, e.height-4);
        ctx.fillStyle = '#fff'; ctx.fillRect(ex+16, e.y+bob+4, 4, 4);
        ctx.fillStyle = '#000'; ctx.fillRect(ex+18, e.y+bob+5, 2, 2);
      } else {
        ctx.fillStyle = '#546E7A'; ctx.fillRect(ex, e.y+bob, e.width, e.height);
        ctx.fillStyle = '#78909C'; ctx.fillRect(ex+4, e.y+bob+2, e.width-8, e.height-4);
        ctx.fillStyle = '#FF0'; ctx.fillRect(ex+14, e.y+bob+4, 6, 4);
        ctx.fillStyle = '#000'; ctx.fillRect(ex+16, e.y+bob+5, 2, 2);
      }
    }
  }

  // Boss
  if (_platBoss && _platBoss.state !== 'dead') {
    const bx = _platBoss.x - _platCam.x;
    const flash = _platBoss.inv > 0 && Math.floor(_platFrameCount/3)%2;
    ctx.save();
    if (flash) ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#4a148c'; ctx.fillRect(bx, _platBoss.y, _platBoss.width, _platBoss.height);
    ctx.fillStyle = '#7b1fa2'; ctx.fillRect(bx+4, _platBoss.y+4, _platBoss.width-8, _platBoss.height-8);
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(bx+8, _platBoss.y+8, 12, 12);
    ctx.fillRect(bx+_platBoss.width-20, _platBoss.y+8, 12, 12);
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx+12, _platBoss.y+12, 4, 4);
    ctx.fillRect(bx+_platBoss.width-16, _platBoss.y+12, 4, 4);
    // HP bar
    const hpPct = _platBoss.hp / 5;
    ctx.fillStyle = '#333'; ctx.fillRect(bx, _platBoss.y-12, _platBoss.width, 6);
    ctx.fillStyle = hpPct > 0.3 ? '#4caf50' : '#f44336';
    ctx.fillRect(bx, _platBoss.y-12, _platBoss.width*hpPct, 6);
    ctx.restore();
  }

  // Player
  if (_platPlayer.invTimer <= 0 || Math.floor(_platFrameCount/4)%2) {
    const ppx = _platPlayer.x - _platCam.x;
    const ppy = _platPlayer.y;
    const f = _platPlayer.facing;
    ctx.save();
    if (f < 0) { ctx.translate(ppx+_platPlayer.width, 0); ctx.scale(-1, 1); } else { ctx.translate(ppx, 0); }

    // Body
    ctx.fillStyle = '#3366cc'; ctx.fillRect(0, ppy+12, 32, 20);
    ctx.fillStyle = '#ff4444'; ctx.fillRect(0, ppy+8, 32, 4);
    ctx.fillRect(2, ppy+12, 6, 12); ctx.fillRect(24, ppy+12, 6, 12);

    // Head
    ctx.fillStyle = '#ffcc88'; ctx.fillRect(12, ppy, 16, 12);
    ctx.fillStyle = '#cc1111'; ctx.fillRect(10, ppy-4, 18, 4); ctx.fillRect(14, ppy-6, 12, 2);

    // Eye
    ctx.fillStyle = '#fff'; ctx.fillRect(22, ppy+2, 4, 4);
    ctx.fillStyle = '#000'; ctx.fillRect(24, ppy+2, 2, 4);

    // Shoes
    ctx.fillStyle = '#333';
    const walkFrame = _platPlayer.vx !== 0 && _platPlayer.grounded ? Math.sin(_platFrameCount*0.3)*3 : 0;
    ctx.fillRect(2, ppy+32, 10, 8+walkFrame);
    ctx.fillRect(20, ppy+32, 10, 8-walkFrame);

    ctx.restore();
  }

  // Particles
  for (const p of _platParticles) {
    ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
    ctx.fillRect(p.x-_platCam.x, p.y, p.size, p.size);
    ctx.restore();
  }

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,cv.width,28);
  ctx.font = '8px "Press Start 2P",monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  ctx.fillText('♥'+_platLives, 4, 18);
  ctx.fillText('★'+_platScore, 70, 18);
  ctx.fillText('●'+_platCoins, 170, 18);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#66fcf1'; ctx.fillText(_platLevelName, cv.width-4, 18);

  // Overlays
  ctx.textAlign = 'center';
  if (_platGameState === 'GAME_OVER') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.font = '16px "Press Start 2P",monospace'; ctx.fillStyle = '#f44';
    ctx.fillText('GAME OVER', cv.width/2, cv.height/2-20);
    ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: '+_platScore, cv.width/2, cv.height/2+10);
    ctx.fillStyle = (Math.floor(_platFrameCount/30)%2)?'#66fcf1':'#45a29e';
    ctx.fillText('PRESS ↑ TO RETRY', cv.width/2, cv.height/2+40);
  } else if (_platGameState === 'LEVEL_COMPLETE') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.font = '12px "Press Start 2P",monospace'; ctx.fillStyle = '#4caf50';
    ctx.fillText('LEVEL CLEAR!', cv.width/2, cv.height/2-30);
    ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('SCORE: '+_platScore, cv.width/2, cv.height/2);
    ctx.fillStyle = (Math.floor(_platFrameCount/30)%2)?'#66fcf1':'#45a29e';
    ctx.fillText('PRESS ↑ FOR NEXT', cv.width/2, cv.height/2+30);
  } else if (_platGameState === 'WIN') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,cv.width,cv.height);
    ctx.font = '14px "Press Start 2P",monospace'; ctx.fillStyle = '#FFD700';
    ctx.fillText('YOU WIN!', cv.width/2, cv.height/2-30);
    ctx.font = '8px "Press Start 2P",monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('FINAL SCORE: '+_platScore, cv.width/2, cv.height/2+10);
    ctx.fillStyle = (Math.floor(_platFrameCount/30)%2)?'#66fcf1':'#45a29e';
    ctx.fillText('PRESS ↑ TO PLAY AGAIN', cv.width/2, cv.height/2+40);
  }

  ctx.restore();
}

function _platLoop() {
  if (!_platRunning) return;
  _platUpdate();
  _platDraw();
  _platRAF = requestAnimationFrame(_platLoop);
}

function _platStartGame() {
  _platLevelIdx = 0; _platScore = 0; _platCoins = 0; _platLives = 3;
  _platLoadLevel(0); _platGameState = 'PLAYING';
}

// ── INIT ─────────────────────────────────────────────────────────
function initPlatform() {
  const container = document.getElementById('platformContent');
  if (!container) return;

  // Build UI
  container.innerHTML = `
    <div style="position:relative;width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;">
      <canvas id="platCanvas" style="width:100%;height:100%;display:block;image-rendering:pixelated;"></canvas>
    </div>`;

  _platCanvas = document.getElementById('platCanvas');
  if (!_platCanvas) return;

  // Size canvas to fill the screen
  const resize = () => {
    const r = _platCanvas.parentElement.getBoundingClientRect();
    _platCanvas.width = Math.floor(r.width);
    _platCanvas.height = Math.floor(r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  _platCtx = _platCanvas.getContext('2d');
  _platRunning = true;
  _platFrameCount = 0;
  _platGameState = 'TITLE';

  _platAudio.init();
  _platAudio.resume();

  // Keyboard input
  _platKeyDownHandler = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (_platGameState === 'TITLE') { _platStartGame(); _platKeys.jump = false; return; }
      if (_platGameState === 'LEVEL_COMPLETE') {
        _platLevelIdx++;
        if (_platLevelIdx >= _platLevels.length) { _platGameState = 'WIN'; }
        else { _platLoadLevel(_platLevelIdx); _platGameState = 'PLAYING'; }
        _platKeys.jump = false; return;
      }
      if (_platGameState === 'GAME_OVER' || _platGameState === 'WIN') {
        _platStartGame(); _platKeys.jump = false; return;
      }
    }
    if (_platGameState === 'PLAYING') {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') _platKeys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') _platKeys.right = true;
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'Space') {
        _platKeys.jump = true; e.preventDefault();
      }
    }
  };
  _platKeyUpHandler = (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') _platKeys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') _platKeys.right = false;
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'KeyW' || e.code === 'KeyS' || e.code === 'Space') _platKeys.jump = false;
  };
  _platBlurHandler = () => { _platKeys.left = false; _platKeys.right = false; _platKeys.jump = false; };

  window.addEventListener('keydown', _platKeyDownHandler);
  window.addEventListener('keyup', _platKeyUpHandler);
  window.addEventListener('blur', _platBlurHandler);

  _platLoop();
}

let _platKeyDownHandler, _platKeyUpHandler, _platBlurHandler;

function _platCleanup() {
  _platRunning = false;
  if (_platRAF) { cancelAnimationFrame(_platRAF); _platRAF = null; }
  if (_platKeyDownHandler) window.removeEventListener('keydown', _platKeyDownHandler);
  if (_platKeyUpHandler) window.removeEventListener('keyup', _platKeyUpHandler);
  if (_platBlurHandler) window.removeEventListener('blur', _platBlurHandler);
  _platKeys.left = false; _platKeys.right = false; _platKeys.jump = false;
  _platParticles.length = 0;
}
