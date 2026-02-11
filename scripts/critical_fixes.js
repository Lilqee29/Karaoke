// ========== ADDITIONAL CRITICAL FIXES ==========

// ========== NEWS (with full articles + navigation) ==========
let newsArticles = [];
let newsIndex = 0;

window.initNews = async function() {
    const display = document.getElementById('newsDisplay');
    if (!display) return;
    
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
};

function showNewsArticle() {
    if (newsArticles.length === 0) return;
    
    const article = newsArticles[newsIndex];
    const display = document.getElementById('newsDisplay');
    
    if (!display) return;
    
   const summary = article.summary || article.title;
    display.innerHTML = `<div style="font-weight: bold; margin-bottom: 5px; font-size: 8px;">${article.title.toUpperCase()}</div>` +
                       `<div style="font-size: 6px; margin-bottom: 5px; line-height: 1.3;">${summary.toUpperCase().substring(0, 300)}...</div>` +
                       `<div style="font-size: 5px; color: var(--gb-text-light);">SOURCE: ${article.news_site ? article.news_site.toUpperCase() : 'UNKNOWN'}</div>` +
                       `<div style="font-size: 5px; margin-top: 5px;">[${newsIndex + 1}/${newsArticles.length}]</div>`;
    sounds.coin();
}

window.nextNews = function() {
    if (newsArticles.length === 0) return;
    newsIndex = (newsIndex + 1) % newsArticles.length;
    showNewsArticle();
    sounds.click();
};

window.prevNews = function() {
    if (newsArticles.length === 0) return;
    newsIndex = (newsIndex - 1 + newsArticles.length) % newsArticles.length;
    showNewsArticle();
    sounds.click();
};

// Fix initTranslate to use window
window.initTranslate = function() { 
    const el = document.getElementById('transOutput');
    if (el) el.textContent = "READY..."; 
};

// Make translateText available globally
window.translateText = async function() {
    const text = document.getElementById('transInput').value;
    const lang = document.getElementById('transLang').value;
    const output = document.getElementById('transOutput');
    
    if (!text || !output) return;
    
    output.textContent = "TRANSLATING...";
    sounds.click();
    
    try {
        const encoded = encodeURIComponent(text);
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${lang}`);
        const data = await res.json();
        
        if (data.responseData && data.responseData.translatedText) {
            output.textContent = data.responseData.translatedText.toUpperCase();
            sounds.coin();
        } else {
            output.textContent = "[TRANSLATION FAILED]";
        }
    } catch(e) {
        output.textContent = `[${lang.toUpperCase()}] OFFLINE`;
    }
};
