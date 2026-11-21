<?php

namespace Tests\Feature;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Shift, Vehicle};
use App\Services\DispatchData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class November21MigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_update_matches_snapshot_and_preserves_history_and_route_data()
    {
        $this->seed(\Database\Seeders\DispatchSeeder::class);
        $expected = app(DispatchData::class)->get();
        require_once database_path('migrations/2026_11_19_000000_update_routes_and_november_schedule.php');
        (new \UpdateRoutesAndNovemberSchedule)->up();
        Shift::where('date', '>=', '2026-11-23')->delete();
        Vehicle::where('plate', 'AOFP411')->delete();
        $history = Shift::where('date', '<', '2026-11-21')->orderBy('id')->get()->toArray();
        $routes = DeliveryRoute::orderBy('id')->get()->toArray();
        $addresses = DeliveryAddress::orderBy('id')->get()->toArray();
        $balla = Employee::where('slug', 'balla-laszlo')->firstOrFail();
        $changed = Shift::where('employee_id', $balla->id)->where('date', '2026-11-21')->firstOrFail();
        $revision = $changed->revision;
        $hanuszka = Employee::where('slug', 'hanuszka-daniel')->firstOrFail();
        Shift::create(['employee_id' => $hanuszka->id, 'date' => '2026-11-25', 'task' => 'Régi feladat']);
        $custom = Employee::create(['slug' => 'extra-person', 'name' => 'Külön munkatárs']);
        $customShift = Shift::create(['employee_id' => $custom->id, 'date' => '2026-11-25', 'task' => 'Egyedi feladat'])->fresh()->toArray();
        $vehicle = Vehicle::where('plate', 'AICD394')->firstOrFail();
        $vehicle->update(['last_refueled_at' => '2026-11-20']);
        require_once database_path('migrations/2026_11_21_000000_update_november_schedule.php');
        $migration = new \UpdateNovemberSchedule;
        $migration->up();
        $actual = app(DispatchData::class)->get();
        $this->assertSame($expected['days'], $actual['days']);
        $source = json_decode(file_get_contents(database_path('data/2026-11-21-schedule.json')), true);
        foreach ($source['people'] as $slug => $cells) {
            $person = collect($actual['people'])->firstWhere('id', $slug);
            $seeded = collect($expected['people'])->firstWhere('id', $slug);
            foreach ($cells as $index => $cell) {
                $day = array_search($source['days'][$index], $actual['days'], true);
                $this->assertSame(mb_strtoupper($cell), mb_strtoupper(preg_replace('/\s+/u', ' ', $person['cells'][$day])), $slug.' '.$source['days'][$index]);
                $this->assertSame($seeded['cells'][$day], $person['cells'][$day]);
            }
        }
        $this->assertSame($history, Shift::where('date', '<', '2026-11-21')->orderBy('id')->get()->toArray());
        $this->assertSame($routes, DeliveryRoute::orderBy('id')->get()->toArray());
        $this->assertSame($addresses, DeliveryAddress::orderBy('id')->get()->toArray());
        $this->assertSame($customShift, Shift::find($customShift['id'])->toArray());
        $this->assertSame($revision + 1, $changed->fresh()->revision);
        $this->assertDatabaseMissing('shifts', ['employee_id' => $hanuszka->id, 'date' => '2026-11-25']);
        $this->assertDatabaseHas('vehicles', ['plate' => 'AOFP411']);
        $this->assertSame('2026-11-20', $vehicle->fresh()->last_refueled_at);
        $beforeRepeat = Shift::orderBy('id')->get()->toArray();
        $migration->up();
        $this->assertSame($beforeRepeat, Shift::orderBy('id')->get()->toArray());
    }
}
