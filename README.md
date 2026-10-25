# Úton – futár címkezelő

Mobilra optimalizált Laravel 8 alkalmazás, felhasználó és adatbázis nélkül.

## Indítás
A meglévő függőségekkel: npm run production, majd php artisan serve.
A helyi cím: http://127.0.0.1:8000. A webszerver dokumentumgyökere élesben a public könyvtár legyen.

## Címek és mentés
A resources/js/tours.js tartalmazza a túrákat. S: a kapott kép 12 címe, eredeti sorrendben. V: üres helyőrző, a címlista még nincs megadva.
Minden cím adatai: azonosító, utca/házszám, irányítószám/település, helyszín neve. Módosítás után npm run production szükséges.
A pipák túránként, a kiválasztott túra és a fennmaradó-szűrő a localStorage uton-state-v1 kulcsába kerülnek. Az adatok ezen az eszközön és böngészőben maradnak. Böngészőadatok törlése törli a haladást. Az újrakezdés megerősítés után csak a kiválasztott túrát nullázza.
A címek Waze keresési/navigációs linkek, nem ellenőrzött GPS-koordináták.

## PWA
Manifest, 192/512 px ikonok, maskable ikon, Apple kezdőképernyő-ikon és service worker a public könyvtárban.
Telepítéshez és offline működéshez HTTPS (fejlesztéskor localhost) szükséges. Telefonról egyszerű HTTP LAN-címen a PWA nem működik.
Első sikeres online megnyitás és a service worker települése után a lista offline is használható. A Waze külön alkalmazás, működése hálózattól és saját offline képességeitől függ.
Androidon a Telepítés gomb vagy böngészőmenü; iPhone-on Safari → Megosztás → Főképernyőhöz adás.
Kiadáskor a public/sw.js CACHE verzióját növelni kell, és az új builddel együtt feltölteni. A várakozó frissítés minden régi alkalmazásablak bezárása után aktiválódik.
