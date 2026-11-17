<dialog id="schedule-notify-dialog" aria-labelledby="schedule-notify-title">
    <div class="modal-heading"><h2 id="schedule-notify-title">Beosztás módosítási értesítés</h2><button type="button" class="secondary modal-close" data-close-dialog="schedule-notify-dialog" aria-label="Bezárás">×</button></div>
    <p>Biztosan értesíted az összes munkatársat a beosztás módosításáról?</p>
    <p id="schedule-notify-week" class="muted"></p>
    <form class="notify-form">
        <input type="hidden" name="kind" value="schedule"><input type="hidden" name="request_id" value="{{ \Illuminate\Support\Str::uuid() }}"><input type="hidden" name="week_start">
        <label for="schedule-notify-note">Megjegyzés (nem kötelező)</label><textarea id="schedule-notify-note" name="body" rows="4" maxlength="5000"></textarea>
        <p class="notify-status" role="status"></p><div class="modal-actions"><button type="button" class="secondary" data-close-dialog="schedule-notify-dialog">Mégse</button><button type="submit">Értesítés küldése</button></div>
    </form>
</dialog>
