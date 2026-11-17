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
    el('route-search').value = tours.some(tour => tour.id === currentRoute()) ? currentRoute() : tours[0]?.id || '';
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU');
    function search() {
        const addressMode = el('search-mode').value === 'address';
        el('route-search-fields').hidden = addressMode;
        el('address-search-fields').hidden = !addressMode;
        el('search-results').replaceChildren();
        if (addressMode) {
            el('search-date').textContent = '';
            const query = normalize(el('address-search').value.trim());
            if (!query) { el('search-results').textContent = 'Írj be egy címet, várost vagy boxazonosítót.'; return; }
            const words = query.split(/\s+/);
            let count = 0;
            for (const tour of tours) for (const stop of tour.stops) {
                if (!words.every(word => normalize(stop.slice(0, 4).join(' ')).includes(word))) continue;
                const card = document.createElement('article'); card.className = 'shift-card';
                const title = document.createElement('h2'); title.textContent = stop[1];
                const address = document.createElement('p'); address.textContent = stop[2];
                const details = document.createElement('p'); details.textContent = tour.name + ' · ' + stop[0] + ' · ' + stop[3];
                card.append(title, address, details); el('search-results').append(card); count++;
            }
            if (!count) el('search-results').textContent = 'Nincs találat erre a címre.';
            return;
        }
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
    el('search-mode').addEventListener('change', search);
    el('address-search').addEventListener('input', search);
    el('search-tab').addEventListener('click', search);
    window.addEventListener('focus', search);

    let fuelGeneration = 0;
    async function fuelJson(response) {
        const data = await response.json();
        if (!response.ok) throw Error(response.status === 422 ? 'Ellenőrizd a dátumot és a gépjárművet.' : 'A szerver nem érhető el. Próbáld újra.');
        return data;
    }
    async function refreshFuel() {
        const token = ++fuelGeneration;
        const route = currentRoute();
        const valid = tours.some(tour => tour.id === route) || (route === 'exempt' && !!window.dispatchData?.fuel?.exempt);
        el('last-fuel-button').disabled = !valid;
        if (!valid) { el('last-fuel').textContent = 'A tankolás egy konkrét útvonalhoz rögzíthető.'; return; }
        el('last-fuel').textContent = 'Tankolási adatok betöltése…';
        try {
            const data = await fuelJson(await fetch('/dispatch/fuel/' + encodeURIComponent(route), { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }));
            if (token !== fuelGeneration) return;
            el('last-fuel').textContent = data.date ? 'Legutóbbi tankolás: ' + displayDate(data.date) : 'Még nincs rögzített tankolás.';
        } catch { if (token === fuelGeneration) el('last-fuel').textContent = 'A közös tankolási adatok nem érhetők el. Ellenőrizd az internetkapcsolatot.'; }
    }
    const vehicles = window.dispatchData?.vehicles || [];
    for (const vehicle of vehicles) el('fuel-vehicle').add(new Option(vehicle.plate, vehicle.id));
    let fuelRoute;
    el('last-fuel-button').addEventListener('click', () => {
        fuelRoute = currentRoute();
        const tour = tours.find(tour => tour.id === fuelRoute);
        if (!tour && !(fuelRoute === 'exempt' && window.dispatchData?.fuel?.exempt)) return;
        el('fuel-dialog-route').textContent = tour ? tour.name : 'Mentesítő';
        const day = scheduleDays.indexOf(todayDate());
        const plates = [...new Set(schedulePeople.map(person => parseShift(person.cells[day])).filter(shift => shift.route === fuelRoute && shift.plate !== 'Nem ismert').map(shift => shift.plate))];
        const vehicle = plates.length === 1 ? vehicles.find(vehicle => vehicle.plate === plates[0]) : null;
        el('fuel-vehicle').value = vehicle ? String(vehicle.id) : '';
        el('fuel-date').value = todayDate(); el('fuel-date').max = todayDate();
        el('fuel-status').textContent = ''; el('fuel-dialog').showModal();
    });
    let fuelBusy = false;
    async function saveFuel(date) {
        if (fuelBusy) return;
        const parsed = new Date(date + 'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date || date > todayDate()) {
            el('fuel-status').textContent = 'Érvényes, nem jövőbeli dátumot adj meg.'; return;
        }
        fuelBusy = true;
        ['fuel-today', 'fuel-submit', 'fuel-close', 'fuel-date', 'fuel-vehicle'].forEach(id => { el(id).disabled = true; });
        el('fuel-status').textContent = 'Mentés…';
        try {
            const session = await fuelJson(await fetch('/address-info/session', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } }));
            await fuelJson(await fetch('/dispatch/fuel/' + encodeURIComponent(fuelRoute), {
                method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': session.token },
                body: JSON.stringify({ date, vehicle_id: el('fuel-vehicle').value || null }),
            }));
            await refreshFuel(); el('fuel-dialog').close();
        } catch (error) { el('fuel-status').textContent = 'Nem sikerült menteni. ' + error.message; }
        finally { fuelBusy = false; ['fuel-today', 'fuel-submit', 'fuel-close', 'fuel-date', 'fuel-vehicle'].forEach(id => { el(id).disabled = false; }); }
    }
    el('fuel-today').addEventListener('click', () => saveFuel(todayDate()));
    el('fuel-form').addEventListener('submit', event => { event.preventDefault(); return saveFuel(el('fuel-date').value); });
    el('fuel-close').addEventListener('click', () => { if (!fuelBusy) el('fuel-dialog').close(); });
    el('fuel-dialog').addEventListener('cancel', event => { if (fuelBusy) event.preventDefault(); });
    el('tour').addEventListener('change', refreshFuel);
    el('fuel-route').addEventListener('change', refreshFuel);
    el('fuel-tab').addEventListener('click', refreshFuel);
    window.addEventListener('focus', refreshFuel);
    window.addEventListener('online', refreshFuel);
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
