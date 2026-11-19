<?php

namespace Database\Factories;

use App\Models\Lead;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Lead> */
class LeadFactory extends Factory
{
    public function definition(): array
    {
        $source = $this->faker->randomElement(['facebook', 'instagram', 'google', 'tiktok', 'snapchat', null]);

        return [
            'name' => $this->faker->randomElement(['أحمد', 'محمد', 'فاطمة', 'سارة', 'خالد', 'مريم', 'عبدالله', 'نورة']).' '.$this->faker->randomElement(['المنصوري', 'الشامسي', 'الكعبي', 'النعيمي', 'السويدي']),
            'phone' => '+9715'.$this->faker->numerify('########'),
            'plot_type' => $this->faker->randomElement(['سكني استثماري', 'تاون هاوس', 'لم أقرر بعد']),
            'payment_method' => $this->faker->randomElement(['كاش (خصم 35%)', 'تقسيط بدون دفعة أولى']),
            'locale' => $this->faker->randomElement(['ar', 'ar', 'ar', 'en']),
            'status' => $this->faker->randomElement(Lead::STATUSES),
            'utm_source' => $source,
            'utm_medium' => $source ? 'paid_social' : null,
            'utm_campaign' => $source ? 'eid-al-etihad-55' : null,
            'created_at' => $this->faker->dateTimeBetween('-13 days'),
        ];
    }
}
