<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    /** Zapier settings: ['webhook_url' => string, 'enabled' => bool]. Kept out of the public page content. */
    public static function zapier(): array
    {
        $value = static::where('key', 'zapier')->value('value');

        return [
            'webhook_url' => (string) ($value['webhook_url'] ?? ''),
            'enabled' => (bool) ($value['enabled'] ?? false),
        ];
    }

    public static function putZapier(?string $webhookUrl, bool $enabled): void
    {
        static::updateOrCreate(['key' => 'zapier'], ['value' => ['webhook_url' => (string) $webhookUrl, 'enabled' => $enabled]]);
    }

    /** The Zapier webhook URL when sending is switched on, otherwise null. */
    public static function zapierWebhookUrl(): ?string
    {
        $zapier = static::zapier();

        return $zapier['enabled'] && $zapier['webhook_url'] !== '' ? $zapier['webhook_url'] : null;
    }
}
