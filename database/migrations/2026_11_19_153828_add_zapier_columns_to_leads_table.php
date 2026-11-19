<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('zapier_status', 20)->nullable()->after('notes'); // null = not sent, "sent", "failed"
            $table->timestamp('zapier_sent_at')->nullable()->after('zapier_status');
            $table->string('zapier_error')->nullable()->after('zapier_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['zapier_status', 'zapier_sent_at', 'zapier_error']);
        });
    }
};
