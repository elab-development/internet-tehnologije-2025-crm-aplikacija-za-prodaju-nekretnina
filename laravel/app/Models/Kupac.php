<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Kupac extends Model
{
    protected $table = 'kupci';

    protected $fillable = [
        'ime',
        'prezime',
        'telefon',
        'email',
        'budzet',
        'lokacija'
    ];

    public function pregledi()
    {
        return $this->hasMany(Pregled::class);
    }

    public function ponude()
    {
        return $this->hasMany(Ponuda::class);
    }
}
