<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Language of the page the visitor used, so sales knows which language to call in.
            $table->string('locale', 5)->default('ar')->after('payment_method')->index();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['locale']);
            $table->dropColumn('locale');
        });
    }
};
