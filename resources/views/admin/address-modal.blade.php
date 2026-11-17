<dialog id="address-create-dialog" aria-labelledby="address-create-title">
    <div class="modal-heading"><h2 id="address-create-title">Új cím</h2><button type="button" class="secondary modal-close" data-close-dialog="address-create-dialog" aria-label="Bezárás">×</button></div>
    <form id="address-create-form" data-route-id="{{ $record->id }}">
        <input type="hidden" name="delivery_route_id" value="{{ $record->id }}">
        <p class="muted">{{ $record->name }}</p>
        <div class="form-grid">
            <div><label for="new-box">Boxazonosító</label><input id="new-box" name="box_code" pattern="AB[0-9]{3,6}" required placeholder="AB1234"></div>
            <div><label for="new-address">Utca, házszám</label><input id="new-address" name="address" required maxlength="255"></div>
            <div><label for="new-city">Irányítószám, település</label><input id="new-city" name="city" required maxlength="255"></div>
            <div><label for="new-location">Helyszín neve</label><input id="new-location" name="location" maxlength="255"></div>
            <div><label for="new-deadline">Befejezési idő</label><select id="new-deadline" name="deadline_hour"><option value="">Útvonal szerint</option>@foreach([9,10,11,12] as $hour)<option value="{{ $hour }}">{{ sprintf('%02d:00', $hour) }}</option>@endforeach</select></div>
            <div><label for="new-exempt">Mentesített cím</label><input id="new-exempt" name="is_exempt" type="checkbox" value="1"></div>
        </div>
        <p id="address-create-status" role="status" aria-live="polite"></p>
        <div class="form-actions"><button type="submit">Cím létrehozása</button></div>
    </form>
</dialog>
