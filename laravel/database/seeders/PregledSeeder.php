<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pregled;
use App\Models\Kupac;
use App\Models\Nekretnina;
use App\Models\User;

class PregledSeeder extends Seeder
{
    public function run(): void
    {
        $agent = User::where('uloga', 'agent')->first();

        for ($i = 0; $i < 5; $i++) {
            Pregled::create([
                'kupac_id' => Kupac::inRandomOrder()->first()->id,
                'nekretnina_id' => Nekretnina::inRandomOrder()->first()->id,
                'korisnik_id' => $agent->id,
                'datum' => now()->addDays(rand(1, 10)),
                'vreme' => '12:00',
                'status' => 'zakazan'
            ]);
        }
    }
}
