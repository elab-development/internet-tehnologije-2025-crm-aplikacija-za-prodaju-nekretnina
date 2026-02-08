<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'ime' => 'Petar',
            'prezime' => 'Petrovic',
            'email' => 'agent@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'agent'
        ]);

        User::create([
            'ime' => 'Marko',
            'prezime' => 'Markovic',
            'email' => 'menadzer@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'menadzer'
        ]);

        User::create([
            'ime' => 'Admin',
            'prezime' => 'Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('123456'),
            'uloga' => 'administrator'
        ]);
    }
}
