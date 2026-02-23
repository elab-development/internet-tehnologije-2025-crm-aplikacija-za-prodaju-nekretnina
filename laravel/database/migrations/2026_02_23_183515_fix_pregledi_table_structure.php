<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function dropFkIfExists(string $table, string $column): void
    {
        $db = DB::getDatabaseName();

        $rows = DB::select(
            "SELECT CONSTRAINT_NAME
             FROM information_schema.KEY_COLUMN_USAGE
             WHERE TABLE_SCHEMA = ?
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?
               AND REFERENCED_TABLE_NAME IS NOT NULL",
            [$db, $table, $column]
        );

        foreach ($rows as $r) {
            $name = $r->CONSTRAINT_NAME;
            DB::statement("ALTER TABLE `$table` DROP FOREIGN KEY `$name`");
        }
    }

    public function up(): void
    {
        // 1) drop FK na korisnik_id ako već postoji (bilo kog imena)
        $this->dropFkIfExists('pregledi', 'korisnik_id');

        Schema::table('pregledi', function (Blueprint $table) {

            // Ako postoji kolona vreme → brišemo je
            if (Schema::hasColumn('pregledi', 'vreme')) {
                $table->dropColumn('vreme');
            }

            // datum da bude DATETIME
            $table->dateTime('datum')->change();

            // korisnik_id tip
            if (Schema::hasColumn('pregledi', 'korisnik_id')) {
                $table->unsignedBigInteger('korisnik_id')->change();
            } else {
                $table->unsignedBigInteger('korisnik_id');
            }

            // 2) dodaj FK sa UNIKATNIM imenom (da ne bude pregledi_korisnik_id_foreign)
            $table->foreign('korisnik_id', 'fk_pregledi_korisnik_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        // drop po našem imenu
        try {
            DB::statement("ALTER TABLE `pregledi` DROP FOREIGN KEY `fk_pregledi_korisnik_id`");
        } catch (\Throwable $e) {
            // ignore
        }

        Schema::table('pregledi', function (Blueprint $table) {
        
            if (!Schema::hasColumn('pregledi', 'vreme')) {
                $table->time('vreme')->nullable();
            }
        });
    }
};