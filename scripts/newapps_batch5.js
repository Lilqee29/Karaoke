// ========== CAT FACTS ==========
window.initCatfact = function() {};
window.getCatFact = async function() {
    const txt = document.getElementById('catfactText');
    txt.textContent = "Fetching feline wisdom...";
    sounds.click();
    try {
        const res = await fetch('https://catfact.ninja/fact');
        const data = await res.json();
        txt.textContent = data.fact.toUpperCase();
        sounds.coin();
    } catch(e) { txt.textContent = "CATS ARE OFFLINE (ERROR)"; }
};

// ========== CHUCK NORRIS ==========
window.initChuck = function() {};
window.getChuckJoke = async function() {
    const txt = document.getElementById('chuckJoke');
    txt.textContent = "Loading Chuck...";
    sounds.click();
    try {
        const res = await fetch('https://api.chucknorris.io/jokes/random');
        const data = await res.json();
        txt.textContent = data.value.toUpperCase();
        sounds.coin();
    } catch(e) { txt.textContent = "CHUCK IS TOO POWERFUL (OFFLINE)"; }
};

// // ========== ANIME QUOTES ==========
// window.initAnime = function() {};
// window.getAnimeQuote = async function() {
//     const quote = document.getElementById('animeQuote');
//     const char = document.getElementById('animeChar');
//     quote.textContent = '"..."';
//     sounds.click();
//     try {
//         const res = await fetch('https://api.animechan.io/v1/quotes/random');
//         const data = await res.json();
//         console.log(data)
//         quote.textContent = `"${data.quote}"`;
//         char.textContent = `- ${data.character} (${data.anime})`;
//         sounds.coin();
//     } catch(e) { 
//         console.error(e)
//         quote.textContent = '"BELIEVE IN YOURSELF"';
//         char.textContent = '- NARUTO';
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
    title.textContent = 'GENERATING...';
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
        title.textContent = data.title ? data.title.toUpperCase().substring(0, 50) : 'MEME';
    } catch(e) { 
        title.textContent = 'MEME MACHINE BROKE';
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
    titleEl.textContent = 'LOADING COSMOS...';
    descEl.textContent = '';
    sounds.click();
    
    try {
        // Using demo key - should work but may hit rate limit
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const data = await res.json();
        
        titleEl.textContent = data.title ? data.title.toUpperCase() : 'NASA APOD';
        descEl.textContent = data.explanation ? data.explanation.toUpperCase().substring(0, 200) + '...' : '';
        
        if(img && data.url && data.media_type === 'image') {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        } else {
            if(ph) ph.textContent = '📹';
            sounds.coin();
        }
    } catch(e) { 
        titleEl.textContent = 'TRANSMISSION LOST';
        descEl.textContent = 'Unable to reach NASA servers';
    }
};

// ========== KANYE QUOTES ==========
window.initKanye = function() {};
window.getKanyeQuote = async function() {
    const txt = document.getElementById('kanyeQuote');
    txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.kanye.rest/');
        const data = await res.json();
        txt.textContent = `"${data.quote.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { txt.textContent = '"I AM A GOD" - KANYE'; }
};

// ========== BORED API ==========
window.initBored = function() {};
window.getBoredActivity = async function() {
    const activity = document.getElementById('boredActivity');
    const type = document.getElementById('boredType');
    activity.textContent = 'THINKING...';
    type.textContent = '';
    sounds.click();
    try {
        const res = await fetch('https://www.boredapi.com/api/activity');
        const data = await res.json();
        activity.textContent = data.activity.toUpperCase();
        type.textContent = `TYPE: ${data.type.toUpperCase()} | PARTICIPANTS: ${data.participants}`;
        sounds.coin();
    } catch(e) { 
        activity.textContent = 'TRY COUNTING TO INFINITY';
        type.textContent = 'TYPE: IMPOSSIBLE';
    }
};

// ========== ZEN QUOTES ==========
window.initZen = function() {};
window.getZen = async function() {
    const txt = document.getElementById('zenText');
    txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.github.com/zen');
        const data = await res.text();
        txt.textContent = `"${data.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { txt.textContent = '"DESIGN FOR FAILURE"'; }
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
    nameEl.textContent = 'MIXING...';
    ingredientsEl.textContent = '';
    sounds.click();
    
    try {
        const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const data = await res.json();
        const drink = data.drinks[0];
        
        nameEl.textContent = drink.strDrink.toUpperCase();
        
        // Get ingredients
        const ingredients = [];
        for(let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if(ingredient) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`.toUpperCase());
            }
        }
        ingredientsEl.textContent = ingredients.join(', ');
        
        if(img && drink.strDrinkThumb) {
            img.src = drink.strDrinkThumb;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
    } catch(e) { 
        nameEl.textContent = 'WATER';
        ingredientsEl.textContent = 'H2O';
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
                output.textContent = '';
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
