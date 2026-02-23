<?php

namespace App\Swagger\Schemas;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: "Kupac",
    type: "object",
    properties: [
        new OA\Property(property: "id", type: "integer", example: 1),
        new OA\Property(property: "ime", type: "string", example: "Ana"),
        new OA\Property(property: "prezime", type: "string", example: "Anić"),
        new OA\Property(property: "telefon", type: "string", nullable: true, example: "+381641112223"),
        new OA\Property(property: "email", type: "string", format: "email", nullable: true, example: "ana@email.com"),
        new OA\Property(property: "budzet", type: "number", nullable: true, example: 80000),
        new OA\Property(property: "lokacija", type: "string", nullable: true, example: "Beograd"),
        new OA\Property(property: "napomena", type: "string", nullable: true, example: "Traži 2-soban stan"),
        new OA\Property(property: "created_at", type: "string", format: "date-time", nullable: true),
        new OA\Property(property: "updated_at", type: "string", format: "date-time", nullable: true),
    ]
)]
class KupacSchema {}