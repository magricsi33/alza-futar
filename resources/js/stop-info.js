// A képek Blobként, a megjegyzések ugyanazon címrekordban maradnak az eszközön.
let dbPromise;
function openDatabase() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open('alzafutar-address-info', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('addresses', { keyPath: 'id' });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('Az adattár megnyitását egy másik ablak blokkolja.'));
        }).catch(error => { dbPromise = null; throw error; });
    }
    return dbPromise;
}
export async function readAddressInfo(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('addresses', 'readonly');
        const request = transaction.objectStore('addresses').get(id);
        transaction.oncomplete = () => resolve(request.result || { id, note: '', photos: [] });
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}
export async function writeAddressInfo(record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('addresses', 'readwrite');
        transaction.objectStore('addresses').put(record);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}
export function initStopInfo({ isExempt, toggleExempt }) {
    const el = id => document.getElementById(id);
    let record = null;
    let routeId = null;
    let busy = false;
    let generation = 0;
    let urls = [];
    function releaseImages() { urls.forEach(url => URL.revokeObjectURL(url)); urls = []; }
    function setBusy(value) {
        busy = value;
        ['info-save', 'info-files', 'info-camera'].forEach(id => { el(id).disabled = value || !record; });
        el('info-close').disabled = value;
        el('info-note').disabled = value || !record;
        el('info-exempt').disabled = value;
    }
    function updateExempt() {
        el('info-exempt').textContent = isExempt(routeId, el('info-dialog').dataset.stop)
            ? 'Mentesítés visszavonása' : 'Megjelölés mentesítettként';
    }
    function gallery() {
        releaseImages();
        el('info-gallery').replaceChildren();
        el('info-no-photos').hidden = record.photos.length > 0;
        record.photos.forEach((photo, index) => {
            const figure = document.createElement('figure');
            const url = URL.createObjectURL(photo.blob);
            urls.push(url);
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
            remove.type = 'button'; remove.textContent = 'Kép törlése';
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
        const next = { ...record, note: el('info-note').value, photos };
        try {
            await writeAddressInfo(next);
            record = next;
            gallery();
            el('info-status').textContent = 'Mentve ezen az eszközön.';
        } catch {
            el('info-status').textContent = 'Nem sikerült menteni. Lehet, hogy megtelt vagy nem elérhető a böngésző tárhelye. A megjegyzést másold ki, és próbáld újra.';
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
    el('info-dialog').addEventListener('close', () => { generation++; releaseImages(); record = null; });
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
            el('info-no-photos').hidden = true;
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
                el('info-status').textContent = 'A helyi adattár nem elérhető. A megjegyzések és képek most nem tölthetők be.';
            }
            if (token === generation) setBusy(false);
        },
    };
}
