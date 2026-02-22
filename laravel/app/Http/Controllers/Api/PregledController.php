<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Pregled;

class PregledController extends Controller
{
    public function index()
    {
        return response()->json(Pregled::all());
    }

    public function show($id)
    {
        $row = Pregled::find($id);
        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);
        return response()->json($row);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kupac_id' => 'required|integer|exists:kupci,id',
            'nekretnina_id' => 'required|integer|exists:nekretnine,id',
            'datum_vreme' => 'required|date',
            'status' => 'nullable|string|max:50',
            'napomena' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $row = Pregled::create([
            'kupac_id' => $request->kupac_id,
            'nekretnina_id' => $request->nekretnina_id,
            'datum_vreme' => $request->datum_vreme,
            'status' => $request->status ?? 'zakazan',
            'napomena' => $request->napomena ?? null,
        ]);

        return response()->json($row, 201);
    }

    public function update(Request $request, $id)
    {
        $row = Pregled::find($id);
        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);

        $validator = Validator::make($request->all(), [
            'kupac_id' => 'sometimes|required|integer|exists:kupci,id',
            'nekretnina_id' => 'sometimes|required|integer|exists:nekretnine,id',
            'datum_vreme' => 'sometimes|required|date',
            'status' => 'sometimes|required|string|max:50',
            'napomena' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $row->update($request->only(['kupac_id','nekretnina_id','datum_vreme','status','napomena']));
        return response()->json($row);
    }

    public function destroy($id)
    {
        $row = Pregled::find($id);
        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);

        $row->delete();
        return response()->json(['message' => 'Pregled obrisan']);
    }

    // GET /api/pregledi/search?q=...&page=1&per_page=10&sort_by=datum_vreme&sort_dir=desc&status=zakazan
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|max:50',
            'sort_by' => 'nullable|in:created_at,datum_vreme,status,kupac_id,nekretnina_id',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $q = trim((string) $request->get('q', ''));
        $status = trim((string) $request->get('status', ''));
        $perPage = (int) $request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'datum_vreme');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = Pregled::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('napomena', 'like', "%{$q}%")
                   ->orWhere('status', 'like', "%{$q}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        // zaštita da se ne sortira po nepostojećoj koloni (ako neko pošalje sort_by pogrešno)
        $allowed = ['created_at','datum_vreme','status','kupac_id','nekretnina_id'];
        if (!in_array($sortBy, $allowed, true)) {
            $sortBy = 'created_at';
        }

        $result = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json($result);
    }
}