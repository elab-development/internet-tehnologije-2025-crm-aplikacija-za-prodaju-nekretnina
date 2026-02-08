<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Aktivnost;
use App\Models\User;

class AktivnostSeeder extends Seeder
{
    public function run(): void
    {
        foreach (User::all() as $user) {
            Aktivnost::create([
                'korisnik_id' => $user->id,
                'tip' => 'LOGIN',
                'datum' => now(),
                'opis' => 'Korisnik se prijavio u sistem'
            ]);
        }
    }
}
