<?php

namespace App\Http\Middleware;

use Closure;

class AdminAccess
{
    public function handle($request, Closure $next)
    {
        if (!$request->session()->get('dispatch_admin')) return redirect()->route('admin.login');
        return $next($request)->header('Cache-Control', 'no-store, private');
    }
}
