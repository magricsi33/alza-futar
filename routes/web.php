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
    return view('home', ['dispatchData' => app(\App\Services\DispatchData::class)->get()]);
});

Route::get('/dispatch/notifications', [\App\Http\Controllers\NoticeController::class, 'index']);
Route::post('/dispatch/notifications/read', [\App\Http\Controllers\NoticeController::class, 'read']);

Route::get('/dispatch/data', function () {
    return response()->json(app(\App\Services\DispatchData::class)->get())->header('Cache-Control', 'no-store, private');
});
Route::get('/dispatch/fuel/{code}', [\App\Http\Controllers\FuelController::class, 'show']);
Route::post('/dispatch/fuel/{code}', [\App\Http\Controllers\FuelController::class, 'store']);
Route::get('/dispatch/exemptions', [\App\Http\Controllers\ExemptionController::class, 'index']);
Route::post('/dispatch/exemptions/import', [\App\Http\Controllers\ExemptionController::class, 'import']);
Route::put('/dispatch/exemptions/{box}', [\App\Http\Controllers\ExemptionController::class, 'update']);
Route::delete('/dispatch/exemptions/{code}', [\App\Http\Controllers\ExemptionController::class, 'clear']);
Route::get('/dispatch/exemptions', [\App\Http\Controllers\ExemptionController::class, 'index']);
Route::post('/dispatch/exemptions/import', [\App\Http\Controllers\ExemptionController::class, 'import']);
Route::post('/dispatch/exemptions/{box}', [\App\Http\Controllers\ExemptionController::class, 'update']);
Route::delete('/dispatch/exemptions/{code}', [\App\Http\Controllers\ExemptionController::class, 'clear']);

Route::get('/admin/login', [\App\Http\Controllers\AdminLoginController::class, 'show'])->name('admin.login');
Route::post('/admin/login', [\App\Http\Controllers\AdminLoginController::class, 'login'])->middleware('throttle:5,1');
Route::prefix('admin')->middleware(\App\Http\Middleware\AdminAccess::class)->group(function () {
    Route::get('/', function () { return redirect()->route('admin.index', 'routes'); });
    Route::post('/logout', [\App\Http\Controllers\AdminLoginController::class, 'logout'])->name('admin.logout');
    Route::get('/notifications', [\App\Http\Controllers\NoticeController::class, 'admin'])->name('admin.notifications');
    Route::post('/notifications', [\App\Http\Controllers\NoticeController::class, 'store']);
    Route::get('/address-data/{id}', [\App\Http\Controllers\AdminController::class, 'addressData'])->whereNumber('id');
    Route::get('/calendar/data', [\App\Http\Controllers\AdminCalendarController::class, 'week']);
    Route::get('/calendar/availability', [\App\Http\Controllers\AdminCalendarController::class, 'availability']);
    Route::get('/{type}', [\App\Http\Controllers\AdminController::class, 'index'])->name('admin.index');
    Route::get('/{type}/create', [\App\Http\Controllers\AdminController::class, 'form'])->name('admin.create');
    Route::post('/{type}', [\App\Http\Controllers\AdminController::class, 'save'])->name('admin.store');
    Route::get('/{type}/{id}/edit', [\App\Http\Controllers\AdminController::class, 'form'])->whereNumber('id')->name('admin.edit');
    Route::put('/{type}/{id}', [\App\Http\Controllers\AdminController::class, 'save'])->whereNumber('id')->name('admin.update');
    Route::delete('/{type}/{id}', [\App\Http\Controllers\AdminController::class, 'destroy'])->whereNumber('id')->name('admin.destroy');
});

Route::get('/address-info/session', function () {
    return response()->json(['token' => csrf_token()])->header('Cache-Control', 'no-store, private');
});
Route::get('/address-info/notes', [AddressInfoController::class, 'notes']);
Route::get('/address-info/{id}', [AddressInfoController::class, 'show'])->where('id', 'AB[0-9]{3,6}');
Route::post('/address-info/{id}', [AddressInfoController::class, 'update'])->where('id', 'AB[0-9]{3,6}');
Route::get('/address-info/{id}/photos/{photo}', [AddressInfoController::class, 'photo'])
    ->where(['id' => 'AB[0-9]{3,6}', 'photo' => '[a-f0-9-]{36}'])->name('address-info.photo');
