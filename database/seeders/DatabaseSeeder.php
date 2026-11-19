<?php

namespace Database\Seeders;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Local development data only. In production create admins with `php artisan admin:create`.
     */
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            $this->command?->warn('Skipping dev seed outside local/testing. Use php artisan admin:create.');

            return;
        }

        // Local dev admin — credentials come from .env (see .env.example).
        User::updateOrCreate(['email' => env('DEV_ADMIN_EMAIL', 'admin@lp.test')], [
            'name' => 'Admin',
            'password' => Hash::make(env('DEV_ADMIN_PASSWORD', 'lp-dev-password')),
            'email_verified_at' => now(),
        ]);

        if (Lead::count() === 0) {
            Lead::factory()->count(24)->create();
        }
    }
}
