<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Nekretnina;

class NekretninaSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Nekretnina::create([
                'adresa' => "Ulica $i, Beograd",
                'tip' => 'stan',
                'cena' => rand(60000, 200000),
                'status' => 'dostupna',
                'atributi' => [
                    'kvadratura' => rand(40, 120),
                    'grejanje' => 'CG',
                    'sprat' => rand(0, 5),
                    'spratnost' => 6,
                    'broj_soba' => rand(1, 4),
                    'lift' => true
                ]
            ]);
        }
    }
}
