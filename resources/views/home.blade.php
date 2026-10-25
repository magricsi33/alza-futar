@extends('layouts.app')
@section('content')
<header class="topbar"><div class="brand"><span class="brand-icon" aria-hidden="true">↗</span> úton<span class="brand-caption">FUTÁR CÍMKEZELŐ</span></div><span class="connection" id="connection">Helyi mentés</span></header>
<main>
<section class="intro"><p class="eyebrow">EGY CÍMMEL KÖZELEBB.</p><h1>A mai útvonalad<span>.</span></h1><p>Minden megálló egy helyen. Indulhatunk?</p></section>
<section class="tour-panel" aria-label="Túra és haladás"><div class="tour-heading"><div><label for="tour">AKTÍV TÚRA</label><div class="tour-select"><span aria-hidden="true">↳</span><select id="tour" aria-label="Aktív túra"></select></div></div><span class="tour-badge">ALZABOX</span></div><div class="stats"><div><strong id="remaining-count">12</strong><span>hátralévő cím</span></div><div><strong id="done-count">0</strong><span>teljesítve</span></div><div><strong id="total-count">12</strong><span>összes megálló</span></div></div><div class="progress-label"><span id="progress-text">Kezdődjön a túra!</span><strong id="progress-percent">0%</strong></div><progress id="progress" max="12" value="0" aria-label="Túra teljesítése"></progress></section>
<section class="stops-section" aria-labelledby="stops-title"><div class="section-heading"><h2 id="stops-title">Megállók <span id="list-count">12</span></h2><button id="reset" class="reset-button" type="button">↻ Újrakezdés</button></div><div class="list-toolbar"><label class="filter"><input id="remaining-only" type="checkbox"><span>Csak a fennmaradók</span></label><span class="waze-hint">Címre koppintva Waze ↗</span></div><ol id="stops" class="stops"></ol><div id="empty" class="empty" hidden></div></section>
<div class="save-note" id="save-note" role="status">✓ A haladásod automatikusan mentve ezen az eszközön.</div>
<section class="install-panel"><span class="install-icon" aria-hidden="true">↗</span><div><h2>Veled van az úton.</h2><p id="install-help">Tedd a kezdőképernyőre, és nyisd meg egy érintéssel.</p></div><button id="install" type="button">Telepítés ↓</button></section>
<footer><span>úton · Egyszerűbb megállók. Könnyebb napok.</span><span>Jó utat! ↗</span></footer>
<noscript><p>A címkezelő használatához engedélyezd a JavaScriptet.</p></noscript>
</main>
<dialog id="reset-dialog"><form method="dialog"><span class="dialog-icon">↻</span><h2>Újra indul a túra?</h2><p id="reset-description"></p><div class="dialog-actions"><button value="cancel">Mégse</button><button value="confirm" class="confirm">Túra újrakezdése</button></div></form></dialog>
@endsection
