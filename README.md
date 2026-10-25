# Úton – futár címkezelő

## Belső használat és keresőrobotok
A robots.txt minden útvonal feltérképezését tiltja. A HTML robots metát, a Laravel válaszok X-Robots-Tag fejlécet kapnak (noindex, nofollow, noarchive, nosnippet, noimageindex). Apache mod_headers és IIS alatt a statikus fájlokra is be van állítva a fejléc. Nginx esetén a szerverkonfigurációban is szükséges: `add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex" always;`.
Ezek keresőrobotoknak szóló jelzések, nem hozzáférés-védelem. A robots.txt tiltása miatt a kereső nem feltétlenül tudja kiolvasni a noindex jelzést; egy máshonnan ismert URL ettől még megjelenhet a találatokban. Korábban indexelt oldal eltávolítását külön kell intézni. Valóban belső eléréshez a tárhelyen VPN/IP-korlátozás vagy HTTP-hitelesítés szükséges. A Referrer-Policy megakadályozza az oldal címének továbbküldését külső navigációkor.

Mobilra optimalizált Laravel 8 alkalmazás, felhasználó és adatbázis nélkül.

## Indítás
Windows alatt a `start-all.bat` indítja a Laravel szervert és a buildfigyelőt a háttérben. A foglalt portokat kihagyja, és kiírja a tényleges elérési címet (alapból 127.0.0.1:3000). Csak működő HTTP-válasz után jelez sikert. Ismételt indításkor a saját, már működő példányt használja. Leállítás: `stop-all.bat`. Naplók: `storage/logs/local-*.log`. A `scripts/local-dev.ps1` végzi az indítást; a PHP és Node legyen elérhető a PATH-ban.
Az önálló `start-server.bat` továbbra is a 8000-es portot használja; foglalt portnál hibával megáll. A `start-watch.bat` ehhez a porthoz kapcsolódik. Automatikus portválasztáshoz mindig a `start-all.bat` fájlt használd.

A meglévő függőségekkel: npm run production, majd php artisan serve.
A helyi cím: http://127.0.0.1:8000. A webszerver dokumentumgyökere élesben a public könyvtár legyen.

## Címek és mentés
### Beosztás
A `resources/js/schedule.js` tartalmazza a kiadott időszak dátumait és a 18 személy sorait. Jelenleg 2026. október 23–30. szerepel (a kapott kép 8 dátumoszlopa). Új heti beosztáskor a dátumlistát és a személyek napi celláit együtt kell frissíteni, az állandó személyazonosítókat megőrizve, majd `npm run production` szükséges. Az üres cella hiányzó adat, a PIHEN pihenőnap; a többi cellában az első betű az útvonal, a négy betűből és három számból álló rész a rendszám. A fennmaradó jelölések megjegyzésként jelennek meg. Nem generálunk beosztást a kiadott időszakon kívül.
A személyválasztást a böngésző `alzafutar-person-v1` localStorage kulcsa menti, az útvonal haladásától külön. Ez kényelmi választó, nem bejelentkezés. A Telepítés blokk mindkét nézet legalján található.

A resources/js/tours.js tartalmazza a képekről rögzített 12 túrát, összesen 189 megállóval: A (16), B (18), C (18), D (16), E (13), F (18), O (22), Q (18), S (12), T (14), U (13), V (11). A túrák betűrendben, megállóik a képek szerinti sorrendben jelennek meg. A kétszer beküldött U túra egyszer szerepel. A címek a jobb oldali címoszlopot követik; az O túra AB9264 megállójánál a forrásban csak „2823/1, 2730 Albertirsa” szerepel, ezért annak Waze-találata külön ellenőrzendő. A C túra forrásában szereplő Kistarcsa/Kerepes irányítószámokat változatlanul megőriztük.
Minden cím adatai: azonosító, utca/házszám, irányítószám/település, helyszín neve. Módosítás után npm run production szükséges.
A pipák túránként, a kiválasztott túra és a fennmaradó-szűrő a localStorage uton-state-v1 kulcsába kerülnek. Az adatok ezen az eszközön és böngészőben maradnak. Böngészőadatok törlése törli a haladást. Az újrakezdés megerősítés után csak a kiválasztott túrát nullázza.
A címek Waze keresési/navigációs linkek, nem ellenőrzött GPS-koordináták.

## PWA
Manifest, 192/512 px ikonok, maskable ikon, Apple kezdőképernyő-ikon és service worker a public könyvtárban.
Telepítéshez és offline működéshez HTTPS (fejlesztéskor localhost) szükséges. Telefonról egyszerű HTTP LAN-címen a PWA nem működik.
Első sikeres online megnyitás és a service worker települése után a lista offline is használható. A Waze külön alkalmazás, működése hálózattól és saját offline képességeitől függ.
Androidon a Telepítés gomb vagy böngészőmenü; iPhone-on Safari → Megosztás → Főképernyőhöz adás.
Kiadáskor a public/sw.js CACHE verzióját növelni kell, és az új builddel együtt feltölteni. A várakozó frissítés minden régi alkalmazásablak bezárása után aktiválódik.
