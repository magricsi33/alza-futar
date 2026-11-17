import { activeSchedulePeople } from './schedule';

export function initNotifications() {
    const el = id => document.getElementById(id);
    let person = null, items = [], unread = 0, latest = 0, next = null, loadedThrough = 1, version = 0, busy = false;
    function selectedPerson() {
        try {
            const slug = localStorage.getItem('alzafutar-person-v1');
            return activeSchedulePeople.some(employee => employee.id === slug) ? slug : null;
        } catch { return null; }
    }
    function render() {
        const badge = el('notification-count'); badge.hidden = unread === 0; badge.textContent = unread > 99 ? '99+' : String(unread);
        el('notifications-tab').className = unread ? 'has-unread' : '';
        el('notifications-tab').setAttribute('aria-label', unread ? 'Értesítések, ' + unread + ' olvasatlan' : 'Értesítések');
        el('notifications-person-hint').hidden = !!person;
        el('notifications-read-all').disabled = busy || !person || unread === 0;
        el('notifications-more').hidden = next === null; el('notifications-more').disabled = busy;
        el('notifications-list').replaceChildren();
        for (const item of items) {
            const card = document.createElement('article'); card.className = 'notification-card' + (item.read_at ? '' : ' notification-unread');
            const type = document.createElement('span'); type.className = 'notification-type'; type.textContent = item.kind === 'schedule' ? 'Beosztás' : 'Üzenet';
            const title = document.createElement('h2'); title.textContent = item.title;
            const time = document.createElement('time'); time.dateTime = item.created_at;
            time.textContent = new Intl.DateTimeFormat('hu-HU', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', timeZone:'Europe/Budapest'}).format(new Date(item.created_at));
            const body = document.createElement('p'); body.className = 'notification-body'; body.textContent = item.body;
            card.append(type, title, time, body);
            if (item.kind === 'schedule' && item.week_start) {
                const link = document.createElement('a'); link.className = 'ramp-button'; link.href = '/?view=schedule&week=' + encodeURIComponent(item.week_start); link.textContent = 'Beosztás megnyitása'; card.append(link);
            }
            if (!item.read_at && person) {
                const read = document.createElement('button'); read.type = 'button'; read.className = 'ramp-button'; read.textContent = 'Olvasottnak jelölés'; read.disabled = busy;
                read.addEventListener('click', () => markRead(item.id)); card.append(read);
            }
            el('notifications-list').append(card);
        }
    }
    async function refresh(page = 1) {
        const token = ++version;
        const selected = selectedPerson();
        if (person !== selected) { person = selected; items = []; next = null; loadedThrough = 1; unread = 0; render(); }
        const query = new URLSearchParams({ page: String(page) }); if (person) query.set('employee', person);
        try {
            const response = await fetch('/dispatch/notifications?' + query, {credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'}});
            if (!response.ok) throw Error('Az értesítések most nem tölthetők be. Próbáld újra internetkapcsolattal.');
            const data = await response.json(); if (token !== version) return;
            const byId = new Map(items.map(item => [item.id, item])); data.items.forEach(item => byId.set(item.id, item));
            items = Array.from(byId.values()).sort((a, b) => b.id - a.id);
            unread = data.unread_count;
            if (page === 1) latest = data.latest_id;
            if (page > 1 || loadedThrough === 1) next = data.next_page;
            loadedThrough = Math.max(loadedThrough, page);
            el('notifications-status').textContent = items.length ? '' : 'Még nincs értesítés.'; render();
        } catch (error) { if (token === version) el('notifications-status').textContent = error.message; }
    }
    async function markRead(id = null) {
        if (busy || !person) return;
        const reader = person; busy = true; render(); el('notifications-status').textContent = 'Mentés…';
        try {
            const sessionResponse = await fetch('/address-info/session', {credentials:'same-origin', cache:'no-store', headers:{Accept:'application/json'}});
            if (!sessionResponse.ok) throw Error();
            const session = await sessionResponse.json();
            const response = await fetch('/dispatch/notifications/read', {
                method:'POST', credentials:'same-origin', headers:{Accept:'application/json', 'Content-Type':'application/json', 'X-CSRF-TOKEN':session.token},
                body:JSON.stringify({employee:reader, ...(id ? {id} : {through_id:latest})}),
            });
            if (!response.ok) throw Error();
            if (person === reader) {
                items = items.map(item => (!id || item.id === id) ? {...item, read_at:new Date().toISOString()} : item);
                unread = id ? Math.max(0, unread - 1) : 0;
            }
            await refresh();
        } catch { el('notifications-status').textContent = 'Az olvasottság nem menthető. Ellenőrizd az internetkapcsolatot.'; }
        finally { busy = false; render(); }
    }
    el('notifications-tab').addEventListener('click', () => refresh());
    el('notifications-read-all').addEventListener('click', () => markRead());
    el('notifications-more').addEventListener('click', () => next && refresh(next));
    window.addEventListener('focus', () => refresh()); window.addEventListener('online', () => refresh());
    if (typeof setInterval === 'function') setInterval(() => { if (document.visibilityState === 'visible' && !busy) refresh(); }, 60000);
    render(); refresh();
    return {refresh: () => refresh()};
}
