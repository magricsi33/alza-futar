<?php

namespace Tests\Feature;

use App\Models\{DispatchNotice, Employee, DeliveryRoute, DeliveryAddress};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_text_and_schedule_notices_once_per_request()
    {
        $payload = ['kind' => 'text', 'title' => 'Fontos információ', 'body' => 'Holnap korábbi indulás.', 'request_id' => (string) Str::uuid()];
        $this->postJson('/admin/notifications', $payload)->assertUnauthorized();
        $this->withSession(['dispatch_admin' => true]);
        $this->get('/admin/notifications')->assertOk()->assertSee('Szöveges értesítés');
        $this->postJson('/admin/notifications', $payload)->assertCreated();
        $this->postJson('/admin/notifications', $payload)->assertCreated();
        $this->assertSame(1, DispatchNotice::count());
        $this->postJson('/admin/notifications', ['kind' => 'schedule', 'week_start' => '2026-11-18', 'body' => 'Nézzétek meg a rendszámokat.', 'request_id' => (string) Str::uuid()])
            ->assertCreated()->assertJsonPath('week_start', '2026-11-16')->assertJsonPath('title', 'Beosztás módosult');
        $this->assertStringContainsString('Nézzétek meg a rendszámokat.', DispatchNotice::latest('id')->first()->body);
        $this->postJson('/admin/notifications', ['kind' => 'text', 'request_id' => (string) Str::uuid()])->assertStatus(422);
    }
    public function test_read_status_is_employee_specific_and_shared_between_sessions()
    {
        $one = Employee::create(['slug' => 'one', 'name' => 'Első', 'active' => true]);
        Employee::create(['slug' => 'two', 'name' => 'Második', 'active' => true]);
        $notice = DispatchNotice::create(['kind' => 'text', 'title' => 'Üzenet', 'body' => 'Tartalom', 'request_id' => (string) Str::uuid()]);
        $this->getJson('/dispatch/notifications?employee=one')->assertOk()->assertJsonPath('unread_count', 1);
        $this->postJson('/dispatch/notifications/read', ['employee' => 'one', 'id' => $notice->id])->assertOk();
        $this->flushSession();
        $this->getJson('/dispatch/notifications?employee=one')->assertJsonPath('unread_count', 0);
        $this->getJson('/dispatch/notifications?employee=two')->assertJsonPath('unread_count', 1);
        $this->getJson('/dispatch/notifications')->assertJsonPath('unread_count', 1);
        $this->postJson('/dispatch/notifications/read', ['id' => $notice->id])->assertStatus(422);
        $this->postJson('/dispatch/notifications/read', ['employee' => 'one', 'id' => $notice->id])->assertOk();
        $this->assertDatabaseCount('dispatch_notice_reads', 1);
    }
    public function test_read_all_does_not_consume_new_notices_and_feed_is_paginated()
    {
        Employee::create(['slug' => 'one', 'name' => 'Első', 'active' => true]);
        for ($i = 0; $i < 25; $i++) DispatchNotice::create(['kind' => 'text', 'title' => 'Üzenet '.$i, 'body' => 'Tartalom', 'request_id' => (string) Str::uuid()]);
        $page = $this->getJson('/dispatch/notifications?employee=one')->assertJsonCount(20, 'items')->assertJsonPath('next_page', 2)->json();
        DispatchNotice::create(['kind' => 'text', 'title' => 'Újabb', 'body' => 'Tartalom', 'request_id' => (string) Str::uuid()]);
        $this->postJson('/dispatch/notifications/read', ['employee' => 'one', 'through_id' => $page['latest_id']])->assertOk();
        $this->getJson('/dispatch/notifications?employee=one')->assertJsonPath('unread_count', 1);
        $this->getJson('/dispatch/notifications?employee=one&page=2')->assertJsonCount(6, 'items');
    }
    public function test_route_address_json_edit_preserves_membership_and_position()
    {
        $this->withSession(['dispatch_admin' => true]);
        $route = DeliveryRoute::create(['code' => 'S', 'name' => 'Budapest S', 'deadline_hour' => 10, 'fuel_interval' => 1]);
        $address = DeliveryAddress::create(['box_code' => 'AB9001', 'address' => 'Régi cím', 'city' => 'Budapest', 'sort_order' => 3, 'delivery_route_id' => $route->id]);
        $this->getJson('/admin/address-data/'.$address->id)->assertOk()->assertJsonPath('address', 'Régi cím');
        $this->putJson('/admin/addresses/'.$address->id, ['box_code' => 'AB9001', 'address' => 'Új cím', 'city' => 'Budapest', 'sort_order' => 3, 'delivery_route_id' => $route->id, 'is_exempt' => true])
            ->assertOk()->assertJsonPath('address', 'Új cím')->assertJsonPath('sort_order', 3)->assertJsonPath('is_exempt', true);
        $this->assertSame($route->id, $address->fresh()->delivery_route_id);
    }
}
