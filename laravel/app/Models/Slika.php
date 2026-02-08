<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Slika extends Model
{
    protected $table = 'slike';

    protected $fillable = [
        'nekretnina_id',
        'putanja',
        'istaknuta',
        'redosled'
    ];

    protected $casts = [
        'istaknuta' => 'boolean',
    ];

    public function nekretnina()
    {
        return $this->belongsTo(Nekretnina::class);
    }
}
