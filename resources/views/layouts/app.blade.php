<!DOCTYPE html>
<html lang="hu">
    <head>
        <meta charset="UTF-8">
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
        <meta name="referrer" content="no-referrer">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#00275B">
        <meta name="msapplication-TileColor" content="#00275B">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="AlzaFutár">
        <meta name="application-name" content="AlzaFutár">

        <title>AlzaFutár</title>

        <link rel="manifest" href="/manifest.webmanifest?v=5">
        <link rel="icon" href="/favicon.ico?v=4" type="image/x-icon" sizes="48x48">
        <link rel="icon" href="/favicon.svg?v=4" type="image/svg+xml" sizes="any">
        <link rel="apple-touch-icon" href="/apple-touch-icon-alzafutar-v5.png" sizes="180x180">
        <link rel="stylesheet" href="{{ mix('css/app.css') }}">

        <script defer src="{{ mix('js/app.js') }}"></script>
    </head>

    <body>
        @yield('content')
    </body>
</html>
