<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Pregled;
use OpenApi\Attributes as OA;

class PregledController extends Controller
{
    #[OA\Get(
        path: "/api/pregledi",
        summary: "Lista pregleda",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Lista pregleda"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function index()
    {
        return response()->json(
            Pregled::with([
                'kupac:id,ime,prezime',
                'nekretnina:id,adresa,tip,status',
            ])->orderBy('datum', 'desc')->get()
        );
    }

    #[OA\Get(
        path: "/api/pregledi/{id}",
        summary: "Prikaz pregleda po ID-u",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID pregleda",
                schema: new OA\Schema(type: "integer"),
                example: 1
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Detalji pregleda"),
            new OA\Response(response: 404, description: "Pregled nije pronađen"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function show($id)
    {
        $row = Pregled::with([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
        ])->find($id);

        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);
        return response()->json($row);
    }

    #[OA\Post(
        path: "/api/pregledi",
        summary: "Kreiranje pregleda",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["kupac_id", "nekretnina_id", "datum"],
                properties: [
                    new OA\Property(property: "kupac_id", type: "integer", example: 1),
                    new OA\Property(property: "nekretnina_id", type: "integer", example: 10),
                    new OA\Property(property: "datum", type: "string", format: "date", example: "2026-02-25"),
                    new OA\Property(property: "status", type: "string", example: "zakazan"),
                    new OA\Property(property: "napomena", type: "string", example: "Kupac želi obilazak popodne.")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Pregled kreiran"),
            new OA\Response(response: 422, description: "Validaciona greška"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
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

        $row->load([
            'kupac:id,ime,prezime',
            'nekretnina:id,adresa,tip,status',
        ]);

        return response()->json($row, 201);
    }

    #[OA\Put(
        path: "/api/pregledi/{id}",
        summary: "Izmena pregleda",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID pregleda",
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
                    new OA\Property(property: "datum", type: "string", format: "date", example: "2026-02-26"),
                    new OA\Property(property: "status", type: "string", example: "odrzan"),
                    new OA\Property(property: "napomena", type: "string", example: "Pregled uspešno obavljen.")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Pregled izmenjen"),
            new OA\Response(response: 404, description: "Pregled nije pronađen"),
            new OA\Response(response: 422, description: "Validaciona greška"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
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

    #[OA\Delete(
        path: "/api/pregledi/{id}",
        summary: "Brisanje pregleda",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(
                name: "id",
                in: "path",
                required: true,
                description: "ID pregleda",
                schema: new OA\Schema(type: "integer"),
                example: 1
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Pregled obrisan"),
            new OA\Response(response: 404, description: "Pregled nije pronađen"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function destroy($id)
    {
        $row = Pregled::find($id);
        if (!$row) return response()->json(['message' => 'Pregled nije pronađen'], 404);

        $row->delete();
        return response()->json(['message' => 'Pregled obrisan']);
    }

    #[OA\Get(
        path: "/api/pregledi/search",
        summary: "Pretraga pregleda",
        tags: ["Pregledi"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "q", in: "query", required: false, description: "Tekst pretrage (status/napomena)", schema: new OA\Schema(type: "string"), example: "zakazan"),
            new OA\Parameter(name: "page", in: "query", required: false, description: "Broj strane", schema: new OA\Schema(type: "integer"), example: 1),
            new OA\Parameter(name: "per_page", in: "query", required: false, description: "Broj stavki po strani", schema: new OA\Schema(type: "integer"), example: 10),
            new OA\Parameter(name: "status", in: "query", required: false, description: "Filter po statusu", schema: new OA\Schema(type: "string"), example: "zakazan"),
            new OA\Parameter(name: "sort_by", in: "query", required: false, description: "Polje za sortiranje", schema: new OA\Schema(type: "string", enum: ["created_at","datum","status","kupac_id","nekretnina_id"]), example: "datum"),
            new OA\Parameter(name: "sort_dir", in: "query", required: false, description: "Smer sortiranja", schema: new OA\Schema(type: "string", enum: ["asc","desc"]), example: "desc"),
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