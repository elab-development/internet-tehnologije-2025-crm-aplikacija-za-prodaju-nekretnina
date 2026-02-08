<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UlogaMiddleware
{
    public function handle(Request $request, Closure $next, ...$uloge): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Niste ulogovani'], 401);
        }

        if (!in_array($user->uloga, $uloge)) {
            return response()->json(['message' => 'Nemate dozvolu'], 403);
        }

        return $next($request);
    }
}
