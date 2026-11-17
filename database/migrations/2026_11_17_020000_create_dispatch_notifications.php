<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDispatchNotifications extends Migration
{
    public function up()
    {
        Schema::create('dispatch_notices', function (Blueprint $table) {
            $table->id(); $table->uuid('request_id')->unique();
            $table->string('kind', 20); $table->string('title', 120); $table->text('body');
            $table->date('week_start')->nullable(); $table->timestamps();
        });
        Schema::create('dispatch_notice_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispatch_notice_id')->constrained('dispatch_notices')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->unique(['dispatch_notice_id', 'employee_id']);
        });
    }
    public function down()
    {
        Schema::dropIfExists('dispatch_notice_reads'); Schema::dropIfExists('dispatch_notices');
    }
}
