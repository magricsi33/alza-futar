import { scheduleDays, schedulePeople, parseShift } from './schedule';

export function todayDate() {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
}

export function displayDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date.split('-').join('. ') + '.' : '';
}

export function routeDrivers(route, date) {
    const index = scheduleDays.indexOf(date);
    if (index < 0) return null;
    return schedulePeople.filter(person => parseShift(person.cells[index]).route === route).map(person => person.name);
}

export function initMobile({ tours, ramps, currentRoute }) {
    const el = id => document.getElementById(id);
    for (const tour of tours) el('route-search').add(new Option(tour.name, tour.id));
    el('route-search').value = currentRoute();
    function search() {
        const today = todayDate();
        el('search-date').textContent = 'Mai beosztás · ' + displayDate(today);
        const query = el('route-search').value.trim().toLocaleUpperCase('hu-HU');
        const matches = tours.filter(tour => tour.id === query);
        el('search-results').replaceChildren();
        for (const tour of matches) {
            const card = document.createElement('article'); card.className = 'shift-card';
            const title = document.createElement('h2'); title.textContent = tour.name;
            const people = document.createElement('p');
            const drivers = routeDrivers(tour.id, today);
            people.textContent = drivers === null ? 'Erre a napra nincs kiadott beosztás.' : drivers.length ? drivers.join(', ') : 'Ma nincs megadott sofőr ehhez az útvonalhoz.';
            const ramp = document.createElement('p');
            const assignment = ramps[tour.id];
            ramp.textContent = !assignment ? 'Nincs rámpaadat' : (assignment.ramp === null ? 'Raktárban pakol' : assignment.ramp + '. rámpa') + ' · Indulás: ' + assignment.departure;
            card.append(title, people, ramp); el('search-results').append(card);
        }
        if (!matches.length) el('search-results').textContent = 'Nincs ilyen útvonal.';
    }
    el('route-search').addEventListener('change', search);
    el('search-tab').addEventListener('click', search);
    window.addEventListener('focus', search);

    const fuelKey = route => 'alzafutar-last-fuel-' + route;
    function refreshFuel() {
        let date = null;
        try { date = localStorage.getItem(fuelKey(currentRoute())); } catch {}
        el('last-fuel').textContent = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? 'Legutóbbi tankolás: ' + displayDate(date) : 'Még nincs rögzített tankolás.';
    }
    let fuelRoute;
    el('last-fuel-button').addEventListener('click', () => {
        fuelRoute = currentRoute();
        el('fuel-dialog-route').textContent = 'Budapest ' + fuelRoute;
        el('fuel-date').value = todayDate(); el('fuel-date').max = todayDate();
        el('fuel-status').textContent = ''; el('fuel-dialog').showModal();
    });
    function saveFuel(date) {
        const parsed = new Date(date + 'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > todayDate()) {
            el('fuel-status').textContent = 'Érvényes, nem jövőbeli dátumot adj meg.'; return;
        }
        try {
            localStorage.setItem(fuelKey(fuelRoute), date);
            refreshFuel(); el('fuel-dialog').close();
        } catch { el('fuel-status').textContent = 'A dátum nem menthető ezen az eszközön.'; }
    }
    el('fuel-today').addEventListener('click', () => saveFuel(todayDate()));
    el('fuel-form').addEventListener('submit', event => { event.preventDefault(); saveFuel(el('fuel-date').value); });
    el('fuel-close').addEventListener('click', () => el('fuel-dialog').close());
    el('tour').addEventListener('change', refreshFuel);
    el('fuel-tab').addEventListener('click', refreshFuel);
    refreshFuel();

    const qrKey = 'alzafutar-device-qr-v1';
    function showQr(value) {
        const valid = /^data:image\/(png|jpeg|webp);base64,/.test(value || '');
        el('qr-image').hidden = !valid; el('qr-empty').hidden = valid;
        if (valid) el('qr-image').src = value;
    }
    el('qr-tab').addEventListener('click', () => {
        el('qr-status').textContent = '';
        try { showQr(localStorage.getItem(qrKey)); }
        catch { showQr(null); el('qr-status').textContent = 'A helyi tároló nem érhető el.'; }
    });
    el('qr-upload').addEventListener('click', () => el('qr-file').click());
    el('qr-file').addEventListener('change', async event => {
        const file = event.target.files[0]; event.target.value = '';
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
            el('qr-status').textContent = 'Legfeljebb 2 MB-os PNG, JPG vagy WebP képet válassz.'; return;
        }
        el('qr-file').disabled = true;
        el('qr-upload').disabled = true;
        el('qr-status').textContent = 'Mentés…';
        try {
            const value = await new Promise((resolve, reject) => {
                const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
            });
            await new Promise((resolve, reject) => { const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = value; });
            localStorage.setItem(qrKey, value); showQr(value);
            el('qr-status').textContent = 'Mentve ezen az eszközön.';
        } catch { el('qr-status').textContent = 'Nem sikerült menteni a képet. A korábbi QR-kód megmaradt.'; }
        finally { el('qr-file').disabled = false; el('qr-upload').disabled = false; }
    });
}
