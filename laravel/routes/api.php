<?php

use App\Http\Controllers\Api\AktivnostController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KupacController;
use App\Http\Controllers\Api\NekretninaController;
use App\Http\Controllers\Api\PonudaController;
use App\Http\Controllers\Api\PregledController;
use App\Http\Controllers\Api\SlikaController;
use App\Http\Controllers\Api\UserAdminController;

// AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// PUBLIC (ako želiš da svako može da vidi oglase)
Route::get('/nekretnine/search', [NekretninaController::class, 'search']);
Route::get('/nekretnine', [NekretninaController::class, 'index']);
Route::get('/nekretnine/{id}', [NekretninaController::class, 'show']);

// PROTECTED
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // KUPCI
    Route::get('/kupci', [KupacController::class, 'index']);
    Route::get('/kupci/search', [KupacController::class, 'search']); // mora pre /kupci/{id}
    Route::get('/kupci/{id}', [KupacController::class, 'show']);
    Route::post('/kupci', [KupacController::class, 'store']);
    Route::put('/kupci/{id}', [KupacController::class, 'update']);
    Route::delete('/kupci/{id}', [KupacController::class, 'destroy']);
});

// AGENT: može da menja nekretnine i slike
Route::middleware(['auth:sanctum', 'uloga:agent'])->group(function () {
    Route::post('/nekretnine', [NekretninaController::class, 'store']);
    Route::put('/nekretnine/{id}', [NekretninaController::class, 'update']);
    Route::delete('/nekretnine/{id}', [NekretninaController::class, 'destroy']);

    Route::post('/nekretnine/{nekretninaId}/slike', [SlikaController::class, 'store']);
    Route::put('/slike/{id}', [SlikaController::class, 'update']);
    Route::delete('/slike/{id}', [SlikaController::class, 'destroy']);
});

// (opciono) test rute
Route::middleware(['auth:sanctum', 'uloga:administrator'])->get('/admin', fn () => "Admin ruta");
Route::middleware(['auth:sanctum', 'uloga:agent,menadzer'])->get('/zaposleni', fn () => "Agent ili Menadzer");
Route::get('/ponude/search', [PonudaController::class, 'search']);
Route::apiResource('ponude', PonudaController::class)->only(['index','show','store','update','destroy']);

Route::get('/pregledi/search', [PregledController::class, 'search']);
Route::apiResource('pregledi', PregledController::class)->only(['index','show','store','update','destroy']);

Route::get('/aktivnosti/search', [AktivnostController::class, 'search']);
Route::apiResource('aktivnosti', AktivnostController::class)->only(['index','show','store','update','destroy']);

// ADMIN users (soft delete + restore + stats)
Route::get('/admin/users/search', [UserAdminController::class, 'search']);
Route::get('/admin/users/stats', [UserAdminController::class, 'stats']);
Route::delete('/admin/users/{id}', [UserAdminController::class, 'destroy']); // soft delete
Route::post('/admin/users/{id}/restore', [UserAdminController::class, 'restore']);