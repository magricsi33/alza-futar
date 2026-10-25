import { initSchedule } from './schedule';
import { tours } from './tours';
const key = 'uton-state-v1';
const $ = id => document.getElementById(id);
// A megadott táblázat értékei, átszámítás nélkül.
const fuelData = {
    A: { code: 'HU14A', km: 289, liters: 35, amount: 22476 },
    B: { code: 'HU15B', km: 237, liters: 26, amount: 18431 },
    D: { code: 'HU17D', km: 257, liters: 32, amount: 19987 },
    E: { code: 'HU18E', km: 137, liters: 15, amount: 10654 },
    S: { code: 'HU32S', km: 106, liters: 11, amount: 8244 },
    U: { code: 'HU34U', km: 69, liters: 8, amount: 5366 },
    V: { code: 'HU35V', km: 44, liters: 8, amount: 3422 },
};
const fuelIntervals = { V: 5, U: 3, S: 2, E: 2 };
const formatNumber = new Intl.NumberFormat('hu-HU');

function renderFuel(tour) {
    const data = fuelData[tour.id];
    const days = fuelIntervals[tour.id] || 1;

    $('fuel-tour').textContent = data ? tour.name + ' · ' + data.code : tour.name;
    $('fuel-values').hidden = !data;
    $('fuel-empty').hidden = !!data;
    $('fuel-km').textContent = data ? formatNumber.format(data.km) + ' km' : '';
    $('fuel-liters').textContent = data ? formatNumber.format(data.liters) + ' liter' : '';
    $('fuel-amount').textContent = data ? formatNumber.format(data.amount) + ' Ft' : '';
    $('fuel-frequency').textContent = days === 1 ? 'Tankolás minden nap' : 'Tankolás ' + days + ' naponta';
}
// A kapott rámpakiosztás alapján. A páros oszlopokban a felső útvonal indul előbb.
const rampAssignments = {
    A: { ramp: 82, departure: '05:30' },
    B: { ramp: 82, departure: '05:30' },
    C: { ramp: 81, departure: '05:30' },
    D: { ramp: 80, departure: '05:30' },
    E: { ramp: 79, departure: '05:30' },
    F: { ramp: 78, departure: '05:30' },
    T: { ramp: 77, departure: '05:30' },
    S: { ramp: 77, departure: '06:00' },
    V: { ramp: 76, departure: '05:30' },
    U: { ramp: 76, departure: '06:00' },
    O: { ramp: null, departure: '05:30' },
    Q: { ramp: null, departure: '05:30' },
};
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
    renderFuel(tour);
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
    $('progress-text').textContent = !total ? 'A címlista még feltöltésre vár' : count === total ? 'Minden cím kész. Szép munka!' : count ? 'Jól haladsz, csak így tovább!' : 'Kezdődjön az útvonal!';
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
    $('empty').textContent = !total ? 'Ehhez az útvonalhoz még nincs címlista megadva.' : '✓ Minden megálló teljesítve! A szűrő kikapcsolásával újra láthatod a címeket.';
}
for (const tour of tours) $('tour').add(new Option(tour.name, tour.id));
$('ramp-button').addEventListener('click', () => {
    const tour = tours.find(t => t.id === state.tour);
    const assignment = rampAssignments[tour.id];

    $('ramp-tour').textContent = tour.name;
    $('ramp-location').textContent = !assignment
        ? 'Még nincs megadva'
        : assignment.ramp === null ? 'Raktárban pakol' : assignment.ramp + '. rámpa';
    $('ramp-departure').textContent = assignment ? assignment.departure : 'Nincs megadva';
    $('ramp-departure').setAttribute('datetime', assignment ? assignment.departure : '');
    $('ramp-dialog').showModal();
});
$('tour').addEventListener('change', e => { state.tour = e.target.value; save(); render(); });
$('remaining-only').addEventListener('change', e => { state.remainingOnly = e.target.checked; save(); render(); });
let resetTour;
$('reset').addEventListener('click', () => {
    resetTour = state.tour;
    $('reset-description').textContent = 'A ' + tours.find(t => t.id === resetTour).name + ' útvonal összes pipáját töröljük. A többi útvonal haladása megmarad.';
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
function connection() { if (!$("connection")) return; $('connection').textContent = navigator.onLine ? 'Helyi mentés' : 'Offline mód'; }
window.addEventListener('online', connection); window.addEventListener('offline', connection);
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.querySelector('.install-panel').hidden = true;
window.addEventListener('appinstalled', () => { document.querySelector('.install-panel').hidden = true; });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { if ($('connection')) $('connection').textContent = 'Offline mód nem elérhető'; }));
render(); save(); connection();

initSchedule();
