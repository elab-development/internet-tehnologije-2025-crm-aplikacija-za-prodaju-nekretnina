<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Aktivnost extends Model
{
    protected $table = 'aktivnosti';

    protected $fillable = [
        'korisnik_id',
        'tip',
        'datum',
        'opis'
    ];

    public function korisnik()
    {
        return $this->belongsTo(User::class, 'korisnik_id');
    }
}
