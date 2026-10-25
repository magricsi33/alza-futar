const mix = require('laravel-mix');

mix.js('resources/js/app.js', 'public/js')
   .postCss('resources/css/app.css', 'public/css', [
       require('tailwindcss'),
       require('autoprefixer'),
   ])
   .browserSync({
       proxy: '127.0.0.1:' + (process.env.FUTAR_SERVER_PORT || '8000'),
       port: Number(process.env.FUTAR_SYNC_PORT || 3000),
       listen: '127.0.0.1',
       host: '127.0.0.1',
       ui: false,
       open: false,
       notify: false,
   });

if (mix.inProduction()) {
    mix.version();
}
