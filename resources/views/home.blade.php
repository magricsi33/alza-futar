@extends('layouts.app')

@section('content')

<main>
    <header class="fixed-toolbar">
        <button id="current-person" type="button" aria-haspopup="dialog">
            <i class="fi fi-rr-user" aria-hidden="true"></i>
            Személy kiválasztása
        </button>
        <div>
            
            <select id="tour" aria-label="Aktív útvonal">
            </select>
        </div>
    </header>
    <nav class="view-navigation" aria-label="Fő navigáció">
        <button id="schedule-tab" type="button" aria-label="Beosztás" title="Beosztás" aria-pressed="false" aria-controls="schedule-view">
            <i class="fi fi-rr-calendar" aria-hidden="true">
            </i>
        </button>
        <button id="fuel-tab" type="button" aria-label="Tankolás" title="Tankolás" aria-pressed="false" aria-controls="fuel-view">
            <i class="fi fi-rr-gas-pump" aria-hidden="true">
            </i>
        </button>
        <button id="route-tab" type="button" aria-label="Útvonal" title="Útvonal" aria-pressed="true" aria-controls="route-view">
            <i class="fi fi-rr-route" aria-hidden="true">
            </i>
        </button>
        <button id="qr-tab" type="button" aria-label="QR-kód" title="QR-kód" aria-pressed="false" aria-controls="qr-view">
            <i class="fi fi-rr-qrcode" aria-hidden="true"></i>
        </button>
        <button id="search-tab" type="button" aria-label="Keresés" title="Keresés" aria-pressed="false" aria-controls="search-view">
            <i class="fi fi-rr-search" aria-hidden="true">
            </i>
        </button>
    </nav>
    <section id="schedule-view" aria-labelledby="schedule-title" hidden>
        <div class="schedule-heading">
            <div>
                <h1 id="schedule-title" class="page-title" tabindex="-1">Beosztás</h1>
            </div>
        </div>
        <div class="week-switcher">
            <button id="schedule-prev" class="ramp-button btn-sm" type="button" aria-label="Előző hét" title="Előző hét"><i class="fi fi-rr-angle-left" aria-hidden="true"></i></button>
            <p id="schedule-period" class="schedule-period" aria-live="polite"></p>
            <button id="schedule-next" class="ramp-button btn-sm" type="button" aria-label="Következő hét" title="Következő hét"><i class="fi fi-rr-angle-right" aria-hidden="true"></i></button>
        </div>
        <p id="person-save-status" role="status">
        </p>
        <div id="schedule-cards" class="schedule-cards">
        </div>
    </section>
    <div id="route-view">
        <section class="stops-section" aria-labelledby="stops-title">
            <div class="section-heading">
                <h1 id="stops-title" class="page-title">
                    Megállók <span id="list-count">12</span>
                </h1>
                <div class="route-actions">
                    <button id="reset" class="reset-button btn-sm" type="button" aria-label="Újrakezdés" title="Újrakezdés"><i class="fi fi-rr-refresh" aria-hidden="true"></i></button>
                    <button id="clear-exempt" class="reset-button btn-sm" type="button">Mentesítés törlése</button>
                </div>
            </div>
            <div class="list-toolbar">
                <label class="filter">
                    <input id="remaining-only" type="checkbox">
                    <span>Csak a fennmaradók</span>
                </label>
                <select id="navigation-app" aria-label="Navigációs alkalmazás">
                    <option value="waze">Waze</option>
                    <option value="google">Google Maps</option>
                </select>
            </div>
            <ol id="stops" class="stops">
            </ol>
            <a id="return-warehouse" class="ramp-button return-warehouse" target="_blank" rel="noopener noreferrer">Vissza a raktárba</a>
            <p id="notes-status" role="status">
            </p>
            <div id="empty" class="empty" hidden>
            </div>
        </section>
        <p id="save-note" role="status"></p>
        <section class="route-ramp" aria-labelledby="ramp-title">
            <h2 id="ramp-title">Rámpakiosztás</h2>
            <p id="ramp-tour"></p>
            <p><strong id="ramp-location"></strong> · Indulás: <time id="ramp-departure"></time></p>
        </section>
    </div>
    <section id="qr-view" hidden aria-labelledby="qr-title">
    <div class="ramp-dialog-heading">
        <h1 id="qr-title" class="page-title">Saját QR-kód</h1>

    </div>
    <img id="qr-image" alt="Saját QR-kód" hidden>
    <p id="qr-empty">Még nincs feltöltött QR-kód.</p>
    <button id="qr-upload" type="button" class="ramp-button file-button">QR-kód feltöltése / cseréje</button>
    <input id="qr-file" type="file" accept="image/png,image/jpeg,image/webp" hidden>
    <p id="qr-status" role="status">
    </p>
</section>
    <section id="search-view" hidden>
        <h1 class="page-title">Keresés</h1>
        <label for="search-mode">Keresés típusa</label>
        <select id="search-mode"><option value="route">Útvonal</option><option value="address">Cím</option></select>
        <div id="route-search-fields">
        <label for="route-search">Útvonal</label>
        <select id="route-search" aria-label="Keresett útvonal"></select>
        </div>
        <div id="address-search-fields" hidden><label for="address-search">Cím, város, helyszín vagy boxazonosító</label><input id="address-search" type="search" placeholder="Pl. Király utca vagy AB9087" autocomplete="off"></div>
        <p id="search-date">
        </p>
        <div id="search-results" aria-live="polite">
        </div>
    </section>
    <section id="fuel-view" hidden>
        <section class="fuel-panel" aria-labelledby="fuel-title">
            <h1 id="fuel-title" class="page-title">Tankolás</h1>
            <p id="fuel-tour" class="fuel-tour">
            </p>
            <dl id="fuel-values" class="fuel-values">
                <div>
                    <dt>Útvonal hossza</dt>
                    <dd id="fuel-km">
                    </dd>
                </div>
                <div>
                    <dt>Tankolható</dt>
                    <dd id="fuel-liters">
                    </dd>
                </div>
                <div>
                    <dt>Összeg</dt>
                    <dd id="fuel-amount">
                    </dd>
                </div>
            </dl>
            <p id="fuel-empty" hidden>Nincs elérhető adat</p>
            <p id="fuel-frequency" class="fuel-frequency">
            </p>
            <p id="last-fuel">
            </p>
            <button id="last-fuel-button" type="button" class="ramp-button" aria-haspopup="dialog">Legutóbbi tankolás</button>
        </section>
    </section>
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
    <p class="icon-credit">Uicons by <a href="https://www.flaticon.com/uicons" rel="noopener noreferrer">Flaticon</a>
    </p>
    <p class="icon-credit"><a href="/admin">Adminisztráció</a></p>
    <noscript>
        <p>A címkezelő használatához engedélyezd a JavaScriptet.</p>
    </noscript>
</main>

<dialog id="fuel-dialog" aria-labelledby="fuel-dialog-title">
    <div class="ramp-dialog-heading">
        <h2 id="fuel-dialog-title">Legutóbbi tankolás</h2>
        <button id="fuel-close" type="button" class="ramp-close" aria-label="Bezárás">×</button>
    </div>
    <p id="fuel-dialog-route">
    </p>
    <button id="fuel-today" type="button" class="ramp-button">A mai napon</button>
    <form id="fuel-form">
        <label for="fuel-vehicle">Gépjármű</label>
        <select id="fuel-vehicle"><option value="">Nem ismert / csak az útvonalhoz rögzítés</option></select>
        <label for="fuel-date">Tankolás dátuma</label>
        <input id="fuel-date" type="date" required>
        <button id="fuel-submit" type="submit" class="ramp-button">Rögzítés</button>
    </form>
    <p id="fuel-status" role="status">
    </p>
</dialog>
<dialog id="info-dialog" aria-labelledby="info-title">
    <div class="ramp-dialog-heading">
        <h2 id="info-title">
        </h2>
        <button id="info-close" class="ramp-close" type="button" aria-label="Bezárás" autofocus>×</button>
    </div>
    <p id="info-address">
    </p>
    <p id="info-meta" class="info-meta">
    </p>
    <p id="info-deadline" class="info-meta">
    </p>
    <label for="info-note">Megjegyzés</label>
    <textarea id="info-note" rows="4" maxlength="10000" placeholder="Bejutás, parkolás, hasznos tudnivalók…"></textarea>
    <button id="info-save" class="ramp-button" type="button">Megjegyzés mentése</button>
    <div class="photo-heading">
        <h3>Képek</h3>
        <button id="info-take-photo" class="photo-camera" type="button" aria-label="Fotó készítése" title="Fotó készítése">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path d="M8 6l2-3h4l2 3h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
        </button>
    </div>
    <input id="info-files" type="file" accept="image/*" multiple hidden>
    <input id="info-camera" type="file" accept="image/*" capture="environment" hidden>
    <div class="photo-grid">
        <button id="info-add" class="photo-add" type="button" aria-label="Képek hozzáadása" title="Képek hozzáadása">+</button>
        <div id="info-gallery" class="info-gallery">
        </div>
    </div>
    <p id="info-status" role="status" aria-live="polite">
    </p>
    <button id="info-exempt" class="ramp-button exemption-action" type="button">Megjelölés mentesítettként</button>
</dialog>
<dialog id="clear-exempt-dialog" aria-labelledby="clear-exempt-title">
    <form method="dialog">
        <h2 id="clear-exempt-title">Mentesítések törlése?</h2>
        <p id="clear-exempt-description">
        </p>
        <div class="dialog-actions">
            <button value="cancel">Mégse</button>
            <button value="confirm" class="confirm">Mentesítések törlése</button>
        </div>
    </form>
</dialog>
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
            <button type="submit" class="confirm">Mentés</button>
        </div>
    </form>
</dialog>

<dialog id="reset-dialog">
    <form method="dialog">
        <span class="dialog-icon">↻</span>
        <h2>Újra indul az útvonal?</h2>
        <p id="reset-description">
        </p>
        <div class="dialog-actions">
            <button value="cancel">Mégse</button>
            <button value="confirm" class="confirm">Útvonal újrakezdése</button>
        </div>
    </form>
</dialog>
@endsection
