<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "NekretninaSlika",
    type: "object",
    properties: [
        new OA\Property(property: "id", type: "integer", example: 10),
        new OA\Property(property: "nekretnina_id", type: "integer", example: 1),
        new OA\Property(property: "putanja", type: "string", example: "uploads/nekretnine/1/slika1.jpg"),
        new OA\Property(property: "istaknuta", type: "boolean", example: true),
        new OA\Property(property: "redosled", type: "integer", example: 1),
        new OA\Property(property: "created_at", type: "string", format: "date-time", nullable: true),
        new OA\Property(property: "updated_at", type: "string", format: "date-time", nullable: true),
    ]
)]
class NekretninaSlikaSchema {}