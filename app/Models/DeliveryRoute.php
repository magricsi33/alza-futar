<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRoute extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['employee_id' => 'integer', 'deadline_hour' => 'integer', 'ramp' => 'integer', 'fuel_amount' => 'integer', 'fuel_interval' => 'integer'];
    protected $table = 'delivery_routes';
    public function addresses() { return $this->hasMany(DeliveryAddress::class)->orderBy('sort_order')->orderBy('id'); }
    public function employee() { return $this->belongsTo(Employee::class); }
}
