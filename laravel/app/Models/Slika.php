<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Slika extends Model
{
    protected $table = 'slike';

    protected $fillable = [
        'nekretnina_id',
        'putanja'
    ];

    public function nekretnina()
    {
        return $this->belongsTo(Nekretnina::class);
    }
}
