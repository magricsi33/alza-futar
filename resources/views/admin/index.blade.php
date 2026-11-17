@extends('admin.layout')
@section('content')
<div class="page-heading"><div><p class="eyebrow">ADATOK KEZELÉSE</p><h1>{{ $title }}</h1></div><a class="button" href="{{ route('admin.create', [$type, 'employee_id' => request('employee_id')]) }}">+ Létrehozás</a></div>
<form class="filters" method="get">
    <div><label for="q">Keresés</label><input id="q" name="q" value="{{ $q }}" placeholder="{{ $type === 'shifts' ? 'Név, rendszám, útvonal, dátum…' : 'Keresés…' }}"></div>
    @if($type === 'shifts')
        <div><label for="employee-filter">Munkatárs</label><select id="employee-filter" name="employee_id"><option value="">Összes munkatárs</option>@foreach($choices['employees'] as $id => $name)<option value="{{ $id }}" @if(request('employee_id') == $id) selected @endif>{{ $name }}</option>@endforeach</select></div>
        <div><label for="date-filter">Nap</label><input id="date-filter" name="date" type="date" value="{{ request('date') }}"></div>
    @endif
    <button>Keresés</button><a class="button secondary" href="{{ route('admin.index', $type) }}">Alaphelyzet</a>
</form>
<p class="muted">{{ $records->total() }} találat</p>
<div class="record-list">
@forelse($records as $record)
    <article class="record">
        <div class="record-content">
        @if($type === 'routes')
            <h2>{{ $record->name }} <span class="badge">{{ $record->code }}</span></h2>
            <p>{{ $record->ramp ? $record->ramp.'. rámpa' : 'Raktárban pakol' }} · Határidő {{ sprintf('%02d:00', $record->deadline_hour) }}</p>
        @elseif($type === 'addresses')
            <h2>{{ $record->address }}</h2><p>{{ $record->city }} · {{ $record->box_code }} · {{ $choices['routes'][$record->delivery_route_id] ?? 'Nincs útvonalhoz rendelve' }}</p>
        @elseif($type === 'employees')
            <h2>{{ $record->name }}</h2><p>{{ $record->active ? 'Aktív munkatárs' : 'Inaktív – az előzmények megmaradnak' }}</p>
        @elseif($type === 'vehicles')
            <h2>{{ $record->plate }}</h2><p>Legutóbbi tankolás: {{ $record->last_refueled_at ? \Carbon\Carbon::parse($record->last_refueled_at)->format('Y. m. d.') : 'Nincs elérhető adat' }}</p>
        @else
            <h2>{{ $record->employee->name }} <span class="badge">{{ \Carbon\Carbon::parse($record->date)->format('Y. m. d.') }}</span></h2>
            <p>{{ $record->status === 'rest' ? 'Pihenőnap' : ($record->route->name ?? $record->task ?? 'Munkanap') }} · {{ $record->vehicle->plate ?? 'Nem ismert rendszám' }}</p>
            @if($record->note)<p>{{ $record->note }}</p>@endif
        @endif
        </div>
        <div class="record-actions">
            @if($type === 'employees')<a class="button secondary" href="{{ route('admin.index', ['shifts', 'employee_id' => $record->id]) }}">Beosztás</a>@endif
            <a class="button secondary" href="{{ route('admin.edit', [$type, $record->id]) }}">Szerkesztés</a>
            <form method="post" action="{{ route('admin.destroy', [$type, $record->id]) }}" data-confirm="Biztosan törlöd? {{ $type === 'employees' ? 'A munkatárs beosztása is törlődik. Az előzmények megőrzéséhez inkább állítsd inaktívra.' : ($type === 'routes' ? 'A címek megmaradnak, az útvonalhoz kapcsolásuk megszűnik.' : 'A kapcsolódó beosztásokban a hozzárendelés megszűnhet.') }}">
                @csrf @method('DELETE')<button class="danger">Törlés</button>
            </form>
        </div>
    </article>
@empty
    <div class="empty">Nincs találat. Hozz létre új elemet, vagy módosítsd a keresést.</div>
@endforelse
</div>
<nav class="pagination" aria-label="Lapozás">
    @if($records->previousPageUrl())<a class="button secondary" href="{{ $records->previousPageUrl() }}">← Előző</a>@endif
    <span>{{ $records->currentPage() }} / {{ $records->lastPage() }}</span>
    @if($records->nextPageUrl())<a class="button secondary" href="{{ $records->nextPageUrl() }}">Következő →</a>@endif
</nav>
@endsection
