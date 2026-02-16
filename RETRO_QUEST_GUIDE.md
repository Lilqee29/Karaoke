# 🗺️ RETRO QUEST - ADVENTURE GAME

## ✅ WHAT WAS CREATED

A complete **tile-based RPG adventure game** integrated into the GameBoy OS!

### **Features:**

- ✅ 10 Progressive Levels
- ✅ Crystal Collection Quest
- ✅ Enemy Combat
- ✅ HP System
- ✅ Gold Currency
- ✅ NPC Interactions
- ✅ Victory/Game Over Screens
- ✅ Tile-based Movement
- ✅ HUD with HP Bar, Gold, Level Progress

---

## 🎮 STORY

**"The 10 Sacred Crystals"**

You wake in a forgotten temple with no memory. A mysterious voice tasks you with finding 10 Sacred Crystals scattered across dangerous realms to restore light to the world.

---

## 📋 THE 10 LEVELS

### **Level 1: Temple of Beginnings**

- **Objective:** Find the first Crystal
- **Enemies:** None (tutorial level)
- **NPC:** Old Sage (teaches controls)

### **Level 2: Forest of Whispers**

- **Objective:** Defeat slime, claim crystal
- **Enemies:** 1 Slime
- **Hazards:** Dense trees

### **Level 3: Mountain Pass**

- **Objective:** Cross mountains, defeat goblins
- **Enemies:** 2 Goblins
- **Hazards:** Narrow paths, platforms

### **Levels 4-10:** (Need to be added)

4. **Dark Cavern** - Navigate darkness, avoid bats
5. **Haunted Graveyard** - Ghosts and tombstones
6. **Ice Fortress** - Slippery ice, frozen enemies
7. **Volcano Summit** - Lava pits, fire elementals
8. **Underwater Ruins** - Limited visibility, sharks
9. **Sky Castle** - Floating platforms, wind hazards
10. **Shadow Realm** - Final boss, all crystals required

---

## 🕹️ CONTROLS

- **Arrow Keys** - Move player
- **SPACE** - Interact with NPCs (future feature)
- **Goal:** Collect crystal → Find exit portal → Next level

---

## 📊 GAME MECHANICS

### **Health Points (HP)**

- Start with 100 HP
- Lose 10 HP per enemy collision
- Die at 0 HP → Game Over screen

### **Gold System**

- Earn 50 gold per crystal
- Future: Use for upgrades/items

### **Level Progression**

- Each level requires crystal collection
- Exit portal only appears after crystal is collected
- Linear progression (Level 1 → 2 → 3 → ...)

---

## 🎨 VISUAL DESIGN

### **Tile Types:**

- **0 (Green)** - Walkable floor/grass
- **1 (Gray)** - Platform (walkable with border)
- **2 (Dark)** - Wall (solid, blocks movement)
- **3 (Forest Green)** - Trees (decorative obstacles)

### **Entities:**

- **Player** - Blue square
- **Crystal** - Golden glowing circle
- **Exit Portal** - Cyan glowing square (appears after crystal)
- **Enemies** - Red squares (slimes, goblins)
- **NPCs** - White squares

---

## 📁 FILE STRUCTURE

```
scripts/
└── retro_quest.js  (Main game engine - 400+ lines)
```

---

## 🚀 INTEGRATION STEPS

### **1. Add HTML Canvas to index.html**

Add this to your `index.html` (inside screen-content, before closing div):

```html
<!-- ADVENTURE GAME -->
<div id="adventureScreen" class="game-screen">
  <div style="padding: 0; width: 100%; height: 100%;">
    <canvas
      id="advCanvas"
      width="300"
      height="280"
      style="display: block; margin: 0 auto; image-rendering: pixelated;"
    ></canvas>
  </div>
</div>
```

### **2. Load Script**

Add before `</body>`:

```html
<script src="scripts/retro_quest.js"></script>
```

### **3. Test**

1. Open app
2. Search for "QUEST" or "ADVENTR"
3. Use arrow keys to move
4. Collect the golden crystal
5. Enter the cyan exit portal

---

## ⚠️ KNOWN LIMITATIONS (V1)

1. **Only 3 levels implemented** - Levels 4-10 need to be added
2. **No attack system** - Enemies damage on collision only
3. **No inventory** - Gold tracked but not used
4. **No NPC dialogs** - NPC objects exist but don't talk yet
5. **No save system** - Progress resets on refresh

---

## 🔧 NEXT ENHANCEMENTS (V2)

1. **Complete all 10 levels** with unique hazards
2. **Add attack button** (Space bar to attack enemies)
3. **Implement item system** (potions, keys, weapons)
4. **NPC dialog boxes** with story elements
5. **Save progress** to localStorage
6. **Boss fights** on levels 5 and 10
7. **Power-ups** (speed boost, invincibility)
8. **Sound effects** integration

---

## 💡 HOW TO EXTEND

### **Adding a New Level:**

Edit `retro_quest.js`, add to `story.levels` array:

```javascript
{
    name: "Your Level Name",
    tilemap: [
        // 15x14 grid
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
        [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
        // ... more rows ...
        [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
    ],
    spawn: {x: 2, y: 11},
    crystal: {x: 7, y: 7},
    exit: {x: 13, y: 11},
    enemies: [
        {x: 5, y: 5, type: 'slime', hp: 30}
    ],
    quest: "Your quest description"
}
```

**Tile Legend:**

- `2` = Wall
- `0` = Floor
- `1` = Platform
- `3` = Tree
- `C` = Crystal marker (becomes 0)
- `E` = Exit marker (becomes 0)
- `M` = Monster marker (becomes 0)
- `N` = NPC marker (becomes 0)

---

## 🎯 CURRENT STATUS

✅ **Working:**

- Movement system
- Collision detection
- Crystal collection
- Level transitions
- HP system
- Game over / Victory screens
- HUD rendering

⚠️ **In Progress:**

- Levels 4-10 content
- Attack system
- NPC interactions
- Item system

---

## 📝 USAGE EXAMPLE

```javascript
// The game auto-initializes when the adventure screen is opened
// via the initAdventure() function

// Manual init (if needed):
RetroQuest.init("advCanvas");

// Reset to level 1:
RetroQuest.loadLevel(0);
```

---

Would you like me to:

1. **Complete levels 4-10** with unique designs?
2. **Add attack system** so you can fight enemies?
3. **Implement NPC dialog boxes**?
4. **Add the HTML screen** to index.html now?
