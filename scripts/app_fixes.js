// COMPREHENSIVE FIXES FOR ALL BROKEN APPS

// Fix 1: Weather - Moved to newapps.js with full upgrade

// Fix 2: Quote API - Better fallback
window.getQuote = async function() {
    const txt = document.getElementById('quoteText');
    const auth = document.getElementById('quoteAuthor');
    txt.textContent = "...";
    sounds.click();
    try {
        const res = await fetch('https://api.quotable.io/random');
        const data = await res.json();
        txt.textContent = `"${data.content.toUpperCase()}"`;
        auth.textContent = `- ${data.author.toUpperCase()}`;
        sounds.coin();
    } catch(e) { 
        txt.textContent = '"THE ONLY WAY TO DO GREAT WORK IS TO LOVE WHAT YOU DO"';
        auth.textContent = '- STEVE JOBS';
    }
};

// Fix 3: Bored API - Add timestamp to prevent caching
window.getBoredActivity = async function() {
    const activity = document.getElementById('boredActivity');
    const type = document.getElementById('boredType');
    activity.textContent = 'THINKING...';
    type.textContent = '';
    sounds.click();
    try {
        const res = await fetch(`https://www.boredapi.com/api/activity?_=${Date.now()}`);
        const data = await res.json();
        activity.textContent = data.activity.toUpperCase();
        type.textContent = `TYPE: ${data.type.toUpperCase()} | PARTICIPANTS: ${data.participants}`;
        sounds.coin();
    } catch(e) { 
        const activities = [
            'LEARN A NEW PROGRAMMING LANGUAGE',
            'START A GARDEN',
            'DRAW SOMETHING',
            'WRITE IN A JOURNAL',
            'TAKE A WALK OUTSIDE'
        ];
        activity.textContent = activities[Math.floor(Math.random() * activities.length)];
        type.textContent = 'TYPE: RANDOM';
    }
};

// Fix 4: Zodiac - Actually calculate based on current date
window.initZodiac = function() {
    updateZodiac();
};

function updateZodiac() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    let sign = '';
    let emoji = '';
    let desc = '';
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
        sign = 'ARIES'; emoji = '♈'; desc = 'THE RAM - BOLD & AMBITIOUS';
    } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
        sign = 'TAURUS'; emoji = '♉'; desc = 'THE BULL - RELIABLE & PATIENT';
    } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
        sign = 'GEMINI'; emoji = '♊'; desc = 'THE TWINS - CURIOUS & PLAYFUL';
    } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
        sign = 'CANCER'; emoji = '♋'; desc = 'THE CRAB - INTUITIVE & SENTIMENTAL';
    } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
        sign = 'LEO'; emoji = '♌'; desc = 'THE LION - CREATIVE & PASSIONATE';
    } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
        sign = 'VIRGO'; emoji = '♍'; desc = 'THE VIRGIN - PRACTICAL & SYSTEMATIC';
    } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
        sign = 'LIBRA'; emoji = '♎'; desc = 'THE SCALES - FAIR-MINDED & SOCIAL';
    } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
        sign = 'SCORPIO'; emoji = '♏'; desc = 'THE SCORPION - RESOURCEFUL & BRAVE';
    } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
        sign = 'SAGITTARIUS'; emoji = '♐'; desc = 'THE ARCHER - GENEROUS & IDEALISTIC';
    } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        sign = 'CAPRICORN'; emoji = '♑'; desc = 'THE GOAT - RESPONSIBLE & DISCIPLINED';
    } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
        sign = 'AQUARIUS'; emoji = '♒'; desc = 'THE WATER BEARER - PROGRESSIVE & ORIGINAL';
    } else {
        sign = 'PISCES'; emoji = '♓'; desc = 'THE FISH - COMPASSIONATE & ARTISTIC';
    }
    
    const el = document.getElementById('zodiacSign');
    const descEl = document.getElementById('zodiacDesc');
    const dateEl = document.getElementById('zodiacDate');
    
    if(el) el.textContent = `${emoji} ${sign}`;
    if(descEl) descEl.textContent = desc;
    if(dateEl) dateEl.textContent = `${now.toLocaleDateString().toUpperCase()}`;
}

// Fix 5: Translate - Moved to newapps.js with full upgrade

// Fix 6: News - Moved to newapps.js (Algolia API with category tabs)

// Fix 7: Better Music Player using RapidAPI Deezer (or fallback to Jamendo)
window.initMusic = function() {
    document.getElementById('musicStatus').textContent = 'READY';
};

let musicTracks = [];
let musicIndex = 0;

window.searchMusic = async function() {
    const query = document.getElementById('musicSearch').value;
    const status = document.getElementById('musicStatus');
    
    if(!query) return;
    
    status.textContent = 'SEARCHING...';
    sounds.click();
    
    try {
        // Using Jamendo API (free)
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=10&search=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if(data.results && data.results.length > 0) {
            musicTracks = data.results;
            musicIndex = 0;
            playMusicTrack();
        } else {
            status.textContent = 'NO RESULTS';
        }
    } catch(e) {
        status.textContent = 'MUSIC SERVER OFFLINE';
    }
};

function playMusicTrack() {
    if(musicTracks.length === 0) return;
    
    const track = musicTracks[musicIndex];
    const audio = document.getElementById('musicAudio');
    const status = document.getElementById('musicStatus');
    
    if(audio && track.audio) {
        audio.src = track.audio;
        audio.play();
        status.textContent = `PLAYING: ${track.name.toUpperCase()}`;
        sounds.launch();
    }
}

window.nextMusicTrack = function() {
    if(musicTracks.length === 0) return;
    musicIndex = (musicIndex + 1) % musicTracks.length;
    playMusicTrack();
};

window.prevMusicTrack = function() {
    if(musicTracks.length === 0) return;
    musicIndex = (musicIndex - 1 + musicTracks.length) % musicTracks.length;
    playMusicTrack();
};

window.stopMusic = function() {
    const audio = document.getElementById('musicAudio');
    if(audio) {
        audio.pause();
        audio.currentTime = 0;
    }
    document.getElementById('musicStatus').textContent = 'STOPPED';
    sounds.back();
};
