<?php

namespace App\Http\Controllers;

use App\Models\{DeliveryRoute, Vehicle};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FuelController extends Controller
{
    public function show($code)
    {
        $route = DeliveryRoute::where('code', $code)->firstOrFail();
        return response()->json(['date' => $route->last_refueled_at])->header('Cache-Control', 'no-store, private');
    }
    public function store(Request $request, $code)
    {
        $data = $request->validate([
            'date' => 'required|date_format:Y-m-d|before_or_equal:'.now('Europe/Budapest')->toDateString(),
            'vehicle_id' => 'nullable|integer|exists:vehicles,id',
        ]);
        return DB::transaction(function () use ($code, $data) {
            $route = DeliveryRoute::where('code', $code)->lockForUpdate()->firstOrFail();
            if (!$route->last_refueled_at || $route->last_refueled_at < $data['date']) {
                $route->update(['last_refueled_at' => $data['date']]);
            }
            if (!empty($data['vehicle_id'])) {
                $vehicle = Vehicle::lockForUpdate()->findOrFail($data['vehicle_id']);
                if (!$vehicle->last_refueled_at || $vehicle->last_refueled_at < $data['date']) $vehicle->update(['last_refueled_at' => $data['date']]);
            }
            return response()->json(['date' => $route->last_refueled_at])->header('Cache-Control', 'no-store, private');
        });
    }
}
