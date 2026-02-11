// ========== KARAOKE MODULE ==========
const karaoke = {
    currentLineIndex: 0,
    lyricsArray: [],
    isPlaying: false,
    intervalId: null,
    currentSpeed: 3000,
    scrollTimer: null,

    init() {
        // Initial setup if needed
    },

    async fetchLyrics(searchTerm) {
        // Redirect to fetchFullLyrics if it's a direct song search from other parts of the app
        // But here we usually use the UI search
    },

    async search() {
        const query = document.getElementById('kInput').value;
        const resDiv = document.getElementById('kResults');
        if(!query) return;
        resDiv.innerHTML = 'LOADING...';
        try {
            const res = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`);
            const data = await res.json();
            resDiv.innerHTML = '';
            data.data.forEach(song => {
                const div = document.createElement('div');
                div.style.cssText = 'padding: 5px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 5px;';
                div.innerHTML = `<img src="${song.album.cover_small}" style="width: 20px; height: 20px;"> <div><b>${song.title}</b><br><span style="font-size: 6px;">${song.artist.name}</span></div>`;
                div.onclick = () => karaoke.loadLyrics(song.artist.name, song.title);
                resDiv.appendChild(div);
            });
        } catch(e) { resDiv.innerHTML = 'ERROR SEARCHING'; }
    },

    async loadLyrics(artist, title) {
        const resDiv = document.getElementById('kResults');
        const lyricDiv = document.getElementById('kLyrics');
        const ctrls = document.getElementById('kControls');
        const back = document.getElementById('kBackBtn');
        
        resDiv.style.display = 'none';
        lyricDiv.style.display = 'block';
        lyricDiv.innerHTML = 'FETCHING LYRICS...';
        back.style.display = 'block';
        
        try {
            // Try LRCLIB first
            let lyrics = '';
            try {
                const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.syncedLyrics || data.plainLyrics;
            } catch(e) {}
            
            if(!lyrics) {
                // Fallback to OVH
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.lyrics;
            }
            
            if(lyrics) {
                // Formatting
                lyricDiv.innerHTML = '';
                const lines = lyrics.split('\n');
                lines.forEach((line, i) => {
                    // Remove timestamp for display if plain
                    const txt = line.replace(/^\[.*?\]/, '').trim();
                    if(txt) {
                        const d = document.createElement('div');
                        d.className = 'karaoke-line'; // Add CSS class if needed
                        d.textContent = txt;
                        d.style.padding = "2px";
                        d.style.cursor = "pointer";
                        d.onclick = () => {
                            document.querySelectorAll('.karaoke-line').forEach(l => l.style.background = 'transparent');
                            d.style.background = 'rgba(255, 255, 0, 0.3)';
                            d.scrollIntoView({behavior: "smooth", block: "center"});
                        };
                        lyricDiv.appendChild(d);
                    }
                });
                ctrls.style.display = 'flex';
            } else {
                lyricDiv.textContent = 'NO LYRICS FOUND :(';
            }
        } catch(e) { lyricDiv.textContent = 'ERROR LOADING LYRICS'; }
    },

    back() {
        document.getElementById('kResults').style.display = 'block';
        document.getElementById('kLyrics').style.display = 'none';
        document.getElementById('kControls').style.display = 'none';
        document.getElementById('kBackBtn').style.display = 'none';
        document.getElementById('kLyrics').textContent = '';
        this.stopAutoScroll();
    },

    togglePlay() {
        const btn = document.getElementById('kPlayBtn');
        if(this.scrollTimer) {
            this.stopAutoScroll();
            btn.textContent = "▶ START";
        } else {
            const div = document.getElementById('kLyrics');
            this.scrollTimer = setInterval(() => {
                div.scrollTop += 1;
            }, 50);
            btn.textContent = "⏸ PAUSE";
        }
    },

    stopAutoScroll() {
        if(this.scrollTimer) clearInterval(this.scrollTimer);
        this.scrollTimer = null;
    },

    scroll(dir) { 
        document.getElementById('kLyrics').scrollTop += dir * 40; 
    }
};

window.karaoke = karaoke;
