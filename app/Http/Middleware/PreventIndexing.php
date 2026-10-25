<?php

namespace App\Http\Middleware;

use Closure;

class PreventIndexing
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
    }
}
