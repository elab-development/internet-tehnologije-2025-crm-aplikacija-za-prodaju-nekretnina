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
        return response()->json(
            Pregled::with([
                'kupac:id,ime,prezime',
                'nekretnina:id,adresa,tip,status',
            ])->orderBy('datum', 'desc')->get()
        );
    }

    public function show($id)
    {
        $row = Pregled::with([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
        ])->find($id);

        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);
        return response()->json($row);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kupac_id' => 'required|integer|exists:kupci,id',
            'nekretnina_id' => 'required|integer|exists:nekretnine,id',

            
            'datum' => 'required|date',

            'status' => 'nullable|string|max:50',
            'napomena' => 'nullable|string',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);
        $authUser = $request->user();
            if (!$authUser) {
                return response()->json(['message' => 'Neautorizovano.'], 401);
            }
        $row = Pregled::create([
            'kupac_id' => (int)$request->kupac_id,
            'nekretnina_id' => (int)$request->nekretnina_id,
             'korisnik_id' => (int)$authUser->id,  
            'datum' => $request->datum,
            'status' => $request->status ?? 'zakazan',
            'napomena' => $request->napomena ?? null,
        ]);

        // vrati sa relacijama da FE odmah ima ime/adresu
        $row->load([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
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
            'datum' => 'sometimes|required|date',
            'status' => 'sometimes|required|string|max:50',
            'napomena' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row->update($request->only(['kupac_id', 'nekretnina_id', 'datum', 'status', 'napomena']));

        $row->load([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
        ]);

        return response()->json($row);
    }

    public function destroy($id)
    {
        $row = Pregled::find($id);
        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);

        $row->delete();
        return response()->json(['message' => 'Pregled obrisan']);
    }

    // GET /api/pregledi/search?q=...&page=1&per_page=10&sort_by=datum&sort_dir=desc&status=zakazan
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|max:50',
            'sort_by' => 'nullable|in:created_at,datum,status,kupac_id,nekretnina_id',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $q = trim((string)$request->get('q', ''));
        $status = trim((string)$request->get('status', ''));

        $perPage = (int)$request->get('per_page', 10);
        $sortBy = (string)$request->get('sort_by', 'datum');
        $sortDir = (string)$request->get('sort_dir', 'desc');

        $allowed = ['created_at', 'datum', 'status', 'kupac_id', 'nekretnina_id'];
        if (!in_array($sortBy, $allowed, true)) $sortBy = 'datum';
        if (!in_array($sortDir, ['asc', 'desc'], true)) $sortDir = 'desc';

        $query = Pregled::query()->with([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
        ]);

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('napomena', 'like', "%{$q}%")
                   ->orWhere('status', 'like', "%{$q}%");
            });
        }

        if ($status !== '') $query->where('status', $status);

        return response()->json(
            $query->orderBy($sortBy, $sortDir)->paginate($perPage)
        );
    }
}