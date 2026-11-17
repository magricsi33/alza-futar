<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDispatchTables extends Migration
{
    public function up()
    {
        Schema::create('employees', function (Blueprint $t) {
            $t->id(); $t->string('slug')->unique(); $t->string('name'); $t->boolean('active')->default(true); $t->timestamps();
        });
        Schema::create('vehicles', function (Blueprint $t) {
            $t->id(); $t->string('plate', 20)->unique(); $t->date('last_refueled_at')->nullable(); $t->timestamps();
        });
        Schema::create('delivery_routes', function (Blueprint $t) {
            $t->id(); $t->string('code', 20)->unique(); $t->string('name');
            $t->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $t->unsignedTinyInteger('deadline_hour')->default(10);
            $t->unsignedSmallInteger('ramp')->nullable(); $t->string('departure', 5)->nullable();
            $t->decimal('km', 10, 1)->nullable(); $t->decimal('fuel_liters', 10, 2)->nullable(); $t->unsignedInteger('fuel_amount')->nullable();
            $t->string('fuel_code')->nullable(); $t->unsignedSmallInteger('fuel_interval')->default(1);
            $t->date('last_refueled_at')->nullable(); $t->timestamps();
        });
        Schema::create('delivery_addresses', function (Blueprint $t) {
            $t->id(); $t->string('box_code', 20)->unique(); $t->string('address'); $t->string('city'); $t->string('location')->nullable();
            $t->foreignId('delivery_route_id')->nullable()->constrained('delivery_routes')->nullOnDelete();
            $t->unsignedTinyInteger('deadline_hour')->nullable(); $t->unsignedInteger('sort_order')->default(1); $t->timestamps();
        });
        Schema::create('shifts', function (Blueprint $t) {
            $t->id(); $t->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $t->date('date'); $t->string('status', 20)->default('work');
            $t->foreignId('delivery_route_id')->nullable()->constrained('delivery_routes')->nullOnDelete();
            $t->foreignId('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $t->string('task')->nullable(); $t->text('note')->nullable(); $t->timestamps();
            $t->unique(['employee_id', 'date']); $t->index('date');
        });
    }
    public function down()
    {
        foreach (['shifts', 'delivery_addresses', 'delivery_routes', 'vehicles', 'employees'] as $table) Schema::dropIfExists($table);
    }
}
