// ========== CHAMELEON — SCENE DEFINITIONS ==========
// 5 maps, each 20×15 tiles (320×240 canvas at 16px tiles)
// Tile types: 0=floor, 1=wall, 2=furniture(solid), 3=hiding-spot, 4=door, 5=decoration

const CHM_TILE = 16;
const CHM_COLS = 20;
const CHM_ROWS = 15;

// ── Color Palettes (per map) ────────────────────────────────────────────
// Each palette: [floor, wall, wallDark, furniture, furnitureAccent, accent1, accent2, shadow, highlight]
const CHM_PALETTES = {
    mansion: {
        name: 'Mansion',
        floor: '#4a3728',       // dark wood floor
        floorAlt: '#3d2e20',    // wood plank variation
        wall: '#5c3d2e',        // dark wood wall
        wallTop: '#6b4a38',     // wall highlight
        wallDark: '#2e1f15',    // wall shadow
        furniture: '#8b6914',   // golden furniture
        furnitureDark: '#5c4510',
        furnitureLight: '#a88020',
        carpet: '#7a1a1a',      // red carpet
        carpetLight: '#992222',
        accent: '#c9a84c',      // gold trim
        accent2: '#1a4a1a',     // green plants
        wood: '#6b4226',        // general wood
        woodDark: '#4a2e1a',
        shadow: 'rgba(0,0,0,0.35)',
        highlight: 'rgba(255,220,150,0.15)',
    },
    school: {
        name: 'School',
        floor: '#c8b89a',       // light tile
        floorAlt: '#b8a88a',
        wall: '#e8dcc8',        // cream wall
        wallTop: '#f0e8d8',
        wallDark: '#a89878',
        furniture: '#8b7355',   // wooden desks
        furnitureDark: '#6b5535',
        furnitureLight: '#a89070',
        carpet: '#2a5a8a',      // blue carpet
        carpetLight: '#3a6a9a',
        accent: '#cc3333',      // red accents
        accent2: '#228822',     // green plants
        wood: '#8b7355',
        woodDark: '#6b5535',
        shadow: 'rgba(0,0,0,0.2)',
        highlight: 'rgba(255,255,240,0.2)',
    },
    park: {
        name: 'Park',
        floor: '#5a8a3a',       // green grass
        floorAlt: '#4a7a2a',
        wall: '#8a7a6a',        // stone wall
        wallTop: '#9a8a7a',
        wallDark: '#6a5a4a',
        furniture: '#6a5040',   // brown wood benches
        furnitureDark: '#4a3020',
        furnitureLight: '#8a7060',
        carpet: '#3a8aba',      // blue water
        carpetLight: '#4a9aca',
        accent: '#dab040',      // yellow flowers
        accent2: '#2a6a1a',     // dark green bushes
        wood: '#6a5040',
        woodDark: '#4a3020',
        shadow: 'rgba(0,0,0,0.3)',
        highlight: 'rgba(255,255,200,0.15)',
    },
    shop: {
        name: 'Shop',
        floor: '#d0c8b8',       // clean tile
        floorAlt: '#c0b8a8',
        wall: '#e0e0e0',        // white walls
        wallTop: '#f0f0f0',
        wallDark: '#b0b0b0',
        furniture: '#404040',   // dark shelves
        furnitureDark: '#2a2a2a',
        furnitureLight: '#606060',
        carpet: '#2060a0',      // blue signage
        carpetLight: '#3070b0',
        accent: '#ff4444',      // sale signs
        accent2: '#44aa44',     // product colors
        wood: '#c8b898',
        woodDark: '#a89878',
        shadow: 'rgba(0,0,0,0.2)',
        highlight: 'rgba(255,255,255,0.25)',
    },
    hospital: {
        name: 'Hospital',
        floor: '#b8c8d0',       // blue-grey tile
        floorAlt: '#a8b8c0',
        wall: '#d8e0e8',        // pale blue wall
        wallTop: '#e8f0f8',
        wallDark: '#a0a8b0',
        furniture: '#e0e0e0',   // white beds
        furnitureDark: '#c0c0c0',
        furnitureLight: '#f0f0f0',
        carpet: '#4080a0',      // teal accents
        carpetLight: '#5090b0',
        accent: '#ff6666',      // red cross
        accent2: '#40a040',     // plants
        wood: '#d0d0d0',
        woodDark: '#a0a0a0',
        shadow: 'rgba(0,0,0,0.2)',
        highlight: 'rgba(255,255,255,0.3)',
    }
};

// ── Tile Maps ───────────────────────────────────────────────────────────
// 0=floor  1=wall  2=solid(furniture)  3=hiding-spot  4=door  5=decoration(non-solid)

const CHM_MAPS = {
    mansion: {
        name: 'Hide-and-Seek Mansion',
        // 20 cols × 15 rows
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,0,3,0,1,0,5,0,0,5,0,0,5,0,0,1,0,3,0,1],
            [1,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4,0,0,0,1],
            [1,0,0,0,1,0,0,2,2,0,0,2,2,0,0,1,0,0,0,1],
            [1,1,4,1,1,0,0,2,2,0,0,2,2,0,0,1,1,4,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,4,1,1,0,0,2,2,0,0,2,2,0,0,1,1,4,1,1],
            [1,0,0,0,1,0,0,2,2,0,0,2,2,0,0,1,0,0,0,1],
            [1,0,3,0,4,0,0,0,0,0,0,0,0,0,0,4,0,3,0,1],
            [1,0,0,0,1,0,5,0,0,5,0,0,5,0,0,1,0,0,0,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        // Object overlays: {x, y, type, w, h}
        objects: [
            // Library (top-left room)
            { x:2, y:2, type:'bookshelf', w:1, h:1 },
            { x:17, y:2, type:'bookshelf', w:1, h:1 },
            // Main hall
            { x:7, y:4, type:'table', w:2, h:1 },
            { x:11, y:4, type:'table', w:2, h:1 },
            { x:7, y:9, type:'table', w:2, h:1 },
            { x:11, y:9, type:'table', w:2, h:1 },
            // Decorations
            { x:6, y:2, type:'painting', w:1, h:1 },
            { x:9, y:2, type:'chandelier', w:1, h:1 },
            { x:13, y:2, type:'painting', w:1, h:1 },
            { x:6, y:11, type:'plant', w:1, h:1 },
            { x:13, y:11, type:'plant', w:1, h:1 },
        ],
        spawns: [
            {x: 1.5, y: 7},  // center-left
            {x: 10, y: 7},   // center
            {x: 18, y: 7},   // center-right
            {x: 1.5, y: 13}, // bottom-left
            {x: 10, y: 13},  // bottom-center
            {x: 18, y: 13},  // bottom-right
            {x: 1.5, y: 1},  // top-left
            {x: 10, y: 1},   // top-center
        ]
    },

    school: {
        name: 'School',
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,3,0,0,2,0,2,0,2,0,2,0,2,0,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,2,0,2,0,2,0,2,0,2,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,2,0,2,0,2,0,2,0,2,0,0,0,0,0,1],
            [1,1,1,4,1,1,1,1,4,1,1,4,1,1,1,1,4,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,1],
            [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,5,0,0,0,0,0,0,0,0,0,5,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        objects: [
            // Classroom desks (top)
            { x:5, y:2, type:'desk', w:1, h:1 },
            { x:7, y:2, type:'desk', w:1, h:1 },
            { x:9, y:2, type:'desk', w:1, h:1 },
            { x:11, y:2, type:'desk', w:1, h:1 },
            { x:13, y:2, type:'desk', w:1, h:1 },
            { x:5, y:4, type:'desk', w:1, h:1 },
            { x:7, y:4, type:'desk', w:1, h:1 },
            { x:9, y:4, type:'desk', w:1, h:1 },
            { x:11, y:4, type:'desk', w:1, h:1 },
            { x:13, y:4, type:'desk', w:1, h:1 },
            { x:5, y:6, type:'desk', w:1, h:1 },
            { x:7, y:6, type:'desk', w:1, h:1 },
            { x:9, y:6, type:'desk', w:1, h:1 },
            { x:11, y:6, type:'desk', w:1, h:1 },
            { x:13, y:6, type:'desk', w:1, h:1 },
            // Hallway
            { x:4, y:9, type:'locker', w:1, h:1 },
            { x:14, y:9, type:'locker', w:1, h:1 },
            { x:4, y:12, type:'locker', w:1, h:1 },
            { x:14, y:12, type:'locker', w:1, h:1 },
            // Chalkboard
            { x:8, y:1, type:'chalkboard', w:4, h:1 },
        ],
        spawns: [
            {x: 1.5, y: 1}, {x: 10, y: 1}, {x: 18, y: 1},
            {x: 1.5, y: 10}, {x: 10, y: 10}, {x: 18, y: 10},
            {x: 1.5, y: 13}, {x: 10, y: 13},
        ]
    },

    park: {
        name: 'Park',
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,5,0,0,0,0,0,0,5,0,0,0,0,0,1],
            [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1],
            [1,0,0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,1],
            [1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,5,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,5,0,1],
            [1,0,0,0,0,0,0,0,0,5,5,0,0,0,0,0,0,0,0,1],
            [1,0,3,0,0,2,0,0,0,0,0,0,0,0,2,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,5,0,0,0,0,0,0,5,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        objects: [
            // Benches
            { x:2, y:2, type:'bench', w:1, h:1 },
            { x:17, y:2, type:'bench', w:1, h:1 },
            { x:2, y:11, type:'bench', w:1, h:1 },
            { x:17, y:11, type:'bench', w:1, h:1 },
            // Bushes (hiding spots)
            { x:5, y:3, type:'bush', w:1, h:1 },
            { x:14, y:3, type:'bush', w:1, h:1 },
            { x:5, y:10, type:'bush', w:1, h:1 },
            { x:14, y:10, type:'bush', w:1, h:1 },
            // Fountain (center)
            { x:9, y:4, type:'fountain', w:2, h:2 },
            // Trees
            { x:6, y:1, type:'tree', w:1, h:1 },
            { x:13, y:1, type:'tree', w:1, h:1 },
            { x:6, y:13, type:'tree', w:1, h:1 },
            { x:13, y:13, type:'tree', w:1, h:1 },
        ],
        spawns: [
            {x: 1.5, y: 1}, {x: 10, y: 1}, {x: 18, y: 1},
            {x: 1.5, y: 7}, {x: 10, y: 7}, {x: 18, y: 7},
            {x: 1.5, y: 13}, {x: 10, y: 13},
        ]
    },

    shop: {
        name: 'Shop',
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,3,2,0,0,2,0,0,2,0,0,2,0,0,2,0,3,0,1],
            [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
            [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
            [1,0,0,2,0,0,2,0,0,2,0,0,2,0,0,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,2,2,2,0,0,0,0,0,0,2,2,2,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        objects: [
            // Shelves (aisles)
            { x:3, y:2, type:'shelf', w:1, h:2 },
            { x:6, y:2, type:'shelf', w:1, h:2 },
            { x:9, y:2, type:'shelf', w:1, h:2 },
            { x:12, y:2, type:'shelf', w:1, h:2 },
            { x:15, y:2, type:'shelf', w:1, h:2 },
            { x:3, y:5, type:'shelf', w:1, h:2 },
            { x:6, y:5, type:'shelf', w:1, h:2 },
            { x:9, y:5, type:'shelf', w:1, h:2 },
            { x:12, y:5, type:'shelf', w:1, h:2 },
            { x:15, y:5, type:'shelf', w:1, h:2 },
            { x:3, y:8, type:'shelf', w:1, h:2 },
            { x:6, y:8, type:'shelf', w:1, h:2 },
            { x:9, y:8, type:'shelf', w:1, h:2 },
            { x:12, y:8, type:'shelf', w:1, h:2 },
            { x:15, y:8, type:'shelf', w:1, h:2 },
            // Checkout counter
            { x:4, y:13, type:'counter', w:3, h:1 },
            { x:13, y:13, type:'counter', w:3, h:1 },
        ],
        spawns: [
            {x: 1.5, y: 1}, {x: 10, y: 1}, {x: 18, y: 1},
            {x: 1.5, y: 7}, {x: 10, y: 7}, {x: 18, y: 7},
            {x: 1.5, y: 12}, {x: 10, y: 12},
        ]
    },

    hospital: {
        name: 'Hospital',
        tiles: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,3,0,0,5,0,0,0,0,0,0,0,0,5,0,0,3,0,1],
            [1,0,0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,4,1,1,0,0,0,0,0,0,0,0,0,0,1,1,4,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,5,5,5,5,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,4,1,1,0,0,0,0,0,0,0,0,0,0,1,1,4,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,3,0,0,2,2,0,0,0,0,0,0,2,2,0,0,3,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        ],
        objects: [
            // Hospital beds
            { x:4, y:3, type:'bed', w:2, h:1 },
            { x:14, y:3, type:'bed', w:2, h:1 },
            { x:4, y:11, type:'bed', w:2, h:1 },
            { x:14, y:11, type:'bed', w:2, h:1 },
            // Curtains (hiding spots near doors)
            { x:5, y:2, type:'curtain', w:1, h:1 },
            { x:14, y:2, type:'curtain', w:1, h:1 },
            { x:5, y:11, type:'curtain', w:1, h:1 },
            { x:14, y:11, type:'curtain', w:1, h:1 },
            // Center nurse station
            { x:8, y:7, type:'desk', w:4, h:1 },
            // Wheelchairs
            { x:1, y:6, type:'wheelchair', w:1, h:1 },
            { x:18, y:6, type:'wheelchair', w:1, h:1 },
            { x:1, y:8, type:'wheelchair', w:1, h:1 },
            { x:18, y:8, type:'wheelchair', w:1, h:1 },
        ],
        spawns: [
            {x: 1.5, y: 1}, {x: 10, y: 1}, {x: 18, y: 1},
            {x: 1.5, y: 7}, {x: 10, y: 7}, {x: 18, y: 7},
            {x: 1.5, y: 13}, {x: 10, y: 13},
        ]
    }
};

// ── Object Render Data ──────────────────────────────────────────────────
// What each object looks like when drawn
const CHM_OBJ_RENDER = {
    bookshelf:  { color: '#5a3a1a', accent: '#3a8a3a', h: 14 },
    table:      { color: '#6a4a2a', accent: '#8a6a4a', h: 8 },
    painting:   { color: '#8a6a3a', accent: '#c9a84c', h: 14 },
    chandelier: { color: '#c9a84c', accent: '#fff8d0', h: 12 },
    plant:      { color: '#2a6a1a', accent: '#4a8a3a', h: 12 },
    desk:       { color: '#8b7355', accent: '#a89070', h: 8 },
    locker:     { color: '#888888', accent: '#aaaaaa', h: 14 },
    chalkboard: { color: '#2a4a2a', accent: '#4a6a4a', h: 14 },
    bench:      { color: '#6a5040', accent: '#8a7060', h: 8 },
    bush:       { color: '#2a6a1a', accent: '#4a8a3a', h: 12 },
    fountain:   { color: '#8a8a8a', accent: '#4a8aba', h: 10 },
    tree:       { color: '#4a3020', accent: '#2a6a1a', h: 16 },
    shelf:      { color: '#404040', accent: '#606060', h: 14 },
    counter:    { color: '#c8b898', accent: '#e0d0b8', h: 10 },
    bed:        { color: '#e0e0e0', accent: '#4080a0', h: 8 },
    curtain:    { color: '#6090b0', accent: '#80b0d0', h: 14 },
    wheelchair: { color: '#666666', accent: '#888888', h: 10 },
};

// ── Get tile color at position ──────────────────────────────────────────
function chmGetTileColor(mapKey, tx, ty) {
    const map = CHM_MAPS[mapKey];
    const pal = CHM_PALETTES[mapKey];
    if(!map || !pal) return '#000';
    
    const tile = map.tiles[ty]?.[tx];
    switch(tile) {
        case 0: return (tx + ty) % 2 === 0 ? pal.floor : pal.floorAlt;
        case 1: return pal.wall;
        case 2: return pal.furniture;
        case 3: return pal.floor; // hiding spot looks like floor
        case 4: return pal.floorAlt;
        case 5: return pal.floor;
        default: return pal.floor;
    }
}

// ── Get surrounding colors for eye-dropper ──────────────────────────────
function chmGetSurroundingColors(mapKey, px, py) {
    const tx = Math.floor(px / CHM_TILE);
    const ty = Math.floor(py / CHM_TILE);
    const colors = new Map();
    
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const c = chmGetTileColor(mapKey, tx+dx, ty+dy);
            colors.set(c, (colors.get(c) || 0) + 1);
        }
    }
    
    // Return sorted by frequency
    return [...colors.entries()]
        .sort((a,b) => b[1] - a[1])
        .map(e => e[0]);
}

// ── Check if tile is solid ──────────────────────────────────────────────
function chmIsSolid(mapKey, tx, ty) {
    const map = CHM_MAPS[mapKey];
    if(!map) return true;
    const tile = map.tiles[ty]?.[tx];
    return tile === 1 || tile === 2;
}

// ── Check if tile is a hiding spot ──────────────────────────────────────
function chmIsHidingSpot(mapKey, tx, ty) {
    const map = CHM_MAPS[mapKey];
    if(!map) return false;
    return map.tiles[ty]?.[tx] === 3;
}
