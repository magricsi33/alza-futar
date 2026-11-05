async function responseJson(response) {
    if (!response.ok) {
        let message = 'A szerver nem érhető el. Ellenőrizd az internetkapcsolatot, és próbáld újra.';
        try {
            const body = await response.json();
            if (response.status === 409) message = body.message;
            else if (response.status === 422) message = 'Ellenőrizd a képeket: legfeljebb 12 kép, képenként 20 MB (JPG, PNG, WebP, GIF, HEIC vagy AVIF).';
            else if (response.status === 419) message = 'A munkamenet lejárt. Próbáld újra a mentést.';
            else if (response.status === 413) message = 'A feltöltés túl nagy a szerver beállításaihoz. Válassz kevesebb vagy kisebb képet.';
        } catch {}
        throw new Error(message);
    }
    return response.json();
}
export async function readAddressInfo(id) {
    return responseJson(await fetch('/address-info/' + encodeURIComponent(id), {
        credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
    }));
}
export async function writeAddressInfo(record) {
    // Friss token kell, mert a PWA HTML-je korábbi munkamenetből is származhat.
    const session = await responseJson(await fetch('/address-info/session', {
        credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' },
    }));
    const data = new FormData();
    data.append('note', record.note);
    data.append('revision', String(record.revision));
    for (const photo of record.photos) {
        if (photo.blob) data.append('photos[]', photo.blob, photo.name);
        else data.append('keep[]', photo.id);
    }
    return responseJson(await fetch('/address-info/' + encodeURIComponent(record.id), {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': session.token },
        body: data,
    }));
}
export function initStopInfo({ isExempt, toggleExempt }) {
    const el = id => document.getElementById(id);
    let record = null;
    let routeId = null;
    let busy = false;
    let generation = 0;


    function setBusy(value) {
        busy = value;
        ['info-save', 'info-files', 'info-camera', 'info-add', 'info-take-photo'].forEach(id => { el(id).disabled = value || !record; });
        el('info-close').disabled = value;
        el('info-note').disabled = value || !record;
        el('info-exempt').disabled = value;
    }
    function updateExempt() {
        el('info-exempt').textContent = isExempt(routeId, el('info-dialog').dataset.stop)
            ? 'Mentesítés visszavonása' : 'Megjelölés mentesítettként';
    }
    function gallery() {

        el('info-gallery').replaceChildren();

        record.photos.forEach((photo, index) => {
            const figure = document.createElement('figure');
            const url = photo.url;

            const link = document.createElement('a');
            link.href = url; link.target = '_blank'; link.rel = 'noopener';
            link.setAttribute('aria-label', 'Kép megnyitása: ' + photo.name);
            const img = document.createElement('img');
            img.src = url; img.alt = photo.name; img.loading = 'lazy';
            const caption = document.createElement('figcaption');
            caption.textContent = photo.name;
            img.addEventListener('error', () => { img.hidden = true; caption.textContent = photo.name + ' – előnézet nem elérhető, koppints a megnyitáshoz.'; });
            link.append(img, caption);
            const remove = document.createElement('button');
            remove.type = 'button'; remove.textContent = '×';
            remove.setAttribute('aria-label', 'Kép törlése: ' + photo.name);
            remove.addEventListener('click', async () => {
                if (busy) return;
                await persist(record.photos.filter((_, i) => i !== index));
            });
            figure.append(link, remove);
            el('info-gallery').append(figure);
        });
    }
    async function persist(photos) {
        if (!record || busy) return;
        setBusy(true);
        el('info-status').textContent = 'Mentés…';
        const next = { ...record, note: el('info-note').value, photos };
        try {
            const saved = await writeAddressInfo(next);
            record = saved;
            gallery();
            el('info-status').textContent = 'Mentve.';
        } catch (error) { el('info-status').textContent = 'Nem sikerült menteni. ' + error.message;
        } finally { setBusy(false); }
    }
    async function addPhotos(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!record || busy || !files.length) return;
        if (record.photos.length + files.length > 12) {
            el('info-status').textContent = 'Címenként legfeljebb 12 kép menthető.'; return;
        }
        if (files.some(file => !(/\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name) || /^image\//.test(file.type)) || file.type === 'image/svg+xml' || /\.svg$/i.test(file.name) || file.size > 20 * 1024 * 1024)) {
            el('info-status').textContent = 'Képfájlokat válassz, képenként legfeljebb 20 MB méretben (SVG nem támogatott).'; return;
        }
        await persist([...record.photos, ...files.map(file => ({ name: file.name, blob: file }))]);
    }
    el('info-add').addEventListener('click', () => el('info-files').click());
    el('info-take-photo').addEventListener('click', () => el('info-camera').click());
    el('info-files').addEventListener('change', addPhotos);
    el('info-camera').addEventListener('change', addPhotos);
    el('info-save').addEventListener('click', () => record && persist(record.photos));
    el('info-exempt').addEventListener('click', () => {
        if (busy) return;
        toggleExempt(routeId, el('info-dialog').dataset.stop);
        updateExempt();
    });
    function close() {
        if (busy) return;
        if (record && el('info-note').value !== record.note && !window.confirm('A megjegyzés nincs mentve. Bezárod mentés nélkül?')) return;
        el('info-dialog').close();
    }
    el('info-close').addEventListener('click', close);
    el('info-dialog').addEventListener('cancel', event => { event.preventDefault(); close(); });
    el('info-dialog').addEventListener('close', () => { generation++; record = null; });
    return {
        async open(route, stop) {
            const token = ++generation;
            routeId = route;
            record = null;
            const [id, address, city, location] = stop;
            el('info-dialog').dataset.stop = id;
            el('info-title').textContent = address;
            el('info-address').textContent = city;
            el('info-meta').textContent = id + ' · ' + location;
            el('info-note').value = '';
            el('info-gallery').replaceChildren();

            el('info-status').textContent = 'Adatok betöltése…';
            updateExempt();
            setBusy(false);
            el('info-dialog').showModal();
            try {
                const loaded = await readAddressInfo(id);
                if (token !== generation) return;
                record = loaded;
                el('info-note').value = record.note;
                gallery();
                el('info-status').textContent = '';
            } catch {
                if (token !== generation) return;
                el('info-status').textContent = 'A szerver nem érhető el. A megjegyzések és képek betöltéséhez internetkapcsolat szükséges.';
            }
            if (token === generation) setBusy(false);
        },
    };
}
