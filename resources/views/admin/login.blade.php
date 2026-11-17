@extends('admin.layout')
@section('content')
<section class="login-card">
    <p class="eyebrow">ALZAFUTÁR ADMIN</p>
    <h1>Belépés</h1>
    <p>Add meg a hatjegyű admin PIN-kódot.</p>
    <form method="post" action="{{ route('admin.login') }}">
        @csrf
        <label for="pin">PIN-kód</label>
        <input id="pin" name="pin" type="password" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="current-password" required autofocus>
        <button>Belépés</button>
    </form>
</section>
@endsection
