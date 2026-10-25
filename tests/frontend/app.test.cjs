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
    querySelector() { return this.children[0]?.children[0]?.children[0]; }
}
function boot(saved, blocked = false) {
    const elements = {};
    const store = { value: saved };
    const document = {
        getElementById: id => elements[id] ||= new Element(),
        createElement: () => new Element(),
        querySelector: selector => selector === '.install-panel' ? new Element() : null,
    };
    const context = {
        document,
        Option: function(text, value) { this.text = text; this.value = value; },
        localStorage: { getItem: () => store.value, setItem: (_, value) => { if (blocked) throw Error('blocked'); store.value = value; } },
        window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
        navigator: { onLine: true },
    };
    vm.createContext(context);
    const data = fs.readFileSync('resources/js/tours.js', 'utf8').replace('export const', 'const');
    const app = fs.readFileSync('resources/js/app.js', 'utf8').replace("import { tours } from './tours';", '');
    vm.runInContext(data + '\n' + app, context);
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
    assert.equal(e.stops.children.length, 0);
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
});
test('malformed, stale and blocked storage recover safely', () => {
    assert.equal(boot('{').elements.stops.children.length, 12);
    const saved = JSON.stringify({tour:'missing',completed:{S:['AB9087','AB9087','invalid']}});
    assert.equal(boot(saved).elements['done-count'].textContent, 1);
    assert.match(boot(null, true).elements['save-note'].textContent, /nem engedi/);
});
test('all addresses have correctly encoded Waze navigation links', () => {
    const {elements} = boot(null);
    for (const stop of elements.stops.children) {
        const url = new URL(stop.children[2].href);
        assert.equal(url.hostname, 'waze.com');
        assert.equal(url.searchParams.get('navigate'), 'yes');
        assert.match(url.searchParams.get('q'), /Magyarország$/);
    }
    assert.match(new URL(elements.stops.children[11].children[2].href).searchParams.get('q'), /Gödöllői út 244, 2146 Mogyoród/);
});
