<?php

namespace Tests\Feature;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Vehicle, Shift};
use App\Services\DispatchData;
use Database\Seeders\DispatchSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DispatchTest extends TestCase
{
    use RefreshDatabase;

    private function import()
    {
        $this->seed(DispatchSeeder::class);
    }

    public function test_import_is_repeatable_and_preserves_admin_changes_and_schedule_history()
    {
        $this->import();
        $this->assertSame(12, DeliveryRoute::count());
        $this->assertSame(189, DeliveryAddress::count());
        $this->assertSame(20, Employee::count());
        $count = Shift::count();
        $route = DeliveryRoute::where('code', 'S')->first();
        $route->update(['name' => 'Módosított útvonal']);
        $this->import();
        $this->assertSame($count, Shift::count());
        $this->assertSame('Módosított útvonal', $route->fresh()->name);
        $data = app(DispatchData::class)->get();
        $this->assertContains('2026-11-11', $data['days']);
        $this->assertContains('2026-11-22', $data['days']);
        $this->get('/')->assertOk()->assertSee('window.dispatchData', false);
        $this->getJson('/dispatch/data')->assertOk()->assertJsonCount(12, 'tours');
        $this->assertDatabaseHas('vehicles', ['plate' => 'TEX047']);
    }

    public function test_admin_pin_login_and_all_pages_render()
    {
        $this->get('/admin/routes')->assertRedirect('/admin/login');
        $this->get('/admin/login')->assertOk();
        $this->post('/admin/login', ['pin' => '000000'])->assertSessionHasErrors('pin');
        $this->post('/admin/login', ['pin' => '130419'])->assertRedirect('/admin/routes');
        $this->import();
        foreach (['routes' => DeliveryRoute::class, 'addresses' => DeliveryAddress::class, 'employees' => Employee::class, 'vehicles' => Vehicle::class, 'shifts' => Shift::class] as $type => $model) {
            $this->get('/admin/'.$type)->assertOk();
            $this->get('/admin/'.$type.'/create')->assertOk();
            $this->get('/admin/'.$type.'/'.$model::first()->id.'/edit')->assertOk();
        }
        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->get('/admin/shifts')->assertRedirect('/admin/login');
    }

    public function test_route_addresses_can_be_attached_ordered_detached_but_not_stolen()
    {
        $this->withSession(['dispatch_admin' => true]);
        $employee = Employee::create(['slug' => 'test', 'name' => 'Teszt Sofőr', 'active' => true]);
        $this->post('/admin/routes', ['code' => 'Z', 'name' => 'Új útvonal', 'deadline_hour' => 9, 'fuel_interval' => 2, 'ramp' => 82, 'employee_id' => $employee->id, 'km' => 100, 'fuel_liters' => 12, 'fuel_amount' => 7000])->assertSessionHasNoErrors();
        $route = DeliveryRoute::where('code', 'Z')->firstOrFail();
        $this->post('/admin/addresses', ['box_code' => 'AB9999', 'address' => 'Teszt utca 1', 'city' => '1111 Budapest', 'sort_order' => 1])->assertSessionHasNoErrors();
        $address = DeliveryAddress::where('box_code', 'AB9999')->firstOrFail();
        $payload = ['code' => 'Z', 'name' => 'Új útvonal', 'deadline_hour' => 10, 'fuel_interval' => 2, 'address_ids' => [$address->id], 'orders' => [$address->id => 3]];
        $this->put('/admin/routes/'.$route->id, $payload)->assertSessionHasNoErrors();
        $this->assertSame($route->id, $address->fresh()->delivery_route_id);
        $this->assertSame(3, $address->fresh()->sort_order);
        $other = DeliveryRoute::create(['code' => 'Y', 'name' => 'Másik', 'deadline_hour' => 11, 'fuel_interval' => 1]);
        $payload['code'] = 'Y';
        $this->put('/admin/routes/'.$other->id, $payload)->assertSessionHasErrors('address_ids');
        $this->assertSame($route->id, $address->fresh()->delivery_route_id);
        $this->delete('/admin/routes/'.$route->id)->assertRedirect('/admin/routes');
        $this->assertNull($address->fresh()->delivery_route_id);
        $this->get('/admin/addresses?q=AB9999')->assertOk()->assertSee('Teszt utca 1');
    }

    public function test_employee_vehicle_and_shift_crud_validate_and_feed_the_courier()
    {
        $this->withSession(['dispatch_admin' => true]);
        $this->post('/admin/employees', ['name' => 'Új Sofőr', 'active' => 1])->assertSessionHasNoErrors();
        $person = Employee::firstOrFail();
        $this->post('/admin/vehicles', ['plate' => 'tex-047'])->assertSessionHasNoErrors();
        $vehicle = Vehicle::firstOrFail();
        $this->assertSame('TEX047', $vehicle->plate);
        $route = DeliveryRoute::create(['code' => 'X', 'name' => 'Útvonal X', 'deadline_hour' => 10, 'fuel_interval' => 1]);
        $shift = ['employee_id' => $person->id, 'date' => '2026-11-17', 'status' => 'work', 'delivery_route_id' => $route->id, 'vehicle_id' => $vehicle->id];
        $this->post('/admin/shifts', $shift)->assertSessionHasNoErrors();
        $this->post('/admin/shifts', $shift)->assertSessionHasErrors('date');
        $this->assertSame(1, Shift::count());
        $data = app(DispatchData::class)->get();
        $this->assertSame('X TEX047', $data['people'][0]['cells'][0]);
        $this->get('/admin/shifts?q=TEX047')->assertOk()->assertSee('Új Sofőr');
        $shift['status'] = 'rest';
        $this->put('/admin/shifts/'.Shift::first()->id, $shift)->assertSessionHasNoErrors();
        $this->assertNull(Shift::first()->vehicle_id);
        $this->assertSame('PIHEN', app(DispatchData::class)->get()['people'][0]['cells'][0]);
        $this->put('/admin/employees/'.$person->id, ['name' => 'Átnevezett', 'active' => 0])->assertSessionHasNoErrors();
        $this->assertFalse(app(DispatchData::class)->get()['people'][0]['active']);
        $this->delete('/admin/vehicles/'.$vehicle->id)->assertRedirect('/admin/vehicles');
        $this->delete('/admin/shifts/'.Shift::first()->id)->assertRedirect('/admin/shifts');
        $this->delete('/admin/employees/'.$person->id)->assertRedirect('/admin/employees');
        $this->assertSame(0, Employee::count());
    }

    public function test_shared_fuel_is_read_by_another_session_and_updates_selected_vehicle_only()
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-11-17 12:00:00', 'Europe/Budapest'));
        $route = DeliveryRoute::create(['code' => 'S', 'name' => 'Budapest S', 'deadline_hour' => 10, 'fuel_interval' => 2]);
        $vehicle = Vehicle::create(['plate' => 'AOBL104']);
        $other = Vehicle::create(['plate' => 'TEX047']);
        $this->postJson('/dispatch/fuel/S', ['date' => '2026-11-16', 'vehicle_id' => $vehicle->id])->assertOk()->assertJsonPath('date', '2026-11-16');
        $this->flushSession();
        $this->getJson('/dispatch/fuel/S')->assertOk()->assertJsonPath('date', '2026-11-16');
        $this->assertSame('2026-11-16', $vehicle->fresh()->last_refueled_at);
        $this->assertNull($other->fresh()->last_refueled_at);
        $this->postJson('/dispatch/fuel/S', ['date' => '2026-11-15'])->assertOk()->assertJsonPath('date', '2026-11-16');
        $this->postJson('/dispatch/fuel/S', ['date' => '2027-01-01'])->assertStatus(422);
        $this->postJson('/dispatch/fuel/S', ['date' => '2026-11-17', 'vehicle_id' => 9999])->assertStatus(422);
        $this->getJson('/dispatch/fuel/exempt')->assertNotFound();
    }
}
