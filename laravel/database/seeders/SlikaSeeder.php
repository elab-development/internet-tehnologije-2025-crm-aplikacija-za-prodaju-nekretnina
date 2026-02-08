<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Slika;
use App\Models\Nekretnina;

class SlikaSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Nekretnina::all() as $nekretnina) {
            for ($i = 1; $i <= 3; $i++) {
                Slika::create([
                    'nekretnina_id' => $nekretnina->id,
                    'putanja' => "properties/".$nekretnina->id."/slika$i.jpg",
                    'istaknuta' => $i === 1,
                    'redosled' => $i
                ]);
            }
        }
    }
}
