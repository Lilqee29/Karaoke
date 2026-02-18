// COMPREHENSIVE FIXES FOR ALL BROKEN APPS

// Fix 1: Weather - Default to Paris
window.getWeather = async function() {
    const input = document.getElementById('weatherInput').value.split(',');
    const lat = input[0] || '48.8566'; // Paris lat
    const lon = input[1] || '2.3522';  // Paris lon
    const display = document.getElementById('weatherDisplay');
    
    display.textContent = "SCANNING SKIES...";
    sounds.click();
    
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`);
        const data = await res.json();
        
        display.textContent = `LOCATION: PARIS\nTEMP: ${data.current_weather.temperature}°C\nWIND: ${data.current_weather.windspeed} km/h\nWEATHER CODE: ${data.current_weather.weathercode}`;
        sounds.coin();
    } catch(e) { display.textContent = "RADAR FAILURE"; }
};

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

// Fix 5: Translate - Use real API (MyMemory)
window.initTranslate = function() {};
window.translateText = async function() {
    const input = document.getElementById('translateInput');
    const output = document.getElementById('translateOutput');
    const langpair = document.getElementById('translateLang').value;
    
    if(!input || !input.value) return;
    
    output.textContent = 'TRANSLATING...';
    sounds.click();
    
    try {
        const text = encodeURIComponent(input.value);
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${text}&langpair=${langpair}`);
        const data = await res.json();
        
        if(data.responseData && data.responseData.translatedText) {
            output.textContent = data.responseData.translatedText.toUpperCase();
            sounds.coin();
        } else {
            throw new Error('Translation failed');
        }
    } catch(e) {
        output.textContent = '[TRANSLATION SERVICE OFFLINE]';
    }
};

// Fix 6: News - Show full articles with read more
window.initNews = function() {
    loadNews();
};

let newsArticles = [];
let newsIndex = 0;

async function loadNews() {
    const display = document.getElementById('newsDisplay');
    display.textContent = 'LOADING NEWS...';
    sounds.click();
    
    try {
        const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles?limit=10');
        const data = await res.json();
        newsArticles = data.results || [];
        newsIndex = 0;
        showNewsArticle();
    } catch(e) {
        display.textContent = 'NEWS SATELLITE OFFLINE';
    }
}

function showNewsArticle() {
    if(newsArticles.length === 0) return;
    
    const article = newsArticles[newsIndex];
    const display = document.getElementById('newsDisplay');
    
    const summary = article.summary || article.title || '';
    const date = article.published_at ? new Date(article.published_at).toLocaleDateString() : '';
    const fullSummary = summary.length > 500 ? summary.substring(0, 500) + '...' : summary;
    
    display.innerHTML = 
        `<div style="font-weight:bold; font-size:7px; margin-bottom:6px; border-bottom:1px solid rgba(15,56,15,0.3); padding-bottom:4px;">${article.title.toUpperCase()}</div>` +
        (date ? `<div style="font-size:5px; opacity:0.6; margin-bottom:5px;">📅 ${date.toUpperCase()} · ${article.news_site ? article.news_site.toUpperCase() : ''}</div>` : '') +
        `<div style="font-size:6px; line-height:1.5; margin-bottom:8px;">${fullSummary.toUpperCase()}</div>` +
        (article.url ? `<div style="font-size:5px; margin-top:4px;"><a href="${article.url}" target="_blank" style="color:var(--gb-text); text-decoration:underline;">🔗 READ FULL ARTICLE</a></div>` : '');
    sounds.coin();
}

window.nextNews = function() {
    newsIndex = (newsIndex + 1) % newsArticles.length;
    showNewsArticle();
    sounds.click();
};

window.prevNews = function() {
    newsIndex = (newsIndex - 1 + newsArticles.length) % newsArticles.length;
    showNewsArticle();
    sounds.click();
};

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
