// ========== BIG ADVENTURE — MAIN (v3.0) ==========
// Story: The Crystal of Dawn — World 1

const GameState = {
    world:     1,
    level:     1,
    season:    'spring',
    hp:        100,
    xp:        0,
    inventory: [],
    gems:      0,

    // ── Level progression map ─────────────────────────────────────────────────
    levelMap: {
        '1-1': { file:'levels/level1.json', next:'1-2' },
        '1-2': { file:'levels/level2.json', next:'1-3' },
        '1-3': { file:'levels/level3.json', next:'2-1' }, // World 2 not yet implemented
    },

    // ── Advance to next level ─────────────────────────────────────────────────
    nextLevel: function() {
        const key  = `${this.world}-${this.level}`;
        const info = this.levelMap[key];
        
        if (!info || !info.next) {
            console.log('YOU WIN! All currently implemented levels complete.');
            Engine.paused = true;
            return;
        }

        const [nw, nl] = info.next.split('-').map(Number);
        if (nw > 1) {
            console.log('World 2 coming soon!');
            return;
        }

        this.world = nw; 
        this.level = nl;
        loadLevel(nw, nl);
    }
};

// ── Load level ────────────────────────────────────────────────────────────────
function loadLevel(world, level) {
    const key  = `${world}-${level}`;
    const info = GameState.levelMap[key];
    if (!info) return;

    fetch(info.file)
        .then(r => r.json())
        .then(data => {
            Engine.loadLevelData(data);
            applySeasonEffects(data.theme || 'spring');
        })
        .catch(err => {
            console.warn('Level file loading failed:', err);
            // Fallback for local testing
            if (level === 1) Engine.loadLevelData(FALLBACK_LEVEL);
        });
}

// ── Season effects ────────────────────────────────────────────────────────────
function applySeasonEffects(theme) {
    const canvas = document.getElementById('gameCanvas');
    const filters = {
        spring:  'saturate(1.1) brightness(1.05)',
        summer:  'saturate(1.2) brightness(1.1)',
        autumn:  'saturate(0.9) sepia(0.2)',
        winter:  'saturate(0.6) brightness(1.1) hue-rotate(-10deg)',
        dungeon: 'saturate(0.8) brightness(0.8) contrast(1.1)',
        shadow:  'saturate(0.5) brightness(0.7) hue-rotate(240deg)',
    };
    canvas.style.filter = filters[theme] || 'none';
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initGame() {
    Engine.setup('gameCanvas');
    loadLevel(GameState.world, GameState.level);
    
    // Start with Story Intro
    setTimeout(() => {
        Engine.dialogActive = true;
        Engine.dialogIndex = 0;
        Engine.dialogQueue = [
            "WORLD 1 — THE GREEN FIELDS",
            "Three days ago, the sky cracked open.",
            "You woke in a field, your past erased.",
            "Only a glowing mark remains on your hand...",
            "Find the Elder to learn your destiny."
        ];
    }, 500);
}

// ── Fallback level (World 1-1) ────────────────────────────────────────
const FALLBACK_LEVEL = {
    world:1, level:1, name:"The Green Fields", theme:"spring",
    bgColor:"#3a7d44", tileSize:32,
    tiles:[
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,1,1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,2],
        [2,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,2],
        [2,0,1,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2],
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
    ],
    enemies:[
        {type:'slime', x:4, y:5},
        {type:'goblin', x:12, y:4}
    ],
    npcs:[{
        id:'elder', x:3, y:2, sprite:'elder', name:'Elder Mirwen',
        dialog:["Young one... the Shadow Rift has torn open.","Find the shard in the Crystal Forge!"]
    }],
    items:[],
    spawn:{x:2,y:5}
};

window.onload = initGame;