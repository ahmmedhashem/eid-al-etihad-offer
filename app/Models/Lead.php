<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    use HasFactory;

    public const STATUSES = ['new', 'contacted', 'qualified', 'won', 'lost'];

    public const ATTRIBUTION_FIELDS = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'gclid', 'fbclid', 'ttclid', 'landing_url', 'referrer',
    ];

    protected $fillable = [
        'name', 'phone', 'plot_type', 'payment_method', 'locale', 'status', 'notes',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
        'gclid', 'fbclid', 'ttclid', 'landing_url', 'referrer', 'ip', 'user_agent',
    ];
}
