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
        'datum',
        'vreme',
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
}
