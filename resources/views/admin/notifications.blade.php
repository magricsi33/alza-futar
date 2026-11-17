@extends('admin.layout')
@section('content')
<div class="page-heading"><div><p class="eyebrow">MUNKATÁRSAK TÁJÉKOZTATÁSA</p><h1>Értesítések</h1></div></div>
<form class="edit-form notify-form" data-confirm="Elküldöd ezt az értesítést az összes munkatársnak?" data-reload="true">
    <h2>Szöveges értesítés létrehozása</h2>
    <p class="muted">Az üzenet minden munkatárs értesítései között megjelenik.</p>
    <input type="hidden" name="kind" value="text"><input type="hidden" name="request_id" value="{{ \Illuminate\Support\Str::uuid() }}">
    <div class="form-grid">
        <div class="wide"><label for="notice-title">Cím</label><input id="notice-title" name="title" required maxlength="120"></div>
        <div class="wide"><label for="notice-body">Üzenet</label><textarea id="notice-body" name="body" required rows="4" maxlength="5000"></textarea></div>
    </div>
    <p class="notify-status" role="status"></p><div class="form-actions"><button><i class="fi fi-rr-bell" aria-hidden="true"></i> Értesítés küldése</button></div>
</form>
<div class="record-list related-notices">
@forelse($notices as $notice)
    <article class="record"><div class="record-content"><span class="badge">{{ $notice->kind === 'schedule' ? 'Beosztás' : 'Üzenet' }}</span><h2>{{ $notice->title }}</h2><p class="muted">{{ $notice->created_at->timezone('Europe/Budapest')->format('Y. m. d. H:i') }}</p><p class="notice-body">{{ $notice->body }}</p></div></article>
@empty
    <p class="empty">Még nincs elküldött értesítés.</p>
@endforelse
</div>
<nav class="pagination" aria-label="Lapozás">@if($notices->previousPageUrl())<a class="button secondary" href="{{ $notices->previousPageUrl() }}">← Előző</a>@endif<span>{{ $notices->currentPage() }} / {{ $notices->lastPage() }}</span>@if($notices->nextPageUrl())<a class="button secondary" href="{{ $notices->nextPageUrl() }}">Következő →</a>@endif</nav>
@endsection
