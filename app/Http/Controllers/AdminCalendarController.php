<?php

namespace App\Http\Controllers;

use App\Models\{DeliveryRoute, Employee, Vehicle, Shift};
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminCalendarController extends Controller
{
    public function data(Request $request)
    {
        $request->validate(['week' => 'nullable|date_format:Y-m-d', 'employee_id' => 'nullable|integer|exists:employees,id']);
        $start = ($request->filled('week') ? Carbon::createFromFormat('!Y-m-d', $request->week) : now('Europe/Budapest'))->startOfWeek(Carbon::MONDAY);
        $days = [];
        for ($i = 0; $i < 7; $i++) $days[] = $start->copy()->addDays($i)->toDateString();
        $shifts = Shift::with(['employee', 'route', 'vehicle'])->whereBetween('date', [$days[0], $days[6]])->get();
        $people = Employee::where(function ($query) use ($shifts, $request) {
            $query->where('active', true)->orWhereIn('id', $shifts->pluck('employee_id'));
            if ($request->filled('employee_id')) $query->orWhere('id', $request->employee_id);
        })->orderBy('name')->get(['id', 'name', 'active']);
        return [
            'days' => $days, 'employees' => $people, 'shifts' => $shifts,
            'routes' => DeliveryRoute::orderBy('code')->get(['id', 'code', 'name']),
            'vehicles' => Vehicle::orderBy('plate')->get(['id', 'plate']),
        ];
    }
    public function index(Request $request)
    {
        return view('admin.calendar', ['title' => 'Beosztás', 'type' => 'shifts', 'calendar' => $this->data($request)]);
    }
    public function week(Request $request)
    {
        return response()->json($this->data($request))->header('Cache-Control', 'no-store, private');
    }
    public function availability(Request $request)
    {
        $data = $request->validate(['date' => 'required|date_format:Y-m-d', 'shift_id' => 'nullable|integer|exists:shifts,id', 'employee_id' => 'nullable|integer|exists:employees,id']);
        $current = !empty($data['employee_id']) ? Shift::with(['employee', 'route', 'vehicle'])->where('employee_id', $data['employee_id'])->where('date', $data['date'])->first() : null;
        $exclude = !empty($data['employee_id']) ? ($current ? $current->id : null) : ($data['shift_id'] ?? null);
        $used = Shift::where('date', $data['date'])->where('status', 'work')->when($exclude, function ($query) use ($exclude) {
            $query->where('id', '!=', $exclude);
        })->get();
        return response()->json([
            'routes' => DeliveryRoute::whereNotIn('id', $used->pluck('delivery_route_id')->filter()->all())->orderBy('code')->get(['id', 'code', 'name']),
            'vehicles' => Vehicle::whereNotIn('id', $used->pluck('vehicle_id')->filter()->all())->orderBy('plate')->get(['id', 'plate']),
            'shift' => $current,
        ])->header('Cache-Control', 'no-store, private');
    }
}
