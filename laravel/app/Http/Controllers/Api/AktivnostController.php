<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Aktivnost;

class AktivnostController extends Controller
{
    public function index()
    {
        return response()->json(Aktivnost::all());
    }

    public function show($id)
    {
        $row = Aktivnost::find($id);
        if (!$row) return response()->json(['message' => 'Aktivnost nije pronađena'], 404);
        return response()->json($row);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'naslov' => 'required|string|max:150',
            'opis' => 'nullable|string',
            'tip' => 'nullable|string|max:80',
            'datum' => 'nullable|date',
            'status' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row = Aktivnost::create([
            'user_id' => $request->user_id,
            'naslov' => $request->naslov,
            'opis' => $request->opis ?? null,
            'tip' => $request->tip ?? 'opste',
            'datum' => $request->datum ?? null,
            'status' => $request->status ?? 'otvorena',
        ]);

        return response()->json($row, 201);
    }

    public function update(Request $request, $id)
    {
        $row = Aktivnost::find($id);
        if (!$row) return response()->json(['message' => 'Aktivnost nije pronađena'], 404);

        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|required|integer|exists:users,id',
            'naslov' => 'sometimes|required|string|max:150',
            'opis' => 'sometimes|nullable|string',
            'tip' => 'sometimes|required|string|max:80',
            'datum' => 'sometimes|nullable|date',
            'status' => 'sometimes|required|string|max:50',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row->update($request->only(['user_id','naslov','opis','tip','datum','status']));
        return response()->json($row);
    }

    public function destroy($id)
    {
        $row = Aktivnost::find($id);
        if (!$row) return response()->json(['message' => 'Aktivnost nije pronađena'], 404);

        $row->delete();
        return response()->json(['message' => 'Aktivnost obrisana']);
    }

    // GET /api/aktivnosti/search?q=...&page=1&per_page=10&sort_by=created_at&sort_dir=desc&status=otvorena
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|string|max:50',
            'sort_by' => 'nullable|in:created_at,naslov,tip,status,datum,user_id',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $q = trim((string)$request->get('q',''));
        $status = trim((string)$request->get('status',''));
        $perPage = (int)$request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = Aktivnost::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('naslov', 'like', "%{$q}%")
                   ->orWhere('opis', 'like', "%{$q}%")
                   ->orWhere('tip', 'like', "%{$q}%")
                   ->orWhere('status', 'like', "%{$q}%");
            });
        }

        if ($status !== '') $query->where('status', $status);

        $result = $query->orderBy($sortBy, $sortDir)->paginate($perPage);
        return response()->json($result);
    }
}