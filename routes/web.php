<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AddressInfoController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('home');
});

Route::get('/address-info/session', function () {
    return response()->json(['token' => csrf_token()])->header('Cache-Control', 'no-store, private');
});
Route::get('/address-info/{id}', [AddressInfoController::class, 'show'])->where('id', 'AB[0-9]{3,6}');
Route::post('/address-info/{id}', [AddressInfoController::class, 'update'])->where('id', 'AB[0-9]{3,6}');
Route::get('/address-info/{id}/photos/{photo}', [AddressInfoController::class, 'photo'])
    ->where(['id' => 'AB[0-9]{3,6}', 'photo' => '[a-f0-9-]{36}'])->name('address-info.photo');
