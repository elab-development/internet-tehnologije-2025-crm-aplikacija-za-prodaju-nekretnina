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
        Schema::create('nekretnine', function (Blueprint $table) {
            $table->id();
            $table->string('adresa');
            $table->string('vrsta', 80);  
            $table->decimal('cena', 12, 2);
            $table->string('status', 50)->default('dostupna');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nekretnine');
    }
};
