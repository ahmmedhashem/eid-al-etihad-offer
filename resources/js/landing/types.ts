export type SectionKey =
    | 'trust'
    | 'offers'
    | 'project'
    | 'plots'
    | 'payment'
    | 'gallery'
    | 'amenities'
    | 'location'
    | 'experience'
    | 'final_cta'
    | 'faq';

export type AmenityIcon = 'store' | 'bag' | 'clinic' | 'mosque' | 'tree' | 'school' | 'gym' | 'parking' | 'road' | 'shield';

export interface LandingContent {
    brand: { name: string; name_en: string; logo: string | null; logo_footer?: string | null; phone: string; email: string; address: string; license_no: string };
    seo: { title: string; description: string; og_image: string | null };
    campaign: { badge: string; offer_ends_at: string | null; show_countdown: boolean; cobrand_logo: string | null };
    hero: {
        title: string;
        subtitle: string;
        chips: string[];
        cta_label: string;
        image: string | null;
        image_mobile: string | null;
        /** [width, height] added by the server for uploaded photos */
        image_size?: [number, number] | null;
        image_mobile_size?: [number, number] | null;
    };
    stats: { value: string; label: string }[];
    offers: {
        eyebrow: string;
        title: string;
        items: { tag: string; big: string; title: string; body: string }[];
        urgency_title: string;
        urgency_body: string;
        urgency_cta: string;
    };
    project: { eyebrow: string; title: string; body: string; features: { title: string; body: string }[]; cta_label: string; image: string | null };
    plots: {
        eyebrow: string;
        title: string;
        subtitle: string;
        items: { name: string; description: string; area: string; permit: string; count: string }[];
        cta_label: string;
        image: string | null;
    };
    payment: {
        eyebrow: string;
        title: string;
        subtitle: string;
        plans: { title: string; tag: string; highlight: boolean; cta_label: string; rows: { label: string; value: string }[] }[];
    };
    gallery: { eyebrow: string; title: string; cta_label: string; images: { url: string; alt: string }[] };
    amenities: { eyebrow: string; title: string; subtitle: string; items: { label: string; icon: AmenityIcon }[] };
    location: {
        eyebrow: string;
        title: string;
        body: string;
        drive_times: { place: string; minutes: string }[];
        map_embed_url: string;
        map_link: string;
        cta_label: string;
    };
    experience: {
        eyebrow: string;
        title: string;
        body: string;
        projects: { name: string; meta: string; image: string | null }[];
        testimonials: { quote: string; name: string; project: string }[];
    };
    form: {
        title: string;
        subtitle: string;
        final_eyebrow: string;
        final_title: string;
        final_body: string;
        final_form_title: string;
        benefits: string[];
        plot_options: string[];
        payment_options: string[];
        submit_label: string;
        consent: string;
        success_title: string;
        success_body: string;
    };
    faq: { eyebrow: string; title: string; items: { q: string; a: string }[]; more_label: string; more_cta: string };
    footer: { about: string; disclaimer: string };
    sections: { key: SectionKey; enabled: boolean }[];
}
