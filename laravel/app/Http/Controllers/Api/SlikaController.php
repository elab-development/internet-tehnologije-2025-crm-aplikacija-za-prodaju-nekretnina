<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Slika;
use App\Models\Nekretnina;

class SlikaController extends Controller
{
    /**
     * POST /api/nekretnine/{nekretninaId}/slike
     * multipart/form-data:
     * - slika (file) [required]
     * - istaknuta (boolean) [optional]
     * - redosled (int) [optional]
     */
    public function store(Request $request, $nekretninaId)
    {
        $nekretnina = Nekretnina::find($nekretninaId);
        if (!$nekretnina) {
            return response()->json(['message' => 'Nekretnina nije pronađena'], 404);
        }

        $validator = Validator::make($request->all(), [
            'slika' => 'required|file|mimes:jpg,jpeg,png,webp|max:4096',
            'istaknuta' => 'nullable|boolean',
            'redosled' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $istaknuta = (bool) $request->input('istaknuta', false);
        $redosled = (int) $request->input('redosled', 0);

        // Ako postavljaš novu istaknutu, prvo spusti ostale na false
        if ($istaknuta) {
            Slika::where('nekretnina_id', $nekretninaId)->update(['istaknuta' => false]);
        }

        // Upis fajla u public disk
        $path = $request->file('slika')->store("nekretnine/{$nekretninaId}", 'public');
        // putanja u bazi: npr "nekretnine/5/abc.jpg"
        // url: /storage/nekretnine/5/abc.jpg

        $slika = Slika::create([
            'nekretnina_id' => $nekretninaId,
            'putanja' => $path,
            'istaknuta' => $istaknuta,
            'redosled' => $redosled,
        ]);

        return response()->json([
            'message' => 'Slika uspešno dodata.',
            'slika' => $slika,
            'url' => asset('storage/' . $slika->putanja),
        ], 201);
    }

    /**
     * PUT /api/slike/{id}
     * JSON body:
     * - istaknuta (boolean) [optional]
     * - redosled (int) [optional]
     */
    public function update(Request $request, $id)
    {
        $slika = Slika::find($id);
        if (!$slika) {
            return response()->json(['message' => 'Slika nije pronađena'], 404);
        }

        $validator = Validator::make($request->all(), [
            'istaknuta' => 'sometimes|required|boolean',
            'redosled' => 'sometimes|required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Ako postavljaš istaknutu na true, spusti sve ostale za tu nekretninu
        if ($request->has('istaknuta') && (bool)$request->istaknuta === true) {
            Slika::where('nekretnina_id', $slika->nekretnina_id)->update(['istaknuta' => false]);
        }

        $slika->update($request->only(['istaknuta', 'redosled']));

        return response()->json([
            'message' => 'Slika ažurirana.',
            'slika' => $slika,
            'url' => asset('storage/' . $slika->putanja),
        ]);
    }

    /**
     * DELETE /api/slike/{id}
     */
    public function destroy($id)
    {
        $slika = Slika::find($id);
        if (!$slika) {
            return response()->json(['message' => 'Slika nije pronađena'], 404);
        }

        // Obrisi fajl iz storage-a (public disk)
        if ($slika->putanja && Storage::disk('public')->exists($slika->putanja)) {
            Storage::disk('public')->delete($slika->putanja);
        }

        $slika->delete();

        return response()->json([
            'message' => 'Slika obrisana.'
        ]);
    }
}
