<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ponuda;
use App\Models\Kupac;
use App\Models\Nekretnina;
use App\Models\User;

class PonudaSeeder extends Seeder
{
    public function run(): void
    {
        $agent = User::where('uloga', 'agent')->first();

        for ($i = 0; $i < 5; $i++) {
            Ponuda::create([
                'kupac_id' => Kupac::inRandomOrder()->first()->id,
                'nekretnina_id' => Nekretnina::inRandomOrder()->first()->id,
                'korisnik_id' => $agent->id,
                'iznos' => rand(50000, 180000),
                'datum' => now(),
                'status' => 'na_cekanju'
            ]);
        }
    }
}
