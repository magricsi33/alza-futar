export const scheduleDays = [
    '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01',
];
// Üres cella: nincs adat. Az extra jelöléseket a forrás szerint őrizzük meg.
export const schedulePeople = [
    ['takacs-istvan', 'Takács István', 'Q AOTI174|B AABZ272|A AAIJ346|PIHEN|PIHEN'],
    ['kollar-janos', 'Kollár János', 'D AOGG683|D AOGG683|D AOGG683|D AOGG683|D AOGG683'],
    ['balla-laszlo', 'Balla László', 'U AICD597|U AICD597|S AICD394|PIHEN|S AICD394'],
    ['vegh-krisztian', 'Végh Krisztián', '||U AICD597|U AICD597|U AICD597'],
    ['szikszai-bettina', 'Szikszai Bettina', 'E AADN204 + TÉ|E AADN204|E AADN204 + TÉ|E AADN204|E AADN204'],
    ['bartos-laszlo', 'Bartos László', '|||A AAIJ346|A AAIJ346'],
    ['joszkin-kevin', 'Joszkin Kevin', 'A AAIJ346|A AAIJ346|PIHEN|PIHEN|PIHEN'],
    ['szalai-zsolt', 'Szalai Zsolt', 'V AOBL104|O AOTI174|O AOTI174|O AOTI174|O AOTI174'],
    ['fekete-gergely', 'Fekete Gergely', 'S AICD394|PIHEN|Q AADV156|Q AADV156|PIHEN'],
    ['toth-boglarka', 'Tóth Boglárka', 'O AADV156|V AOFP411 + TÉ|PIHEN|V AOFP411 + TÉ|V AOFP411 + TÉ'],
    ['mag-richard', 'Mag Richárd', 'PIHEN|S AICD394|V AOFP411|S AICD394|PIHEN'],
    ['horvath-angela', 'Horváth Angéla', 'B AABZ272|PIHEN|B AABZ272|B AABZ272|B AABZ272'],
    ['utto-norbert', 'Uttó Norbert', 'PIHEN|Q AADV156|PIHEN|PIHEN|Q AADV156'],
    ['kiss-daniel', 'Kiss Dániel', 'F É|F É|F + É|F + É|F + É'],
    ['hanuszka-daniel', 'Hanuszka Dániel', 'C|C|C|C|C'],
    ['pokorny-patrik', 'Pokorny Patrik', 'T|T|T|T|T'],
    ['csolle-daniel', 'Csölle Dániel', 'F|F|PIHEN|PIHEN|PIHEN'],
    ['miklos-daniel', 'Miklós Dániel', '||||'],
].map(([id, name, cells]) => ({ id, name, cells: cells.split('|') }));


export function parseShift(cell) {
    if (!cell) return { status: 'unknown' };
    if (cell === 'PIHEN') return { status: 'rest' };
    const [route, ...tokens] = cell.split(' ');
    const plate = tokens.find(token => /^[A-Z]{4}\d{3}$/.test(token));
    return { status: 'work', route, plate: plate || 'Nem ismert', note: tokens.filter(token => token !== plate).join(' ') };
}

export function initSchedule() {
    const el = id => document.getElementById(id);
    const storageKey = 'alzafutar-person-v1';
    const periodFormat = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Budapest' });
    el('schedule-period').textContent = periodFormat.format(new Date(scheduleDays[0] + 'T12:00:00Z')) + ' – ' + periodFormat.format(new Date(scheduleDays[scheduleDays.length - 1] + 'T12:00:00Z'));
    let personId = null;
    try {
        const saved = localStorage.getItem(storageKey);
        if (schedulePeople.some(person => person.id === saved)) personId = saved;
    } catch {}
    for (const person of schedulePeople) el('person-select').add(new Option(person.name, person.id));

    function showView(schedule) {
        el('route-view').hidden = schedule;
        el('schedule-view').hidden = !schedule;
        el('route-tab').setAttribute('aria-pressed', String(!schedule));
        el('schedule-tab').setAttribute('aria-pressed', String(schedule));
    }
    function renderSchedule() {
        const person = schedulePeople.find(item => item.id === personId);
        if (!person) return;
        el('schedule-person').textContent = person.name;
        el('schedule-cards').replaceChildren();
        const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
        scheduleDays.forEach((date, index) => {
            const shift = parseShift(person.cells[index]);
            const card = document.createElement('article');
            card.className = 'shift-card shift-' + shift.status;
            const heading = document.createElement('h3');
            const time = document.createElement('time');
            time.setAttribute('datetime', date);
            time.textContent = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Europe/Budapest' }).format(new Date(date + 'T12:00:00Z'));
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
                for (const [label, value] of [['Útvonal', shift.route], ['Rendszám', shift.plate]]) {
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
    function choosePerson() {
        el('person-select').value = personId || '';
        el('person-dialog').showModal();
    }
    el('route-tab').addEventListener('click', () => showView(false));
    el('schedule-tab').addEventListener('click', () => {
        if (!personId) choosePerson();
        else { renderSchedule(); showView(true); }
    });
    el('change-person').addEventListener('click', choosePerson);
    el('person-form').addEventListener('submit', event => {
        event.preventDefault();
        const selected = el('person-select').value;
        if (!schedulePeople.some(person => person.id === selected)) return;
        personId = selected;
        try {
            localStorage.setItem(storageKey, personId);
            el('person-save-status').textContent = '';
        } catch {
            el('person-save-status').textContent = 'A személyválasztás nem menthető ebben a böngészőben. Újratöltés után válaszd ki újra.';
        }
        el('person-dialog').close();
        renderSchedule();
        showView(true);
        el('schedule-person').focus();
    });
    el('person-cancel').addEventListener('click', () => el('person-dialog').close());
}
