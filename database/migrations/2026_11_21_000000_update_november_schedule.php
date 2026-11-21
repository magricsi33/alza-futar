<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class UpdateNovemberSchedule extends Migration
{
    public function up()
    {
        // Empty installations receive the same values from DispatchSeeder.
        if (!DB::table('delivery_routes')->exists()) return;
        $data = json_decode(file_get_contents(database_path('data/2026-11-21-schedule.json')), true, 512, JSON_THROW_ON_ERROR);
        DB::transaction(function () use ($data) {
            $now = now();
            foreach ($data['days'] as $date) {
                DB::table('schedule_day_locks')->insertOrIgnore(['date' => $date]);
                DB::table('schedule_day_locks')->where('date', $date)->lockForUpdate()->first();
            }
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
                        'task' => $routeId || $cell === 'PIHEN' ? null : ($relief ? 'Mentesítő' : $cell),
                        'note' => $note ?: null,
                    ];
                    if ($existing) {
                        $changed = false;
                        foreach ($values as $field => $value) {
                            if ($existing->$field != $value) $changed = true;
                        }
                        if ($changed) DB::table('shifts')->where('id', $existing->id)->update($values + [
                            'revision' => $existing->revision + 1, 'updated_at' => $now,
                        ]);
                    } else {
                        DB::table('shifts')->insert($key + $values + ['revision' => 1, 'created_at' => $now, 'updated_at' => $now]);
                    }
                }
            }
        });
    }

    public function down()
    {
        // Keep published schedule corrections; do not overwrite later admin edits on rollback.
    }
}
