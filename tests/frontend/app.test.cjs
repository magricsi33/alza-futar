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
    addEventListener(name, fn) { this.events[name] = fn; }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    querySelector() { return this.children[0]?.children[0]?.children[0]; }
}
function boot(saved, blocked = false, person = null) {
    const elements = {};
    const store = { value: saved, person };
    const document = {
        getElementById: id => elements[id] ||= new Element(),
        createElement: () => new Element(),
        querySelector: selector => selector === '.install-panel' ? new Element() : null,
    };
    const context = {
        document,
        Option: function(text, value) { this.text = text; this.value = value; },
        localStorage: {
            getItem: key => key === 'alzafutar-person-v1' ? store.person : store.value,
            setItem: (key, value) => {
                if (blocked) throw Error('blocked');
                if (key === 'alzafutar-person-v1') store.person = value;
                else store.value = value;
            },
        },
        window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
        navigator: { onLine: true },
    };
    vm.createContext(context);
    const data = fs.readFileSync('resources/js/tours.js', 'utf8').replace('export const', 'const');
    const app = fs.readFileSync('resources/js/app.js', 'utf8').replace(/^import .*;\r?\n/gm, '');
    const schedule = fs.readFileSync('resources/js/schedule.js', 'utf8').replace(/export /g, '');
    vm.runInContext(data + '\n' + schedule + '\n' + app, context);
    return { elements, store };
}
test('completion, filter, reload, tour isolation and reset', () => {
    let {elements: e, store} = boot(null);
    assert.equal(e.stops.children.length, 12);
    const first = e.stops.children[0].children[0].children[0];
    first.checked = true; first.events.change();
    assert.equal(e['done-count'].textContent, 1);
    e['remaining-only'].events.change({target:{checked:true}});
    assert.equal(e.stops.children.length, 11);
    assert.equal(e.stops.children[0].children[1].textContent, '02');
    e.tour.events.change({target:{value:'V'}});
    assert.equal(e.stops.children.length, 11);
    const vFirst = e.stops.children[0].children[0].children[0];
    vFirst.checked = true; vFirst.events.change();
    assert.equal(e.stops.children.length, 10);
    const restored = boot(store.value); e = restored.elements;
    assert.equal(e.tour.value, 'V');
    e.tour.events.change({target:{value:'S'}});
    assert.equal(e['done-count'].textContent, 1);
    assert.equal(e.stops.children.length, 11);
    e.reset.events.click();
    e['reset-dialog'].returnValue = 'cancel'; e['reset-dialog'].events.close();
    assert.equal(e['done-count'].textContent, 1);
    e.reset.events.click();
    e['reset-dialog'].returnValue = 'confirm'; e['reset-dialog'].events.close();
    assert.equal(e['done-count'].textContent, 0);
    assert.equal(e.stops.children.length, 12);
    e.tour.events.change({target:{value:'V'}});
    assert.equal(e['done-count'].textContent, 1);
    assert.equal(e.stops.children.length, 10);
});
test('malformed, stale and blocked storage recover safely', () => {
    assert.equal(boot('{').elements.stops.children.length, 12);
    const saved = JSON.stringify({tour:'missing',completed:{S:['AB9087','AB9087','invalid']}});
    assert.equal(boot(saved).elements['done-count'].textContent, 1);
    assert.match(boot(null, true).elements['save-note'].textContent, /nem engedi/);
});
test('fuel summary follows restored and changed tours without leaking previous values', () => {
    const {elements: e} = boot(JSON.stringify({tour:'V'}));
    assert.equal(e['fuel-km'].textContent, '44 km');
    assert.equal(e['fuel-liters'].textContent, '8 liter');
    assert.equal(e['fuel-amount'].textContent.replace(/\s/g, ''), '3422Ft');
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
    assert.equal(e['fuel-amount'].textContent.replace(/\s/g, ''), '10654Ft');
    assert.equal(e['fuel-frequency'].textContent, 'Tankolás 2 naponta');
});
test('ramp dialog follows the active tour and distinguishes warehouse loading', () => {
    const {elements: e} = boot(JSON.stringify({tour:'S'}));
    e['ramp-button'].events.click();
    assert.equal(e['ramp-dialog'].open, true);
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
        e['ramp-button'].events.click();
        assert.equal(e['ramp-tour'].textContent, 'Budapest ' + tour);
        assert.equal(e['ramp-location'].textContent, location);
        assert.equal(e['ramp-departure'].textContent, departure);
    }
});
test('all addresses have correctly encoded Waze navigation links', () => {
    const {elements} = boot(null);
    const expected = {A:16, B:18, C:18, D:16, E:13, F:18, O:22, Q:18, S:12, T:14, U:13, V:11};
    assert.equal(elements.tour.children.length, 12);
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
    assert.match(new URL(elements.stops.children[11].children[2].href).searchParams.get('q'), /Gödöllői út 244, 2146 Mogyoród/);
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
    assert.equal(e['schedule-person'].textContent, 'Mag Richárd');
    assert.equal(e['schedule-cards'].children.length, 8);
    assert.equal(e['schedule-cards'].children[0].children[1].textContent, 'Pihenőnap');
    assert.equal(e['schedule-cards'].children[3].children[2].children[1].children[1].textContent, 'AICD394');

    const second = boot(first.store.value, false, first.store.person);
    second.elements['schedule-tab'].events.click();
    assert.equal(second.elements['person-dialog'], undefined);
    assert.equal(second.elements['schedule-person'].textContent, 'Mag Richárd');
    second.elements['change-person'].events.click();
    assert.equal(second.elements['person-dialog'].open, true);
    second.elements['person-select'].value = 'kiss-daniel';
    second.elements['person-form'].events.submit({preventDefault() {}});
    assert.equal(second.store.person, 'kiss-daniel');
    assert.equal(second.elements['schedule-cards'].children[0].children[2].children[1].children[1].textContent, 'Nem ismert');
    second.elements['route-tab'].events.click();
    assert.equal(second.elements['route-view'].hidden, false);
    assert.equal(second.elements['done-count'].textContent, 1);
});

test('empty schedule differs from rest and unknown saved person prompts again', () => {
    const {elements:e} = boot(null, false, 'deleted-person');
    e['schedule-tab'].events.click();
    assert.equal(e['person-dialog'].open, true);
    e['person-select'].value = 'miklos-daniel';
    e['person-form'].events.submit({preventDefault() {}});
    assert.equal(e['schedule-cards'].children.length, 8);
    for (const card of e['schedule-cards'].children) {
        assert.equal(card.children[1].textContent, 'Nincs megadott beosztás');
        assert.equal(card.children.length, 2);
    }
});

test('all schedule rows cover exactly the published dates', () => {
    const context = {};
    vm.createContext(context);
    vm.runInContext(fs.readFileSync('resources/js/schedule.js','utf8').replace(/export /g,'') + '\nthis.people = schedulePeople; this.days = scheduleDays; this.parse = parseShift;', context);
    assert.equal(context.people.length, 18);
    assert.equal(context.days.length, 8);
    assert.equal(new Set(context.people.map(p => p.id)).size, 18);
    for (const person of context.people) assert.equal(person.cells.length, context.days.length, person.name);
    const night = context.parse('T csak éjszaka');
    assert.equal(night.route, 'T');
    assert.equal(night.plate, 'Nem ismert');
    assert.equal(night.note, 'csak éjszaka');
});
