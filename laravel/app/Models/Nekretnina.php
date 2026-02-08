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
        'status',
        'atributi'   //npr kvadratura, broj soba, spratnost, itd. - sve u JSON formatu
    ];
    protected $casts = [
        'atributi' => 'array',
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
