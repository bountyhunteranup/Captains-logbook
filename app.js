// ==========================================
// COMPONENT 1 & 2: MARKDOWN PARSER
// ==========================================
const markdownInput = document.getElementById('markdown-input');
const markdownPreview = document.getElementById('markdown-preview');

function parseMarkdown(rawText) {
    let html = rawText;

    // Convert Headings: ###, ##, # (Must go from most #'s to fewest!)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Convert Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Convert Italic: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Convert Blockquotes (Captain's quotes): > text -> <blockquote>text</blockquote>
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Convert Line Breaks (Enter key) into <br> tags
    html = html.replace(/\n/gim, '<br>');

    return html;
}

markdownInput.addEventListener('input', () => {
    const rawText = markdownInput.value;
    markdownPreview.innerHTML = parseMarkdown(rawText);
});


// ==========================================
// COMPONENT 3: QUARTERMASTER'S LEDGER (STATE & DOM)
// ==========================================
const needsForm = document.getElementById('needs-form');
const needInput = document.getElementById('need-input');
const needsListEl = document.getElementById('needs-list');

let needsData = [];

function renderNeeds() {
    needsListEl.innerHTML = '';

    needsData.forEach((item) => {
        const li = document.createElement('li');
        li.className = `need-item ${item.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <label class="need-label">
                <input type="checkbox" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
                <span></span>
            </label>
            <button class="delete-need-btn" data-id="${item.id}">✕</button>
        `;

        li.querySelector('span').textContent = item.text;
        needsListEl.appendChild(li);
    });
}

needsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = needInput.value.trim();
    if (!text) return;

    const newNeed = {
        id: Date.now(),
        text: text,
        completed: false
    };

    needsData.push(newNeed);
    needInput.value = '';
    renderNeeds();
    saveCurrentDayToMemory(); // Auto-save on adding task
});

needsListEl.addEventListener('click', (e) => {
    const targetId = Number(e.target.getAttribute('data-id'));

    if (e.target.type === 'checkbox') {
        const item = needsData.find(need => need.id === targetId);
        if (item) {
            item.completed = !item.completed;
            renderNeeds();
            saveCurrentDayToMemory(); // Auto-save on checking task
        }
    }

    if (e.target.classList.contains('delete-need-btn')) {
        needsData = needsData.filter(need => need.id !== targetId);
        renderNeeds();
        saveCurrentDayToMemory(); // Auto-save on deleting task
    }
});


// ==========================================
// COMPONENT 4 & 5: HEATMAP, MULTI-DAY & STORAGE
// ==========================================
const heatmapGrid = document.getElementById('heatmap-grid');
const recentLogsList = document.getElementById('recent-logs-list');
const moodSelect = document.getElementById('mood-select');
const scratchpadInput = document.getElementById('scratchpad-input');
const logTitle = document.getElementById('log-title');
const logDateEl = document.getElementById('log-date');

let currentDateKey = '2026-10-16';

// 1. Retrieve saved data from localStorage
const savedLocalData = localStorage.getItem('grandLineLogs');
let logsByDate = savedLocalData ? JSON.parse(savedLocalData) : {};

if (!logsByDate['2026-10-16']) {
    logsByDate['2026-10-16'] = {
        markdown: '',
        mood: '5',
        needs: [],
        scratchpad: ''
    };
}

// FIXED: Cleaned up save function with active localStorage sync
function saveCurrentDayToMemory() {
    logsByDate[currentDateKey] = {
        markdown: markdownInput.value,
        mood: moodSelect.value,
        needs: [...needsData],
        scratchpad: scratchpadInput.value
    };

    // Save the entire dictionary to browser's permanent storage
    localStorage.setItem('grandLineLogs', JSON.stringify(logsByDate));

    renderHeatmap();
    renderRecentLogs();
}

function selectDay(dateKey, dayNumber) {
    saveCurrentDayToMemory();
    currentDateKey = dateKey;

    const dayData = logsByDate[dateKey] || {
        markdown: '',
        mood: '3',
        needs: [],
        scratchpad: ''
    };

    logTitle.textContent = `Captain's Log: Oct ${dayNumber}`;
    logDateEl.textContent = `Grand Line — ${dateKey}`;
    markdownInput.value = dayData.markdown;
    markdownPreview.innerHTML = parseMarkdown(dayData.markdown);
    moodSelect.value = dayData.mood;
    needsData = [...dayData.needs];
    scratchpadInput.value = dayData.scratchpad;

    renderNeeds();
    renderHeatmap();
}

function renderHeatmap() {
    heatmapGrid.innerHTML = '';

    for (let day = 1; day <= 31; day++) {
        const paddedDay = String(day).padStart(2, '0');
        const dateKey = `2026-10-${paddedDay}`;

        const square = document.createElement('div');
        square.className = `heatmap-day ${dateKey === currentDateKey ? 'active-day' : ''}`;
        square.textContent = day;

        const savedDay = logsByDate[dateKey];
        if (savedDay && (savedDay.markdown.trim() !== '' || savedDay.needs.length > 0)) {
            square.setAttribute('data-mood', savedDay.mood);
        }

        square.addEventListener('click', () => selectDay(dateKey, day));
        heatmapGrid.appendChild(square);
    }
}

function renderRecentLogs() {
    recentLogsList.innerHTML = '';
    const activeDates = Object.keys(logsByDate)
        .filter(date => logsByDate[date].markdown.trim() !== '' || logsByDate[date].needs.length > 0)
        .sort()
        .reverse();

    activeDates.forEach(dateKey => {
        const dayNum = parseInt(dateKey.split('-')[2], 10);
        const li = document.createElement('li');
        li.className = 'recent-log-item';
        li.innerHTML = `<span>Oct ${dayNum}, 2026</span> <span>Haki: ${logsByDate[dateKey].mood}/5</span>`;
        li.addEventListener('click', () => selectDay(dateKey, dayNum));
        recentLogsList.appendChild(li);
    });
}

// ==========================================
// INITIALIZATION ON STARTUP
// ==========================================
currentDateKey = '2026-10-16';
const startupData = logsByDate[currentDateKey];

logTitle.textContent = `Captain's Log: Oct 16`;
logDateEl.textContent = `Grand Line — 2026-10-16`;
markdownInput.value = startupData.markdown;
markdownPreview.innerHTML = parseMarkdown(startupData.markdown);
moodSelect.value = startupData.mood;
needsData = [...startupData.needs];
scratchpadInput.value = startupData.scratchpad;

renderNeeds();
renderHeatmap();
renderRecentLogs();

// Attach single clean set of event listeners for auto-saving
markdownInput.addEventListener('input', saveCurrentDayToMemory);
moodSelect.addEventListener('change', saveCurrentDayToMemory);
scratchpadInput.addEventListener('input', saveCurrentDayToMemory);

// ==========================================
// COMPONENT 5: SUPABASE CLOUD DATABASE SYNC
// ==========================================
const SUPABASE_URL = 'https://tfhkbotdcbjzeheiqdsn.supabase.co'; // Paste your Project URL here
const SUPABASE_ANON_KEY = 'sb_publishable_z0wZw7_WQxgqG2nVXG6OIw_T_FnLqhQ'; // Paste your Publishable Key here[cite: 19]

const syncCloudBtn = document.getElementById('sync-cloud-btn');
const syncStatusEl = document.getElementById('sync-status');

// Function to push all local logs to Supabase
async function syncToCloud() {
    syncStatusEl.textContent = 'Syncing with Grand Line...';
    
    try {
        const rowsToUpsert = Object.keys(logsByDate).map(dateKey => ({
            date_key: dateKey,
            markdown: logsByDate[dateKey].markdown,
            mood: logsByDate[dateKey].mood,
            needs: logsByDate[dateKey].needs,
            scratchpad: logsByDate[dateKey].scratchpad,
            updated_at: new Date().toISOString()
        }));

        const response = await fetch(`${SUPABASE_URL}/rest/v1/captains_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(rowsToUpsert)
        });

        if (!response.ok) throw new Error('Cloud sync failed.');

        syncStatusEl.textContent = 'Synced successfully to Cloud!';
    } catch (error) {
        console.error(error);
        syncStatusEl.textContent = 'Sync error (Check API keys)';
    }
}

syncCloudBtn.addEventListener('click', syncToCloud);