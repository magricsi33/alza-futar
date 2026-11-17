<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['employee_id' => 'integer', 'delivery_route_id' => 'integer', 'vehicle_id' => 'integer', 'revision' => 'integer'];
    protected $table = 'shifts';
    public function employee() { return $this->belongsTo(Employee::class); }
    public function route() { return $this->belongsTo(DeliveryRoute::class, 'delivery_route_id'); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
}
