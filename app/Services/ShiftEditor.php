<?php

namespace App\Services;

use App\Models\Shift;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ShiftEditor
{
    private function lockDays($dates)
    {
        sort($dates);
        foreach (array_unique($dates) as $date) {
            DB::table('schedule_day_locks')->insertOrIgnore(['date' => $date]);
            DB::table('schedule_day_locks')->where('date', $date)->lockForUpdate()->first();
        }
    }

    public function save(array $data, $id = null, $revision = null)
    {
        return DB::transaction(function () use ($data, $id, $revision) {
            $original = $id ? Shift::findOrFail($id) : null;
            $this->lockDays($original ? [$original->date, $data['date']] : [$data['date']]);
            $record = $id ? Shift::lockForUpdate()->findOrFail($id) : new Shift;
            if ($id && $revision !== null && (int) $revision !== $record->revision) {
                abort(409, 'A beosztás közben módosult. Nyisd meg újra a cellát.');
            }
            $others = Shift::where('date', $data['date'])->when($id, function ($query) use ($id) { $query->where('id', '!=', $id); });
            if ((clone $others)->where('employee_id', $data['employee_id'])->lockForUpdate()->first()) {
                throw ValidationException::withMessages(['employee_id' => 'A munkatársnak erre a napra már van beosztása. Nyisd meg a meglévő cellát.']);
            }
            if ($data['status'] === 'work') {
                foreach (['delivery_route_id' => 'Az útvonal', 'vehicle_id' => 'A gépjármű'] as $field => $label) {
                    if (!empty($data[$field]) && (clone $others)->where('status', 'work')->where($field, $data[$field])->lockForUpdate()->first()) {
                        throw ValidationException::withMessages([$field => $label.' ezen a napon már foglalt. Válassz szabad elemet.']);
                    }
                }
            }
            $record->fill($data);
            $record->revision = $record->exists ? $record->revision + 1 : 1;
            $record->save();
            return $record;
        }, 3);
    }

    public function delete($id, $revision = null)
    {
        DB::transaction(function () use ($id, $revision) {
            $original = Shift::findOrFail($id);
            $this->lockDays([$original->date]);
            $record = Shift::lockForUpdate()->findOrFail($id);
            if ($revision !== null && (int) $revision !== $record->revision) abort(409, 'A beosztás közben módosult. Nyisd meg újra a cellát.');
            $record->delete();
        }, 3);
    }
}
