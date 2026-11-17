# AlzaFutár

Mobilra optimalizált Laravel 8 futárfelület, MySQL-adatbázissal és PIN-kóddal védett adminisztrációval.

## Telepítés / frissítés szerveren

A webszerver dokumentumgyökere a public könyvtár. A storage és bootstrap/cache legyen írható a PHP számára. A PHP PDO MySQL, fileinfo és mbstring bővítmény szükséges.

1. Kód frissítése: git pull.
2. Függőségek: composer install --no-dev --optimize-autoloader.
3. A .env DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD értékeit a céladatbázishoz állítsd be. A fejlesztői adatbázis neve project_alza_futar. Élesben APP_ENV=production, APP_DEBUG=false és helyes HTTPS APP_URL szükséges.
4. php artisan config:clear
5. php artisan migrate --force
6. Az első átálláskor: php artisan db:seed --class=DispatchSeeder --force
7. php artisan view:clear
8. php artisan config:cache

A public/css és public/js kiadási buildjei a repositoryban vannak. Forrásmódosításkor npm ci, majd npm run production szükséges.

Az import a database/seeders/data/dispatch.json pillanatképből tölti be a 12 útvonalat, 189 címet, munkatársakat, rendszámokat és a november 11–22-i beosztást a november 16–18-i javításokkal. Ismételt futtatáskor a meglévő rekordokat nem módosítja. Az importot csak az átálláskor használd: később az adminban kezeld az adatokat; egy törölt rekordot az import újra létrehozhat. A normál db:seed is ezt az importot futtatja.

## Admin

Elérés: /admin. A belépés a megbeszélt hatjegyű PIN-nel történik; hibás próbálkozásból IP-címenként öt engedélyezett percenként. A PIN ellenőrzéséhez csak bcrypt hash szerepel a konfigurációban. Saját PIN-hez az ADMIN_PIN_HASH környezeti változóban adhatsz meg új, bcrypt hash-t, egyes idézőjelek között; utána php artisan config:cache.

Oldalak:
- Útvonalak: keresés, létrehozás, szerkesztés, törlés; munkatárs hozzárendelése, 09/10/11/12 órás befejezés, rámpa és indulás, km/liter/Ft és tankolási gyakoriság.
- Címek: létrehozás, keresés, szerkesztés, törlés. A boxazonosító AB és 3–6 számjegy. Egy cím egyetlen útvonalhoz kapcsolódhat; másikhoz rendelés előtt az eredeti útvonalon válaszd le. Az útvonallapon meglévő szabad címek csatolhatók és leválaszthatók. A sorrend a fogantyúval húzva (érintőképernyőn is), vagy a fogantyúra fókuszálva a fel/le nyíllal módosítható, és az útvonal Mentés gombja rögzíti. Az új cím az útvonallapon modalban hozható létre, az oldal elhagyása és a többi mező elvesztése nélkül. A cím saját határideje felülírja az útvonal általános határidejét.
- Munkatársak: létrehozás, keresés, szerkesztés, törlés, beosztás létrehozása és szűrt listája. Inaktív munkatárs nem jelenik meg a futár személyválasztójában, az előzmények megmaradnak. Törléskor a munkatárs beosztása is törlődik.
- Beosztás: egy munkatárs egy napjára egy bejegyzés. Útvonal, jármű, egyéb feladat és megjegyzés állítható. Pihenőnapnál az útvonal/jármű/feladat törlődik. Hiányzó rekord = nincs megadott beosztás. Az új napok nem törlik a korábbiakat.
- Gépjárművek: rendszám alapján keresés, létrehozás, szerkesztés, törlés, legutóbbi tankolás. A 3 vagy 4 betű + 3 szám formátum támogatott; a beírt szóköz és kötőjel normalizálódik.

Útvonal törlésekor a címek megmaradnak, útvonal nélküli címekké válnak. Jármű vagy útvonal törlése az előzménybejegyzések kapcsolását megszünteti, ezért a törlési megerősítést figyelmesen olvasd el.

## Futárfelület és közös tankolás

A címek, útvonalak, rámpák, tankolási keretek, munkatársak és heti beosztás a Laravel által adatbázisból kerülnek a futárfelületre. Adminmódosítás után frissítsd az alkalmazást; adatváltoztatáshoz nem kell JavaScript-build. Az első útvonal alapértelmezetten S, ha létezik. A felső személyválasztó kényelmi választás, nem felhasználói belépés.

A tankolás az adott útvonalhoz közös szerveres adat. A modalban jármű is választható: az aznapi útvonal egyértelmű rendszáma előre kiválasztódik, a rögzítés az útvonal és a kiválasztott gépjármű legutóbbi tankolását is frissíti. Ismeretlen rendszámnál csak az útvonal frissül. Korábbi dátum rögzítése nem írja felül az újabb legutóbbi tankolást. Dátumjavítás az adminban lehetséges. Előzménylista nincs. A futárfelület tankoláskor, nézet- és útvonalváltáskor, lapfókuszkor és kapcsolat-visszatéréskor a szervert kéri le. Offline tankolás nem rögzíthető, sikertelen kérés nem jelez mentést. A korábbi eszközön tárolt dátumokat nem importáljuk.

A QR-kód továbbra is csak az adott eszközön marad. A haladás, a Waze/Google Maps választás és a kiválasztott személy szintén helyi adat. A mentesítések közös adatbázisos jelölések; az admin címűrlapján és útvonallapján is módosíthatók. Az összes mentesített címet a Mentesített gyűjtőútvonal mutatja. Ezeket a böngészőadatok törlése törli.

## Címinformációk és fotók

A megjegyzések és képek közösen a storage/app/address-info könyvtárban maradnak, AB-azonosítóhoz kötve; ezt a funkciót az adatbázisra váltás nem törli. A könyvtárat telepítéskor őrizd meg és mentsd az adatbázissal együtt. A boxazonosító módosítása új információs kulcsot jelent.

Címenként legfeljebb 12, egyenként 20 MB-os kép tárolható. PHP upload_max_filesize legalább 20M, több nagy képhez post_max_size és a webszerver kérésméretkorlátja pl. 256M. Nem kell storage:link. A kamera megnyitását a telefon kezeli. A lista megjegyzései kötegelt kérésből töltődnek, a modal minden megnyitáskor friss adatot kér.

## Helyi indítás és tesztek

Windows: start-all.bat / stop-all.bat. A scriptek háttérben indítják a Laravel szervert és a buildfigyelőt, a foglalt portokat kihagyják. Az adatbázist előtte hozd létre, majd futtasd a migrációt és az első importot. Az önálló start-server.bat a 8000-es portot használja.

Frontend: node --test tests/frontend/app.test.cjs
Szerver: php vendor/phpunit/phpunit/phpunit

A szervertesztek a phpunit.xml alapján kizárólag SQLite :memory: adatbázist használnak, a .env MySQL-adatbázisát nem módosítják. A helyi C:\php7 környezetben: C:\php7\php.exe -d extension=pdo_sqlite vendor/phpunit/phpunit/phpunit. A tesztadatok minden teszt után visszaállnak.

## PWA és belső használat

A telepítés HTTPS-t igényel (fejlesztéskor localhost is jó). iPhone: Safari → Megosztás → Főképernyőhöz adás. A PWA az utolsó sikeres online címlistát/beosztást offline is megnyitja; a tankolás és a közös címinformációk internetkapcsolatot igényelnek. Az admin és a /dispatch API nem kerül a service worker gyorsítótárába. Kiadáskor a public/sw.js CACHE verzióját növelni kell; frissítéshez zárd be az összes régi alkalmazásablakot.

A robots.txt, robots meta és X-Robots-Tag tiltja az indexelést. Ez nem hozzáférés-védelem: a futárfelület belépés nélkül elérhető, az admin PIN-nel védett. A Referrer-Policy megakadályozza az oldal címének továbbküldését.

Flaticon Uicons 4.0.0 regular-rounded: CSS és WOFF2 a public/vendor/flaticon könyvtárban. Az alkalmazás alján szerepel a forrásmegjelölés. Útmutató: https://www.flaticon.com/uicons/get-started/

## Admin naptár és közös mentesítés
A /admin/shifts heti naptár. Felül hétváltó és szűrők, az oszlopokban napok, a sorokban munkatársak láthatók. A fejléc és a bal névoszlop görgetéskor rögzített, mobilon a tábla oldalra görgethető. Üres vagy kitöltött cellára kattintva modalban lehet létrehozni, szerkeszteni vagy törölni. A munkanaphoz az aznap szabad útvonalak és gépjárművek választhatók, a saját hozzárendelés szerkesztéskor megtartható. Az egyéb feladatok és pihenőnapok továbbra is kezelhetők.

A foglaltságot a szerver tranzakcióban, naponkénti zárolással ellenőrzi; azonos napi útvonal vagy gépjármű nem foglalható másik munkatárshoz. A korábbi importált ütközéseket nem töröljük automatikusan. Egy közben módosított beosztás régi revízióval nem írható felül: 409 válasz érkezik; a cella újranyitása friss adatot tölt be. A beosztás egy munkatárs/nap párosra továbbra is egyedi.

A mentesítések a delivery_addresses.is_exempt mezőben vannak. A futárfelület első sikeres online kapcsolódáskor a régi helyi mentesítéseket egyszer importálja, utána a közös állapotot mutatja, lapfókuszkor és kapcsolat-visszatéréskor is frissítve. Offline az utolsó ismert állapot látható, mentesítés mentéséhez vagy törléséhez kapcsolat szükséges. Adminban módosított jelölés is bekerül a Mentesített gyűjtőútvonalra. Aki a mentesítéseket törli, a közös állapotot módosítja.

Ehhez a kiadáshoz új migráció tartozik: frissítéskor php artisan migrate --force és php artisan view:clear szükséges. Újraimportálás nem szükséges.
