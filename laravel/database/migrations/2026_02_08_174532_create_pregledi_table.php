<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pregledi', function (Blueprint $table) {
            $table->id();
              $table->foreignId('kupac_id')
                ->constrained('kupci')
                ->cascadeOnDelete();

            $table->foreignId('nekretnina_id')
                ->constrained('nekretnine')
                ->cascadeOnDelete();

            // agent koji vodi pregled (korisnik sistema)
            $table->foreignId('korisnik_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->date('datum');
            $table->time('vreme');
            $table->string('status', 50)->default('zakazan');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pregledi');
    }
};
