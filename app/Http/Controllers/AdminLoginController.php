<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminLoginController extends Controller
{
    public function show() { return response()->view('admin.login')->header('Cache-Control', 'no-store, private'); }
    public function login(Request $request)
    {
        $data = $request->validate(['pin' => 'required|digits:6']);
        if (!Hash::check($data['pin'], config('admin.pin_hash'))) return back()->withErrors(['pin' => 'Hibás PIN-kód.']);
        $request->session()->regenerate();
        $request->session()->put('dispatch_admin', true);
        return redirect()->route('admin.index', 'routes');
    }
    public function logout(Request $request)
    {
        $request->session()->forget('dispatch_admin');
        $request->session()->regenerate();
        $request->session()->regenerateToken();
        return redirect()->route('admin.login');
    }
}
