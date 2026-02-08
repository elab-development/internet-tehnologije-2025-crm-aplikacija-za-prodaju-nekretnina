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
        Schema::create('kupci', function (Blueprint $table) {
            $table->id();
                $table->string('ime', 100);
            $table->string('prezime', 100);
            $table->string('telefon', 50)->nullable();
            $table->string('email')->nullable()->index();
            $table->decimal('budzet', 12, 2)->nullable();
            $table->string('lokacija', 120)->nullable();
 
            $table->text('napomena')->nullable();
            $table->text('beleske')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kupci');
    }
};
