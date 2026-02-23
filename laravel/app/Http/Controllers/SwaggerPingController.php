<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;
 
class SwaggerPingController extends Controller
{
    #[OA\Get(
        path: "/api/ping",
        summary: "Ping endpoint",
        description: "Test endpoint da Swagger generisanje proradi",
        tags: ["System"],
        responses: [
            new OA\Response(
                response: 200,
                description: "OK",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "ok", type: "boolean", example: true),
                    ],
                    type: "object"
                )
            )
        ]
    )]
    public function ping(): JsonResponse
    {
        return response()->json(['ok' => true]);
    }
}