// ========== CAT FACTS ==========
window.initCatfact = function() {};
window.getCatFact = async function() {
    const txt = document.getElementById('catfactText');
    if(txt) txt.textContent = "Fetching feline wisdom...";
    sounds.click();
    try {
        const res = await fetch('https://catfact.ninja/fact');
        const data = await res.json();
        if(txt) txt.textContent = data.fact.toUpperCase();
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "CATS ARE OFFLINE (ERROR)"; }
};

// ========== CHUCK NORRIS ==========
window.initChuck = function() {};
window.getChuckJoke = async function() {
    const txt = document.getElementById('chuckJoke');
    if(txt) txt.textContent = "Loading Chuck...";
    sounds.click();
    try {
        const res = await fetch('https://api.chucknorris.io/jokes/random');
        const data = await res.json();
        if(txt) txt.textContent = data.value.toUpperCase();
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "CHUCK IS TOO POWERFUL (OFFLINE)"; }
};

// // ========== ANIME QUOTES ==========
// window.initAnime = function() {};
// window.getAnimeQuote = async function() {
//     const quote = document.getElementById('animeQuote');
//     const char = document.getElementById('animeChar');
//     if(quote) quote.textContent = '"..."';
//     sounds.click();
//     try {
//         const res = await fetch('https://api.animechan.io/v1/quotes/random');
//         const data = await res.json();
//         console.log(data)
//         if(quote) quote.textContent = `"${data.quote}"`;
//         if(char) char.textContent = `- ${data.character} (${data.anime})`;
//         sounds.coin();
//     } catch(e) { 
//         console.error(e)
//         if(quote) quote.textContent = '"BELIEVE IN YOURSELF"';
//         if(char) char.textContent = '- NARUTO';
//     }
// };

// ========== MEME GENERATOR ==========
window.initMeme = function() {};
window.getMeme = async function() {
    const img = document.getElementById('memeImg');
    const ph = document.getElementById('memePlaceholder');
    const title = document.getElementById('memeTitle');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(title) title.textContent = 'GENERATING...';
    sounds.click();
    
    try {
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();
        
        if(img && data.url) {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
        if(title) title.textContent = data.title ? data.title.toUpperCase().substring(0, 50) : 'MEME';
    } catch(e) { 
        if(title) title.textContent = 'MEME MACHINE BROKE';
    }
};

// ========== NASA APOD ==========
window.initNasa = function() {};
window.getNASA = async function() {
    const img = document.getElementById('nasaImg');
    const ph = document.getElementById('nasaPlaceholder');
    const titleEl = document.getElementById('nasaTitle');
    const descEl = document.getElementById('nasaDesc');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(titleEl) titleEl.textContent = 'LOADING COSMOS...';
    if(descEl) descEl.textContent = '';
    sounds.click();
    
    try {
        // Using demo key - should work but may hit rate limit
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const data = await res.json();
        
        if(titleEl) titleEl.textContent = data.title ? data.title.toUpperCase() : 'NASA APOD';
        if(descEl) descEl.textContent = data.explanation ? data.explanation.toUpperCase().substring(0, 200) + '...' : '';
        
        if(img && data.url && data.media_type === 'image') {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        } else {
            if(ph) if(ph) ph.textContent = '📹';
            sounds.coin();
        }
    } catch(e) { 
        if(titleEl) titleEl.textContent = 'TRANSMISSION LOST';
        if(descEl) descEl.textContent = 'Unable to reach NASA servers';
    }
};

// ========== KANYE QUOTES ==========
window.initKanye = function() {};
window.getKanyeQuote = async function() {
    const txt = document.getElementById('kanyeQuote');
    if(txt) txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.kanye.rest/');
        const data = await res.json();
        if(txt) txt.textContent = `"${data.quote.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = '"I AM A GOD" - KANYE'; }
};

// ========== BORED API ==========
// ========== BORED APP (LOCAL) ==========
const boredActivities = [
    { activity: "Learn how to use a french press", type: "recreational" },
    { activity: "Learn the periodic table", type: "education" },
    { activity: "Start a blog", type: "recreational" },
    { activity: "Conquer your fear of something", type: "recreational" },
    { activity: "Learn to juggle", type: "recreational" },
    { activity: "Go to a concert with local groups", type: "social" },
    { activity: "Learn to play a new instrument", type: "music" },
    { activity: "Study a foreign language", type: "education" },
    { activity: "Create a compost pile", type: "diy" },
    { activity: "Go for a run", type: "recreational" },
    { activity: "Pot some plants", type: "recreational" },
    { activity: "Learn to paper mache", type: "diy" },
    { activity: "Go to a local landmark", type: "recreational" },
    { activity: "Start a collection", type: "recreational" },
    { activity: "Go stargazing", type: "relaxation" },
    { activity: "Write a short story", type: "creative" },
    { activity: "Learn a magic trick", type: "recreational" },
    { activity: "Bake a pie", type: "cooking" },
    { activity: "Organize your room", type: "busywork" },
    { activity: "Take a nap", type: "relaxation" },
    { activity: "Read a random Wikipedia article", type: "education" }
];

window.initBored = function() {
    let screen = document.getElementById('boredScreen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'boredScreen';
        screen.className = 'game-screen';
        
        // Fix: Use querySelector for class, or append to specialized container if exists
        const container = document.querySelector('.screen-content');
        if(container) container.appendChild(screen);
        else console.error("Screen content container not found!");
    }
    
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; display: flex; flex-direction: column; height: 100%; justify-content: center;">
            <div style="font-size: 14px; margin-bottom: 20px; font-weight: bold;">IDEAS GENERATOR</div>
            <div id="boredActivity" style="font-size: 12px; margin-bottom: 10px; min-height: 40px; display: flex; align-items: center; justify-content: center;">PUSH BUTTON FOR IDEA</div>
            <div id="boredType" style="font-size: 8px; opacity: 0.7; margin-bottom: 20px;"></div>
            <button onclick="getBoredActivity()" style="padding: 15px; font-size: 16px; border: 2px solid #0f380f; background: #9bbc0f; color: #0f380f; font-family: 'VT323', monospace; cursor: pointer;">💡 GENERATE</button>
        </div>
    `;
};

window.getBoredActivity = function() {
    const activity = document.getElementById('boredActivity');
    const type = document.getElementById('boredType');
    
    if(!activity || !type) return;

    if(activity) activity.textContent = 'THINKING...';
    if(type) type.textContent = '';
    
    if(typeof sounds !== 'undefined') sounds.click();
    
    setTimeout(() => {
        const item = boredActivities[Math.floor(Math.random() * boredActivities.length)];
        if(activity) activity.textContent = item.activity.toUpperCase();
        if(type) type.textContent = `TYPE: ${item.type.toUpperCase()}`;
        if(typeof sounds !== 'undefined') sounds.coin();
    }, 300);
};

// ========== ZEN QUOTES ==========
window.initZen = function() {};
window.getZen = async function() {
    const txt = document.getElementById('zenText');
    if(txt) txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.github.com/zen');
        const data = await res.text();
        if(txt) txt.textContent = `"${data.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = '"DESIGN FOR FAILURE"'; }
};

// ========== COCKTAIL DB ==========
window.initCocktail = function() {};
window.getRandomCocktail = async function() {
    const img = document.getElementById('cocktailImg');
    const ph = document.getElementById('cocktailPlaceholder');
    const nameEl = document.getElementById('cocktailName');
    const ingredientsEl = document.getElementById('cocktailIngredients');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(nameEl) nameEl.textContent = 'MIXING...';
    if(ingredientsEl) ingredientsEl.textContent = '';
    sounds.click();
    
    try {
        const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const data = await res.json();
        const drink = data.drinks[0];
        
        if(nameEl) nameEl.textContent = drink.strDrink.toUpperCase();
        
        // Get ingredients
        const ingredients = [];
        for(let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if(ingredient) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`.toUpperCase());
            }
        }
        if(ingredientsEl) ingredientsEl.textContent = ingredients.join(', ');
        
        if(img && drink.strDrinkThumb) {
            img.src = drink.strDrinkThumb;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
    } catch(e) { 
        if(nameEl) nameEl.textContent = 'WATER';
        if(ingredientsEl) ingredientsEl.textContent = 'H2O';
    }
};

// ========== TERMINAL (ZSH CLONE) ==========
window.initTerm = function() {
    const output = document.getElementById('termOutput');
    const input = document.getElementById('termInput');
    
    input.value = '';
    input.focus();
    
    // Command History
    let history = [];
    let historyIdx = -1;
    
    input.onkeydown = (e) => {
        if(e.key === 'Enter') {
            const cmd = input.value.trim();
            if(cmd) {
                history.push(cmd);
                historyIdx = history.length;
                print(`root@gb-os:~$ ${cmd}`);
                processCommand(cmd);
            }
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if(historyIdx > 0) {
                historyIdx--;
                input.value = history[historyIdx];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if(historyIdx < history.length - 1) {
                historyIdx++;
                input.value = history[historyIdx];
            } else {
                historyIdx = history.length;
                input.value = '';
            }
        }
    };
    
    async function processCommand(cmd) {
        const parts = cmd.toLowerCase().split(' ');
        const c = parts[0];
        const args = parts.slice(1).join(' ');
        
        if(typeof sounds !== 'undefined') sounds.click();
        
        switch(c) {
            case 'help':
                print("COMMANDS:\n  ls      - list apps\n  open    - launch app (e.g. open snake)\n  fetch   - sys info\n  clear   - clear screen\n  echo    - print text\n  date    - show time\n  hack    - ???\n  matrix  - neo mode\n  color   - set color (e.g. color #f0f)\n  say     - speak text\n  reboot  - restart sys");
                break;
            case 'ls':
                const appList = apps.map(a => a.id).join('  ');
                print(appList);
                break;
            case 'open':
                const targetApp = apps.find(a => a.id === args || a.name.toLowerCase() === args);
                if(targetApp) {
                    print(`Launching ${targetApp.name}...`);
                    setTimeout(() => openApp(targetApp.id), 500);
                } else {
                    print(`App '${args}' not found.`);
                }
                break;
            case 'fetch':
                print(`
       .---.       root@gameboy-os
      /     \\      ---------------
      | .-. |      OS: GB-OS v2.0
      | | | |      Kernel: JS/Web
      | '-' |      Uptime: ${(performance.now()/1000).toFixed(0)}s
      '-----'      Shell: ZSH-JS
                   Theme: ${state.theme.toUpperCase()}
`);
                break;
            case 'clear':
            case 'cls':
                if(output) output.textContent = '';
                break;
            case 'date':
                print(new Date().toString());
                break;
            case 'echo':
                print(args);
                break;
            case 'color':
                output.style.color = args || '#0f0';
                input.style.color = args || '#0f0';
                print(`Color set to ${args}`);
                break;
            case 'say':
                if('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(args);
                    speechSynthesis.speak(u);
                    print(`Speaking: "${args}"`);
                } else print("Speech API not supported.");
                break;
            case 'hack':
                startHack();
                break;
            case 'matrix':
                document.getElementById('termScreen').style.background = 'url("https://media.giphy.com/media/dummy/giphy.gif")'; 
                // Simple textual matrix effect
                let mInt = setInterval(() => {
                    if(!document.getElementById('termScreen').classList.contains('active')) clearInterval(mInt);
                    const line = Array(40).fill(0).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('');
                    print(line);
                }, 100);
                setTimeout(() => clearInterval(mInt), 5000);
                break;
            case 'reboot':
                print("Rebooting system...");
                setTimeout(() => location.reload(), 1000);
                break;
            default:
                print(`zsh: command not found: ${c}`);
        }
    }
    
    function print(text) {
        output.textContent += text + '\n';
        output.scrollTop = output.scrollHeight;
    }
    
    function startHack() {
        print("Initializing brute force attack...");
        let i = 0;
        const interval = setInterval(() => {
            const hex = Array(8).fill(0).map(() => Math.floor(Math.random()*16).toString(16)).join('');
            print(`[${Math.floor(Date.now()/1000)}] ACCESSING 0x${hex.toUpperCase()}...`);
            i++;
            if(i > 15) {
                clearInterval(interval);
                print("ACCESS GRANTED.\nWELCOME TO THE MAINFRAME.");
                output.style.color = "#0f0";
                if(typeof sounds !== 'undefined') sounds.coin();
            }
        }, 100);
    }
};
