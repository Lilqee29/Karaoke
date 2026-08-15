// ========== KARAOKE MODULE (v3.0 UPGRADED) ==========
const karaoke = {
    currentLineIndex: 0,
    lyricsArray: [],
    isPlaying: false,
    intervalId: null,
    currentSpeed: 50, // ms per pixel scroll step
    scrollTimer: null,
    pitchShift: 0, // semitones (-6 to +6)
    currentSong: null,

    init() {
        this.loadFavorites();
    },

    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('gb_karaoke_favs')) || [];
        } catch(e) { return []; }
    },

    saveFavorite(artist, title) {
        let favs = this.getFavorites();
        if(!favs.some(f => f.artist === artist && f.title === title)) {
            favs.push({ artist, title });
            localStorage.setItem('gb_karaoke_favs', JSON.stringify(favs));
            if(window.sounds && window.sounds.coin) window.sounds.coin();
            alert('SAVED TO FAVORITES! ⭐');
        }
    },

    async search() {
        const query = document.getElementById('kInput').value.trim();
        const resDiv = document.getElementById('kResults');
        if(!query) return;
        resDiv.innerHTML = 'LOADING...';
        try {
            const res = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`);
            const data = await res.json();
            resDiv.innerHTML = '';
            if(!data.data || data.data.length === 0) {
                resDiv.innerHTML = '<div style="padding: 10px; font-size: 8px;">NO SONGS FOUND. TRY ANOTHER SEARCH!</div>';
                return;
            }
            data.data.forEach(song => {
                const div = document.createElement('div');
                div.style.cssText = 'padding: 6px; border-bottom: 1px solid var(--gb-text); cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 7px;';
                const cover = song.album && song.album.cover_small ? song.album.cover_small : '';
                const imgHtml = cover ? `<img src="${cover}" style="width: 24px; height: 24px; border-radius: 2px;">` : '🎤';
                div.innerHTML = `${imgHtml} <div style="flex:1;"><b>${song.title.toUpperCase()}</b><br><span style="opacity:0.7;">${song.artist.name.toUpperCase()}</span></div> <button onclick="event.stopPropagation(); karaoke.saveFavorite('${song.artist.name.replace(/'/g, "\\'")}', '${song.title.replace(/'/g, "\\'")}')" style="padding: 2px 4px; font-size: 6px;">⭐</button>`;
                div.onclick = () => karaoke.loadLyrics(song.artist.name, song.title);
                resDiv.appendChild(div);
            });
        } catch(e) { resDiv.innerHTML = 'ERROR SEARCHING LYRICS'; }
    },

    async loadLyrics(artist, title) {
        const resDiv = document.getElementById('kResults');
        const lyricDiv = document.getElementById('kLyrics');
        const ctrls = document.getElementById('kControls');
        const back = document.getElementById('kBackBtn');
        
        this.currentSong = { artist, title };
        this.pitchShift = 0;
        
        resDiv.style.display = 'none';
        lyricDiv.style.display = 'block';
        lyricDiv.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 8px;">FETCHING LYRICS... 🎤</div>';
        if(back) back.style.display = 'block';
        
        try {
            let lyrics = '';
            try {
                const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.syncedLyrics || data.plainLyrics;
            } catch(e) {}
            
            if(!lyrics) {
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.lyrics;
            }
            
            if(lyrics) {
                lyricDiv.innerHTML = '';
                
                // Song Header & Controls inside lyric window
                const header = document.createElement('div');
                header.style.cssText = 'padding: 8px; background: rgba(15,56,15,0.15); border-bottom: 2px solid var(--gb-text); margin-bottom: 10px; text-align: center;';
                header.innerHTML = `
                    <div style="font-size: 9px; font-weight: bold;">${title.toUpperCase()}</div>
                    <div style="font-size: 7px; opacity: 0.8; margin-top: 2px;">${artist.toUpperCase()}</div>
                    <div style="display: flex; justify-content: center; gap: 6px; margin-top: 6px; align-items: center; font-size: 7px;">
                        <span>KEY:</span>
                        <button onclick="karaoke.changePitch(-1)" style="padding: 2px 6px;">-</button>
                        <span id="kPitchLabel" style="font-weight: bold;">0</span>
                        <button onclick="karaoke.changePitch(1)" style="padding: 2px 6px;">+</button>
                    </div>
                `;
                lyricDiv.appendChild(header);

                const lines = lyrics.split('\n');
                lines.forEach((line) => {
                    const txt = line.replace(/^\[.*?\]/, '').trim();
                    if(txt) {
                        const d = document.createElement('div');
                        d.className = 'karaoke-line';
                        d.textContent = txt;
                        d.style.cssText = 'padding: 4px 6px; margin-bottom: 3px; cursor: pointer; border-radius: 3px; font-size: 8px; transition: background 0.15s;';
                        d.onclick = () => {
                            document.querySelectorAll('.karaoke-line').forEach(l => {
                                l.style.background = 'transparent';
                                l.style.color = 'var(--gb-text)';
                            });
                            d.style.background = 'var(--gb-text)';
                            d.style.color = 'var(--gb-screen)';
                            d.scrollIntoView({behavior: "smooth", block: "center"});
                        };
                        lyricDiv.appendChild(d);
                    }
                });
                if(ctrls) ctrls.style.display = 'flex';
            } else {
                lyricDiv.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 8px;">NO LYRICS FOUND FOR THIS TRACK :(</div>';
            }
        } catch(e) { lyricDiv.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 8px;">ERROR LOADING LYRICS</div>'; }
    },

    changePitch(delta) {
        this.pitchShift = Math.max(-6, Math.min(6, this.pitchShift + delta));
        const lbl = document.getElementById('kPitchLabel');
        if(lbl) lbl.textContent = (this.pitchShift > 0 ? '+' : '') + this.pitchShift;
    },

    back() {
        document.getElementById('kResults').style.display = 'block';
        document.getElementById('kLyrics').style.display = 'none';
        const ctrls = document.getElementById('kControls');
        if(ctrls) ctrls.style.display = 'none';
        const back = document.getElementById('kBackBtn');
        if(back) back.style.display = 'none';
        document.getElementById('kLyrics').textContent = '';
        this.stopAutoScroll();
    },

    togglePlay() {
        const btn = document.getElementById('kPlayBtn');
        if(this.scrollTimer) {
            this.stopAutoScroll();
            if(btn) btn.textContent = "▶ START";
        } else {
            const div = document.getElementById('kLyrics');
            this.scrollTimer = setInterval(() => {
                div.scrollTop += 1;
            }, this.currentSpeed);
            if(btn) btn.textContent = "⏸ PAUSE";
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
