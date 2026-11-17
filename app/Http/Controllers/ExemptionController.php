<?php

namespace App\Http\Controllers;

use App\Models\{DeliveryAddress, DeliveryRoute};
use Illuminate\Http\Request;

class ExemptionController extends Controller
{
    public function data()
    {
        $exempt = [];
        foreach (DeliveryRoute::with(['addresses' => function ($query) { $query->where('is_exempt', true); }])->get() as $route) $exempt[$route->code] = $route->addresses->pluck('box_code')->all();
        return ['exempt' => $exempt];
    }
    public function index() { return response()->json($this->data())->header('Cache-Control', 'no-store, private'); }
    public function update(Request $request, $box)
    {
        $data = $request->validate(['is_exempt' => 'required|boolean']);
        DeliveryAddress::where('box_code', $box)->firstOrFail()->update($data);
        return $this->index();
    }
    public function import(Request $request)
    {
        $data = $request->validate(['boxes' => 'required|array|max:300', 'boxes.*' => ['required', 'string', 'regex:/^AB[0-9]{3,6}$/D']]);
        DeliveryAddress::whereIn('box_code', $data['boxes'])->update(['is_exempt' => true]);
        return $this->index();
    }
    public function clear($code)
    {
        $addresses = DeliveryAddress::query();
        if ($code !== 'exempt') $addresses->where('delivery_route_id', DeliveryRoute::where('code', $code)->firstOrFail()->id);
        $addresses->update(['is_exempt' => false]);
        return $this->index();
    }
}
