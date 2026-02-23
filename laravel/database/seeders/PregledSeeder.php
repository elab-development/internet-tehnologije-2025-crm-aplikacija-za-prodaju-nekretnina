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

        // ako nema agenta, nemoj pucati
        if (!$agent) {
            return;
        }

        for ($i = 0; $i < 5; $i++) {
            Pregled::create([
                'kupac_id' => Kupac::inRandomOrder()->value('id'),
                'nekretnina_id' => Nekretnina::inRandomOrder()->value('id'),
                'korisnik_id' => $agent->id,

                // sada koristimo SAMO datum (datetime)
                'datum' => now()
                    ->addDays(rand(1, 10))
                    ->setTime(rand(9, 18), [0, 30][rand(0, 1)]),

                'status' => 'zakazan'
            ]);
        }
    }
}