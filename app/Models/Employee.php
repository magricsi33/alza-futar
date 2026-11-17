<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $guarded = ['id'];
    protected $casts = ['active' => 'boolean'];
    protected $table = 'employees';
    public function shifts() { return $this->hasMany(Shift::class); }
}
