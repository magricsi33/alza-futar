import { tours } from './tours';
const key = 'uton-state-v1';
const $ = id => document.getElementById(id);
let state = { tour: 'S', remainingOnly: false, completed: {} };
try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === 'object') {
        if (tours.some(t => t.id === saved.tour)) state.tour = saved.tour;
        state.remainingOnly = saved.remainingOnly === true;
        for (const tour of tours) {
            const ids = saved.completed?.[tour.id];
            state.completed[tour.id] = Array.isArray(ids) ? [...new Set(ids.filter(id => tour.stops.some(s => s[0] === id)))] : [];
        }
    }
} catch { /* Invalid or unavailable storage: use a clean state. */ }
function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); $('save-note').textContent = '✓ A haladásod automatikusan mentve ezen az eszközön.'; }
    catch { $('save-note').textContent = 'A böngésző nem engedi a mentést. A haladás most csak a lap bezárásáig marad meg.'; }
}
function render() {
    const tour = tours.find(t => t.id === state.tour);
    const completed = state.completed[tour.id] || [];
    const count = completed.length, total = tour.stops.length;
    $('tour').value = tour.id;
    $('remaining-only').checked = state.remainingOnly;
    $('remaining-count').textContent = total - count;
    $('done-count').textContent = count;
    $('total-count').textContent = total;
    $('progress').max = total || 1;
    $('progress').value = count;
    $('progress-percent').textContent = (total ? Math.round(count / total * 100) : 0) + '%';
    $('progress-text').textContent = !total ? 'A címlista még feltöltésre vár' : count === total ? 'Minden cím kész. Szép munka!' : count ? 'Jól haladsz, csak így tovább!' : 'Kezdődjön a túra!';
    $('reset').disabled = count === 0;
    const list = $('stops'); list.replaceChildren();
    tour.stops.forEach(([id, address, city, location], index) => {
        const done = completed.includes(id);
        if (state.remainingOnly && done) return;
        const row = document.createElement('li'); row.className = 'stop' + (done ? ' is-done' : ''); row.dataset.stop = id;
        const label = document.createElement('label'); label.className = 'stop-check';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = done;
        checkbox.setAttribute('aria-label', (index + 1) + '. ' + address + ' teljesítve');
        checkbox.addEventListener('change', () => {
            const ids = new Set(state.completed[tour.id] || []);
            checkbox.checked ? ids.add(id) : ids.delete(id);
            state.completed[tour.id] = [...ids]; save(); render();
            const next = document.querySelector('[data-stop="' + id + '"] input') || list.querySelector('input') || $('remaining-only');
            next.focus({ preventScroll: true });
        });
        label.append(checkbox);
        const number = document.createElement('span'); number.className = 'stop-number'; number.textContent = String(index + 1).padStart(2, '0');
        const link = document.createElement('a'); link.className = 'stop-link';
        link.href = 'https://waze.com/ul?q=' + encodeURIComponent(address.replace(/–/g, '-') + ', ' + city + ', Magyarország') + '&navigate=yes';
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', address + ', ' + city + ' — megnyitás Waze-ben');
        const text = document.createElement('span');
        const title = document.createElement('strong'); title.textContent = address;
        const subtitle = document.createElement('span'); subtitle.className = 'stop-city'; subtitle.textContent = city;
        const meta = document.createElement('span'); meta.className = 'stop-meta'; meta.textContent = id + ' · ' + location;
        text.append(title, subtitle, meta);
        const arrow = document.createElement('span'); arrow.className = 'navigate'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
        link.append(text, arrow); row.append(label, number, link); list.append(row);
    });
    $('list-count').textContent = list.children.length;
    $('empty').hidden = list.children.length > 0;
    $('empty').textContent = !total ? 'Ehhez a túrához még nincs címlista megadva.' : '✓ Minden megálló teljesítve! A szűrő kikapcsolásával újra láthatod a címeket.';
}
for (const tour of tours) $('tour').add(new Option(tour.name, tour.id));
$('tour').addEventListener('change', e => { state.tour = e.target.value; save(); render(); });
$('remaining-only').addEventListener('change', e => { state.remainingOnly = e.target.checked; save(); render(); });
let resetTour;
$('reset').addEventListener('click', () => {
    resetTour = state.tour;
    $('reset-description').textContent = 'A ' + tours.find(t => t.id === resetTour).name + ' túra összes pipáját töröljük. A többi túra haladása megmarad.';
    $('reset-dialog').showModal();
});
$('reset-dialog').addEventListener('close', () => {
    if ($('reset-dialog').returnValue === 'confirm') { state.completed[resetTour] = []; save(); render(); }
});
let installPrompt;
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
$('install').addEventListener('click', async () => {
    if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; }
    else $('install-help').textContent = 'iPhone: Safari → Megosztás → Főképernyőhöz adás. Android: böngészőmenü → Alkalmazás telepítése vagy Hozzáadás a kezdőképernyőhöz.';
});
function connection() { $('connection').textContent = navigator.onLine ? 'Helyi mentés' : 'Offline mód'; }
window.addEventListener('online', connection); window.addEventListener('offline', connection);
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.querySelector('.install-panel').hidden = true;
window.addEventListener('appinstalled', () => { document.querySelector('.install-panel').hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { $('connection').textContent = 'Offline mód nem elérhető'; }));
render(); save(); connection();
