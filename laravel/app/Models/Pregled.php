<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pregled extends Model
{
    protected $table = 'pregledi';

    protected $fillable = [
        'kupac_id',
        'nekretnina_id',
        'korisnik_id',
        'datum', //ovo je i datum i vreme u bazi
        'korisnik_id', //dodato zbog relacije sa User modelom
        'status'
    ];

    public function kupac()
    {
        return $this->belongsTo(\App\Models\Kupac::class, 'kupac_id');
    }

    public function nekretnina()
    {
        return $this->belongsTo(\App\Models\Nekretnina::class, 'nekretnina_id');
    }

    public function korisnik()
    {
        return $this->belongsTo(\App\Models\User::class, 'korisnik_id');
    }
}
