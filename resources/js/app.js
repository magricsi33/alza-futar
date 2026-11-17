import { initSchedule } from './schedule';
import { initStopInfo } from './stop-info';
import { tours } from './tours';
import { initMobile } from './mobile';
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (standalone) {
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
    document.documentElement?.classList.add('pwa-standalone');
    // Az iOS gesztusait is kezeljük, mert a viewport-korlátot felülbírálhatja.
    ['gesturestart', 'gesturechange'].forEach(name => document.addEventListener(name, event => event.preventDefault(), { passive: false }));
    document.addEventListener('touchmove', event => {
        if (event.touches.length > 1) event.preventDefault();
    }, { passive: false });
}
const key = 'uton-state-v1';
const $ = id => document.getElementById(id);
let navigationApp = 'waze';
try { if (localStorage.getItem('alzafutar-navigation') === 'google') navigationApp = 'google'; } catch {}
const exemptRouteId = 'exempt';
function selectedTour(id = state.tour) {
    if (id !== exemptRouteId) return tours.find(t => t.id === id);
    return { id: exemptRouteId, name: 'Mentesített', stops: tours.flatMap(tour => tour.stops.filter(stop => (state.exempt[tour.id] || []).includes(stop[0]))) };
}
const notes = {};
let notesRequest = 0;
async function loadNotes() {
    const request = ++notesRequest;
    const tour = selectedTour();
    try {
        const data = {};
        for (let offset = 0; offset < tour.stops.length; offset += 40) {
        const query = tour.stops.slice(offset, offset + 40).map(stop => 'ids[]=' + encodeURIComponent(stop[0])).join('&');
        const response = await fetch('/address-info/notes?' + query, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) throw Error('notes');
        Object.assign(data, await response.json());
        }
        if (request !== notesRequest) return;
        Object.assign(notes, data); render();
        $('notes-status').textContent = '';
    } catch {
        if (request === notesRequest) $('notes-status').textContent = 'A közös megjegyzések nem frissíthetők. Ellenőrizd az internetkapcsolatot.';
    }
}
// A megadott táblázat értékei, átszámítás nélkül.
const fuelData = window.dispatchData?.fuel || {};
const fuelIntervals = window.dispatchData?.intervals || {};
const formatNumber = new Intl.NumberFormat('hu-HU');

function renderFuel(tour) {
    const data = fuelData[tour.id];
    const days = fuelIntervals[tour.id] || 1;

    $('fuel-tour').textContent = data?.code ? tour.name + ' · ' + data.code : tour.name;
    $('fuel-values').hidden = !data;
    $('fuel-empty').hidden = !!data;
    $('fuel-km').textContent = data ? (data.km === null ? 'Nincs adat' : formatNumber.format(data.km) + ' km') : '';
    $('fuel-liters').textContent = data ? (data.liters === null ? 'Nincs adat' : formatNumber.format(data.liters) + ' liter') : '';
    $('fuel-amount').textContent = data ? (data.amount === null ? 'Nincs adat' : formatNumber.format(data.amount) + ' Ft') : '';
    $('fuel-frequency').textContent = days === 1 ? 'Tankolás minden nap' : 'Tankolás ' + days + ' naponta';
}
// A kapott rámpakiosztás alapján. A páros oszlopokban a felső útvonal indul előbb.
const rampAssignments = window.dispatchData?.ramps || {};
let state = { tour: tours.some(t => t.id === 'S') ? 'S' : tours[0]?.id || exemptRouteId, remainingOnly: false, completed: {}, exempt: {} };
try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === 'object') {
        if (saved.tour === exemptRouteId || tours.some(t => t.id === saved.tour)) state.tour = saved.tour;
        state.remainingOnly = saved.remainingOnly === true;
        for (const tour of tours) {
            const ids = saved.completed?.[tour.id];
            state.completed[tour.id] = Array.isArray(ids) ? [...new Set(ids.filter(id => tour.stops.some(s => s[0] === id)))] : [];
            const exempt = saved.exempt?.[tour.id];
            state.exempt[tour.id] = Array.isArray(exempt) ? [...new Set(exempt.filter(id => tour.stops.some(s => s[0] === id)))] : [];
        }
    }
} catch { /* Invalid or unavailable storage: use a clean state. */ }
function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); $('save-note').textContent = ''; }
    catch { $('save-note').textContent = 'A böngésző nem engedi a mentést. A haladás most csak a lap bezárásáig marad meg.'; }
}
function render() {
    $('navigation-app').value = navigationApp;
    const warehouse = encodeURIComponent('Bevásárló utca 1, 2310 Szigetszentmiklós, Magyarország');
    $('return-warehouse').href = navigationApp === 'google'
        ? 'https://www.google.com/maps/dir/?api=1&destination=' + warehouse + '&travelmode=driving'
        : 'https://waze.com/ul?q=' + warehouse + '&navigate=yes';
    const tour = selectedTour();
    renderFuel(tour);
    renderRamp();
    const completed = state.completed[tour.id] || [];
    const aggregate = tour.id === exemptRouteId;
    const exempt = aggregate ? tour.stops.map(stop => stop[0]) : state.exempt[tour.id] || [];
    const total = tour.stops.length;
    $('tour').value = tour.id;
    $('remaining-only').checked = state.remainingOnly;
    $('reset').disabled = aggregate || completed.length === 0;
    $('remaining-only').disabled = aggregate;
    $('clear-exempt').disabled = exempt.length === 0;
    const list = $('stops'); list.replaceChildren();
    tour.stops.forEach(([id, address, city, location, deadline], index) => {
        const source = aggregate ? tours.find(route => route.stops.some(stop => stop[0] === id)) : tour;
        const done = completed.includes(id);
        const waived = exempt.includes(id);
        if (!aggregate && state.remainingOnly && (done || waived)) return;
        const row = document.createElement('li'); row.className = 'stop' + (done ? ' is-done' : '') + (waived ? ' is-exempt' : ''); row.dataset.stop = id;
        const label = document.createElement('label'); label.className = 'stop-check';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = done;
        checkbox.disabled = waived;
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
        const destination = encodeURIComponent(address.replace(/–/g, '-') + ', ' + city + ', Magyarország');
        link.href = navigationApp === 'google'
            ? 'https://www.google.com/maps/dir/?api=1&destination=' + destination + '&travelmode=driving'
            : 'https://waze.com/ul?q=' + destination + '&navigate=yes';
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', address + ', ' + city + ' — megnyitás: ' + (navigationApp === 'google' ? 'Google Maps' : 'Waze'));
        const text = document.createElement('span');
        const title = document.createElement('strong'); title.textContent = address;
        const subtitle = document.createElement('span'); subtitle.className = 'stop-city'; subtitle.textContent = city;
        text.append(title, subtitle);
        if (aggregate) {
            const origin = document.createElement('span'); origin.className = 'stop-city'; origin.textContent = source.name; text.append(origin);
        }
        if (notes[id]) {
            const note = document.createElement('span'); note.className = 'stop-note';
            note.textContent = notes[id]; text.append(note);
        }
        if (waived) {
            const badge = document.createElement('span'); badge.className = 'exempt-badge'; badge.textContent = 'Mentesítve';
            text.append(badge);
        }
        const arrow = document.createElement('span'); arrow.className = 'navigate'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '↗';
        const info = document.createElement('button'); info.type = 'button'; info.className = 'stop-info-button'; info.textContent = 'ⓘ';
        info.setAttribute('aria-label', address + ' – információk');
        info.setAttribute('aria-haspopup', 'dialog'); info.setAttribute('aria-controls', 'info-dialog');
        info.addEventListener('click', () => stopInfo.open(source.id, [id, address, city, location, deadline]));
        link.append(text, arrow); row.append(label, number, link, info); list.append(row);
    });
    $('list-count').textContent = list.children.length;
    $('empty').hidden = list.children.length > 0;
    $('empty').textContent = !total ? (aggregate ? 'Még nincs mentesített cím.' : 'Ehhez az útvonalhoz még nincs címlista megadva.') : '✓ Nincs hátralévő megálló! A szűrő kikapcsolásával újra láthatod a teljesített és mentesített címeket.';
}
const stopInfo = initStopInfo({
    onSaved: record => { notesRequest++; notes[record.id] = record.note; render(); },
    isExempt: (route, id) => (state.exempt[route] || []).includes(id),
    toggleExempt: (route, id) => {
        const ids = new Set(state.exempt[route] || []);
        ids.has(id) ? ids.delete(id) : ids.add(id);
        state.exempt[route] = [...ids]; save(); render();
    },
});
let clearExemptRoute;
$('clear-exempt').addEventListener('click', () => {
    clearExemptRoute = state.tour;
    $('clear-exempt-description').textContent = 'A ' + selectedTour(clearExemptRoute).name + ' útvonal összes mentesítését töröljük. A megjegyzések, képek és teljesítési pipák megmaradnak.';
    $('clear-exempt-dialog').showModal();
});
$('clear-exempt-dialog').addEventListener('close', () => {
    if ($('clear-exempt-dialog').returnValue === 'confirm') { if (clearExemptRoute === exemptRouteId) { for (const tour of tours) state.exempt[tour.id] = []; }
        else state.exempt[clearExemptRoute] = []; save(); render(); }
});
for (const tour of tours) $('tour').add(new Option(tour.name, tour.id));
$('tour').add(new Option('Mentesített', exemptRouteId));
function renderRamp() {
    const tour = selectedTour();
    const assignment = rampAssignments[tour.id];

    $('ramp-tour').textContent = tour.name;
    $('ramp-location').textContent = !assignment
        ? 'Még nincs megadva'
        : assignment.ramp === null ? 'Raktárban pakol' : assignment.ramp + '. rámpa';
    $('ramp-departure').textContent = assignment ? assignment.departure : 'Nincs megadva';
    $('ramp-departure').setAttribute('datetime', assignment ? assignment.departure : '');
}
$('tour').addEventListener('change', e => { state.tour = e.target.value; save(); render(); loadNotes(); });
$('remaining-only').addEventListener('change', e => { state.remainingOnly = e.target.checked; save(); render(); });
$('navigation-app').addEventListener('change', event => {
    navigationApp = event.target.value === 'google' ? 'google' : 'waze';
    try { localStorage.setItem('alzafutar-navigation', navigationApp); } catch {}
    render();
});
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
initMobile({ tours, ramps: rampAssignments, currentRoute: () => state.tour });
loadNotes();
window.addEventListener('focus', loadNotes);
window.addEventListener('online', loadNotes);
