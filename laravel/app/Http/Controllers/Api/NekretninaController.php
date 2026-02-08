<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Nekretnina;

class NekretninaController extends Controller
{
    // GET /api/nekretnine
    public function index()
    {
       
        // return response()->json(Nekretnina::with('slike')->get());

        return response()->json(Nekretnina::all());
    }

    // GET /api/nekretnine/{id}
    public function show($id)
    {
        $nekretnina = Nekretnina::with(['slike' => function ($q) {
            
            $q->orderBy('redosled');
        }])->find($id);

        if (!$nekretnina) {
            return response()->json(['message' => 'Nekretnina nije pronađena'], 404);
        }

        return response()->json($nekretnina);
    }

    // POST /api/nekretnine
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'adresa' => 'required|string|max:255',
            'tip' => 'required|string|max:80',
            'cena' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'atributi' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $nekretnina = Nekretnina::create([
            'adresa' => $request->adresa,
            'tip' => $request->tip,
            'cena' => $request->cena,
            'status' => $request->status ?? 'dostupna',
            'atributi' => $request->atributi ?? null,
        ]);

        return response()->json($nekretnina, 201);
    }

    // PUT /api/nekretnine/{id}
    public function update(Request $request, $id)
    {
        $nekretnina = Nekretnina::find($id);

        if (!$nekretnina) {
            return response()->json(['message' => 'Nekretnina nije pronađena'], 404);
        }

        $validator = Validator::make($request->all(), [
            'adresa' => 'sometimes|required|string|max:255',
            'tip' => 'sometimes|required|string|max:80',
            'cena' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|string|max:50',
            'atributi' => 'sometimes|nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Napomena: update radi i za JSON atributi jer je cast array
        $nekretnina->update($request->only([
            'adresa', 'tip', 'cena', 'status', 'atributi'
        ]));

        return response()->json($nekretnina);
    }

    // DELETE /api/nekretnine/{id}
    public function destroy($id)
    {
        $nekretnina = Nekretnina::find($id);

        if (!$nekretnina) {
            return response()->json(['message' => 'Nekretnina nije pronađena'], 404);
        }

        $nekretnina->delete();

        return response()->json([
            'message' => 'Nekretnina obrisana'
        ]);
    }



    // GET /api/nekretnine/search?q=...&page=1&per_page=10&sort_by=adresa&sort_dir=asc&status=dostupna&tip=stan
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',

            'status' => 'nullable|string|max:50',
            'tip' => 'nullable|string|max:80',

            'sort_by' => 'nullable|in:adresa,tip,cena,status,created_at',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $q = trim((string) $request->get('q', ''));
        $status = trim((string) $request->get('status', ''));
        $tip = trim((string) $request->get('tip', ''));

        $perPage = (int) $request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = Nekretnina::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('adresa', 'like', "%{$q}%")
                ->orWhere('tip', 'like', "%{$q}%")
                ->orWhere('status', 'like', "%{$q}%");

                // ako želiš da pretražuje i JSON (atributi), može ovako (MySQL):
                // ->orWhere('atributi', 'like', "%{$q}%");
            });
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($tip !== '') {
            $query->where('tip', $tip);
        }

        $result = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);

        return response()->json($result);
    }






}
