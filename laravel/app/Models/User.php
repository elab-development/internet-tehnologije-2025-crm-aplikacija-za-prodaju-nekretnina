<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'ime',
        'prezime',
        'email',
        'password',
        'uloga',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Relacije
    public function pregledi()
    {
        return $this->hasMany(Pregled::class, 'korisnik_id');
    }

    public function ponude()
    {
        return $this->hasMany(Ponuda::class, 'korisnik_id');
    }

    public function aktivnosti()
    {
        return $this->hasMany(Aktivnost::class, 'korisnik_id');
    }
}
