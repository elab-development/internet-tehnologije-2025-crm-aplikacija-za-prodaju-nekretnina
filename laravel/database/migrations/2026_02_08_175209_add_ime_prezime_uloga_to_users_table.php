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
        Schema::table('users', function (Blueprint $table) {
             $table->string('ime', 100)->after('id');
            $table->string('prezime', 100)->after('ime');

            $table->enum('uloga', [
                'agent',
                'menadzer',
                'administrator'
            ])->default('agent')->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['ime', 'prezime', 'uloga']);
        });
    }
};
