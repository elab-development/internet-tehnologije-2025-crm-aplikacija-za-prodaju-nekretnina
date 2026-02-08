<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/register
     * Body: ime, prezime, email, password, password_confirmation, uloga
     */
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

        // odmah izdaj token (da se korisnik odmah uloguje)
        $token = $user->createToken('crm-api')->plainTextToken;

        return response()->json([
            'message' => 'Korisnik je uspešno registrovan.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'ime' => $user->ime,
                'prezime' => $user->prezime,
                'email' => $user->email,
                'uloga' => $user->uloga,
            ],
        ], 201);
    }

    /**
     * POST /api/login
     * Body: email, password
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
        ] );

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
                'errors' => [
                    'email' => ['Neispravni kredencijali.']
                ],
            ], 401);
        }

        // opcionalno: jedna aktivna sesija po korisniku
        // $user->tokens()->delete();

        $token = $user->createToken('crm-api')->plainTextToken;

        return response()->json([
            'message' => 'Uspešna prijava.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'ime' => $user->ime,
                'prezime' => $user->prezime,
                'email' => $user->email,
                'uloga' => $user->uloga,
            ],
        ]);
    }

    /**
     * GET /api/me
     * Header: Authorization: Bearer <token>
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'ime' => $user->ime,
            'prezime' => $user->prezime,
            'email' => $user->email,
            'uloga' => $user->uloga,
        ]);
    }

    /**
     * POST /api/logout
     * Header: Authorization: Bearer <token>
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Uspešna odjava.'
        ]);
    }
}
