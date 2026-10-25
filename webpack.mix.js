const mix = require('laravel-mix');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

mix.js('resources/js/app.js', 'public/js')
   .postCss('resources/css/app.css', 'public/css', [
       require('tailwindcss'),
       require('autoprefixer'),
   ])
   .browserSync({
       proxy: '127.0.0.1:8000',
       open: false,
       notify: false,
   });

if (mix.inProduction()) {
    mix.version();
}