<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryAddress extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['delivery_route_id' => 'integer', 'deadline_hour' => 'integer', 'sort_order' => 'integer'];
    protected $table = 'delivery_addresses';
    public function route() { return $this->belongsTo(DeliveryRoute::class, 'delivery_route_id'); }
}
