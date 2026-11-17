(() => {
    if (!window.adminCalendar) return;
    const el = id => document.getElementById(id);
    let data = window.adminCalendar;
    let current = null, busy = false, loadVersion = 0, availabilityVersion = 0;
    const dateLabel = date => date.split('-').join('. ') + '.';
    const dayName = date => new Intl.DateTimeFormat('hu-HU', { weekday: 'short', timeZone: 'Europe/Budapest' }).format(new Date(date + 'T12:00:00Z'));
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('hu-HU');
    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function render() {
        el('calendar-period').textContent = dateLabel(data.days[0]) + ' – ' + dateLabel(data.days[6]);
        const table = el('schedule-calendar'), head = table.tHead, body = table.tBodies[0];
        head.replaceChildren(); body.replaceChildren();
        const headings = document.createElement('tr');
        const peopleHeading = element('th', 'Munkatárs'); peopleHeading.scope = 'col'; headings.append(peopleHeading);
        const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Budapest' }).format(new Date());
        for (const date of data.days) {
            const th = element('th'); th.scope = 'col';
            if (date === today) th.className = 'calendar-today';
            th.append(element('span', dayName(date)), element('strong', dateLabel(date)));
            headings.append(th);
        }
        head.append(headings);
        const query = normalize(el('calendar-search').value.trim());
        const employeeFilter = el('calendar-employee-filter').value;
        const byCell = new Map(data.shifts.map(shift => [shift.employee_id + ':' + shift.date, shift]));
        let total = 0;
        for (const person of data.employees) {
            if (employeeFilter && String(person.id) !== employeeFilter) continue;
            const shifts = data.shifts.filter(shift => shift.employee_id === person.id);
            const searchable = [person.name, ...shifts.flatMap(shift => [shift.route?.name || '', shift.route?.code || '', shift.vehicle?.plate || '', shift.task || '', shift.note || ''])].join(' ');
            if (query && !normalize(searchable).includes(query)) continue;
            const row = document.createElement('tr');
            const name = element('th'); name.scope = 'row'; name.append(element('span', person.name));
            if (!person.active) name.append(element('small', 'Inaktív'));
            row.append(name);
            for (const date of data.days) {
                const shift = byCell.get(person.id + ':' + date);
                const cell = document.createElement('td');
                const button = element('button', undefined, 'calendar-cell' + (shift ? shift.status === 'rest' ? ' cell-rest' : ' cell-work' : ' cell-empty'));
                button.type = 'button'; button.dataset.employeeId = person.id; button.dataset.date = date;
                const label = shift ? shift.status === 'rest' ? 'Pihenőnap' : shift.route?.code || shift.task || 'Munkanap' : '+';
                button.append(element('strong', label));
                if (shift?.status === 'work') {
                    button.append(element('span', shift.vehicle?.plate || 'Nem ismert'));
                    if (shift.note) button.append(element('small', shift.note));
                }
                button.setAttribute('aria-label', person.name + ', ' + dateLabel(date) + ', ' + (shift ? label + ', szerkesztés' : 'új beosztás'));
                button.addEventListener('click', () => openCell(person, date, shift));
                cell.append(button); row.append(cell);
            }
            body.append(row); total++;
        }
        if (!total) {
            const row = document.createElement('tr'), cell = element('td', 'Nincs a szűrésnek megfelelő munkatárs.');
            cell.colSpan = 8; row.append(cell); body.append(row);
        }
    }
    function setBusy(value) {
        busy = value; el('shift-dialog').dataset.busy = String(value);
        el('shift-dialog').querySelectorAll('button, input, select, textarea').forEach(control => { control.disabled = value; });
        if (!value) toggleWork();
    }
    function toggleWork() {
        const rest = el('shift-status').value === 'rest';
        el('shift-dialog').querySelectorAll('[data-work-field]').forEach(field => {
            field.hidden = rest; field.querySelectorAll('input, select').forEach(control => { control.disabled = rest || busy; });
        });
    }
    function options(select, values, key, selected, original) {
        select.replaceChildren(new Option('Nincs megadva', ''));
        for (const item of values) select.add(new Option(item[key], item.id));
        if (selected && !values.some(item => String(item.id) === String(selected))) {
            const option = new Option((original || 'Korábbi érték') + ' – már foglalt', selected);
            option.disabled = true; select.add(option);
        }
        select.value = selected ? String(selected) : '';
    }
    async function availability() {
        const token = ++availabilityVersion;
        const query = new URLSearchParams({date: current.date, employee_id: current.person.id});
        const available = await window.adminRequest('/admin/calendar/availability?' + query);
        if (token !== availabilityVersion || !el('shift-dialog').open) return;
        current.shift = available.shift;
        const shift = current.shift;
        el('shift-dialog-title').textContent = shift ? 'Beosztás szerkesztése' : 'Új beosztás';
        el('shift-status').value = shift?.status || 'work';
        el('shift-task').value = shift?.task || ''; el('shift-note').value = shift?.note || '';
        el('shift-delete').hidden = !shift;
        options(el('shift-route'), available.routes, 'name', current.shift?.delivery_route_id, current.shift?.route?.name);
        options(el('shift-vehicle'), available.vehicles, 'plate', current.shift?.vehicle_id, current.shift?.vehicle?.plate);
    }
    async function openCell(person, date, shift) {
        current = {person, date, shift}; el('shift-dialog-form').reset();
        el('shift-dialog-title').textContent = shift ? 'Beosztás szerkesztése' : 'Új beosztás';
        el('shift-person-date').textContent = person.name + ' · ' + dateLabel(date);
        el('shift-status').value = shift?.status || 'work';
        el('shift-task').value = shift?.task || ''; el('shift-note').value = shift?.note || '';
        el('shift-delete').hidden = !shift;
        el('shift-dialog-status').textContent = 'Szabad útvonalak és gépjárművek betöltése…';
        el('shift-route').replaceChildren(); el('shift-vehicle').replaceChildren();
        el('shift-dialog').showModal(); setBusy(true);
        try { await availability(); el('shift-dialog-status').textContent = ''; setBusy(false); }
        catch (error) {
            el('shift-dialog-status').textContent = error.message;
            // Bezárható marad, de betöltetlen választókkal nem menthető.
            el('shift-dialog').dataset.busy = 'false'; busy = false;
            el('shift-dialog').querySelector('[data-close-dialog]').disabled = false;
        }
    }
    async function loadWeek(week) {
        const token = ++loadVersion;
        el('calendar-status').textContent = 'Hét betöltése…';
        ['calendar-prev', 'calendar-next', 'calendar-today'].forEach(id => { el(id).disabled = true; });
        try {
            const next = await window.adminRequest('/admin/calendar/data?week=' + encodeURIComponent(week));
            if (token !== loadVersion) return;
            data = next;
            const chosen = el('calendar-employee-filter').value;
            const select = el('calendar-employee-filter'); select.replaceChildren(new Option('Összes munkatárs', ''));
            for (const person of data.employees) select.add(new Option(person.name, person.id));
            select.value = Array.from(select.options).some(option => option.value === chosen) ? chosen : '';
            const url = new URL(window.location.href); url.searchParams.set('week', data.days[0]); window.history.replaceState(null, '', url);
            render(); el('calendar-status').textContent = '';
        } catch (error) { if (token === loadVersion) el('calendar-status').textContent = error.message; }
        finally { if (token === loadVersion) ['calendar-prev', 'calendar-next', 'calendar-today'].forEach(id => { el(id).disabled = false; }); }
    }
    function moveWeek(offset) {
        const date = new Date(data.days[0] + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + offset);
        loadWeek(date.toISOString().slice(0, 10));
    }
    el('calendar-prev').addEventListener('click', () => moveWeek(-7));
    el('calendar-next').addEventListener('click', () => moveWeek(7));
    el('calendar-today').addEventListener('click', () => loadWeek(new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Budapest'}).format(new Date())));
    el('calendar-search').addEventListener('input', render);
    el('calendar-employee-filter').addEventListener('change', render);
    el('shift-status').addEventListener('change', toggleWork);
    el('shift-dialog').addEventListener('close', () => { availabilityVersion++; });
    el('shift-dialog-form').addEventListener('submit', async event => {
        event.preventDefault(); if (busy || !current) return;
        const payload = {
            employee_id: current.person.id, date: current.date, revision: current.shift?.revision,
            status: el('shift-status').value, delivery_route_id: el('shift-route').value || null,
            vehicle_id: el('shift-vehicle').value || null, task: el('shift-task').value, note: el('shift-note').value,
        };
        setBusy(true); el('shift-dialog-status').textContent = 'Mentés…';
        try {
            const shift = await window.adminRequest('/admin/shifts' + (current.shift ? '/' + current.shift.id : ''), {method: current.shift ? 'PUT' : 'POST', body: JSON.stringify(payload)});
            data.shifts = data.shifts.filter(item => item.id !== shift.id); data.shifts.push(shift);
            render(); el('shift-dialog').close(); el('calendar-status').textContent = 'Beosztás mentve.';
        } catch (error) { el('shift-dialog-status').textContent = error.message; }
        finally { setBusy(false); }
    });
    el('shift-delete').addEventListener('click', async () => {
        if (busy || !current?.shift || !window.confirm('Törlöd ezt a napi beosztást?')) return;
        const shift = current.shift; setBusy(true); el('shift-dialog-status').textContent = 'Törlés…';
        try {
            await window.adminRequest('/admin/shifts/' + shift.id, {method:'DELETE', body:JSON.stringify({revision:shift.revision})});
            data.shifts = data.shifts.filter(item => item.id !== shift.id); render(); el('shift-dialog').close(); el('calendar-status').textContent = 'Beosztás törölve.';
        } catch (error) { el('shift-dialog-status').textContent = error.message; }
        finally { setBusy(false); }
    });
    render();
    const editId = new URL(window.location.href).searchParams.get('edit_shift');
    if (editId) {
        const shift = data.shifts.find(shift => String(shift.id) === editId);
        const person = shift && data.employees.find(person => person.id === shift.employee_id);
        if (person) openCell(person, shift.date, shift);
    }
    const createFor = new URL(window.location.href).searchParams.get('create_employee');
    if (createFor) {
        const person = data.employees.find(person => String(person.id) === createFor);
        if (person) {
            const date = data.days.find(date => !data.shifts.some(shift => shift.employee_id === person.id && shift.date === date));
            if (date) openCell(person, date, null);
        }
    }
})();
