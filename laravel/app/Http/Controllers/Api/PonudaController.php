<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Ponuda;
use OpenApi\Attributes as OA;

class PonudaController extends Controller
{
    #[OA\Get(
        path: "/api/ponude",
        summary: "Lista ponuda",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Lista ponuda"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function index()
    {
        return response()->json(Ponuda::all());
    }

    #[OA\Get(
        path: "/api/ponude/{id}",
        summary: "Prikaz ponude po ID-u",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID ponude",
                schema: new OA\Schema(type: "integer"),
                example: 1
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Detalji ponude"),
            new OA\Response(response: 404, description: "Ponuda nije pronađena"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function show($id)
    {
        $row = Ponuda::find($id);
        if (!$row) return response()->json(['message' => 'Ponuda nije pronađena'], 404);
        return response()->json($row);
    }

    #[OA\Post(
        path: "/api/ponude",
        summary: "Kreiranje ponude",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["kupac_id", "nekretnina_id", "cena", "datum"],
                properties: [
                    new OA\Property(property: "kupac_id", type: "integer", example: 1),
                    new OA\Property(property: "nekretnina_id", type: "integer", example: 10),
                    new OA\Property(property: "cena", type: "number", format: "float", example: 120000),
                    new OA\Property(property: "status", type: "string", example: "u_toku"),
                    new OA\Property(property: "napomena", type: "string", example: "Kupac nudi 120k, traži brzu realizaciju."),
                    new OA\Property(property: "datum", type: "string", format: "date", example: "2026-02-25")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Ponuda kreirana"),
            new OA\Response(response: 422, description: "Validaciona greška"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'kupac_id' => 'required|integer|exists:kupci,id',
            'nekretnina_id' => 'required|integer|exists:nekretnine,id',
            'cena' => 'required|numeric|min:0',
            'status' => 'nullable|string|max:50',
            'napomena' => 'nullable|string',
            'datum' => 'required|date',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $row = Ponuda::create([
            'kupac_id' => $request->kupac_id,
            'nekretnina_id' => $request->nekretnina_id,
            'iznos' => $request->cena,
            'status' => $request->status ?? 'u_toku',
            'napomena' => $request->napomena ?? null,
            'korisnik_id' => auth()->id(),
            'datum' => $request->datum,
        ]);

        return response()->json($row, 201);
    }

    #[OA\Put(
        path: "/api/ponude/{id}",
        summary: "Izmena ponude",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID ponude",
                schema: new OA\Schema(type: "integer"),
                example: 1
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "kupac_id", type: "integer", example: 1),
                    new OA\Property(property: "nekretnina_id", type: "integer", example: 10),
                    new OA\Property(property: "cena", type: "number", format: "float", example: 125000),
                    new OA\Property(property: "status", type: "string", example: "prihvacena"),
                    new OA\Property(property: "napomena", type: "string", example: "Dogovoreno na 125k.")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Ponuda izmenjena"),
            new OA\Response(response: 404, description: "Ponuda nije pronađena"),
            new OA\Response(response: 422, description: "Validaciona greška"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
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

    #[OA\Delete(
        path: "/api/ponude/{id}",
        summary: "Brisanje ponude",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID ponude",
                schema: new OA\Schema(type: "integer"),
                example: 1
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Ponuda obrisana"),
            new OA\Response(response: 404, description: "Ponuda nije pronađena"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function destroy($id)
    {
        $row = Ponuda::find($id);
        if (!$row) return response()->json(['message' => 'Ponuda nije pronađena'], 404);

        $row->delete();
        return response()->json(['message' => 'Ponuda obrisana']);
    }

    #[OA\Get(
        path: "/api/ponude/search",
        summary: "Pretraga ponuda",
        tags: ["Ponude"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "q",
                in: "query",
                required: false,
                description: "Tekst pretrage (status/napomena)",
                schema: new OA\Schema(type: "string"),
                example: "u_toku"
            ),
            new OA\Parameter(
                name: "page",
                in: "query",
                required: false,
                description: "Broj strane",
                schema: new OA\Schema(type: "integer"),
                example: 1
            ),
            new OA\Parameter(
                name: "per_page",
                in: "query",
                required: false,
                description: "Broj stavki po strani",
                schema: new OA\Schema(type: "integer"),
                example: 10
            ),
            new OA\Parameter(
                name: "status",
                in: "query",
                required: false,
                description: "Filter po statusu",
                schema: new OA\Schema(type: "string"),
                example: "u_toku"
            ),
            new OA\Parameter(
                name: "sort_by",
                in: "query",
                required: false,
                description: "Polje za sortiranje",
                schema: new OA\Schema(type: "string", enum: ["created_at","cena","status","kupac_id","nekretnina_id"]),
                example: "created_at"
            ),
            new OA\Parameter(
                name: "sort_dir",
                in: "query",
                required: false,
                description: "Smer sortiranja",
                schema: new OA\Schema(type: "string", enum: ["asc","desc"]),
                example: "desc"
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Paginirani rezultat pretrage"),
            new OA\Response(response: 422, description: "Validaciona greška"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
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

        $query = Ponuda::query()
            ->with([
                'kupac:id,ime,prezime,email,telefon',
                'nekretnina:id,adresa,tip,status',
                'korisnik:id,ime,prezime,email',
            ]);

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('napomena', 'like', "%{$q}%")
                    ->orWhere('status', 'like', "%{$q}%");
            });
        }

        if ($status !== '') $query->where('status', $status);

        $result = $query->orderBy($sortBy, $sortDir)->paginate($perPage);

        $result->getCollection()->transform(function ($p) {
            return [
                'id' => $p->id,

                'kupac_id' => $p->kupac_id,
                'kupac_ime' => $p->kupac ? $p->kupac->ime : null,
                'kupac_prezime' => $p->kupac ? $p->kupac->prezime : null,
                'kupac_full' => $p->kupac ? trim($p->kupac->ime . ' ' . $p->kupac->prezime) : null,

                'nekretnina_id' => $p->nekretnina_id,
                'nekretnina_adresa' => $p->nekretnina ? $p->nekretnina->adresa : null,
                'nekretnina_tip' => $p->nekretnina ? $p->nekretnina->tip : null,

                'korisnik_id' => $p->korisnik_id,
                'agent_full' => $p->korisnik ? trim($p->korisnik->ime . ' ' . $p->korisnik->prezime) : null,

                'iznos' => $p->iznos ?? $p->cena ?? null,
                'datum' => $p->datum ?? null,
                'status' => $p->status ?? null,

                'created_at' => $p->created_at,
                'updated_at' => $p->updated_at,
            ];
        });

        return response()->json($result);
    }
}