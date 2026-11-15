const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
    constructor() { this.children = []; this.events = {}; this.dataset = {}; this.value = ''; }
    append(...items) { this.children.push(...items); }
    add(item) { this.append(item); }
    replaceChildren() { this.children = []; }
    setAttribute() {}
    addEventListener(name, fn) {
        const previous = this.events[name];
        this.events[name] = previous ? (...args) => { previous(...args); return fn(...args); } : fn;
    }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    querySelector() { return this.children[0]?.children[0]?.children[0]; }
}
function boot(saved, blocked = false, person = null) {
    const elements = {};
    const store = { value: saved, person, extra: {} };
    const document = {
        getElementById: id => elements[id] ||= new Element(),
        createElement: () => new Element(),
        querySelector: selector => selector === '.install-panel' ? new Element() : null,
    };
    const context = {
        document,
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : ["2026-11-18T12:00:00Z"])); } },
        Option: function(text, value) { this.text = text; this.value = value; },
        localStorage: {
            getItem: key => key === 'alzafutar-person-v1' ? store.person : key === 'uton-state-v1' ? store.value : store.extra[key] || null,
            setItem: (key, value) => {
                if (blocked) throw Error('blocked');
                if (key === 'alzafutar-person-v1') store.person = value;
                else if (key === 'uton-state-v1') store.value = value;
                else store.extra[key] = value;
            },
        },
        window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
        navigator: { onLine: true },
        URL,
    };
    vm.createContext(context);
    const data = fs.readFileSync('resources/js/tours.js', 'utf8').replace('export const', 'const');
    const app = fs.readFileSync('resources/js/app.js', 'utf8').replace(/^import .*;\r?\n/gm, '');
    const schedule = fs.readFileSync('resources/js/schedule.js', 'utf8').replace(/export /g, '');
    const info = fs.readFileSync('resources/js/stop-info.js', 'utf8').replace(/export /g, '');
    const mobile = fs.readFileSync('resources/js/mobile.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
    vm.runInContext(data + '\n' + schedule + '\n' + info + '\n' + mobile + '\n' + app, context);
    return { elements, store, context };
}
test('completion, filter, reload, tour isolation and reset', () => {
    let {elements: e, store} = boot(null);
    assert.equal(e.stops.children.length, 14);
    const first = e.stops.children[0].children[0].children[0];
    first.checked = true; first.events.change();
    e['remaining-only'].events.change({target:{checked:true}});
    assert.equal(e.stops.children.length, 13);
    assert.equal(e.stops.children[0].children[1].textContent, '02');
    e.tour.events.change({target:{value:'V'}});
    assert.equal(e.stops.children.length, 11);
    const vFirst = e.stops.children[0].children[0].children[0];
    vFirst.checked = true; vFirst.events.change();
    assert.equal(e.stops.children.length, 10);
    const restored = boot(store.value); e = restored.elements;
    assert.equal(e.tour.value, 'V');
    e.tour.events.change({target:{value:'S'}});
    assert.equal(e.stops.children.length, 13);
    e.reset.events.click();
    e['reset-dialog'].returnValue = 'cancel'; e['reset-dialog'].events.close();
    e.reset.events.click();
    e['reset-dialog'].returnValue = 'confirm'; e['reset-dialog'].events.close();
    assert.equal(e.stops.children.length, 14);
    e.tour.events.change({target:{value:'V'}});
    assert.equal(e.stops.children.length, 10);
});
test('malformed, stale and blocked storage recover safely', () => {
    assert.equal(boot('{').elements.stops.children.length, 14);
    const saved = JSON.stringify({tour:'missing',completed:{S:['AB9087','AB9087','invalid']}});
    assert.match(boot(null, true).elements['save-note'].textContent, /nem engedi/);
});
test('fuel summary follows restored and changed tours without leaking previous values', () => {
    const {elements: e} = boot(JSON.stringify({tour:'V'}));
    assert.equal(e['fuel-km'].textContent, '44 km');
    assert.equal(e['fuel-liters'].textContent, '5 liter');
    assert.equal(e['fuel-amount'].textContent.replace(/\s/g, ''), '3266Ft');
    assert.equal(e['fuel-frequency'].textContent, 'Tankolás 5 naponta');

    e.tour.events.change({target:{value:'C'}});
    assert.equal(e['fuel-values'].hidden, true);
    assert.equal(e['fuel-empty'].hidden, false);
    assert.equal(e['fuel-amount'].textContent, '');
    assert.equal(e['fuel-frequency'].textContent, 'Tankolás minden nap');

    e.tour.events.change({target:{value:'E'}});
    assert.equal(e['fuel-values'].hidden, false);
    assert.equal(e['fuel-empty'].hidden, true);
    assert.equal(e['fuel-km'].textContent, '137 km');
    assert.equal(e['fuel-liters'].textContent, '15 liter');
    assert.equal(e['fuel-amount'].textContent.replace(/\s/g, ''), '10170Ft');
    assert.equal(e['fuel-frequency'].textContent, 'Tankolás 2 naponta');
});
test('ramp section follows the active tour and distinguishes warehouse loading', () => {
    const {elements: e} = boot(JSON.stringify({tour:'S'}));
    assert.equal(e['ramp-tour'].textContent, 'Budapest S');
    assert.equal(e['ramp-location'].textContent, '77. rámpa');
    assert.equal(e['ramp-departure'].textContent, '06:00');

    for (const [tour, location, departure] of [
        ['T', '77. rámpa', '05:30'],
        ['V', '76. rámpa', '05:30'],
        ['U', '76. rámpa', '06:00'],
        ['O', 'Raktárban pakol', '05:30'],
        ['Q', 'Raktárban pakol', '05:30'],
    ]) {
        e.tour.events.change({target:{value:tour}});
            assert.equal(e['ramp-tour'].textContent, 'Budapest ' + tour);
        assert.equal(e['ramp-location'].textContent, location);
        assert.equal(e['ramp-departure'].textContent, departure);
    }
});
test('all addresses have correctly encoded Waze navigation links', () => {
    const {elements} = boot(null);
    const expected = {A:15, B:17, C:16, D:14, E:11, F:22, O:22, Q:16, S:14, T:16, U:15, V:11};
    assert.equal(elements.tour.children.length, 13);
    const allIds = new Set();
    let total = 0;
    for (const [tour, count] of Object.entries(expected)) {
        elements.tour.events.change({target:{value:tour}});
        assert.equal(elements.stops.children.length, count, tour);
        for (const stop of elements.stops.children) {
            assert.ok(!allIds.has(stop.dataset.stop), 'Duplicate stop: ' + stop.dataset.stop);
            allIds.add(stop.dataset.stop);
            total++;
            const url = new URL(stop.children[2].href);
            assert.equal(url.hostname, 'waze.com');
            assert.equal(url.searchParams.get('navigate'), 'yes');
            assert.match(url.searchParams.get('q'), /Magyarország$/);
        }
    }
    assert.equal(total, 189);
    elements.tour.events.change({target:{value:'S'}});
    assert.match(new URL(elements.stops.children[9].children[2].href).searchParams.get('q'), /Gödöllői út 244, 2146 Mogyoród/);
});

test('person selection persists, reopens directly and can be changed without resetting route', () => {
    const first = boot(JSON.stringify({tour:'S', completed:{S:['AB9087']}}));
    const e = first.elements;
    e['schedule-tab'].events.click();
    assert.equal(e['person-dialog'].open, true);
    e['person-select'].value = 'mag-richard';
    e['person-form'].events.submit({preventDefault() {}});
    assert.equal(first.store.person, 'mag-richard');
    assert.equal(e['person-dialog'].open, false);
    assert.equal(e['schedule-view'].hidden, false);
    assert.equal(e['route-view'].hidden, true);
    assert.equal(e['current-person'].textContent, 'Mag Richárd');
    assert.equal(e['schedule-cards'].children.length, 7);
    assert.equal(e['schedule-cards'].children[1].children[1].textContent, 'Pihenőnap');
    assert.equal(e['schedule-cards'].children[4].children[2].children[1].children[1].textContent, 'AELW962');

    const second = boot(first.store.value, false, first.store.person);
    second.elements['schedule-tab'].events.click();
    assert.equal(second.elements['person-dialog'], undefined);
    assert.equal(second.elements['current-person'].textContent, 'Mag Richárd');
    second.elements['current-person'].events.click();
    assert.equal(second.elements['person-dialog'].open, true);
    second.elements['person-select'].value = 'kiss-daniel';
    second.elements['person-form'].events.submit({preventDefault() {}});
    assert.equal(second.store.person, 'kiss-daniel');
    assert.equal(second.elements['schedule-cards'].children[0].children[2].children[1].children[1].textContent, 'Nem ismert');
    second.elements['route-tab'].events.click();
    assert.equal(second.elements['route-view'].hidden, false);
});

test('empty schedule differs from rest and unknown saved person prompts again', () => {
    const {elements:e} = boot(null, false, 'deleted-person');
    e['schedule-tab'].events.click();
    assert.equal(e['person-dialog'].open, true);
    e['person-select'].value = 'csolle-daniel';
    e['person-form'].events.submit({preventDefault() {}});
    assert.equal(e['schedule-cards'].children.length, 7);
    for (const card of e['schedule-cards'].children) {
        assert.equal(card.children[1].textContent, 'Nincs megadott beosztás');
        assert.equal(card.children.length, 2);
    }
});

test('all schedule rows cover exactly the published dates', () => {
    const context = {};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('resources/js/schedule.js','utf8').replace(/export /g,'') + '\nthis.people = schedulePeople; this.days = scheduleDays; this.parse = parseShift;', context);
    assert.equal(context.people.length, 19);
    assert.equal(context.days.length, 12);
    assert.equal(context.days[0], '2026-11-11');
    assert.equal(context.days[11], '2026-11-22');
    assert.equal(context.people.find(p => p.id === 'mag-richard').cells[9], 'S AELW962');
    assert.equal(context.people.find(p => p.id === 'takacs-istvan').cells[7], 'Q AADV156');
    assert.equal(context.people.find(p => p.id === 'toth-boglarka').cells[5], '');
    assert.equal(new Set(context.people.map(p => p.id)).size, 19);
    for (const person of context.people) assert.equal(person.cells.length, context.days.length, person.name);
    assert.equal(context.parse('MENTESÍTŐ (Q-O) AOJT457').plate, 'AOJT457');
    assert.equal(context.parse('MENTESÍTŐ (Q-O)').task, 'Mentesítő (Q–O)');
    assert.equal(context.parse('oktatás').task, 'Oktatás');
    const night = context.parse('T csak éjszaka');
    assert.equal(night.route, 'T');
    assert.equal(night.plate, 'Nem ismert');
    assert.equal(night.note, 'csak éjszaka');
    const extra = context.parse(context.people.find(p => p.id === 'szalai-zsolt').cells[7]);
    assert.equal(extra.route, 'B');
    assert.equal(extra.plate, 'AICD394');
    assert.equal(extra.note, '+ T ÉJSZAKA AOBL104');
});

test('updated fuel table includes O and Q while C F T remain unavailable', () => {
    const {elements:e} = boot(null);
    for (const [route, km, liters, amount] of [
        ['A', 289, 31, 21454], ['B', 237, 26, 17594], ['D', 257, 28, 19078],
        ['E', 137, 15, 10170], ['S', 106, 12, 7869], ['U', 69, 8, 5122],
        ['V', 44, 5, 3266], ['O', 316, 35, 23458], ['Q', 306, 34, 22716],
    ]) {
        e.tour.events.change({target:{value:route}});
        assert.equal(e['fuel-km'].textContent, km + ' km');
        assert.equal(e['fuel-liters'].textContent, liters + ' liter');
        assert.equal(e['fuel-amount'].textContent.replace(/\s/g,''), amount + 'Ft');
    }
    for (const route of ['C', 'F', 'T']) {
        e.tour.events.change({target:{value:route}});
        assert.equal(e['fuel-empty'].hidden, false);
        assert.equal(e['fuel-values'].hidden, true);
    }
});

test('exemptions persist independently of completion and clear only the active route', async () => {
    const {elements:e, store} = boot(JSON.stringify({tour:'S',completed:{S:['AB9087']},exempt:{V:['AB9705']}}));
    await e.stops.children[0].children[3].events.click();
    assert.equal(e['info-meta'].textContent, 'AB9087 · Central Passage');
    assert.equal(e['info-deadline'].textContent, 'Befejezési határidő: 10:00');
    e['info-exempt'].events.click();
    assert.match(e.stops.children[0].className, /is-exempt/);
    assert.equal(e.stops.children[0].children[0].children[0].disabled, true);
    e.reset.events.click();
    e['reset-dialog'].returnValue = 'confirm';
    e['reset-dialog'].events.close();
    assert.equal(JSON.parse(store.value).exempt.S[0], 'AB9087');
    e['remaining-only'].events.change({target:{checked:true}});
    assert.equal(e.stops.children.length, 13);
    const restored = boot(store.value);
    e['clear-exempt'].events.click();
    e['clear-exempt-dialog'].returnValue = 'cancel';
    e['clear-exempt-dialog'].events.close();
    e['clear-exempt'].events.click();
    e['clear-exempt-dialog'].returnValue = 'confirm';
    e['clear-exempt-dialog'].events.close();
    assert.equal(JSON.parse(store.value).exempt.V[0], 'AB9705');
});

test('address notes and camera photos save together, remain address-specific and report failed writes', async () => {
    const {elements:e, context} = boot(null);
    const records = new Map();
    context.readAddressInfo = async id => records.get(id) || {id,note:'',photos:[]};
    context.writeAddressInfo = async record => { records.set(record.id, record); return record; };
    await e.stops.children[0].children[3].events.click();
    e['info-note'].value = 'Bejárat az udvar felől';
    await e['info-save'].events.click();
    assert.equal(records.get('AB9087').note, 'Bejárat az udvar felől');
    assert.equal(e.stops.children[0].children[2].children[0].children[2].textContent, 'Bejárat az udvar felől');
    const photo = new Blob(['test'], {type:'image/jpeg'});
    photo.name = 'camera.jpg';
    await e['info-camera'].events.change({target:{files:[photo],value:'camera.jpg'}});
    assert.equal(records.get('AB9087').photos.length, 1);
    assert.equal(e['info-gallery'].children.length, 1);
    await e.stops.children[1].children[3].events.click();
    assert.equal(e['info-note'].value, '');
    assert.equal(e['info-gallery'].children.length, 0);
    await e.stops.children[0].children[3].events.click();
    assert.equal(e['info-note'].value, 'Bejárat az udvar felől');
    assert.equal(e['info-gallery'].children.length, 1);
    context.writeAddressInfo = async () => { throw Error('quota'); };
    e['info-note'].value = 'Új megjegyzés';
    await e['info-save'].events.click();
    assert.match(e['info-status'].textContent, /Nem sikerült menteni/);
    assert.equal(records.get('AB9087').note, 'Bejárat az udvar felől');
    assert.equal(e['info-note'].value, 'Új megjegyzés');
});

test('bottom tabs and header person selection preserve the active view', () => {
    const {elements:e} = boot(null, false, 'mag-richard');
    assert.equal(e['current-person'].textContent, 'Mag Richárd');
    e['search-tab'].events.click();
    assert.equal(e['search-view'].hidden, false);
    e['route-search'].value = 'Q';
    e['route-search'].events.change();
    assert.equal(e['search-results'].children.length, 1);
    assert.equal(e['search-results'].children[0].children[0].textContent, 'Budapest Q');
    assert.equal(e['route-view'].hidden, true);
    e['current-person'].events.click();
    e['person-select'].value = 'kollar-janos';
    e['person-form'].events.submit({preventDefault() {}});
    assert.equal(e['current-person'].textContent, 'Kollár János');
    assert.equal(e['search-view'].hidden, false);
    e['fuel-tab'].events.click();
    assert.equal(e['fuel-view'].hidden, false);
    assert.equal(e['search-view'].hidden, true);
    e['qr-tab'].events.click();
    assert.equal(e['qr-view'].hidden, false);
    assert.equal(e['fuel-view'].hidden, true);
    e['route-tab'].events.click();
    assert.equal(e['qr-view'].hidden, true);
});

test('route search uses the requested day and distinguishes missing schedules', () => {
    const {context} = boot(null);
    assert.deepEqual(Array.from(context.routeDrivers('S', '2026-11-17')), ['Szalai Zsolt']);
    assert.deepEqual(Array.from(context.routeDrivers('S', '2026-11-18')), ['Mag Richárd']);
    assert.deepEqual(Array.from(context.routeDrivers('D', '2026-11-19')), ['Szikszai Bettina']);
    assert.equal(context.routeDrivers('S', '2026-12-01'), null);
});

test('fuel dates are device local, route-specific and reject future dates', () => {
    const {elements:e, store} = boot(null);
    e['last-fuel-button'].events.click();
    e['fuel-date'].value = '2026-01-02';
    e['fuel-form'].events.submit({preventDefault() {}});
    assert.equal(store.extra['alzafutar-last-fuel-S'], '2026-01-02');
    assert.equal(e['last-fuel'].textContent, 'Legutóbbi tankolás: 2026. 01. 02.');
    e.tour.events.change({target:{value:'V'}});
    assert.match(e['last-fuel'].textContent, /Még nincs/);
    e['last-fuel-button'].events.click();
    e['fuel-date'].value = '2999-01-01';
    e['fuel-form'].events.submit({preventDefault() {}});
    assert.match(e['fuel-status'].textContent, /nem jövőbeli/);
    assert.equal(store.extra['alzafutar-last-fuel-V'], undefined);
    e['fuel-today'].events.click();
    assert.match(store.extra['alzafutar-last-fuel-V'], /^\d{4}-\d{2}-\d{2}$/);
});

test('QR upload stays on the device, can be replaced and preserves old code on failed save', async () => {
    const {elements:e, store, context} = boot(null);
    context.FileReader = class { readAsDataURL(file) { this.result = file.data; this.onload(); } };
    context.Image = class { set src(value) { this.onload(); } };
    e['qr-tab'].events.click();
    assert.equal(e['qr-image'].hidden, true);
    const upload = data => e['qr-file'].events.change({target:{files:[{type:'image/png',size:100,data}],value:''}});
    await upload('data:image/png;base64,first');
    assert.equal(store.extra['alzafutar-device-qr-v1'], 'data:image/png;base64,first');
    await upload('data:image/png;base64,second');
    assert.equal(e['qr-image'].src, 'data:image/png;base64,second');
    context.localStorage.setItem = () => {throw Error('full');};
    await upload('data:image/png;base64,third');
    assert.equal(e['qr-image'].src, 'data:image/png;base64,second');
    assert.match(e['qr-status'].textContent, /korábbi QR-kód megmaradt/);
});

test('weekly navigation preserves old shifts and missing days', () => {
    const {elements:e, context} = boot(null, false, 'takacs-istvan');
    e['schedule-tab'].events.click();
    assert.match(e['schedule-period'].textContent, /2026. 11. 16./);
    assert.equal(e['schedule-next'].disabled, true);
    e['schedule-prev'].events.click();
    assert.match(e['schedule-period'].textContent, /2026. 11. 09./);
    assert.equal(e['schedule-cards'].children.length, 7);
    assert.equal(e['schedule-cards'].children[0].children[1].textContent, 'Nincs megadott beosztás');
    assert.equal(e['schedule-cards'].children[2].children[2].children[1].children[1].textContent, 'AOJT457');
    assert.equal(e['schedule-prev'].disabled, true);
    e['schedule-next'].events.click();
    assert.match(e['schedule-period'].textContent, /2026. 11. 16./);
    assert.deepEqual(Array.from(context.routeDrivers('S', '2026-11-12')), ['Szalai Zsolt']);
    assert.deepEqual(Array.from(context.routeDrivers('S', '2026-11-18')), ['Mag Richárd']);
});

test('navigation switches between Waze and Google Maps and saves the preference', () => {
    const {elements:e, context, store} = boot(null);
    const original = new URL(e.stops.children[0].children[2].href).searchParams.get('q');
    e['navigation-app'].events.change({target:{value:'google'}});
    const url = new URL(e.stops.children[0].children[2].href);
    assert.equal(url.hostname, 'www.google.com');
    assert.equal(url.searchParams.get('destination'), original);
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(store.extra['alzafutar-navigation'], 'google');
    e.tour.events.change({target:{value:'V'}});
    assert.equal(new URL(e.stops.children[0].children[2].href).hostname, 'www.google.com');
    context.localStorage.setItem = () => {throw Error('blocked');};
    e['navigation-app'].events.change({target:{value:'waze'}});
    assert.equal(new URL(e.stops.children[0].children[2].href).hostname, 'waze.com');
});

test('address search supports accents, box identifiers and switching back to routes', () => {
    const {elements:e} = boot(null);
    e['search-mode'].value = 'address';
    e['address-search'].value = 'kiraly';
    e['search-mode'].events.change();
    assert.equal(e['route-search-fields'].hidden, true);
    assert.ok(e['search-results'].children.length > 0);
    e['address-search'].value = 'AB9087';
    e['address-search'].events.input();
    assert.equal(e['search-results'].children.length, 1);
    assert.match(e['search-results'].children[0].children[2].textContent, /Budapest S/);
    e['address-search'].value = 'nonexistent-address';
    e['address-search'].events.input();
    assert.match(e['search-results'].textContent, /Nincs találat/);
    e['search-mode'].value = 'route';
    e['search-mode'].events.change();
    assert.equal(e['address-search-fields'].hidden, true);
    assert.equal(e['search-results'].children.length, 1);
});

test('exempt route gathers source routes, survives reload and removes revoked exemptions', async () => {
    const saved = JSON.stringify({tour:'exempt', remainingOnly:true, exempt:{S:['AB9087'],V:['AB9705']}});
    const {elements:e, store} = boot(saved);
    assert.equal(e.tour.value, 'exempt');
    assert.equal(e.stops.children.length, 2);
    assert.equal(e['remaining-only'].disabled, true);
    const restored = boot(store.value);
    assert.equal(restored.elements.stops.children.length, 2);
    const row = e.stops.children.find(row => row.dataset.stop === 'AB9087');
    await row.children[3].events.click();
    e['info-exempt'].events.click();
    assert.equal(e.stops.children.length, 1);
    assert.equal(e.stops.children[0].dataset.stop, 'AB9705');
    assert.equal(JSON.parse(store.value).exempt.S.length, 0);
    e['clear-exempt'].events.click();
    e['clear-exempt-dialog'].returnValue = 'confirm';
    e['clear-exempt-dialog'].events.close();
    assert.equal(e.stops.children.length, 0);
    assert.match(e.empty.textContent, /Még nincs mentesített/);
});

test('return to warehouse uses the selected navigation app and the verified shop address', () => {
    const {elements:e} = boot(null);
    const waze = new URL(e['return-warehouse'].href);
    assert.equal(waze.hostname, 'waze.com');
    assert.equal(waze.searchParams.get('q'), 'Bevásárló utca 1, 2310 Szigetszentmiklós, Magyarország');
    e['navigation-app'].events.change({target:{value:'google'}});
    const google = new URL(e['return-warehouse'].href);
    assert.equal(google.hostname, 'www.google.com');
    assert.equal(google.searchParams.get('destination'), waze.searchParams.get('q'));
});
