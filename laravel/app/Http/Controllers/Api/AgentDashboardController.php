<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kupac;
use App\Models\Nekretnina;
use App\Models\Ponuda;
use App\Models\Pregled;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $agentId = auth()->id();

        $today = Carbon::today();
        $in7 = Carbon::today()->addDays(7);
        $from6m = Carbon::today()->subMonths(5)->startOfMonth();
        $toNow = Carbon::now();

        // KPI
        $activeCustomers = Kupac::query()->count();

        $availableProperties = Nekretnina::query()
            ->where('status', 'dostupna')
            ->count();

        $scheduledViewings7d = Pregled::query()
            ->where('korisnik_id', $agentId)
            ->whereBetween('datum', [$today->toDateString(), $in7->toDateString()])
            ->count();

        $dealsInProgress = Ponuda::query()
            ->where('korisnik_id', $agentId)
            ->whereIn('status', ['na_cekanju', 'u_toku'])
            ->count();

        // Chart 1: ponude po statusu (sve ili npr poslednjih 90 dana)
        $offersByStatus = Ponuda::query()
            ->where('korisnik_id', $agentId)
            ->select('status', DB::raw('COUNT(*) as cnt'))
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => (int)$r->cnt]);

        // Chart 2: ponude po mesecima (poslednjih 6 meseci)
        $offersByMonthRaw = Ponuda::query()
            ->where('korisnik_id', $agentId)
            ->whereBetween('created_at', [$from6m, $toNow])
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as ym"),
                DB::raw('COUNT(*) as cnt'),
                DB::raw('SUM(iznos) as sum_iznos')
            )
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $months = [];
        for ($i = 0; $i < 6; $i++) {
            $m = Carbon::today()->subMonths(5 - $i)->format('Y-m');
            $months[] = $m;
        }

        $offersByMonth = array_map(function ($ym) use ($offersByMonthRaw) {
            $row = $offersByMonthRaw->get($ym);
            return [
                'month' => $ym,
                'count' => $row ? (int)$row->cnt : 0,
                'sum' => $row ? (float)$row->sum_iznos : 0.0,
            ];
        }, $months);

        // Chart 3: pregledi narednih 7 dana (po danima)
        $viewingsByDayRaw = Pregled::query()
            ->where('korisnik_id', $agentId)
            ->whereBetween('datum', [$today->toDateString(), $in7->toDateString()])
            ->select('datum', DB::raw('COUNT(*) as cnt'))
            ->groupBy('datum')
            ->orderBy('datum')
            ->get()
            ->keyBy('datum');

        $viewingsByDay = [];
        for ($d = 0; $d <= 7; $d++) {
            $date = Carbon::today()->addDays($d)->toDateString();
            $row = $viewingsByDayRaw->get($date);
            $viewingsByDay[] = [
                'date' => $date,
                'count' => $row ? (int)$row->cnt : 0,
            ];
        }

        return response()->json([
            'kpi' => [
                'activeCustomers' => $activeCustomers,
                'availableProperties' => $availableProperties,
                'scheduledViewings7d' => $scheduledViewings7d,
                'dealsInProgress' => $dealsInProgress,
            ],
            'charts' => [
                'offersByStatus' => $offersByStatus,
                'offersByMonth' => $offersByMonth,
                'viewingsByDay' => $viewingsByDay,
            ],
        ]);
    }
}