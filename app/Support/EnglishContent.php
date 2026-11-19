<?php

namespace App\Support;

/**
 * Default English copy for the landing page. Same structure as the Arabic defaults in
 * LandingContent; language-independent values (images, phone, dates…) come from Arabic.
 */
class EnglishContent
{
    public static function defaults(): array
    {
        return [
            'brand' => [
                'name' => 'Al Rasikhoon Real Estate',
                'name_en' => 'الراسخون للعقارات',
                'logo' => null,
                'phone' => '+971 6 000 0000',
                'email' => '',
                'address' => '[Office address], Ajman',
                'license_no' => '[..]',
            ],
            'seo' => [
                'title' => 'Plots on Maliha Road with no down payment | Al Rasikhoon Real Estate',
                'description' => 'Residential investment and townhouse plots with G+2 permit in Sharjah. 35% off for cash, or direct developer instalments with no bank — Eid Al Etihad offers.',
                'og_image' => null,
            ],
            'tracking' => ['gtm_id' => '', 'meta_pixel_id' => '', 'tiktok_pixel_id' => '', 'snap_pixel_id' => ''],
            'notifications' => ['email' => ''],
            'campaign' => [
                'badge' => 'Eid Al Etihad 55 offers  •  Limited time',
                'offer_ends_at' => '2026-12-31',
                'show_countdown' => true,
                'cobrand_logo' => null,
            ],
            'hero' => [
                'title' => "Own your plot on Maliha Road\nwith no down payment",
                'subtitle' => 'Residential investment and townhouse plots with a G+2 building permit in Sharjah — 35% off when you pay cash, or instalments directly with the developer, no bank needed.',
                'chips' => ['35% off cash', 'No down payment', 'G+2 permit', 'No bank'],
                'cta_label' => 'Get prices & plot sizes',
                'image' => null,
            ],
            'stats' => [
                ['value' => 'Since 2002', 'label' => 'In the real estate market'],
                ['value' => '40+', 'label' => 'Projects in Sharjah & Ajman'],
                ['value' => '5 stars', 'label' => 'Bliss rating – Land Department'],
                ['value' => 'Licence [no.]', 'label' => 'Licensed developer in Ajman'],
            ],
            'offers' => [
                'eyebrow' => 'Eid Al Etihad offers',
                'title' => 'Choose the offer that suits you',
                'items' => [
                    ['tag' => 'Best price', 'big' => '35% off', 'title' => 'When you pay cash', 'body' => 'Save on the full plot price during the offer period.'],
                    ['tag' => 'Easiest start', 'big' => 'No down payment', 'title' => 'Direct developer instalments', 'body' => 'Start owning your plot with no bank. Payment period: [period].'],
                ],
                'urgency_title' => 'Valid until the end of the Eid Al Etihad offers',
                'urgency_body' => 'Plots are limited — priority goes to those who register first.',
                'urgency_cta' => 'Book your plot now',
            ],
            'project' => [
                'eyebrow' => 'About the project',
                'title' => 'A complete community to live and invest',
                'body' => 'Basateen Al Buraida offers a range of plots for residential and investment development, with a ground + two floors (G+2) building permit. The project includes residential-commercial plots and townhouse plots within a complete master plan, giving you more than one way to build your home or invest.',
                'features' => [
                    ['title' => 'Multiple development options', 'body' => 'Residential, residential-commercial or townhouse — your choice.'],
                    ['title' => 'G+2 building permit', 'body' => 'Ground + two floors.'],
                    ['title' => 'Organised internal roads', 'body' => 'Easy movement within the project.'],
                    ['title' => 'Complete residential plan', 'body' => 'A carefully planned community.'],
                    ['title' => 'Facilities across the project', 'body' => 'Everything you need, close by.'],
                ],
                'cta_label' => 'Get the project master plan',
                'image' => null,
            ],
            'plots' => [
                'eyebrow' => 'Plot types',
                'title' => 'Choose the right plot for your plan',
                'subtitle' => 'Two plot types, both with G+2 permit — choose by your goal: living or rental income.',
                'items' => [
                    ['name' => 'Residential investment', 'description' => 'Plots suited to building a residential project for rental income.', 'area' => 'From 225 m²', 'permit' => 'G+2', 'count' => '[number]'],
                    ['name' => 'Townhouse', 'description' => 'Plots dedicated to building townhouse units.', 'area' => 'From 160 m²', 'permit' => 'G+2', 'count' => '[number]'],
                ],
                'cta_label' => 'Request prices for these plots',
            ],
            'payment' => [
                'eyebrow' => 'Payment plan',
                'title' => 'Choose how you want to pay',
                'subtitle' => 'Same plot, two ways to pay — compare and choose.',
                'plans' => [
                    [
                        'title' => 'Pay cash', 'tag' => 'Best value', 'highlight' => true, 'cta_label' => 'Book with 35% off',
                        'rows' => [
                            ['label' => 'Down payment', 'value' => 'Full amount'],
                            ['label' => 'Offer', 'value' => '35% off the plot price'],
                            ['label' => 'Best for', 'value' => 'Buyers who want the best price'],
                        ],
                    ],
                    [
                        'title' => 'Instalments', 'tag' => 'Easiest', 'highlight' => false, 'cta_label' => 'Request the instalment plan',
                        'rows' => [
                            ['label' => 'Down payment', 'value' => 'No down payment'],
                            ['label' => 'Offer', 'value' => 'Direct instalments with the developer, no bank — period: [period]'],
                            ['label' => 'Best for', 'value' => 'Buyers who want an easy start'],
                        ],
                    ],
                ],
            ],
            'gallery' => [
                'eyebrow' => 'Project photos',
                'title' => 'See the project up close',
                'cta_label' => 'Book a site visit',
                'images' => [],
            ],
            'amenities' => [
                'eyebrow' => 'Amenities',
                'title' => 'Facilities within the community',
                'subtitle' => 'Facilities and services spread across the project, close to every plot.',
                'items' => [
                    ['label' => 'Service areas', 'icon' => 'store'],
                    ['label' => 'Retail shops', 'icon' => 'bag'],
                    ['label' => 'Clinics', 'icon' => 'clinic'],
                    ['label' => 'Mosques', 'icon' => 'mosque'],
                    ['label' => 'Public parks', 'icon' => 'tree'],
                ],
            ],
            'location' => [
                'eyebrow' => 'Location',
                'title' => 'A strategic location on Maliha Road',
                'body' => 'The project sits directly on Maliha Road in Sharjah, with easy access to Emirates Road — excellent links to the main road network and surrounding areas.',
                'drive_times' => [
                    ['place' => 'Emirates Road', 'minutes' => '[..]'],
                    ['place' => 'Sharjah International Airport', 'minutes' => '[..]'],
                    ['place' => 'Sharjah City', 'minutes' => '[..]'],
                    ['place' => 'Ajman', 'minutes' => '[..]'],
                ],
                'map_embed_url' => '',
                'map_link' => '',
                'cta_label' => 'Open in Google Maps',
            ],
            'experience' => [
                'eyebrow' => 'About us',
                'title' => '24 years of experience and 40+ projects',
                'body' => 'Founded on [10 June 2002], the company has delivered more than 40 projects in Sharjah and Ajman and holds a 5-star Bliss rating from the Ajman Department of Land and Real Estate Regulation. Company licence no. [..].',
                'projects' => [
                    ['name' => '[Project name]', 'meta' => '[City] • [Handover year]', 'image' => null],
                    ['name' => '[Project name]', 'meta' => '[City] • [Handover year]', 'image' => null],
                    ['name' => '[Project name]', 'meta' => '[City] • [Handover year]', 'image' => null],
                ],
                'testimonials' => [
                    ['quote' => '[Client review — one or two sentences about their experience]', 'name' => '[Client name]', 'project' => '[Project name]'],
                    ['quote' => '[Client review — one or two sentences about their experience]', 'name' => '[Client name]', 'project' => '[Project name]'],
                    ['quote' => '[Client review — one or two sentences about their experience]', 'name' => '[Client name]', 'project' => '[Project name]'],
                ],
            ],
            'form' => [
                'title' => 'Register your interest',
                'subtitle' => 'Leave your details and our advisor will contact you within [time] with prices and available plots.',
                'final_eyebrow' => 'Eid Al Etihad offers',
                'final_title' => "Register now and book your plot\nbefore the offer ends",
                'final_body' => 'Leave your details and one of our advisors will contact you within [time] with prices and available plot sizes.',
                'final_form_title' => 'Book your plot now',
                'benefits' => ['Updated price list and plot sizes', 'Free consultation with no commitment', 'Site visit at a time that suits you'],
                'plot_options' => ['Residential investment', 'Townhouse', 'Not decided yet'],
                'payment_options' => ['Cash (35% off)', 'Instalments, no down payment', 'Not decided yet'],
                'submit_label' => 'Send me prices & plot sizes',
                'consent' => 'By submitting this form you agree to our privacy policy and to being contacted by phone.',
                'success_title' => 'Thank you! We received your request',
                'success_body' => 'One of our advisors will contact you shortly with prices and available plot sizes.',
            ],
            'faq' => [
                'eyebrow' => 'FAQ',
                'title' => 'Everything you need to know before booking',
                'items' => [
                    ['q' => 'What does a G+2 permit mean?', 'a' => 'It is a building permit for ground + two floors, so you can build three levels on the plot.'],
                    ['q' => 'Is there a down payment on the instalment plan?', 'a' => 'No. You can start with no down payment and pay in instalments directly to the developer.'],
                    ['q' => 'What is the cash discount?', 'a' => '35% off the plot price when you pay cash during the offer period.'],
                    ['q' => 'Where is the project?', 'a' => 'On Maliha Road in Sharjah, close to Emirates Road.'],
                    ['q' => 'Which plot types are available?', 'a' => 'Residential investment plots and townhouse plots, all with a G+2 permit.'],
                    ['q' => 'Are instalments through a bank?', 'a' => 'No, instalments are directly with the developer, with no bank involved.'],
                    ['q' => 'Can I get prices before visiting the project?', 'a' => 'Yes. Register your details and we will send you the price list and available plot sizes.'],
                    ['q' => 'Is the plot registered in my name? What type of ownership?', 'a' => '[Add answer]'],
                    ['q' => 'Can non-UAE nationals buy?', 'a' => '[Add answer]'],
                    ['q' => 'Does the 35% discount apply to all plots?', 'a' => '[Add answer]'],
                    ['q' => 'Are there any additional fees?', 'a' => '[Add answer]'],
                ],
                'more_label' => 'Have another question?',
                'more_cta' => 'Talk to an advisor',
            ],
            'footer' => [
                'about' => 'Licensed real estate developer since 2002 — more than 40 projects in Sharjah and Ajman.',
                'disclaimer' => 'Offers and prices are subject to availability and may change without notice.',
            ],
            'sections' => array_map(fn ($k) => ['key' => $k, 'enabled' => true], LandingContent::SECTION_KEYS),
        ];
    }
}
