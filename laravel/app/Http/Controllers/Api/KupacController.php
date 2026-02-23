<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Kupac;
use OpenApi\Attributes as OA;

class KupacController extends Controller
{
    #[OA\Get(
        path: "/api/kupci",
        summary: "Lista kupaca",
        tags: ["Kupci"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista kupaca",
                content: new OA\JsonContent(type: "array", items: new OA\Items(ref: "#/components/schemas/Kupac"))
            )
        ]
    )]
    public function index()
    {
        return response()->json(Kupac::all());
    }

    #[OA\Get(
        path: "/api/kupci/{id}",
        summary: "Detalji kupca",
        tags: ["Kupci"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Kupac",
                content: new OA\JsonContent(ref: "#/components/schemas/Kupac")
            ),
            new OA\Response(response: 404, description: "Kupac nije pronađen")
        ]
    )]
    public function show($id)
    {
        $kupac = Kupac::find($id);

        if (!$kupac) {
            return response()->json(['message' => 'Kupac nije pronađen'], 404);
        }

        return response()->json($kupac);
    }

    #[OA\Post(
        path: "/api/kupci",
        summary: "Kreiranje kupca",
        tags: ["Kupci"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["ime", "prezime"],
                properties: [
                    new OA\Property(property: "ime", type: "string", maxLength: 100, example: "Ana"),
                    new OA\Property(property: "prezime", type: "string", maxLength: 100, example: "Anić"),
                    new OA\Property(property: "telefon", type: "string", maxLength: 50, nullable: true, example: "+381641112223"),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255, nullable: true, example: "ana@email.com"),
                    new OA\Property(property: "budzet", type: "number", nullable: true, example: 80000),
                    new OA\Property(property: "lokacija", type: "string", maxLength: 120, nullable: true, example: "Beograd"),
                    new OA\Property(property: "napomena", type: "string", nullable: true, example: "Traži 2-soban stan, blizu centra")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Kupac kreiran",
                content: new OA\JsonContent(ref: "#/components/schemas/Kupac")
            ),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
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

    #[OA\Put(
        path: "/api/kupci/{id}",
        summary: "Izmena kupca",
        tags: ["Kupci"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "ime", type: "string", maxLength: 100, nullable: true, example: "Ana"),
                    new OA\Property(property: "prezime", type: "string", maxLength: 100, nullable: true, example: "Anić"),
                    new OA\Property(property: "telefon", type: "string", maxLength: 50, nullable: true, example: "+381641112223"),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255, nullable: true, example: "ana@email.com"),
                    new OA\Property(property: "budzet", type: "number", nullable: true, example: 90000),
                    new OA\Property(property: "lokacija", type: "string", maxLength: 120, nullable: true, example: "Novi Sad"),
                    new OA\Property(property: "napomena", type: "string", nullable: true, example: "Prioritet: parking")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Kupac izmenjen",
                content: new OA\JsonContent(ref: "#/components/schemas/Kupac")
            ),
            new OA\Response(response: 404, description: "Kupac nije pronađen"),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
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

    #[OA\Delete(
        path: "/api/kupci/{id}",
        summary: "Brisanje kupca",
        tags: ["Kupci"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Kupac obrisan",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Kupac obrisan")
                    ],
                    type: "object"
                )
            ),
            new OA\Response(response: 404, description: "Kupac nije pronađen")
        ]
    )]
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

    #[OA\Get(
        path: "/api/kupci/search",
        summary: "Pretraga kupaca (paginacija + sortiranje)",
        description: "Primer: /api/kupci/search?q=...&page=1&per_page=10&sort_by=prezime&sort_dir=asc",
        tags: ["Kupci"],
        parameters: [
            new OA\Parameter(name: "q", in: "query", required: false, schema: new OA\Schema(type: "string", maxLength: 100)),
            new OA\Parameter(name: "page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1), example: 1),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1, maximum: 100), example: 10),
            new OA\Parameter(name: "sort_by", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["ime","prezime","email","telefon","budzet","lokacija","created_at"]), example: "prezime"),
            new OA\Parameter(name: "sort_dir", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["asc","desc"]), example: "asc")
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Paginirani rezultati",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "current_page", type: "integer", example: 1),
                        new OA\Property(property: "per_page", type: "integer", example: 10),
                        new OA\Property(property: "total", type: "integer", example: 25),
                        new OA\Property(
                            property: "data",
                            type: "array",
                            items: new OA\Items(ref: "#/components/schemas/Kupac")
                        )
                    ],
                    type: "object"
                )
            ),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|in:ime,prezime,email,telefon,budzet,lokacija,created_at',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $q = trim((string) $request->get('q', ''));
        $perPage = (int) $request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = Kupac::query();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('ime', 'like', "%{$q}%")
                    ->orWhere('prezime', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('telefon', 'like', "%{$q}%")
                    ->orWhere('lokacija', 'like', "%{$q}%")
                    ->orWhere('napomena', 'like', "%{$q}%");
            });
        }

        $result = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage);

        return response()->json($result);
    }
}