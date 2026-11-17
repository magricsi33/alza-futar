@extends('admin.layout')
@section('content')
<div class="page-heading"><div><p class="eyebrow">{{ $title }}</p><h1>{{ $record->exists ? 'Szerkesztés' : 'Létrehozás' }}</h1></div><a class="button secondary" href="{{ route('admin.index', $type) }}">Vissza a listához</a></div>
<form method="post" action="{{ $record->exists ? route('admin.update', [$type, $record->id]) : route('admin.store', $type) }}" class="edit-form">
    @csrf @if($record->exists) @method('PUT') @endif
    <div class="form-grid">
    @foreach($fields as $field => [$label, $kind, $rules])
        @php($value = old($field, $record->$field))
        <div class="field {{ $kind === 'textarea' ? 'wide' : '' }}">
            <label for="{{ $field }}">{{ $label }}</label>
            @if(in_array($kind, ['employees', 'routes', 'vehicles', 'hours', 'status']))
                @php($options = $kind === 'hours' ? [9 => '09:00', 10 => '10:00', 11 => '11:00', 12 => '12:00'] : ($kind === 'status' ? ['work' => 'Munkanap', 'rest' => 'Pihenőnap'] : $choices[$kind]))
                <select id="{{ $field }}" name="{{ $field }}"><option value="">Nincs megadva</option>@foreach($options as $id => $name)<option value="{{ $id }}" @if((string)$value === (string)$id) selected @endif>{{ $name }}</option>@endforeach</select>
            @elseif($kind === 'checkbox')
                <input type="hidden" name="{{ $field }}" value="0"><input id="{{ $field }}" name="{{ $field }}" type="checkbox" value="1" @if($value) checked @endif>
            @elseif($kind === 'textarea')
                <textarea id="{{ $field }}" name="{{ $field }}" rows="4">{{ $value }}</textarea>
            @else
                <input id="{{ $field }}" name="{{ $field }}" type="{{ $kind === 'decimal' ? 'number' : $kind }}" @if($kind === 'decimal') step="0.01" @endif @if(in_array($kind, ['number','decimal'])) min="0" @endif value="{{ $value }}">
            @endif
            @error($field)<span class="field-error">{{ $message }}</span>@enderror
        </div>
    @endforeach
    </div>
    @if($type === 'routes')
    <section class="address-assignment">
        <h2>Címek az útvonalon</h2>
        <p>Jelöld be a hozzáadandó címeket. A sorszámokkal állítható a sorrend. Másik útvonal címe először ott választható le.</p>
        @if($record->exists)<a class="button secondary" href="{{ route('admin.create', ['addresses', 'route_id' => $record->id]) }}">+ Új cím ehhez az útvonalhoz</a>@else<p>Új cím létrehozásához először mentsd az útvonalat.</p>@endif
        <label for="address-filter">Címek szűrése</label><input id="address-filter" type="search" placeholder="Boxazonosító, cím, város…">
        @foreach($addresses as $address)
            <div class="address-option" data-address-search="{{ mb_strtolower($address->box_code.' '.$address->address.' '.$address->city) }}">
                <label><input type="checkbox" name="address_ids[]" value="{{ $address->id }}" @if(in_array($address->id, old('address_ids', session()->hasOldInput() ? [] : ($record->exists && $address->delivery_route_id == $record->id ? [$address->id] : [])))) checked @endif> <span><strong>{{ $address->address }}</strong><small>{{ $address->box_code }} · {{ $address->city }}</small></span></label>
                <input type="number" name="orders[{{ $address->id }}]" min="1" max="99999" value="{{ old('orders.'.$address->id, $address->sort_order) }}" aria-label="{{ $address->box_code }} sorszáma">
            </div>
        @endforeach
        @if($addresses->isEmpty())<p>Még nincs hozzáadható cím.</p>@endif
    </section>
    @endif
    <div class="form-actions"><button>Mentés</button></div>
</form>
@if($type === 'employees' && $record->exists)
<section class="related"><h2>Munkatárs beosztása</h2><div class="record-actions"><a class="button" href="{{ route('admin.create', ['shifts', 'employee_id' => $record->id]) }}">+ Beosztás létrehozása</a><a class="button secondary" href="{{ route('admin.index', ['shifts', 'employee_id' => $record->id]) }}">Beosztás megtekintése</a></div></section>
@endif
@endsection
