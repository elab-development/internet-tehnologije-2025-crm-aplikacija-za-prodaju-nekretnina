<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KupacController;
use App\Http\Controllers\Api\NekretninaController;
use App\Http\Controllers\Api\PonudaController;
use App\Http\Controllers\Api\PregledController;
use App\Http\Controllers\Api\AktivnostController;
use App\Http\Controllers\Api\SlikaController;
use App\Http\Controllers\Api\UserAdminController;
use App\Http\Controllers\Api\AgentDashboardController;

/*
|--------------------------------------------------------------------------
| AUTH (public)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| NEKRETNINE (public read)
|--------------------------------------------------------------------------
*/
Route::get('/nekretnine/search', [NekretninaController::class, 'search']);
Route::get('/nekretnine',        [NekretninaController::class, 'index']);
Route::get('/nekretnine/{id}',   [NekretninaController::class, 'show']);

/*
|--------------------------------------------------------------------------
| PROTECTED (auth:sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    /*
    |--------------------------------------------------------------------------
    | KUPCI
    |--------------------------------------------------------------------------
    */
    Route::get('/kupci/search', [KupacController::class, 'search']); // pre /kupci/{id}
    Route::apiResource('kupci', KupacController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | PONUDE / PREGLEDI / AKTIVNOSTI
    |--------------------------------------------------------------------------
    */
    Route::get('/ponude/search',     [PonudaController::class, 'search']);
    Route::apiResource('ponude',     PonudaController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    Route::get('/pregledi/search',   [PregledController::class, 'search']);
    Route::apiResource('pregledi',   PregledController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    Route::get('/aktivnosti/search', [AktivnostController::class, 'search']);
    Route::apiResource('aktivnosti', AktivnostController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN users (soft delete + restore + stats)
    |--------------------------------------------------------------------------
    */
    Route::middleware('uloga:administrator')->group(function () {
        Route::get('/admin', fn () => 'Admin ruta');

        Route::get('/admin/users/search',        [UserAdminController::class, 'search']);
        Route::get('/admin/users/stats',         [UserAdminController::class, 'stats']);
        Route::post('/admin/users',              [UserAdminController::class, 'store']);   // <-- OVO FALILO
        Route::delete('/admin/users/{id}',       [UserAdminController::class, 'destroy']);
        Route::post('/admin/users/{id}/restore', [UserAdminController::class, 'restore']);
    });

    /*
    |--------------------------------------------------------------------------
    | ZAPOSLENI (test ruta)
    |--------------------------------------------------------------------------
    */
    Route::middleware('uloga:agent,menadzer')->get('/zaposleni', fn () => 'Agent ili Menadzer');
});

/*
|--------------------------------------------------------------------------
| AGENT: može da menja nekretnine i slike
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'uloga:agent'])->group(function () {
    // nekretnine (write)
    Route::post('/nekretnine',       [NekretninaController::class, 'store']);
    Route::put('/nekretnine/{id}',   [NekretninaController::class, 'update']);
    Route::delete('/nekretnine/{id}',[NekretninaController::class, 'destroy']);


     Route::get('/agent/dashboard', [AgentDashboardController::class, 'stats']);

    // slike
    Route::post('/nekretnine/{nekretninaId}/slike', [SlikaController::class, 'store']);
    Route::put('/slike/{id}',                      [SlikaController::class, 'update']);
    Route::delete('/slike/{id}',                   [SlikaController::class, 'destroy']);
});

 