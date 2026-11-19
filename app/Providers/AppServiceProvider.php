<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Lead form: a real visitor submits once or twice; this blocks scripted floods.
        RateLimiter::for('leads', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
            Limit::perDay(30)->by($request->ip()),
        ]);
    }
}
