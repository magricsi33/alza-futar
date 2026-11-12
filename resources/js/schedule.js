export const scheduleDays = ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
// Üres cella: nincs adat. A táblából hiányzó korábbi személyek választását megőrizzük.
export const schedulePeople = [
    ["takacs-istvan","Takács István","MENTESÍTŐ (Q-O) AOJT457|V AOBL104|Q AADV156|V AOBL104|PIHEN"],
    ["kollar-janos","Kollár János","PIHEN|MENTESÍTŐ (Q-O)|PIHEN|D AADN204|O AOGG683"],
    ["balla-laszlo","Balla László","A AAIJ346|A AAIJ346|A AAIJ346|PIHEN|PIHEN"],
    ["vegh-krisztian","Végh Krisztián","U AICD597|U AICD597|U AICD597|U AICD597|U AICD597"],
    ["szikszai-bettina","Szikszai Bettina","D AADN204|D AADN204|D AADN204|PIHEN|D AADN204"],
    ["bartos-laszlo","Bartos László","|||A AAIJ346|A AAIJ346"],
    ["joszkin-kevin","Joszkin Kevin","PIHEN|Q AADV156|PIHEN|E AOJT458|oktatás"],
    ["szalai-zsolt","Szalai Zsolt","S AELW962|S AELW962|V AOBL104|O AOGG683|V AOBL104"],
    ["fekete-gergely","Fekete Gergely","B AICD394|B AICD394|B AICD394|B AICD394|B AICD394"],
    ["toth-boglarka","Tóth Boglárka","V AOBL104|PIHEN|PIHEN|PIHEN|PIHEN"],
    ["mag-richard","Mag Richárd","PIHEN|PIHEN|S AELW962|S AELW962|S AELW962"],
    ["horvath-angela","Horváth Angéla","E AOJT458|E AOJT458|E AOJT458|PIHEN|E AOJT458"],
    ["utto-norbert","Uttó Norbert","Q AADV156|PIHEN|PIHEN|Q AADV156|Q AADV156"],
    ["kemecsei-balazs","Kemecsei Balázs","O AOGG683|O AOGG683|O AOGG683|PIHEN|PIHEN"],
    ["kiss-daniel","Kiss Dániel","F É|F + É|F + É|F + É|F + É"],
    ["hanuszka-daniel","Hanuszka Dániel","C + TÉ|C|C + TÉ|C + TÉ|C + TÉ"],
    ["pokorny-patrik","Pokorny Patrik","F|T + É|T|T|T"],
    ["csolle-daniel","Csölle Dániel","||||"],
    ["miklos-daniel","Miklós Dániel","||||"],
].map(([id, name, cells]) => ({ id, name, cells: cells.split('|') }));

export function parseShift(cell) {
    if (!cell) return { status: 'unknown' };
    if (cell === 'PIHEN') return { status: 'rest' };
    if (cell.toLowerCase() === 'oktatás') return { status: 'work', task: 'Oktatás', plate: 'Nem ismert', note: '' };
    if (cell.startsWith('MENTESÍTŐ')) {
        const plate = cell.match(/\b[A-Z]{4}\d{3}\b/);
        return { status: 'work', task: 'Mentesítő (Q–O)', plate: plate ? plate[0] : 'Nem ismert', note: '' };
    }
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
