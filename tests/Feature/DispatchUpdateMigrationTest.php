<?php

namespace Tests\Feature;

use App\Models\{DeliveryRoute, Employee, Shift, Vehicle};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DispatchUpdateMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_preserves_history_refueling_and_ids_and_is_repeatable()
    {
        $this->seed(\Database\Seeders\DispatchSeeder::class);
        $person = Employee::where('slug', 'mag-richard')->firstOrFail();
        $route = DeliveryRoute::where('code', 'S')->firstOrFail();
        $route->update(['km' => 106, 'last_refueled_at' => '2026-11-16']);
        $vehicle = Vehicle::where('plate', 'AELW962')->firstOrFail();
        $vehicle->update(['last_refueled_at' => '2026-11-15']);
        $history = Shift::where('employee_id', $person->id)->where('date', '2026-11-16')->firstOrFail()->toArray();
        $shift = Shift::where('employee_id', $person->id)->where('date', '2026-11-21')->firstOrFail();
        $shift->update(['status' => 'rest', 'delivery_route_id' => null, 'vehicle_id' => null]);
        $hegyes = Employee::where('slug', 'hegyes-laszlo')->firstOrFail();
        Shift::create(['employee_id' => $hegyes->id, 'date' => '2026-11-18', 'task' => 'Régi feladat']);
        require_once database_path('migrations/2026_11_17_030000_update_fuel_and_november_schedule.php');
        $migration = new \UpdateFuelAndNovemberSchedule;
        $migration->up();
        $this->assertSame($history, Shift::find($history['id'])->toArray());
        $this->assertSame('2026-11-16', $route->fresh()->last_refueled_at);
        $this->assertSame('2026-11-15', $vehicle->fresh()->last_refueled_at);
        $this->assertDatabaseHas('delivery_routes', ['code' => 'S', 'km' => 101, 'fuel_liters' => 11, 'fuel_amount' => 7424]);
        $this->assertDatabaseHas('delivery_routes', ['code' => 'exempt', 'km' => 175, 'fuel_liters' => 19, 'fuel_amount' => 12863]);
        $this->assertDatabaseHas('shifts', ['id' => $shift->id, 'status' => 'work', 'revision' => 2, 'delivery_route_id' => DeliveryRoute::where('code', 'V')->value('id')]);
        $this->assertDatabaseMissing('shifts', ['employee_id' => $hegyes->id, 'date' => '2026-11-18']);
        $this->assertDatabaseHas('shifts', ['date' => '2026-11-19', 'task' => 'Mentesítő', 'note' => '+ T ÉJSZAKA', 'vehicle_id' => $vehicle->id]);
        $count = Shift::count();
        $migration->up();
        $this->assertSame($count, Shift::count());
        $this->assertSame(2, $shift->fresh()->revision);
        $this->getJson('/dispatch/data')->assertOk()->assertJsonCount(12, 'tours')->assertJsonPath('fuel.exempt.amount', 12863);
        $this->postJson('/dispatch/fuel/exempt', ['date' => '2026-11-16'])->assertOk();
        $this->getJson('/dispatch/fuel/exempt')->assertOk()->assertJsonPath('date', '2026-11-16');
    }
}
