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
}
