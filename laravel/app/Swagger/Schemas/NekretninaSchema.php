<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "Nekretnina",
    type: "object",
    properties: [
        new OA\Property(property: "id", type: "integer", example: 1),
        new OA\Property(property: "adresa", type: "string", example: "Bulevar Oslobođenja 12, Novi Sad"),
        new OA\Property(property: "tip", type: "string", example: "stan"),
        new OA\Property(property: "cena", type: "number", example: 95000),
        new OA\Property(property: "status", type: "string", nullable: true, example: "dostupna"),
        new OA\Property(
            property: "atributi",
            type: "object",
            nullable: true,
            additionalProperties: new OA\AdditionalProperties(type: "string"),
            example: ["kvadratura" => "55", "sprat" => "3"]
        ),
        new OA\Property(
            property: "slike",
            type: "array",
            nullable: true,
            items: new OA\Items(ref: "#/components/schemas/NekretninaSlika")
        ),
        new OA\Property(property: "created_at", type: "string", format: "date-time", nullable: true),
        new OA\Property(property: "updated_at", type: "string", format: "date-time", nullable: true),
    ]
)]
class NekretninaSchema {}