<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex,nofollow,noarchive">
    <meta name="referrer" content="no-referrer">
    <title>{{ $title ?? 'Belépés' }} · AlzaFutár admin</title>
    <link rel="stylesheet" href="/css/admin.css">
</head>
<body>
<header class="admin-header">
    <a href="/admin" class="brand">AlzaFutár <span>Admin</span></a>
    <div class="header-actions"><a href="/">Futárfelület ↗</a>
        @if(session('dispatch_admin'))<form action="{{ route('admin.logout') }}" method="post">@csrf<button class="secondary">Kilépés</button></form>@endif
    </div>
</header>
@if(session('dispatch_admin'))
<nav class="admin-nav" aria-label="Admin navigáció">
    @foreach(['routes' => 'Útvonalak', 'addresses' => 'Címek', 'employees' => 'Munkatársak', 'shifts' => 'Beosztás', 'vehicles' => 'Gépjárművek'] as $key => $label)
        <a href="{{ route('admin.index', $key) }}" @if(($type ?? '') === $key) aria-current="page" @endif>{{ $label }}</a>
    @endforeach
</nav>
@endif
<main>
    @if(session('status'))<p class="notice" role="status">{{ session('status') }}</p>@endif
    @if($errors->any())<div class="error" role="alert"><strong>A mentés nem sikerült.</strong><ul>@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>@endif
    @yield('content')
</main>
<script src="/js/admin.js" defer></script>
</body>
</html>
