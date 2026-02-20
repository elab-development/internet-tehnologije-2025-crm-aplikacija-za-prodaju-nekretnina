<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ponuda extends Model
{
    protected $table = 'ponude';

    protected $fillable = [
        'kupac_id',
        'nekretnina_id',
        'korisnik_id',
        'iznos',
        'datum',
        'status'
    ];

    public function kupac()
    {
        return $this->belongsTo(Kupac::class);
    }

    public function nekretnina()
    {
        return $this->belongsTo(Nekretnina::class);
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'korisnik_id');
    }

 

public function korisnik()
{
    return $this->belongsTo(\App\Models\User::class, 'korisnik_id');
}
}
