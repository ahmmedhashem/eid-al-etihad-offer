<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateContentRequest;
use App\Support\ImageOptimizer;
use App\Support\LandingContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    public function edit(Request $request): Response
    {
        $locale = $request->query('locale') === 'en' ? 'en' : 'ar';

        return Inertia::render('admin/content', [
            'locale' => $locale,
            'content' => LandingContent::get($locale),
            'sharedPaths' => LandingContent::SHARED,
            'sectionKeys' => LandingContent::SECTION_KEYS,
            'alwaysOn' => LandingContent::ALWAYS_ON,
            'amenityIcons' => LandingContent::AMENITY_ICONS,
        ]);
    }

    public function update(UpdateContentRequest $request): RedirectResponse
    {
        // validated() would only return the keys that have explicit rules, dropping plain text fields.
        // The whole document has passed validation; LandingContent::save() discards unknown keys.
        $locale = $request->validated('locale');
        LandingContent::save($request->input('content'), $locale);

        return back()->with('success', ($locale === 'en' ? 'English' : 'Arabic').' content saved.');
    }

    public function reset(Request $request): RedirectResponse
    {
        $locale = $request->input('locale') === 'en' ? 'en' : 'ar';
        LandingContent::reset($locale);

        return back()->with('success', ($locale === 'en' ? 'English' : 'Arabic').' content reset to defaults.');
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            // SVG is excluded on purpose: it can carry scripts when served from our own domain.
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:15360'],
        ]);

        try {
            // Converted to WebP, capped at 2560px wide, with 640/1280/1920px copies for smaller screens.
            $url = ImageOptimizer::store($request->file('file'));
        } catch (\RuntimeException $e) {
            return response()->json(['errors' => ['file' => [$e->getMessage()]]], 422);
        }

        return response()->json(['url' => $url]);
    }
}
