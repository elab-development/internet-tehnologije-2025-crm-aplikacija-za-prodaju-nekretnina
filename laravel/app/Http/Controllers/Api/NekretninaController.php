<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Nekretnina;
use OpenApi\Attributes as OA;

class NekretninaController extends Controller
{
    #[OA\Get(
        path: "/api/nekretnine",
        summary: "Lista nekretnina (sa slikama)",
        tags: ["Nekretnine"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Lista nekretnina",
                content: new OA\JsonContent(type: "array", items: new OA\Items(ref: "#/components/schemas/Nekretnina"))
            )
        ]
    )]
    public function index()
    {
        $nekretnine = Nekretnina::with(['slike' => function ($q) {
            $q->orderByDesc('istaknuta')
                ->orderBy('redosled');
        }])->get();

        return response()->json($nekretnine);
    }

    #[OA\Get(
        path: "/api/nekretnine/{id}",
        summary: "Detalji nekretnine (sa slikama)",
        tags: ["Nekretnine"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Nekretnina",
                content: new OA\JsonContent(ref: "#/components/schemas/Nekretnina")
            ),
            new OA\Response(response: 404, description: "Nekretnina nije pronađena")
        ]
    )]
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

    #[OA\Post(
        path: "/api/nekretnine",
        summary: "Kreiranje nekretnine",
        tags: ["Nekretnine"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["adresa","tip","cena"],
                properties: [
                    new OA\Property(property: "adresa", type: "string", maxLength: 255, example: "Bulevar Oslobođenja 12, Novi Sad"),
                    new OA\Property(property: "tip", type: "string", maxLength: 80, example: "stan"),
                    new OA\Property(property: "cena", type: "number", example: 95000),
                    new OA\Property(property: "status", type: "string", maxLength: 50, nullable: true, example: "dostupna"),
                    new OA\Property(
                        property: "atributi",
                        type: "object",
                        nullable: true,
                        additionalProperties: new OA\AdditionalProperties(type: "string"),
                        example: ["kvadratura" => "55", "sprat" => "3", "grejanje" => "CG"]
                    )
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: "Nekretnina kreirana",
                content: new OA\JsonContent(ref: "#/components/schemas/Nekretnina")
            ),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
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

    #[OA\Put(
        path: "/api/nekretnine/{id}",
        summary: "Izmena nekretnine",
        tags: ["Nekretnine"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "adresa", type: "string", maxLength: 255, nullable: true, example: "Cara Dušana 8, Beograd"),
                    new OA\Property(property: "tip", type: "string", maxLength: 80, nullable: true, example: "kuca"),
                    new OA\Property(property: "cena", type: "number", nullable: true, example: 125000),
                    new OA\Property(property: "status", type: "string", maxLength: 50, nullable: true, example: "rezervisana"),
                    new OA\Property(
                        property: "atributi",
                        type: "object",
                        nullable: true,
                        additionalProperties: new OA\AdditionalProperties(type: "string"),
                        example: ["kvadratura" => "120", "parking" => "da"]
                    )
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Nekretnina izmenjena",
                content: new OA\JsonContent(ref: "#/components/schemas/Nekretnina")
            ),
            new OA\Response(response: 404, description: "Nekretnina nije pronađena"),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
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

        $nekretnina->update($request->only([
            'adresa', 'tip', 'cena', 'status', 'atributi'
        ]));

        return response()->json($nekretnina);
    }

    #[OA\Delete(
        path: "/api/nekretnine/{id}",
        summary: "Brisanje nekretnine",
        tags: ["Nekretnine"],
        parameters: [
            new OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Nekretnina obrisana",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Nekretnina obrisana")
                    ],
                    type: "object"
                )
            ),
            new OA\Response(response: 404, description: "Nekretnina nije pronađena")
        ]
    )]
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

    #[OA\Get(
        path: "/api/nekretnine/search",
        summary: "Pretraga nekretnina (filter + paginacija + sortiranje)",
        description: "Primer: /api/nekretnine/search?q=...&page=1&per_page=10&sort_by=adresa&sort_dir=asc&status=dostupna&tip=stan",
        tags: ["Nekretnine"],
        parameters: [
            new OA\Parameter(name: "q", in: "query", required: false, schema: new OA\Schema(type: "string", maxLength: 150)),
            new OA\Parameter(name: "page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1), example: 1),
            new OA\Parameter(name: "per_page", in: "query", required: false, schema: new OA\Schema(type: "integer", minimum: 1, maximum: 100), example: 10),
            new OA\Parameter(name: "status", in: "query", required: false, schema: new OA\Schema(type: "string", maxLength: 50), example: "dostupna"),
            new OA\Parameter(name: "tip", in: "query", required: false, schema: new OA\Schema(type: "string", maxLength: 80), example: "stan"),
            new OA\Parameter(name: "sort_by", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["adresa","tip","cena","status","created_at"]), example: "created_at"),
            new OA\Parameter(name: "sort_dir", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["asc","desc"]), example: "desc")
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
                            items: new OA\Items(ref: "#/components/schemas/Nekretnina")
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