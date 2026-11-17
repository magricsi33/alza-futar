<?php

namespace App\Http\Controllers;

use App\Models\{DeliveryRoute, DeliveryAddress, Employee, Vehicle, Shift};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    private function definition($type)
    {
        $definitions = [
            'routes' => [DeliveryRoute::class, 'Útvonalak', [
                'code' => ['Betűjel / kód', 'text', 'required|alpha_num|max:20'], 'name' => ['Név', 'text', 'required|string|max:255'],
                'employee_id' => ['Hozzárendelt munkatárs', 'employees', 'nullable|integer|exists:employees,id'],
                'deadline_hour' => ['Befejezési idő', 'hours', 'required|in:9,10,11,12'],
                'ramp' => ['Rámpa (üres: raktárban pakol)', 'number', 'nullable|integer|min:1|max:999'],
                'departure' => ['Indulás', 'time', 'nullable|date_format:H:i'],
                'km' => ['Távolság (km)', 'decimal', 'nullable|numeric|min:0|max:999999'],
                'fuel_liters' => ['Tankolható liter', 'decimal', 'nullable|numeric|min:0|max:99999'],
                'fuel_amount' => ['Tankolási összeg (Ft)', 'number', 'nullable|integer|min:0|max:99999999'],
                'fuel_code' => ['Tankolási útvonalkód', 'text', 'nullable|string|max:255'],
                'fuel_interval' => ['Tankolás gyakorisága (nap)', 'number', 'required|integer|min:1|max:365'],
                'last_refueled_at' => ['Legutóbbi tankolás', 'date', 'nullable|date_format:Y-m-d|before_or_equal:'.now('Europe/Budapest')->toDateString()],
            ]],
            'addresses' => [DeliveryAddress::class, 'Címek', [
                'box_code' => ['Boxazonosító', 'text', ['required', 'regex:/^AB[0-9]{3,6}$/D']],
                'address' => ['Utca, házszám', 'text', 'required|string|max:255'], 'city' => ['Irányítószám, település', 'text', 'required|string|max:255'],
                'location' => ['Helyszín neve', 'text', 'nullable|string|max:255'],
                'delivery_route_id' => ['Útvonal', 'routes', 'nullable|integer|exists:delivery_routes,id'],
                'deadline_hour' => ['Befejezési idő (üres: útvonal szerint)', 'hours', 'nullable|in:9,10,11,12'],
                'sort_order' => ['Sorszám az útvonalon', 'number', 'required|integer|min:1|max:99999'],
                'is_exempt' => ['Mentesített cím', 'checkbox', 'boolean'],
            ]],
            'employees' => [Employee::class, 'Munkatársak', [
                'name' => ['Név', 'text', 'required|string|max:255'], 'active' => ['Aktív a személyválasztóban', 'checkbox', 'boolean'],
            ]],
            'vehicles' => [Vehicle::class, 'Gépjárművek', [
                'plate' => ['Rendszám', 'text', ['required', 'regex:/^[A-Z]{3,4}[0-9]{3}$/D']],
                'last_refueled_at' => ['Legutóbbi tankolás', 'date', 'nullable|date_format:Y-m-d|before_or_equal:'.now('Europe/Budapest')->toDateString()],
            ]],
            'shifts' => [Shift::class, 'Beosztás', [
                'employee_id' => ['Munkatárs', 'employees', 'required|integer|exists:employees,id'],
                'date' => ['Dátum', 'date', 'required|date_format:Y-m-d'],
                'status' => ['Nap típusa', 'status', 'required|in:work,rest'],
                'delivery_route_id' => ['Útvonal', 'routes', 'nullable|integer|exists:delivery_routes,id'],
                'vehicle_id' => ['Gépjármű', 'vehicles', 'nullable|integer|exists:vehicles,id'],
                'task' => ['Egyéb feladat (pl. Mentesítő, Oktatás)', 'text', 'nullable|string|max:255'],
                'note' => ['Megjegyzés', 'textarea', 'nullable|string|max:10000'],
            ]],
        ];
        abort_unless(isset($definitions[$type]), 404);
        return $definitions[$type];
    }
    private function choices()
    {
        return [
            'employees' => Employee::orderBy('name')->pluck('name', 'id'),
            'routes' => DeliveryRoute::orderBy('code')->pluck('name', 'id'),
            'vehicles' => Vehicle::orderBy('plate')->pluck('plate', 'id'),
            'hours' => collect([9 => '09:00', 10 => '10:00', 11 => '11:00', 12 => '12:00']),
            'status' => collect(['work' => 'Munkanap', 'rest' => 'Pihenőnap']),
        ];
    }
    public function index(Request $request, $type)
    {
        if ($type === 'shifts') return app(AdminCalendarController::class)->index($request);
        [$model, $title, $fields] = $this->definition($type);
        $q = mb_substr((string) $request->query('q'), 0, 200);
        $query = $model::query();
        if ($type === 'shifts') {
            $query->with(['employee', 'route', 'vehicle']);
            if ($request->filled('employee_id')) $query->where('employee_id', $request->employee_id);
            if ($request->filled('date')) $query->where('date', $request->date);
            if ($q !== '') $query->where(function ($query) use ($q) {
                $query->where('date', 'like', '%'.$q.'%')->orWhere('task', 'like', '%'.$q.'%')->orWhere('note', 'like', '%'.$q.'%')
                    ->orWhereHas('employee', function ($query) use ($q) { $query->where('name', 'like', '%'.$q.'%'); })
                    ->orWhereHas('route', function ($query) use ($q) { $query->where('name', 'like', '%'.$q.'%')->orWhere('code', 'like', '%'.$q.'%'); })
                    ->orWhereHas('vehicle', function ($query) use ($q) { $query->where('plate', 'like', '%'.$q.'%'); });
            });
            $query->orderByDesc('date')->orderBy('employee_id');
        } else {
            $columns = ['routes' => ['code', 'name'], 'addresses' => ['box_code', 'address', 'city', 'location'], 'employees' => ['name'], 'vehicles' => ['plate']][$type];
            if ($q !== '') $query->where(function ($query) use ($q, $columns) { foreach ($columns as $column) $query->orWhere($column, 'like', '%'.$q.'%'); });
            $query->orderBy($columns[0]);
        }
        $records = $query->paginate(25)->withQueryString();
        return view('admin.index', compact('type', 'title', 'records', 'q') + ['choices' => $this->choices()]);
    }
    public function form(Request $request, $type, $id = null)
    {
        [$model, $title, $fields] = $this->definition($type);
        if ($type === 'shifts') {
            if ($id) {
                $shift = Shift::findOrFail($id);
                return redirect()->route('admin.index', ['shifts', 'week' => $shift->date, 'edit_shift' => $id]);
            }
            return redirect()->route('admin.index', ['shifts', 'employee_id' => $request->query('employee_id'), 'create_employee' => $request->query('employee_id')]);
        }
        $record = $id ? $model::findOrFail($id) : new $model;
        if (!$id) {
            if ($type === 'routes') { $record->deadline_hour = 10; $record->fuel_interval = 1; }
            if ($type === 'employees') $record->active = true;
            if ($type === 'shifts') { $record->date = now('Europe/Budapest')->toDateString(); $record->status = 'work'; $record->employee_id = $request->query('employee_id'); }
            if ($type === 'addresses') { $record->delivery_route_id = $request->query('route_id'); $record->sort_order = DeliveryAddress::where('delivery_route_id', $record->delivery_route_id)->max('sort_order') + 1; }
        }
        $addresses = $type === 'routes' ? DeliveryAddress::where(function ($q) use ($id) {
            $q->whereNull('delivery_route_id'); if ($id) $q->orWhere('delivery_route_id', $id);
        })->orderBy('sort_order')->orderBy('id')->get() : collect();
        return view('admin.form', compact('type', 'title', 'record', 'fields', 'addresses') + ['choices' => $this->choices()]);
    }
    public function save(Request $request, $type, $id = null)
    {
        [$model, $title, $fields] = $this->definition($type);
        $record = $id ? $model::findOrFail($id) : new $model;
        if ($type === 'routes') $request->merge(['code' => strtoupper(trim($request->code ?? ''))]);
        if ($type === 'vehicles') $request->merge(['plate' => strtoupper(preg_replace('/[\s-]/', '', $request->plate ?? ''))]);
        if ($type === 'employees') $request->merge(['active' => $request->boolean('active')]);
        if ($type === 'addresses') {
            $request->merge(['is_exempt' => $request->boolean('is_exempt')]);
            if (!$id && !$request->filled('sort_order')) $request->merge(['sort_order' => 1]);
        }
        $rules = []; foreach ($fields as $field => $definition) $rules[$field] = $definition[2];
        $unique = ['routes' => 'code', 'addresses' => 'box_code', 'vehicles' => 'plate'];
        if (isset($unique[$type])) {
            $field = $unique[$type]; $rules[$field] = array_merge(is_array($rules[$field]) ? $rules[$field] : explode('|', $rules[$field]), [Rule::unique($record->getTable(), $field)->ignore($record->id)]);
        }
        if ($type === 'shifts') $rules['date'] = ['required', 'date_format:Y-m-d', Rule::unique('shifts', 'date')->where('employee_id', $request->employee_id)->ignore($record->id)];
        $attributes = []; foreach ($fields as $field => $definition) $attributes[$field] = $definition[0];
        $data = $request->validate($rules, [
            'required' => 'A(z) :attribute mező kötelező.', 'unique' => 'Ez a(z) :attribute már szerepel az adatok között.',
            'exists' => 'A választott :attribute már nem elérhető.', 'in' => 'A(z) :attribute értéke nem választható.',
            'regex' => 'A(z) :attribute formátuma nem megfelelő.', 'date_format' => 'A(z) :attribute dátuma nem megfelelő.',
            'before_or_equal' => 'A(z) :attribute nem lehet jövőbeli dátum.',
        ], $attributes);
        if ($type === 'shifts') {
            $data += ['delivery_route_id' => null, 'vehicle_id' => null, 'task' => null, 'note' => null];
            if ($data['status'] === 'rest') { $data['delivery_route_id'] = null; $data['vehicle_id'] = null; $data['task'] = null; }
            elseif (empty($data['delivery_route_id']) && empty($data['task'])) throw ValidationException::withMessages(['task' => 'Válassz útvonalat vagy adj meg egyéb feladatot.']);
        }
        if ($type === 'routes' && strtolower($data['code']) === 'exempt') throw ValidationException::withMessages(['code' => 'Ez a kód a Mentesített gyűjtőútvonal számára fenntartott.']);
        if ($type === 'shifts') {
            $request->validate(['revision' => ($request->expectsJson() && $id ? 'required|' : 'nullable|').'integer|min:1']);
            $record = app(\App\Services\ShiftEditor::class)->save($data, $id, $request->input('revision'));
            return $request->expectsJson() ? response()->json($record->load(['employee', 'route', 'vehicle'])) : redirect()->route('admin.index', ['shifts', 'week' => $record->date])->with('status', 'Mentve.');
        }
        $relations = $type === 'routes' ? $request->validate(['address_ids' => 'nullable|array', 'address_ids.*' => 'integer|distinct|exists:delivery_addresses,id', 'orders' => 'nullable|array', 'orders.*' => 'integer|min:1|max:99999', 'exempt_ids' => 'nullable|array', 'exempt_ids.*' => 'integer|distinct|exists:delivery_addresses,id']) : [];
        DB::transaction(function () use ($record, $data, $type, $relations, $request) {
            if ($type === 'addresses' && !$record->exists && $request->expectsJson()) {
                if (!empty($data['delivery_route_id'])) DeliveryRoute::whereKey($data['delivery_route_id'])->lockForUpdate()->firstOrFail();
                $data['sort_order'] = DeliveryAddress::where('delivery_route_id', $data['delivery_route_id'] ?? null)->max('sort_order') + 1;
            }
            if ($type === 'employees' && !$record->exists) $record->slug = 'employee-'.Str::uuid();
            $record->fill($data)->save();
            if ($type === 'routes') {
                $ids = $relations['address_ids'] ?? [];
                $addresses = DeliveryAddress::whereIn('id', $ids)->lockForUpdate()->get();
                foreach ($addresses as $address) {
                    if ($address->delivery_route_id && $address->delivery_route_id != $record->id) throw ValidationException::withMessages(['address_ids' => 'Egy cím már másik útvonalhoz tartozik. Előbb ott válaszd le.']);
                }
                DeliveryAddress::where('delivery_route_id', $record->id)->whereNotIn('id', $ids)->update(['delivery_route_id' => null]);
                foreach ($addresses as $address) $address->update(['delivery_route_id' => $record->id, 'sort_order' => $relations['orders'][$address->id] ?? $address->sort_order]);
                if ($request->boolean('exempt_selection')) {
                    $exempt = $relations['exempt_ids'] ?? [];
                    DeliveryAddress::where('delivery_route_id', $record->id)->update(['is_exempt' => false]);
                    DeliveryAddress::where('delivery_route_id', $record->id)->whereIn('id', $exempt)->update(['is_exempt' => true]);
                }
            }
        });
        if ($request->expectsJson()) return response()->json($record, $id ? 200 : 201);
        return redirect()->route('admin.edit', [$type, $record->id])->with('status', 'Mentve.');
    }
    public function destroy(Request $request, $type, $id)
    {
        [$model] = $this->definition($type);
        if ($type === 'shifts') {
            $request->validate(['revision' => ($request->expectsJson() ? 'required|' : 'nullable|').'integer|min:1']);
            app(\App\Services\ShiftEditor::class)->delete($id, $request->input('revision'));
        } else $model::findOrFail($id)->delete();
        if ($request->expectsJson()) return response()->json(['deleted' => true]);
        return redirect()->route('admin.index', $type)->with('status', 'Törölve.');
    }
}
