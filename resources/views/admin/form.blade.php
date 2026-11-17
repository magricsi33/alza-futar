@extends('admin.layout')
@section('content')
<div class="page-heading"><div><p class="eyebrow">{{ $title }}</p><h1>{{ $record->exists ? 'Szerkesztés' : 'Létrehozás' }}</h1></div><a class="button secondary" href="{{ route('admin.index', $type) }}">Vissza a listához</a></div>
<form method="post" action="{{ $record->exists ? route('admin.update', [$type, $record->id]) : route('admin.store', $type) }}" class="edit-form">
    @csrf @if($record->exists) @method('PUT') @endif
    @if($type === 'shifts' && $record->exists)<input type="hidden" name="revision" value="{{ $record->revision }}">@endif
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
        <p>Jelöld be a hozzáadandó címeket. A fogantyúval húzva állítható a sorrend; a Mentés gomb rögzíti a változtatásokat.</p>
        @if($record->exists)<button type="button" class="secondary" id="address-create-open">+ Új cím ehhez az útvonalhoz</button>@else<p>Új cím létrehozásához először mentsd az útvonalat.</p>@endif
        <input type="hidden" name="exempt_selection" value="1">
        <label for="address-filter">Címek szűrése</label><input id="address-filter" type="search" placeholder="Boxazonosító, cím, város…">
        <p id="address-order-status" class="muted" role="status"></p>
        <div id="route-address-list">
        @foreach($addresses as $address)
            <div class="address-option" data-address-id="{{ $address->id }}" data-address-search="{{ mb_strtolower($address->box_code.' '.$address->address.' '.$address->city) }}">
                <button type="button" class="drag-handle secondary" aria-label="{{ $address->box_code }} mozgatása, fel és le nyíllal is" title="Húzd a sorrend módosításához">☰</button>
                <span class="order-number" data-order-number>{{ $loop->iteration }}</span>
                <label class="address-attach"><input type="checkbox" name="address_ids[]" value="{{ $address->id }}" @if(in_array($address->id, old('address_ids', session()->hasOldInput() ? [] : ($record->exists && $address->delivery_route_id == $record->id ? [$address->id] : [])))) checked @endif><span><strong>{{ $address->address }}</strong><small>{{ $address->box_code }} · {{ $address->city }}</small></span></label>
                <label class="exempt-toggle"><input type="checkbox" name="exempt_ids[]" value="{{ $address->id }}" @if(in_array($address->id, old('exempt_ids', session()->hasOldInput() ? [] : ($address->is_exempt ? [$address->id] : [])))) checked @endif> Mentesített</label>
                <input type="hidden" name="orders[{{ $address->id }}]" value="{{ old('orders.'.$address->id, $address->sort_order) }}">
            </div>
        @endforeach
        </div>
        <p id="address-list-empty" @if($addresses->isNotEmpty()) hidden @endif>Még nincs hozzáadható cím.</p>
    </section>
    @endif
    <div class="form-actions"><button>Mentés</button></div>
</form>
@if($type === 'routes' && $record->exists)
    @include('admin.address-modal')
@endif
@if($type === 'employees' && $record->exists)
<section class="related"><h2>Munkatárs beosztása</h2><div class="record-actions"><a class="button" href="{{ route('admin.index', ['shifts', 'employee_id' => $record->id, 'create_employee' => $record->id]) }}">+ Beosztás létrehozása</a><a class="button secondary" href="{{ route('admin.index', ['shifts', 'employee_id' => $record->id]) }}">Beosztás megtekintése</a></div></section>
@endif
@endsection
