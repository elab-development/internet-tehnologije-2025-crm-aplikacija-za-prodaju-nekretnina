<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class UserAdminController extends Controller
{
    // GET /api/admin/users/search
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'nullable|string|max:150',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'uloga' => 'nullable|string|max:50',
            'with_deleted' => 'nullable|boolean',
            'sort_by' => 'nullable|in:created_at,ime,prezime,email,uloga',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

        $q = trim((string)$request->get('q',''));
        $uloga = trim((string)$request->get('uloga',''));
        $withDeleted = (bool)$request->get('with_deleted', false);

        $perPage = (int)$request->get('per_page', 10);
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        $query = User::query();

        if ($withDeleted) $query->withTrashed();

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('ime', 'like', "%{$q}%")
                   ->orWhere('prezime', 'like', "%{$q}%")
                   ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($uloga !== '') $query->where('uloga', $uloga);

        return response()->json(
            $query->orderBy($sortBy, $sortDir)->paginate($perPage)
        );
    }

    // GET /api/admin/users/stats
    public function stats()
    {
        return response()->json([
            'total' => User::count(),
            'deleted' => User::onlyTrashed()->count(),
            'by_role' => User::selectRaw('uloga, COUNT(*) as cnt')->groupBy('uloga')->get(),
        ]);
    }

    // DELETE (soft) /api/admin/users/{id}
    public function destroy($id)
    {
        $u = User::find($id);
        if (!$u) return response()->json(['message' => 'Korisnik nije pronađen'], 404);

        $u->delete();
        return response()->json(['message' => 'Korisnik soft-deleted']);
    }

    // POST /api/admin/users/{id}/restore
    public function restore($id)
    {
        $u = User::onlyTrashed()->find($id);
        if (!$u) return response()->json(['message' => 'Korisnik nije pronađen (nije obrisan?)'], 404);

        $u->restore();
        return response()->json(['message' => 'Korisnik vraćen']);
    }
}