<?php

namespace Database\Seeders;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Vehicle, Shift};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DispatchSeeder extends Seeder
{
    public function run()
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/dispatch.json')), true, 512, JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($data) {
            foreach ($data['people'] as $person) {
                Employee::firstOrCreate(['slug' => $person['id']], ['name' => $person['name'], 'active' => in_array($person['id'], $data['active'], true)]);
            }
            foreach ($data['tours'] as $tour) {
                $ramp = $data['ramps'][$tour['id']];
                $fuel = $data['fuel'][$tour['id']] ?? [];
                $route = DeliveryRoute::firstOrCreate(['code' => $tour['id']], [
                    'name' => $tour['name'], 'deadline_hour' => (int) $tour['stops'][0][4],
                    'ramp' => $ramp['ramp'], 'departure' => $ramp['departure'],
                    'km' => $fuel['km'] ?? null, 'fuel_liters' => $fuel['liters'] ?? null,
                    'fuel_amount' => $fuel['amount'] ?? null, 'fuel_code' => $fuel['code'] ?? null,
                    'fuel_interval' => $data['intervals'][$tour['id']] ?? 1,
                ]);
                foreach ($tour['stops'] as $index => $stop) {
                    DeliveryAddress::firstOrCreate(['box_code' => $stop[0]], [
                        'delivery_route_id' => $route->id, 'address' => $stop[1], 'city' => $stop[2],
                        'location' => $stop[3], 'deadline_hour' => (int) $stop[4], 'sort_order' => $index + 1,
                    ]);
                }
            }
            foreach ($data['people'] as $person) {
                $employee = Employee::where('slug', $person['id'])->firstOrFail();
                foreach ($data['days'] as $index => $date) {
                    $cell = $person['cells'][$index];
                    if (!$cell) continue;
                    preg_match('/\b[A-Z]{3,4}\d{3}\b/', $cell, $plate);
                    $vehicle = $plate ? Vehicle::firstOrCreate(['plate' => $plate[0]]) : null;
                    $routeCode = explode(' ', $cell)[0];
                    $route = DeliveryRoute::where('code', $routeCode)->first();
                    $task = $route || $cell === 'PIHEN' ? null : ($routeCode === 'MENTESÍTŐ' ? (strpos($cell, '(Q-O)') !== false ? 'Mentesítő (Q–O)' : 'Mentesítő') : $cell);
                    $note = trim($route ? substr($cell, strlen($routeCode)) : '');
                    if ($plate) $note = trim(preg_replace('/'.preg_quote($plate[0], '/').'/', '', $note, 1));
                    Shift::firstOrCreate(['employee_id' => $employee->id, 'date' => $date], [
                        'status' => $cell === 'PIHEN' ? 'rest' : 'work', 'delivery_route_id' => $route ? $route->id : null,
                        'vehicle_id' => $vehicle ? $vehicle->id : null, 'task' => $task, 'note' => $note ?: null,
                    ]);
                }
            }
        });
    }
}
