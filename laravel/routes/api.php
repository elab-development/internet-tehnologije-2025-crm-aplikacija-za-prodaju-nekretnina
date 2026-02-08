<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KupacController;
use App\Http\Controllers\Api\NekretninaController;
use App\Http\Controllers\Api\SlikaController;

// AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// PUBLIC (ako želiš da svako može da vidi oglase)
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
