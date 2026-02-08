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
        Schema::create('slike', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nekretnina_id')
                ->constrained('nekretnine')
                ->cascadeOnDelete();
            $table->string('putanja'); // npr: properties/123/1.jpg
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slike');
    }
};
