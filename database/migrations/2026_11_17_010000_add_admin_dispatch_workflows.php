<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdminDispatchWorkflows extends Migration
{
    public function up()
    {
        Schema::table('delivery_addresses', function (Blueprint $table) { $table->boolean('is_exempt')->default(false); });
        Schema::table('shifts', function (Blueprint $table) { $table->unsignedInteger('revision')->default(1); });
        Schema::create('schedule_day_locks', function (Blueprint $table) { $table->date('date')->primary(); });
    }
    public function down()
    {
        Schema::dropIfExists('schedule_day_locks');
        Schema::table('shifts', function (Blueprint $table) { $table->dropColumn('revision'); });
        Schema::table('delivery_addresses', function (Blueprint $table) { $table->dropColumn('is_exempt'); });
    }
}
