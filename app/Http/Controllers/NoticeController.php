<?php

namespace App\Http\Controllers;

use App\Models\{DispatchNotice, Employee};
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoticeController extends Controller
{
    public function admin()
    {
        return view('admin.notifications', ['type' => 'notifications', 'title' => 'Értesítések', 'notices' => DispatchNotice::orderByDesc('id')->paginate(20)]);
    }
    public function store(Request $request)
    {
        $data = $request->validate([
            'kind' => 'required|in:text,schedule', 'request_id' => 'required|uuid',
            'title' => 'required_if:kind,text|nullable|string|max:120',
            'body' => 'required_if:kind,text|nullable|string|max:5000',
            'week_start' => 'required_if:kind,schedule|nullable|date_format:Y-m-d',
        ]);
        $week = $data['kind'] === 'schedule' ? Carbon::createFromFormat('!Y-m-d', $data['week_start'])->startOfWeek(Carbon::MONDAY) : null;
        $body = $week ? 'Módosult a beosztás: '.$week->format('Y. m. d.').' – '.$week->copy()->addDays(6)->format('Y. m. d.')."\n\n".($data['body'] ?? '') : $data['body'];
        DispatchNotice::query()->insertOrIgnore([
            'request_id' => $data['request_id'], 'kind' => $data['kind'],
            'title' => $week ? 'Beosztás módosult' : $data['title'], 'body' => trim($body),
            'week_start' => $week ? $week->toDateString() : null, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $notice = DispatchNotice::where('request_id', $data['request_id'])->firstOrFail();
        return $request->expectsJson() ? response()->json($notice, 201) : redirect()->route('admin.notifications')->with('status', 'Értesítés elküldve.');
    }
    private function employee(Request $request, $required = false)
    {
        $request->validate(['employee' => ($required ? 'required' : 'nullable').'|string|exists:employees,slug']);
        return $request->filled('employee') ? Employee::where('slug', $request->employee)->where('active', true)->firstOrFail() : null;
    }
    public function index(Request $request)
    {
        $person = $this->employee($request);
        $request->validate(['page' => 'nullable|integer|min:1|max:100000']);
        $latest = DispatchNotice::max('id') ?? 0;
        $notices = DispatchNotice::where('id', '<=', $latest)->orderByDesc('id')->paginate(20);
        $reads = $person ? DB::table('dispatch_notice_reads')->where('employee_id', $person->id)->whereIn('dispatch_notice_id', $notices->pluck('id'))->pluck('read_at', 'dispatch_notice_id') : collect();
        $unread = DispatchNotice::query();
        if ($person) $unread->whereNotIn('id', DB::table('dispatch_notice_reads')->where('employee_id', $person->id)->select('dispatch_notice_id'));
        return response()->json([
            'items' => $notices->map(function ($notice) use ($reads) { return array_merge($notice->only(['id', 'kind', 'title', 'body', 'week_start']), ['created_at' => $notice->created_at->toIso8601String(), 'read_at' => $reads->get($notice->id)]); })->all(),
            'unread_count' => $unread->count(), 'next_page' => $notices->hasMorePages() ? $notices->currentPage() + 1 : null,
            'latest_id' => $latest,
        ])->header('Cache-Control', 'no-store, private');
    }
    public function read(Request $request)
    {
        $person = $this->employee($request, true);
        $data = $request->validate(['id' => 'nullable|integer|exists:dispatch_notices,id', 'through_id' => 'required_without:id|nullable|integer|min:0']);
        $query = DispatchNotice::query();
        if (!empty($data['id'])) $query->whereKey($data['id']); else $query->where('id', '<=', $data['through_id']);
        $query->select('id')->chunkById(200, function ($notices) use ($person) {
            $rows = $notices->map(function ($notice) use ($person) { return ['dispatch_notice_id' => $notice->id, 'employee_id' => $person->id, 'read_at' => now()]; })->all();
            if ($rows) DB::table('dispatch_notice_reads')->insertOrIgnore($rows);
        });
        return response()->json(['saved' => true])->header('Cache-Control', 'no-store, private');
    }
}
