@extends('layouts.app')

@section('content')

    <main>
        <nav class="view-navigation" aria-label="Fő navigáció">
            <button id="route-tab" type="button" aria-pressed="true" aria-controls="route-view">Útvonal</button>
            <button id="schedule-tab" type="button" aria-pressed="false" aria-controls="schedule-view">Beosztás</button>
        </nav>

        <section id="schedule-view" aria-labelledby="schedule-person" hidden>
            <div class="schedule-heading">
                <div>
                    <p class="eyebrow">BEOSZTÁS</p>
                    <h1 id="schedule-person" tabindex="-1"></h1>
                </div>
                <button id="change-person" class="ramp-button" type="button" aria-haspopup="dialog">Személy módosítása</button>
            </div>
            <p id="schedule-period" class="schedule-period"></p>
            <p class="schedule-info">Csak a kiadott időszak látható. Az üres napokra még nincs megadott beosztás.</p>
            <p id="person-save-status" role="status"></p>
            <div id="schedule-cards" class="schedule-cards"></div>
        </section>

        <div id="route-view">
            <section class="intro">
                <div class="intro-heading">
                    <h1>A mai útvonalad<span>.</span></h1>
                    <button id="ramp-button" class="ramp-button" type="button" aria-haspopup="dialog" aria-controls="ramp-dialog">
                        Rámpa
                    </button>
                </div>
            </section>

            <section class="tour-panel" aria-label="Útvonal és haladás">
                <div class="tour-heading">
                    <div>
                        <label for="tour">AKTÍV ÚTVONAL</label>

                        <div class="tour-select">
                            <span aria-hidden="true">↳</span>
                            <select id="tour" aria-label="Aktív útvonal"></select>
                        </div>
                    </div>

                    <span class="tour-badge">ALZABOX</span>
                </div>

                <div class="stats">
                    <div>
                        <strong id="remaining-count">12</strong>
                        <span>hátralévő cím</span>
                    </div>

                    <div>
                        <strong id="done-count">0</strong>
                        <span>teljesítve</span>
                    </div>

                    <div>
                        <strong id="total-count">12</strong>
                        <span>összes megálló</span>
                    </div>
                </div>

                <div class="progress-label">
                    <span id="progress-text">Kezdődjön az útvonal!</span>
                    <strong id="progress-percent">0%</strong>
                </div>

                <progress
                    id="progress"
                    max="12"
                    value="0"
                    aria-label="Útvonal teljesítése"
                ></progress>
            </section>

            <section class="stops-section" aria-labelledby="stops-title">
                <div class="section-heading">
                    <h2 id="stops-title">
                        Megállók <span id="list-count">12</span>
                    </h2>

                    <button id="reset" class="reset-button" type="button">
                        ↻ Újrakezdés
                    </button>
                </div>

                <div class="list-toolbar">
                    <label class="filter">
                        <input id="remaining-only" type="checkbox">
                        <span>Csak a fennmaradók</span>
                    </label>

                    <span class="waze-hint">Címre koppintva Waze ↗</span>
                </div>

                <ol id="stops" class="stops"></ol>
                <div id="empty" class="empty" hidden></div>
            </section>

            <div class="save-note" id="save-note" role="status">
                ✓ A haladásod automatikusan mentve ezen az eszközön.
        </div>



        <section class="fuel-panel" aria-labelledby="fuel-title">
            <h2 id="fuel-title">Útvonal és tankolás</h2>
            <p id="fuel-tour" class="fuel-tour"></p>

            <dl id="fuel-values" class="fuel-values">
                <div>
                    <dt>Útvonal hossza</dt>
                    <dd id="fuel-km"></dd>
                </div>
                <div>
                    <dt>Tankolható</dt>
                    <dd id="fuel-liters"></dd>
                </div>
                <div>
                    <dt>Összeg</dt>
                    <dd id="fuel-amount"></dd>
                </div>
            </dl>

            <p id="fuel-empty" hidden>Nincs elérhető adat</p>
            <p id="fuel-frequency" class="fuel-frequency"></p>
        </section>

        </div>
        <section class="install-panel">
            <span class="install-icon" aria-hidden="true">↗</span>

            <div>
                <h2>Veled van az úton.</h2>
                <p id="install-help">
                    Tedd a kezdőképernyőre, és nyisd meg egy érintéssel.
                </p>
            </div>

            <button id="install" type="button">Telepítés ↓</button>
        </section>
        <noscript>
            <p>A címkezelő használatához engedélyezd a JavaScriptet.</p>
        </noscript>
    </main>

    <dialog id="person-dialog" aria-labelledby="person-title">
        <form id="person-form">
            <h2 id="person-title">Ki vagy?</h2>
            <p>Válaszd ki a neved, és megmutatjuk a beosztásodat. A választást ezen az eszközön megjegyezzük.</p>
            <label for="person-select">Név</label>
            <select id="person-select" required autofocus>
                <option value="" disabled>Válassz személyt</option>
            </select>
            <div class="dialog-actions">
                <button id="person-cancel" type="button">Mégse</button>
                <button type="submit" class="confirm">Mentés és beosztás</button>
            </div>
        </form>
    </dialog>

    <dialog id="ramp-dialog" aria-labelledby="ramp-title" aria-describedby="ramp-location">
        <form method="dialog">
            <div class="ramp-dialog-heading">
                <h2 id="ramp-title">Rámpakiosztás</h2>
                <button class="ramp-close" aria-label="Bezárás" autofocus>×</button>
            </div>

            <p id="ramp-tour" class="ramp-tour"></p>

            <div class="ramp-details">
                <span class="ramp-label">PAKOLÁS HELYE</span>
                <strong id="ramp-location"></strong>
                <span class="ramp-label">INDULÁS</span>
                <time id="ramp-departure"></time>
            </div>

            <div class="dialog-actions">
                <button class="confirm">Rendben</button>
            </div>
        </form>
    </dialog>

    <dialog id="reset-dialog">
        <form method="dialog">
            <span class="dialog-icon">↻</span>
            <h2>Újra indul az útvonal?</h2>
            <p id="reset-description"></p>

            <div class="dialog-actions">
                <button value="cancel">Mégse</button>
                <button value="confirm" class="confirm">Útvonal újrakezdése</button>
            </div>
        </form>
    </dialog>
@endsection
