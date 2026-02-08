<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
});





Route::middleware(['auth:sanctum', 'uloga:administrator'])->get('/admin', function () {
    return "Samo admin";
});

Route::middleware(['auth:sanctum', 'uloga:agent,menadzer'])->get('/zaposleni', function () {
    return "Agent ili Menadzer";
});
