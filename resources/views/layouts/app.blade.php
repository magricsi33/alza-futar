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

        <title>Úton · Futár címkezelő</title>

        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/icons/ios/32.png" type="image/png" sizes="32x32">
        <link rel="icon" href="/icons/android/launchericon-192x192.png" type="image/png" sizes="192x192">
        <link rel="apple-touch-icon" href="/icons/ios/180.png" sizes="180x180">
        <link rel="stylesheet" href="{{ mix('css/app.css') }}">

        <script defer src="{{ mix('js/app.js') }}"></script>
    </head>

    <body>
        @yield('content')
    </body>
</html>
