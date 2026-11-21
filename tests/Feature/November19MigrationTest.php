<?php

namespace Tests\Feature;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Shift, Vehicle};
use App\Services\DispatchData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class November19MigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_matches_fresh_import_and_preserves_history_ids_and_refueling()
    {
        $this->seed(\Database\Seeders\DispatchSeeder::class);
        $expected = app(DispatchData::class)->get();
        $history = Shift::where('date', '<', '2026-11-19')->orderBy('id')->get()->toArray();
        $previous = json_decode(file_get_contents(base_path('tests/frontend/fixtures/dispatch.json')), true);
        $oldBoxes = [];
        foreach ($previous['tours'] as $tour) {
            $route = DeliveryRoute::where('code', $tour['id'])->firstOrFail();
            $route->update(['deadline_hour' => (int) $tour['stops'][0][4]]);
            foreach ($tour['stops'] as $index => $stop) {
                $oldBoxes[] = $stop[0];
                DeliveryAddress::where('box_code', $stop[0])->update([
                    'delivery_route_id' => $route->id, 'address' => $stop[1], 'city' => $stop[2],
                    'location' => $stop[3], 'deadline_hour' => (int) $stop[4], 'sort_order' => $index + 1,
                ]);
            }
        }
        DeliveryAddress::whereNotIn('box_code', $oldBoxes)->delete();
        require_once database_path('migrations/2026_11_17_030000_update_fuel_and_november_schedule.php');
        (new \UpdateFuelAndNovemberSchedule)->up();
        $moved = DeliveryAddress::where('box_code', 'AB9087')->firstOrFail();
        $moved->update(['is_exempt' => true]);
        $removed = DeliveryAddress::where('box_code', 'AB9041')->firstOrFail();
        $removed->update(['is_exempt' => true]);
        $route = DeliveryRoute::where('code', 'S')->firstOrFail();
        $route->update(['last_refueled_at' => '2026-11-18', 'ramp' => 77, 'fuel_interval' => 2]);
        $fuel = $route->only(['km', 'fuel_liters', 'fuel_amount', 'last_refueled_at', 'fuel_interval', 'ramp']);
        $vehicle = Vehicle::firstOrFail();
        $vehicle->update(['last_refueled_at' => '2026-11-17']);
        $custom = Employee::create(['slug' => 'extra-person', 'name' => 'Külön munkatárs']);
        $customShift = Shift::create(['employee_id' => $custom->id, 'date' => '2026-11-22', 'task' => 'Egyedi feladat']);
        $customShift->refresh();
        $changed = Shift::where('employee_id', Employee::where('slug', 'mag-richard')->value('id'))->where('date', '2026-11-21')->firstOrFail();
        $revision = $changed->revision;
        require_once database_path('migrations/2026_11_19_000000_update_routes_and_november_schedule.php');
        $migration = new \UpdateRoutesAndNovemberSchedule;
        $migration->up();
        $actual = app(DispatchData::class)->get();
        $this->assertSame($expected['tours'], $actual['tours']);
        $source = json_decode(file_get_contents(database_path('data/2026-11-19-routes-and-schedule.json')), true);
        foreach ($source['people'] as $slug => $cells) {
            $person = collect($actual['people'])->firstWhere('id', $slug);
            foreach ($cells as $index => $cell) {
                $saved = $person['cells'][array_search($source['days'][$index], $actual['days'], true)];
                $this->assertSame(mb_strtoupper($cell), mb_strtoupper(preg_replace('/\s+/u', ' ', $saved)), $slug.' '.$source['days'][$index]);
            }
        }
        $this->assertSame($history, Shift::where('date', '<', '2026-11-19')->orderBy('id')->get()->toArray());
        $this->assertSame('rest', $changed->fresh()->status);
        $this->assertSame($revision + 1, $changed->fresh()->revision);
        $this->assertSame($customShift->toArray(), $customShift->fresh()->toArray());
        $this->assertSame($fuel, $route->fresh()->only(array_keys($fuel)));
        $this->assertSame('2026-11-17', $vehicle->fresh()->last_refueled_at);
        $this->assertTrue($moved->fresh()->is_exempt);
        $this->assertSame(DeliveryRoute::where('code', 'V')->value('id'), $moved->fresh()->delivery_route_id);
        $this->assertTrue($removed->fresh()->is_exempt);
        $this->assertNull($removed->fresh()->delivery_route_id);
        $this->assertSame(194, DeliveryAddress::count());
        $this->assertSame(188, DeliveryAddress::whereNotNull('delivery_route_id')->count());
        $beforeRepeat = Shift::orderBy('id')->get()->toArray();
        $addresses = DeliveryAddress::orderBy('id')->get()->toArray();
        $migration->up();
        $this->assertSame($beforeRepeat, Shift::orderBy('id')->get()->toArray());
        $this->assertSame($addresses, DeliveryAddress::orderBy('id')->get()->toArray());
    }
}
