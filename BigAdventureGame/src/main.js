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
    saveKey:   'questBigSave',

    // ── Level progression map (10 levels) ────────────────────────────────────
    levelMap: {
        '1-1': { file:'levels/level1.json', next:'1-2' },
        '1-2': { file:'levels/level2.json', next:'1-3' },
        '1-3': { file:'levels/level3.json', next:'1-4' },
        '1-4': { inline: true, next:'1-5', name:'Cursed Swamp', theme:'dungeon' },
        '1-5': { inline: true, next:'1-6', name:'Crystal Cavern', theme:'dungeon' },
        '1-6': { inline: true, next:'1-7', name:"Dragon's Lair", theme:'shadow' },
        '1-7': { inline: true, next:'1-8', name:'Frozen Peak', theme:'winter' },
        '1-8': { inline: true, next:'1-9', name:'Shadow Realm', theme:'shadow' },
        '1-9': { inline: true, next:'1-10', name:'Demon Gate', theme:'dungeon' },
        '1-10':{ inline: true, next:null, name:'Throne of Dawn', theme:'spring' }
    },

    // ── Inline level data for levels 4-10 ────────────────────────────────────
    inlineLevels: {
        '1-4': {
            world:1, level:4, name:"Cursed Swamp", theme:"dungeon",
            bgColor:"#2a3a2a", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,3,0,0,3,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,1,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,2],
                [2,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'slime',x:8,y:6},{type:'goblin',x:14,y:8}],
            npcs:[{id:'witch',x:3,y:10, sprite:'elder', name:'Witch', dialog:["The swamp hides dangers...","Beware the toxic pools!"]}],
            items:[], spawn:{x:2,y:11}
        },
        '1-5': {
            world:1, level:5, name:"Crystal Cavern", theme:"dungeon",
            bgColor:"#1a1a2e", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'goblin',x:6,y:3},{type:'goblin',x:12,y:5},{type:'slime',x:9,y:7}],
            npcs:[], items:[], spawn:{x:2,y:11}
        },
        '1-6': {
            world:1, level:6, name:"Dragon's Lair", theme:"shadow",
            bgColor:"#2a1a1a", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'goblin',x:9,y:6}],
            npcs:[{id:'smith',x:3,y:11, sprite:'elder', name:'Blacksmith', dialog:["A dragon guards the crystal!","Press A to attack!"]}],
            items:[], spawn:{x:2,y:11}
        },
        '1-7': {
            world:1, level:7, name:"Frozen Peak", theme:"winter",
            bgColor:"#a0c0e0", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'slime',x:8,y:4},{type:'goblin',x:13,y:8},{type:'slime',x:5,y:9}],
            npcs:[], items:[], spawn:{x:2,y:11}
        },
        '1-8': {
            world:1, level:8, name:"Shadow Realm", theme:"shadow",
            bgColor:"#0a0a1a", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'goblin',x:5,y:3},{type:'goblin',x:14,y:3},{type:'goblin',x:9,y:7}],
            npcs:[], items:[], spawn:{x:2,y:11}
        },
        '1-9': {
            world:1, level:9, name:"Demon Gate", theme:"dungeon",
            bgColor:"#2a0a0a", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'goblin',x:7,y:4},{type:'goblin',x:12,y:4},{type:'slime',x:9,y:7}],
            npcs:[], items:[], spawn:{x:2,y:11}
        },
        '1-10': {
            world:1, level:10, name:"Throne of Dawn", theme:"spring",
            bgColor:"#4a9e4a", tileSize:32,
            tiles:[
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            enemies:[{type:'goblin',x:9,y:4}],
            npcs:[{id:'elder2',x:7,y:11, sprite:'elder', name:'Elder', dialog:["You've come so far...","The final crystal awaits! Restore the light!"]}],
            items:[], spawn:{x:2,y:11}
        }
    },

    // ── Advance to next level ─────────────────────────────────────────────────
    nextLevel: function() {
        const key  = `${this.world}-${this.level}`;
        const info = this.levelMap[key];
        
        if (!info || !info.next) {
            this.save();
            Engine.paused = true;
            // Show victory
            Engine.dialogActive = true;
            Engine.dialogQueue = [
                "CONGRATULATIONS!",
                "You collected all 10 crystals!",
                "The realm is restored!",
                `Time survived: check your timer`,
                "THE END... for now."
            ];
            Engine.dialogIndex = 0;
            return;
        }

        const [nw, nl] = info.next.split('-').map(Number);
        this.world = nw; 
        this.level = nl;
        this.save();
        loadLevel(nw, nl);

        // Show level intro dialog
        const nextInfo = this.levelMap[info.next];
        if (nextInfo) {
            setTimeout(() => {
                Engine.dialogActive = true;
                Engine.dialogQueue = [
                    `WORLD 1 — ${nextInfo.name.toUpperCase()}`,
                    `Level ${nl} of 10`,
                    "Find the crystal and reach the exit!"
                ];
                Engine.dialogIndex = 0;
            }, 500);
        }
    },

    // ── Save / Load ──────────────────────────────────────────────────────────
    save: function() {
        const data = {
            world: this.world,
            level: this.level,
            hp: Engine.player.hp,
            xp: Engine.player.xp,
            gems: this.gems
        };
        localStorage.setItem(this.saveKey, JSON.stringify(data));
    },

    load: function() {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch(e) { return null; }
    },

    clearSave: function() {
        localStorage.removeItem(this.saveKey);
    }
};

// ── Load level ────────────────────────────────────────────────────────────────
function loadLevel(world, level) {
    const key  = `${world}-${level}`;
    const info = GameState.levelMap[key];
    if (!info) return;

    // Inline levels (4-10)
    if (info.inline && GameState.inlineLevels[key]) {
        const data = GameState.inlineLevels[key];
        Engine.loadLevelData(data);
        applySeasonEffects(data.theme || 'spring');
        return;
    }

    // File-based levels (1-3)
    if (info.file) {
        fetch(info.file)
            .then(r => r.json())
            .then(data => {
                Engine.loadLevelData(data);
                applySeasonEffects(data.theme || 'spring');
            })
            .catch(err => {
                console.warn('Level file loading failed:', err);
                if (level === 1) Engine.loadLevelData(FALLBACK_LEVEL);
            });
    }
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

    // Try to load saved game
    const saved = GameState.load();
    if (saved && saved.level) {
        GameState.world = saved.world;
        GameState.level = saved.level;
        GameState.gems = saved.gems || 0;
        loadLevel(saved.world, saved.level);
        // Restore HP after level loads
        setTimeout(() => {
            Engine.player.hp = saved.hp || 100;
            Engine.player.xp = saved.xp || 0;
        }, 100);
    } else {
        loadLevel(GameState.world, GameState.level);
    }

    // A button attack (physical button mapping)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'a' || e.key === 'z') {
            // Engine already handles attack via 'z' key
        }
    });

    // Start with Story Intro (only on new game)
    if (!saved) {
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