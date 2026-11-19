<?php

use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\IntegrationController;
use App\Http\Controllers\Admin\LeadController as AdminLeadController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

// SEO
Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);

// Public landing page
Route::get('/', [LandingController::class, 'arabic'])->name('home');
Route::get('/en', [LandingController::class, 'english'])->name('home.en');
Route::post('/leads', [LeadController::class, 'store'])->middleware('throttle:leads')->name('leads.store');

// Admin dashboard
Route::middleware(['auth'])->prefix('dashboard')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('leads', [AdminLeadController::class, 'index'])->name('admin.leads.index');
    Route::get('leads/export', [AdminLeadController::class, 'export'])->name('admin.leads.export');
    Route::patch('leads/{lead}', [AdminLeadController::class, 'update'])->name('admin.leads.update');
    Route::post('leads/{lead}/zapier', [AdminLeadController::class, 'sendToZapier'])->middleware('throttle:30,1')->name('admin.leads.zapier');
    Route::delete('leads/{lead}', [AdminLeadController::class, 'destroy'])->name('admin.leads.destroy');

    Route::get('integrations', [IntegrationController::class, 'edit'])->name('admin.integrations.edit');
    Route::put('integrations', [IntegrationController::class, 'update'])->name('admin.integrations.update');
    Route::post('integrations/test', [IntegrationController::class, 'test'])->middleware('throttle:10,1')->name('admin.integrations.test');

    Route::get('content', [ContentController::class, 'edit'])->name('admin.content.edit');
    Route::put('content', [ContentController::class, 'update'])->name('admin.content.update');
    Route::post('content/reset', [ContentController::class, 'reset'])->name('admin.content.reset');
    Route::post('uploads', [ContentController::class, 'upload'])->middleware('throttle:60,1')->name('admin.uploads.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
