<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: "/api/register",
        summary: "Registracija korisnika",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["ime","prezime","email","password","password_confirmation","uloga"],
                properties: [
                    new OA\Property(property: "ime", type: "string", example: "Marko"),
                    new OA\Property(property: "prezime", type: "string", example: "Marković"),
                    new OA\Property(property: "email", type: "string", format: "email", example: "marko@email.com"),
                    new OA\Property(property: "password", type: "string", example: "123456"),
                    new OA\Property(property: "password_confirmation", type: "string", example: "123456"),
                    new OA\Property(property: "uloga", type: "string", enum: ["agent","menadzer","administrator"])
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Uspešna registracija"),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ime' => ['required', 'string', 'max:100'],
            'prezime' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'uloga' => ['required', 'in:agent,menadzer,administrator'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validacija nije prošla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'ime' => $request->ime,
            'prezime' => $request->prezime,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'uloga' => $request->uloga,
        ]);

        $token = $user->createToken('crm-api')->plainTextToken;

        return response()->json([
            'message' => 'Korisnik je uspešno registrovan.',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    #[OA\Post(
        path: "/api/login",
        summary: "Prijava korisnika",
        tags: ["Auth"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email","password"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email"),
                    new OA\Property(property: "password", type: "string")
                ],
                type: "object"
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Uspešna prijava"),
            new OA\Response(response: 401, description: "Neispravni kredencijali"),
            new OA\Response(response: 422, description: "Validaciona greška")
        ]
    )]
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validacija nije prošla.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Pogrešan email ili lozinka.',
            ], 401);
        }

        $token = $user->createToken('crm-api')->plainTextToken;

        return response()->json([
            'message' => 'Uspešna prijava.',
            'token' => $token,
            'user' => $user
        ]);
    }

    #[OA\Get(
        path: "/api/me",
        summary: "Podaci o trenutno ulogovanom korisniku",
        tags: ["Auth"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Podaci o korisniku"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    #[OA\Post(
        path: "/api/logout",
        summary: "Odjava korisnika",
        tags: ["Auth"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(response: 200, description: "Uspešna odjava"),
            new OA\Response(response: 401, description: "Unauthorized")
        ]
    )]
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Uspešna odjava.'
        ]);
    }
}