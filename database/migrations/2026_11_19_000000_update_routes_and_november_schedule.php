<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class UpdateRoutesAndNovemberSchedule extends Migration
{
    public function up()
    {
        // Fresh installations use the updated DispatchSeeder snapshot.
        if (!DB::table('delivery_routes')->exists()) return;
        $data = json_decode(file_get_contents(database_path('data/2026-11-19-routes-and-schedule.json')), true, 512, JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($data) {
            $now = now();
            foreach ($data['days'] as $date) {
                DB::table('schedule_day_locks')->insertOrIgnore(['date' => $date]);
                DB::table('schedule_day_locks')->where('date', $date)->lockForUpdate()->first();
            }
            $routeIds = []; $boxCodes = [];
            foreach ($data['tours'] as $tour) {
                DB::table('delivery_routes')->insertOrIgnore([
                    'code' => $tour['id'], 'name' => $tour['name'],
                    'deadline_hour' => (int) $tour['stops'][0][4], 'fuel_interval' => 1,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                $route = DB::table('delivery_routes')->where('code', $tour['id'])->lockForUpdate()->first();
                $routeIds[] = $route->id;
                $deadline = (int) $tour['stops'][0][4];
                if ((int) $route->deadline_hour !== $deadline) {
                    DB::table('delivery_routes')->where('id', $route->id)->update(['deadline_hour' => $deadline, 'updated_at' => $now]);
                }
                foreach ($tour['stops'] as $index => $stop) {
                    if (isset($boxCodes[$stop[0]])) throw new RuntimeException('Ismétlődő box: '.$stop[0]);
                    $boxCodes[$stop[0]] = true;
                    $address = DB::table('delivery_addresses')->where('box_code', $stop[0])->lockForUpdate()->first();
                    $values = [
                        'delivery_route_id' => $route->id, 'address' => $stop[1], 'city' => $stop[2],
                        'location' => $stop[3], 'deadline_hour' => (int) $stop[4], 'sort_order' => $index + 1,
                    ];
                    if ($address) {
                        foreach ($values as $field => $value) {
                            if ($address->$field != $value) {
                                DB::table('delivery_addresses')->where('id', $address->id)->update($values + ['updated_at' => $now]);
                                break;
                            }
                        }
                    } else {
                        DB::table('delivery_addresses')->insert($values + ['box_code' => $stop[0], 'created_at' => $now, 'updated_at' => $now]);
                    }
                }
            }
            // Removed boxes stay available in admin, with their IDs and exemption flags intact.
            DB::table('delivery_addresses')->whereIn('delivery_route_id', $routeIds)
                ->whereNotIn('box_code', array_keys($boxCodes))->update(['delivery_route_id' => null, 'updated_at' => $now]);

            $routes = DB::table('delivery_routes')->pluck('id', 'code');
            foreach ($data['people'] as $slug => $cells) {
                $employee = DB::table('employees')->where('slug', $slug)->first();
                if (!$employee) throw new RuntimeException('Hiányzó munkatárs: '.$slug);
                foreach ($cells as $index => $cell) {
                    $key = ['employee_id' => $employee->id, 'date' => $data['days'][$index]];
                    $existing = DB::table('shifts')->where($key)->lockForUpdate()->first();
                    if ($cell === '') {
                        DB::table('shifts')->where($key)->delete();
                        continue;
                    }
                    preg_match('/\b[A-Z]{3,4}\d{3}\b/', $cell, $plate);
                    $vehicleId = null;
                    if ($plate) {
                        DB::table('vehicles')->insertOrIgnore(['plate' => $plate[0], 'created_at' => $now, 'updated_at' => $now]);
                        $vehicleId = DB::table('vehicles')->where('plate', $plate[0])->value('id');
                    }
                    $code = explode(' ', $cell)[0];
                    $routeId = $routes[$code] ?? null;
                    $relief = $code === 'MENTESÍTŐ';
                    $note = $routeId || $relief ? trim(substr($cell, strlen($code))) : '';
                    if ($plate) $note = trim(preg_replace('/'.preg_quote($plate[0], '/').'/', '', $note, 1));
                    $values = [
                        'status' => $cell === 'PIHEN' ? 'rest' : 'work',
                        'delivery_route_id' => $routeId, 'vehicle_id' => $vehicleId,
                        'task' => $routeId || $cell === 'PIHEN' ? null : ($relief ? 'Mentesítő' : $cell), 'note' => $note ?: null,
                    ];
                    if ($existing) {
                        foreach ($values as $field => $value) {
                            if ($existing->$field != $value) {
                                DB::table('shifts')->where('id', $existing->id)->update($values + ['revision' => $existing->revision + 1, 'updated_at' => $now]);
                                break;
                            }
                        }
                    } else {
                        DB::table('shifts')->insert($key + $values + ['revision' => 1, 'created_at' => $now, 'updated_at' => $now]);
                    }
                }
            }
        });
    }

    public function down()
    {
        // Keep published corrections; rollback must not overwrite later admin edits.
    }
}
