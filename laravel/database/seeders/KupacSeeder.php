<?php

namespace Database\Seeders;

use App\Models\Kupac;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KupacSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
   public function run(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Kupac::create([
                'ime' => 'Kupac'.$i,
                'prezime' => 'Prezime'.$i,
                'telefon' => '06012345'.$i,
                'email' => "kupac$i@test.com",
                'budzet' => rand(50000, 150000),
                'lokacija' => 'Beograd'
            ]);
        }
    }

}
