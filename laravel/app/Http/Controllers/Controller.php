<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "CRM Nekretnine API",
    description: "API dokumentacija za CRM sistem nekretnina"
)]
abstract class Controller
{
}