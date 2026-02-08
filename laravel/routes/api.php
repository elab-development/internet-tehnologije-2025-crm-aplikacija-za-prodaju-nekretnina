<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KupacController;
use App\Http\Controllers\Api\NekretninaController;
use App\Http\Controllers\Api\SlikaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);



    Route::get('/nekretnine', [NekretninaController::class, 'index']);
    Route::get('/nekretnine/{id}', [NekretninaController::class, 'show']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
 

    Route::get('/kupci', [KupacController::class, 'index']);
    Route::get('/kupci/{id}', [KupacController::class, 'show']);
    Route::post('/kupci', [KupacController::class, 'store']);
    Route::put('/kupci/{id}', [KupacController::class, 'update']);
    Route::delete('/kupci/{id}', [KupacController::class, 'destroy']);



});
 
Route::middleware(['auth:sanctum', 'uloga:agent'])->get('/agent', function () {
     Route::post('/nekretnine', [NekretninaController::class, 'store']);
    Route::put('/nekretnine/{id}', [NekretninaController::class, 'update']);
    Route::delete('/nekretnine/{id}', [NekretninaController::class, 'destroy']);

        // Upload nove slike za nekretninu
    Route::post('/nekretnine/{nekretninaId}/slike', [SlikaController::class, 'store']);

    // Update meta (istaknuta, redosled)
    Route::put('/slike/{id}', [SlikaController::class, 'update']);

    // Brisanje slike
    Route::delete('/slike/{id}', [SlikaController::class, 'destroy']);
});
Route::middleware(['auth:sanctum', 'uloga:administrator'])->get('/admin', function () { 
});

Route::middleware(['auth:sanctum', 'uloga:agent,menadzer'])->get('/zaposleni', function () {
    return "Agent ili Menadzer";
});
