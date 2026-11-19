<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create {email?} {--name=Admin}';

    protected $description = 'Create (or reset the password of) a dashboard admin user';

    public function handle(): int
    {
        $email = $this->argument('email') ?: $this->ask('Admin email');
        $password = $this->secret('Password (min 10 characters)');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen((string) $password) < 10) {
            $this->error('A valid email and a password of at least 10 characters are required.');

            return self::FAILURE;
        }

        User::updateOrCreate(['email' => $email], [
            'name' => $this->option('name'),
            'password' => Hash::make($password),
            'email_verified_at' => now(),
        ]);

        $this->info("Admin {$email} is ready. Log in at /login.");

        return self::SUCCESS;
    }
}
