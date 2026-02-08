<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'uloga:administrator'])->get('/admin', function () {
    return "Samo admin";
});

Route::middleware(['auth:sanctum', 'uloga:agent,menadzer'])->get('/zaposleni', function () {
    return "Agent ili Menadzer";
});
