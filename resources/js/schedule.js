export const scheduleDays = window.dispatchData?.days || [];
export const schedulePeople = window.dispatchData?.people || [];
export const activeSchedulePeople = schedulePeople.filter(person => person.active);

export function scheduleWeek(date) {
    const day = new Date(date + 'T12:00:00Z');
    day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => {
        const next = new Date(day); next.setUTCDate(next.getUTCDate() + index);
        return next.toISOString().slice(0, 10);
    });
}

export function parseShift(cell) {
    if (!cell) return { status: 'unknown' };
    if (cell === 'PIHEN') return { status: 'rest' };
    if (cell.toLowerCase() === 'oktatás') return { status: 'work', task: 'Oktatás', plate: 'Nem ismert', note: '' };
    if (cell === 'SZADA') return { status: 'work', task: 'SZADA', plate: 'Nem ismert', note: '' };
    if (cell.toLocaleUpperCase('hu-HU').startsWith('MENTESÍTŐ')) {
        const plate = cell.match(/\b[A-Z]{3,4}\d{3}\b/);
        return { status: 'work', task: /\(Q[–-]O\)/.test(cell) ? 'Mentesítő (Q–O)' : 'Mentesítő', plate: plate ? plate[0] : 'Nem ismert', note: '' };
    }
    const [route, ...tokens] = cell.split(' ');
    const plate = tokens.find(token => /^[A-Z]{3,4}\d{3}$/.test(token));
    if (!(window.dispatchData?.tours || []).some(tour => tour.id === route)) {
        return { status: 'work', task: tokens.filter(token => token !== plate).length ? [route, ...tokens.filter(token => token !== plate)].join(' ') : route, plate: plate || 'Nem ismert', note: '' };
    }
    return { status: 'work', route, plate: plate || 'Nem ismert', note: tokens.filter(token => token !== plate).join(' ') };
}

export function initSchedule() {
    const el = id => document.getElementById(id);
    const storageKey = 'alzafutar-person-v1';
    const periodFormat = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Budapest' });
    const weeks = [...new Set(scheduleDays.map(date => scheduleWeek(date)[0]))];
    if (!weeks.length) weeks.push(scheduleWeek(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date()))[0]);
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
    let weekIndex = weeks.indexOf(scheduleWeek(today)[0]);
    if (weekIndex < 0) weekIndex = today < weeks[0] ? 0 : weeks.length - 1;
    let personId = null;
    try {
        const saved = localStorage.getItem(storageKey);
        if (activeSchedulePeople.some(person => person.id === saved)) personId = saved;
    } catch {}
    for (const person of activeSchedulePeople) el('person-select').add(new Option(person.name, person.id));

    let activeView = 'route';
    let personTarget = 'route';
    function showView(view) {
        activeView = view;
        for (const name of ['route', 'schedule', 'search', 'fuel', 'qr']) {
            el(name + '-view').hidden = name !== view;
            el(name + '-tab').setAttribute('aria-pressed', String(name === view));
        }
    }
    function showPerson() {
        el('current-person').textContent = schedulePeople.find(person => person.id === personId)?.name || 'Személy kiválasztása';
    }
    showPerson();
    function renderSchedule() {
        const person = schedulePeople.find(item => item.id === personId);
        if (!person) return;
        el('schedule-cards').replaceChildren();
        const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
        const days = scheduleWeek(weeks[weekIndex]);
        el('schedule-period').textContent = periodFormat.format(new Date(days[0] + 'T12:00:00Z')) + ' – ' + periodFormat.format(new Date(days[6] + 'T12:00:00Z'));
        el('schedule-prev').disabled = weekIndex === 0;
        el('schedule-next').disabled = weekIndex === weeks.length - 1;
        days.forEach(date => {
            const index = scheduleDays.indexOf(date);
            const shift = parseShift(person.cells[index]);
            const card = document.createElement('article');
            card.className = 'shift-card shift-' + shift.status;
            const heading = document.createElement('h3');
            const time = document.createElement('time');
            time.setAttribute('datetime', date);
            time.textContent = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long', timeZone: 'Europe/Budapest' }).format(new Date(date + 'T12:00:00Z'));
            heading.append(time);
            if (date === today) {
                const badge = document.createElement('span');
                badge.className = 'today-badge';
                badge.textContent = 'Ma';
                heading.append(badge);
            }
            card.append(heading);
            const status = document.createElement('p');
            status.className = 'shift-status';
            status.textContent = shift.status === 'rest' ? 'Pihenőnap' : shift.status === 'unknown' ? 'Nincs megadott beosztás' : 'Munkanap';
            card.append(status);
            if (shift.status === 'work') {
                const details = document.createElement('div');
                details.className = 'shift-details';
                for (const [label, value] of [[shift.task ? 'Feladat' : 'Útvonal', shift.task || shift.route], ['Rendszám', shift.plate]]) {
                    const field = document.createElement('div');
                    const caption = document.createElement('span');
                    caption.textContent = label;
                    const strong = document.createElement('strong');
                    strong.textContent = value;
                    field.append(caption, strong);
                    details.append(field);
                }
                card.append(details);
                if (shift.note) {
                    const note = document.createElement('p');
                    note.className = 'shift-note';
                    note.textContent = 'Megjegyzés: ' + shift.note;
                    card.append(note);
                }
            }
            el('schedule-cards').append(card);
        });
    }
    function choosePerson(target = activeView) {
        personTarget = target;
        el('person-select').value = personId || '';
        el('person-dialog').showModal();
    }
    el('route-tab').addEventListener('click', () => showView('route'));
    el('search-tab').addEventListener('click', () => showView('search'));
    el('fuel-tab').addEventListener('click', () => showView('fuel'));
    el('qr-tab').addEventListener('click', () => showView('qr'));
    el('schedule-tab').addEventListener('click', () => {
        if (!personId) choosePerson('schedule');
        else { renderSchedule(); showView('schedule'); }
    });
    el('schedule-prev').addEventListener('click', () => { if (weekIndex > 0) { weekIndex--; renderSchedule(); } });
    el('schedule-next').addEventListener('click', () => { if (weekIndex < weeks.length - 1) { weekIndex++; renderSchedule(); } });
    el('current-person').addEventListener('click', () => choosePerson());
    el('person-form').addEventListener('submit', event => {
        event.preventDefault();
        const selected = el('person-select').value;
        if (!activeSchedulePeople.some(person => person.id === selected)) return;
        personId = selected;
        try {
            localStorage.setItem(storageKey, personId);
            el('person-save-status').textContent = '';
        } catch {
            el('person-save-status').textContent = 'A személyválasztás nem menthető ebben a böngészőben. Újratöltés után válaszd ki újra.';
        }
        el('person-dialog').close();
        renderSchedule();
        showPerson();
        showView(personTarget);
        if (personTarget === 'schedule') el('schedule-title').focus();
    });
    el('person-cancel').addEventListener('click', () => el('person-dialog').close());
}
