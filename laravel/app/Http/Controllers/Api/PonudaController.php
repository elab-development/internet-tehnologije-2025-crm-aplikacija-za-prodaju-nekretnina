<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Ponuda;

class PonudaController extends Controller
{
    public function index()
    {
        return response()->json(Ponuda::all());
    }

    public function show($id)
    {
        $row = Ponuda::find($id);
        if (!$row) return response()->json(['message' => 'Ponuda nije pronađena'], 404);
        return response()->json($row);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kupac_id' => 'required|integer|exists:kupci,id',
            'nekretnina_id' => 'required|integer|exists:nekretnine,id',
            'cena' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'napomena' => 'nullable|string',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row = Ponuda::create([
            'kupac_id' => $request->kupac_id,
            'nekretnina_id' => $request->nekretnina_id,
            'cena' => $request->cena,
            'status' => $request->status ?? 'u_toku',
            'napomena' => $request->napomena ?? null,
        ]);

        return response()->json($row, 201);
    }

    public function update(Request $request, $id)
    {
        $row = Ponuda::find($id);
        if (!$row) return response()->json(['message' => 'Ponuda nije pronađena'], 404);

        $validator = Validator::make($request->all(), [
            'kupac_id' => 'sometimes|required|integer|exists:kupci,id',
            'nekretnina_id' => 'sometimes|required|integer|exists:nekretnine,id',
            'cena' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|string|max:50',
            'napomena' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row->update($request->only(['kupac_id','nekretnina_id','cena','status','napomena']));
        return response()->json($row);
    }

    public function destroy($id)
    {
        $row = Ponuda::find($id);
        if (!$row) return response()->json(['message' => 'Ponuda nije pronađena'], 404);

        $row->delete();
        return response()->json(['message' => 'Ponuda obrisana']);
    }

    // GET /api/ponude/search?q=...&page=1&per_page=10&sort_by=created_at&sort_dir=desc&status=u_toku
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|max:50',
            'sort_by' => 'nullable|in:created_at,cena,status,kupac_id,nekretnina_id',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $q = trim((string)$request->get('q',''));
        $status = trim((string)$request->get('status',''));
        $perPage = (int)$request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = Ponuda::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('napomena', 'like', "%{$q}%")
                   ->orWhere('status', 'like', "%{$q}%");
            });
        }

        if ($status !== '') $query->where('status', $status);

        $result = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json($result);
    }
}