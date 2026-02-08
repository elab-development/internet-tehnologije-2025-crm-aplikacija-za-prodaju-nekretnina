<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Kupac;

class KupacController extends Controller
{
    // GET /api/kupci
    public function index()
    {
        return response()->json(Kupac::all());
    }

    // GET /api/kupci/{id}
    public function show($id)
    {
        $kupac = Kupac::find($id);

        if (!$kupac) {
            return response()->json(['message' => 'Kupac nije pronađen'], 404);
        }

        return response()->json($kupac);
    }

    // POST /api/kupci
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ime' => 'required|string|max:100',
            'prezime' => 'required|string|max:100',
            'telefon' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'budzet' => 'nullable|numeric',
            'lokacija' => 'nullable|string|max:120',
            'napomena' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $kupac = Kupac::create($request->all());

        return response()->json($kupac, 201);
    }

    // PUT /api/kupci/{id}
    public function update(Request $request, $id)
    {
        $kupac = Kupac::find($id);

        if (!$kupac) {
            return response()->json(['message' => 'Kupac nije pronađen'], 404);
        }

        $validator = Validator::make($request->all(), [
            'ime' => 'sometimes|required|string|max:100',
            'prezime' => 'sometimes|required|string|max:100',
            'telefon' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'budzet' => 'nullable|numeric',
            'lokacija' => 'nullable|string|max:120',
            'napomena' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $kupac->update($request->all());

        return response()->json($kupac);
    }

    // DELETE /api/kupci/{id}
    public function destroy($id)
    {
        $kupac = Kupac::find($id);

        if (!$kupac) {
            return response()->json(['message' => 'Kupac nije pronađen'], 404);
        }

        $kupac->delete();

        return response()->json([
            'message' => 'Kupac obrisan'
        ]);
    }
}
