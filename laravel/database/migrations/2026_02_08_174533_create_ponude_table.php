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
        Schema::create('ponude', function (Blueprint $table) {
            $table->id();
              $table->foreignId('kupac_id')
                ->constrained('kupci')
                ->cascadeOnDelete();

            $table->foreignId('nekretnina_id')
                ->constrained('nekretnine')
                ->cascadeOnDelete();

            // agent koji je uneo/obradio ponudu
            $table->foreignId('korisnik_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->decimal('iznos', 12, 2);
            $table->date('datum');
            $table->string('status', 50)->default('na_cekanju');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ponude');
    }
};
