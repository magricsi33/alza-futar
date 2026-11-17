@extends('admin.layout')
@section('content')
<div class="page-heading"><div><p class="eyebrow">HETI TERVEZÉS</p><h1>Beosztás</h1></div><button type="button" id="calendar-notify-open"><i class="fi fi-rr-bell" aria-hidden="true"></i> Beosztás módosítási értesítés küldése</button><button type="button" id="calendar-today" class="secondary">Aktuális hét</button></div>
<div class="calendar-toolbar">
    <div class="calendar-week-switch"><button type="button" id="calendar-prev" class="secondary" aria-label="Előző hét">←</button><h2 id="calendar-period" aria-live="polite"></h2><button type="button" id="calendar-next" class="secondary" aria-label="Következő hét">→</button></div>
    <div><label for="calendar-search">Keresés munkatársra, útvonalra vagy rendszámra</label><input id="calendar-search" type="search" value="{{ request('q') }}" placeholder="Név, útvonal, rendszám…"></div>
    <div><label for="calendar-employee-filter">Munkatárs</label><select id="calendar-employee-filter"><option value="">Összes munkatárs</option>@foreach($calendar['employees'] as $person)<option value="{{ $person->id }}" @if(request('employee_id') == $person->id) selected @endif>{{ $person->name }}</option>@endforeach</select></div>
</div>
<p class="muted">Kattints egy napra a beosztás létrehozásához vagy módosításához.</p>
<p id="calendar-status" role="status" aria-live="polite"></p>
<div class="calendar-scroll" tabindex="0" aria-label="Heti beosztás, vízszintesen görgethető"><table class="schedule-calendar" id="schedule-calendar"><thead></thead><tbody></tbody></table></div>
<dialog id="shift-dialog" aria-labelledby="shift-dialog-title">
    <div class="modal-heading"><h2 id="shift-dialog-title">Beosztás</h2><button type="button" class="secondary modal-close" data-close-dialog="shift-dialog" aria-label="Bezárás">×</button></div>
    <p id="shift-person-date" class="muted"></p>
    <form id="shift-dialog-form">
        <div class="form-grid">
            <div><label for="shift-status">Nap típusa</label><select id="shift-status" name="status"><option value="work">Munkanap</option><option value="rest">Pihenőnap</option></select></div>
            <div data-work-field><label for="shift-route">Szabad útvonal</label><select id="shift-route" name="delivery_route_id"></select></div>
            <div data-work-field><label for="shift-vehicle">Szabad gépjármű</label><select id="shift-vehicle" name="vehicle_id"></select></div>
            <div data-work-field><label for="shift-task">Egyéb feladat</label><input id="shift-task" name="task" maxlength="255" placeholder="Pl. Mentesítő vagy Oktatás"></div>
            <div class="wide"><label for="shift-note">Megjegyzés</label><textarea id="shift-note" name="note" rows="3" maxlength="10000"></textarea></div>
        </div>
        <p id="shift-dialog-status" role="status" aria-live="polite"></p>
        <div class="modal-actions"><button type="button" class="danger" id="shift-delete" hidden>Beosztás törlése</button><button id="shift-save" type="submit">Mentés</button></div>
    </form>
</dialog>
@include('admin.schedule-notification-modal')
@endsection
@push('scripts')
<script>window.adminCalendar = @json($calendar);</script>
<script defer src="/js/admin-calendar.js?v=3"></script>
@endpush
