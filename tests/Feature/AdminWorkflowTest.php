<?php

namespace Tests\Feature;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Vehicle, Shift};
use App\Services\DispatchData;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function routeRecord($code = 'S') { return DeliveryRoute::create(['code' => $code, 'name' => 'Budapest '.$code, 'deadline_hour' => 10, 'fuel_interval' => 1]); }
    private function employee($slug) { return Employee::create(['slug' => $slug, 'name' => 'Sofőr '.$slug, 'active' => true]); }

    public function test_modal_address_creation_appends_and_route_order_and_exemptions_save()
    {
        $this->withSession(['dispatch_admin' => true]);
        $route = $this->routeRecord();
        $address = DeliveryAddress::create(['box_code' => 'AB9001', 'address' => 'Első utca', 'city' => 'Budapest', 'delivery_route_id' => $route->id, 'sort_order' => 4]);
        $new = $this->postJson('/admin/addresses', ['box_code' => 'AB9002', 'address' => 'Második utca', 'city' => 'Budapest', 'delivery_route_id' => $route->id, 'is_exempt' => true])
            ->assertCreated()->assertJsonPath('sort_order', 5)->assertJsonPath('is_exempt', true)->json();
        $this->get('/admin/routes/'.$route->id.'/edit')->assertOk()->assertSee('address-create-dialog')->assertSee('drag-handle');
        $this->put('/admin/routes/'.$route->id, [
            'code' => 'S', 'name' => 'Budapest S', 'deadline_hour' => 10, 'fuel_interval' => 1,
            'address_ids' => [$address->id, $new['id']], 'orders' => [$address->id => 2, $new['id'] => 1],
            'exempt_selection' => 1, 'exempt_ids' => [$address->id],
        ])->assertSessionHasNoErrors();
        $data = app(DispatchData::class)->get();
        $this->assertSame('AB9002', $data['tours'][0]['stops'][0][0]);
        $this->assertSame(['AB9001'], $data['exempt']['S']);
        $this->getJson('/dispatch/exemptions')->assertJsonPath('exempt.S.0', 'AB9001');
        $this->putJson('/dispatch/exemptions/AB9001', ['is_exempt' => false])->assertOk()->assertJsonCount(0, 'exempt.S');
    }

    public function test_calendar_week_renders_and_available_resources_exclude_other_shifts_only()
    {
        $this->withSession(['dispatch_admin' => true]);
        $one = $this->employee('one'); $two = $this->employee('two');
        $route = $this->routeRecord(); $free = $this->routeRecord('V');
        $vehicle = Vehicle::create(['plate' => 'ABC123']);
        $shift = Shift::create(['employee_id' => $one->id, 'date' => '2026-11-17', 'status' => 'work', 'delivery_route_id' => $route->id, 'vehicle_id' => $vehicle->id]);
        $this->get('/admin/shifts?week=2026-11-17')->assertOk()->assertSee('schedule-calendar')->assertSee('shift-dialog');
        $this->getJson('/admin/calendar/data?week=2026-11-17')->assertOk()->assertJsonPath('days.0', '2026-11-16')->assertJsonPath('days.6', '2026-11-22')->assertJsonCount(1, 'shifts');
        $this->getJson('/admin/calendar/data?week=2026-12-01')->assertOk()->assertJsonCount(0, 'shifts')->assertJsonCount(7, 'days');
        $available = $this->getJson('/admin/calendar/availability?date=2026-11-17')->assertOk()->json();
        $this->assertSame([$free->id], array_column($available['routes'], 'id'));
        $this->assertSame([], $available['vehicles']);
        $this->getJson('/admin/calendar/availability?date=2026-11-17&shift_id='.$shift->id)->assertJsonCount(2, 'routes')->assertJsonCount(1, 'vehicles');
        $this->getJson('/admin/calendar/availability?date=invalid')->assertStatus(422);
    }

    public function test_calendar_save_blocks_conflicts_and_stale_updates_and_delete_releases_resources()
    {
        $this->withSession(['dispatch_admin' => true]);
        $one = $this->employee('one'); $two = $this->employee('two');
        $route = $this->routeRecord(); $other = $this->routeRecord('V');
        $vehicle = Vehicle::create(['plate' => 'ABC123']);
        $payload = ['employee_id' => $one->id, 'date' => '2026-11-17', 'status' => 'work', 'delivery_route_id' => $route->id, 'vehicle_id' => $vehicle->id];
        $shift = $this->postJson('/admin/shifts', $payload)->assertOk()->json();
        $payload['employee_id'] = $two->id;
        $this->postJson('/admin/shifts', $payload)->assertStatus(422)->assertJsonValidationErrors('delivery_route_id');
        $payload['delivery_route_id'] = $other->id;
        $this->postJson('/admin/shifts', $payload)->assertStatus(422)->assertJsonValidationErrors('vehicle_id');
        $payload['employee_id'] = $one->id; $payload['delivery_route_id'] = $route->id; $payload['revision'] = $shift['revision'];
        $this->putJson('/admin/shifts/'.$shift['id'], $payload)->assertOk()->assertJsonPath('revision', 2);
        $this->getJson('/admin/calendar/availability?date=2026-11-17&employee_id='.$one->id)->assertOk()->assertJsonPath('shift.revision', 2);
        $this->putJson('/admin/shifts/'.$shift['id'], $payload)->assertStatus(409);
        $this->deleteJson('/admin/shifts/'.$shift['id'], ['revision' => 1])->assertStatus(409);
        $this->deleteJson('/admin/shifts/'.$shift['id'], ['revision' => 2])->assertOk();
        $this->getJson('/admin/calendar/availability?date=2026-11-17&employee_id='.$one->id)->assertOk()->assertJsonPath('shift', null);
        $payload['employee_id'] = $two->id; unset($payload['revision']);
        $this->postJson('/admin/shifts', $payload)->assertOk();
        $payload['date'] = '2026-11-18';
        $this->postJson('/admin/shifts', $payload)->assertOk();
        $this->assertSame(2, Shift::count());
    }

    public function test_exemption_import_is_repeatable_clear_is_scoped_and_admin_api_requires_login()
    {
        $route = $this->routeRecord(); $other = $this->routeRecord('V');
        foreach ([['AB9001', $route->id], ['AB9002', $other->id]] as [$code, $id]) DeliveryAddress::create(['box_code' => $code, 'address' => 'Cím', 'city' => 'Budapest', 'delivery_route_id' => $id, 'sort_order' => 1]);
        $this->postJson('/dispatch/exemptions/import', ['boxes' => ['AB9001', 'AB9002']])->assertOk();
        $this->postJson('/dispatch/exemptions/import', ['boxes' => ['AB9001']])->assertOk();
        $this->deleteJson('/dispatch/exemptions/S')->assertOk()->assertJsonCount(0, 'exempt.S')->assertJsonCount(1, 'exempt.V');
        $this->deleteJson('/dispatch/exemptions/exempt')->assertOk()->assertJsonCount(0, 'exempt.V');
        $this->getJson('/admin/calendar/data')->assertUnauthorized();
        $this->postJson('/admin/addresses', [])->assertUnauthorized();
    }
}
