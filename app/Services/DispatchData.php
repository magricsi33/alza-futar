<?php

namespace App\Services;

use App\Models\{DeliveryRoute, Employee, Vehicle, Shift};

class DispatchData
{
    public function get()
    {
        $routes = DeliveryRoute::with('addresses')->orderBy('code')->get();
        $shifts = Shift::with(['route', 'vehicle'])->orderBy('date')->get();
        $days = $shifts->pluck('date')->unique()->sort()->values()->all();
        $people = Employee::orderBy('name')->get()->map(function ($person) use ($days, $shifts) {
            $byDate = $shifts->where('employee_id', $person->id)->keyBy('date');
            return ['id' => $person->slug, 'dbId' => $person->id, 'name' => $person->name, 'active' => (bool) $person->active,
                'cells' => array_map(function ($date) use ($byDate) {
                    $shift = $byDate->get($date);
                    if (!$shift) return '';
                    if ($shift->status === 'rest') return 'PIHEN';
                    return trim(($shift->route ? $shift->route->code : ($shift->task ?: 'Munkanap')).' '.($shift->vehicle ? $shift->vehicle->plate : '').' '.$shift->note);
                }, $days)];
        })->all();
        $fuel = []; $ramps = []; $intervals = [];
        foreach ($routes as $route) {
            if ($route->km !== null || $route->fuel_liters !== null || $route->fuel_amount !== null) {
                $fuel[$route->code] = ['code' => $route->fuel_code, 'km' => $route->km === null ? null : (float) $route->km,
                    'liters' => $route->fuel_liters === null ? null : (float) $route->fuel_liters, 'amount' => $route->fuel_amount];
            }
            $ramps[$route->code] = ['ramp' => $route->ramp, 'departure' => $route->departure];
            $intervals[$route->code] = $route->fuel_interval;
        }
        return [
            'tours' => $routes->reject(function ($route) { return $route->code === 'exempt'; })->values()->map(function ($route) {
                return ['id' => $route->code, 'name' => $route->name, 'employeeId' => $route->employee_id,
                    'stops' => $route->addresses->map(function ($address) use ($route) {
                        return [$address->box_code, $address->address, $address->city, $address->location ?: '', sprintf('%02d:00', $address->deadline_hour ?: $route->deadline_hour)];
                    })->all()];
            })->all(),
            'days' => $days, 'people' => $people, 'fuel' => $fuel, 'ramps' => $ramps, 'intervals' => $intervals,
            'exempt' => $routes->mapWithKeys(function ($route) { return [$route->code => $route->addresses->where('is_exempt', true)->pluck('box_code')->values()->all()]; })->all(),
            'vehicles' => Vehicle::orderBy('plate')->get(['id', 'plate'])->toArray(),
            'exempt' => app(\App\Http\Controllers\ExemptionController::class)->data()['exempt'],
        ];
    }
}
