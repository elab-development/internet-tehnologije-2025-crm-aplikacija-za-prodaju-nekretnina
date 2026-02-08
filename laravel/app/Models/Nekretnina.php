<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Nekretnina extends Model
{
    protected $table = 'nekretnine';

    protected $fillable = [
        'adresa',
        'tip',
        'cena',
        'status'
    ];

    public function pregledi()
    {
        return $this->hasMany(Pregled::class);
    }

    public function ponude()
    {
        return $this->hasMany(Ponuda::class);
    }
    public function slike()
    {
        return $this->hasMany(Slika::class);
    }
}
