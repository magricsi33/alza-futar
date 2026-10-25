/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./resources/js/app.js":
/*!*****************************!*\
  !*** ./resources/js/app.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _tours__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./tours */ "./resources/js/tours.js");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }

var key = 'uton-state-v1';
var $ = function $(id) {
  return document.getElementById(id);
};
var state = {
  tour: 'S',
  remainingOnly: false,
  completed: {}
};
try {
  var saved = JSON.parse(localStorage.getItem(key));
  if (saved && _typeof(saved) === 'object') {
    if (_tours__WEBPACK_IMPORTED_MODULE_0__.tours.some(function (t) {
      return t.id === saved.tour;
    })) state.tour = saved.tour;
    state.remainingOnly = saved.remainingOnly === true;
    var _iterator = _createForOfIteratorHelper(_tours__WEBPACK_IMPORTED_MODULE_0__.tours),
      _step;
    try {
      var _loop = function _loop() {
        var _saved$completed;
        var tour = _step.value;
        var ids = (_saved$completed = saved.completed) === null || _saved$completed === void 0 ? void 0 : _saved$completed[tour.id];
        state.completed[tour.id] = Array.isArray(ids) ? _toConsumableArray(new Set(ids.filter(function (id) {
          return tour.stops.some(function (s) {
            return s[0] === id;
          });
        }))) : [];
      };
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
} catch (_unused) {/* Invalid or unavailable storage: use a clean state. */}
function save() {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    $('save-note').textContent = '✓ A haladásod automatikusan mentve ezen az eszközön.';
  } catch (_unused2) {
    $('save-note').textContent = 'A böngésző nem engedi a mentést. A haladás most csak a lap bezárásáig marad meg.';
  }
}
function render() {
  var tour = _tours__WEBPACK_IMPORTED_MODULE_0__.tours.find(function (t) {
    return t.id === state.tour;
  });
  var completed = state.completed[tour.id] || [];
  var count = completed.length,
    total = tour.stops.length;
  $('tour').value = tour.id;
  $('remaining-only').checked = state.remainingOnly;
  $('remaining-count').textContent = total - count;
  $('done-count').textContent = count;
  $('total-count').textContent = total;
  $('progress').max = total || 1;
  $('progress').value = count;
  $('progress-percent').textContent = (total ? Math.round(count / total * 100) : 0) + '%';
  $('progress-text').textContent = !total ? 'A címlista még feltöltésre vár' : count === total ? 'Minden cím kész. Szép munka!' : count ? 'Jól haladsz, csak így tovább!' : 'Kezdődjön a túra!';
  $('reset').disabled = count === 0;
  var list = $('stops');
  list.replaceChildren();
  tour.stops.forEach(function (_ref, index) {
    var _ref2 = _slicedToArray(_ref, 4),
      id = _ref2[0],
      address = _ref2[1],
      city = _ref2[2],
      location = _ref2[3];
    var done = completed.includes(id);
    if (state.remainingOnly && done) return;
    var row = document.createElement('li');
    row.className = 'stop' + (done ? ' is-done' : '');
    row.dataset.stop = id;
    var label = document.createElement('label');
    label.className = 'stop-check';
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = done;
    checkbox.setAttribute('aria-label', index + 1 + '. ' + address + ' teljesítve');
    checkbox.addEventListener('change', function () {
      var ids = new Set(state.completed[tour.id] || []);
      checkbox.checked ? ids.add(id) : ids["delete"](id);
      state.completed[tour.id] = _toConsumableArray(ids);
      save();
      render();
      var next = document.querySelector('[data-stop="' + id + '"] input') || list.querySelector('input') || $('remaining-only');
      next.focus({
        preventScroll: true
      });
    });
    label.append(checkbox);
    var number = document.createElement('span');
    number.className = 'stop-number';
    number.textContent = String(index + 1).padStart(2, '0');
    var link = document.createElement('a');
    link.className = 'stop-link';
    link.href = 'https://waze.com/ul?q=' + encodeURIComponent(address.replace(/–/g, '-') + ', ' + city + ', Magyarország') + '&navigate=yes';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', address + ', ' + city + ' — megnyitás Waze-ben');
    var text = document.createElement('span');
    var title = document.createElement('strong');
    title.textContent = address;
    var subtitle = document.createElement('span');
    subtitle.className = 'stop-city';
    subtitle.textContent = city;
    var meta = document.createElement('span');
    meta.className = 'stop-meta';
    meta.textContent = id + ' · ' + location;
    text.append(title, subtitle, meta);
    var arrow = document.createElement('span');
    arrow.className = 'navigate';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    link.append(text, arrow);
    row.append(label, number, link);
    list.append(row);
  });
  $('list-count').textContent = list.children.length;
  $('empty').hidden = list.children.length > 0;
  $('empty').textContent = !total ? 'Ehhez a túrához még nincs címlista megadva.' : '✓ Minden megálló teljesítve! A szűrő kikapcsolásával újra láthatod a címeket.';
}
var _iterator2 = _createForOfIteratorHelper(_tours__WEBPACK_IMPORTED_MODULE_0__.tours),
  _step2;
try {
  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
    var tour = _step2.value;
    $('tour').add(new Option(tour.name, tour.id));
  }
} catch (err) {
  _iterator2.e(err);
} finally {
  _iterator2.f();
}
$('tour').addEventListener('change', function (e) {
  state.tour = e.target.value;
  save();
  render();
});
$('remaining-only').addEventListener('change', function (e) {
  state.remainingOnly = e.target.checked;
  save();
  render();
});
var resetTour;
$('reset').addEventListener('click', function () {
  resetTour = state.tour;
  $('reset-description').textContent = 'A ' + _tours__WEBPACK_IMPORTED_MODULE_0__.tours.find(function (t) {
    return t.id === resetTour;
  }).name + ' túra összes pipáját töröljük. A többi túra haladása megmarad.';
  $('reset-dialog').showModal();
});
$('reset-dialog').addEventListener('close', function () {
  if ($('reset-dialog').returnValue === 'confirm') {
    state.completed[resetTour] = [];
    save();
    render();
  }
});
var installPrompt;
window.addEventListener('beforeinstallprompt', function (event) {
  event.preventDefault();
  installPrompt = event;
});
$('install').addEventListener('click', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
  return _regenerator().w(function (_context) {
    while (1) switch (_context.n) {
      case 0:
        if (!installPrompt) {
          _context.n = 3;
          break;
        }
        _context.n = 1;
        return installPrompt.prompt();
      case 1:
        _context.n = 2;
        return installPrompt.userChoice;
      case 2:
        installPrompt = null;
        _context.n = 4;
        break;
      case 3:
        $('install-help').textContent = 'iPhone: Safari → Megosztás → Főképernyőhöz adás. Android: böngészőmenü → Alkalmazás telepítése vagy Hozzáadás a kezdőképernyőhöz.';
      case 4:
        return _context.a(2);
    }
  }, _callee);
})));
function connection() {
  $('connection').textContent = navigator.onLine ? 'Helyi mentés' : 'Offline mód';
}
window.addEventListener('online', connection);
window.addEventListener('offline', connection);
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) document.querySelector('.install-panel').hidden = true;
window.addEventListener('appinstalled', function () {
  document.querySelector('.install-panel').hidden = true;
});
if ('serviceWorker' in navigator) window.addEventListener('load', function () {
  return navigator.serviceWorker.register('/sw.js')["catch"](function () {
    $('connection').textContent = 'Offline mód nem elérhető';
  });
});
render();
save();
connection();

/***/ }),

/***/ "./resources/js/tours.js":
/*!*******************************!*\
  !*** ./resources/js/tours.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "tours": () => (/* binding */ tours)
/* harmony export */ });
var tours = [{
  id: 'S',
  name: 'Budapest S',
  stops: [['AB9087', 'Király u. 8–10', '1061 Budapest', 'Central Passage'], ['AB9815', 'Kis Diófa u. 8', '1076 Budapest', 'BoxHub'], ['AB9682', 'Király u. 73', '1077 Budapest', 'AlzaBox Budapest VII.'], ['AB9828', 'Szondi utca 22', '1067 Budapest', 'AlzaBox Budapest VI.'], ['AB9251', 'Zichy Jenő u. 36', '1066 Budapest', 'AlzaBox Budapest VI.'], ['AB9796', 'Felsőerdősor u. 5', '1068 Budapest', 'BOXHUB'], ['AB9792', 'Dob utca 100', '1073 Budapest', 'Vendobox'], ['AB9811', 'Dembinszky u. 41', '1071 Budapest', 'Box Office'], ['AB9377', 'Hungária krt. 175–177', '1146 Budapest', 'OMV'], ['AB9619', 'Nagy Lajos király útja 186', '1149 Budapest', 'Vendobox'], ['AB9193', 'Béke u. 2', '2145 Kerepes', 'COOP'], ['AB9074', 'Gödöllői út 244', '2146 Mogyoród', 'CBA']]
}, {
  id: 'V',
  name: 'Budapest V',
  stops: []
}];

/***/ }),

/***/ "./resources/css/app.css":
/*!*******************************!*\
  !*** ./resources/css/app.css ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"/js/app": 0,
/******/ 			"css/app": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk"] = self["webpackChunk"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	__webpack_require__.O(undefined, ["css/app"], () => (__webpack_require__("./resources/js/app.js")))
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["css/app"], () => (__webpack_require__("./resources/css/app.css")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;