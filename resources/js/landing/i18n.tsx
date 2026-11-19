import { createContext, useContext, type ReactNode } from 'react';

export type Locale = 'ar' | 'en';

/** Fixed interface text. Everything editorial lives in the dashboard content instead. */
const UI = {
    ar: {
        nav: { project: 'المشروع', plots: 'القطع', payment: 'خطة الدفع', location: 'الموقع', faq: 'الأسئلة الشائعة' },
        navLabel: 'أقسام الصفحة',
        book: 'احجز قطعتك',
        cobrandAlt: 'عيد الاتحاد',
        switchLabel: 'English',
        switchAria: 'View this page in English',
        fullName: 'الاسم الكامل',
        namePlaceholder: 'اكتب اسمك',
        phone: 'رقم الهاتف',
        plotType: 'نوع القطعة',
        paymentMethod: 'طريقة الدفع المفضلة',
        areaFrom: 'المساحة تبدأ من',
        permit: 'تصريح البناء',
        available: 'القطع المتاحة',
        minutes: 'دقيقة',
        countdownLabel: 'الوقت المتبقي على انتهاء العرض',
        days: 'يوم',
        hours: 'ساعة',
        mins: 'دقيقة',
        fiveStars: '5 نجوم',
        quickLinks: 'روابط سريعة',
        contactUs: 'تواصل معنا',
        phoneLabel: 'هاتف:',
        emailLabel: 'البريد:',
        addressLabel: 'العنوان:',
        rights: 'جميع الحقوق محفوظة.',
        licence: 'رخصة رقم',
        call: 'اتصل',
        callAria: 'اتصل بنا',
        getPrices: 'احصل على الأسعار',
    },
    en: {
        nav: { project: 'Project', plots: 'Plots', payment: 'Payment plan', location: 'Location', faq: 'FAQ' },
        navLabel: 'Page sections',
        book: 'Book your plot',
        cobrandAlt: 'Eid Al Etihad',
        switchLabel: 'العربية',
        switchAria: 'عرض الصفحة بالعربية',
        fullName: 'Full name',
        namePlaceholder: 'Your name',
        phone: 'Phone number',
        plotType: 'Plot type',
        paymentMethod: 'Preferred payment method',
        areaFrom: 'Area from',
        permit: 'Building permit',
        available: 'Plots available',
        minutes: 'min',
        countdownLabel: 'Time left until the offer ends',
        days: 'days',
        hours: 'hours',
        mins: 'mins',
        fiveStars: '5 stars',
        quickLinks: 'Quick links',
        contactUs: 'Contact us',
        phoneLabel: 'Phone:',
        emailLabel: 'Email:',
        addressLabel: 'Address:',
        rights: 'All rights reserved.',
        licence: 'Licence no.',
        call: 'Call',
        callAria: 'Call us',
        getPrices: 'Get prices',
    },
} as const;

export type UiText = (typeof UI)[Locale];

interface LandingI18n {
    locale: Locale;
    dir: 'rtl' | 'ltr';
    ui: UiText;
    /** URL of the other language version. */
    otherUrl: string;
}

const Ctx = createContext<LandingI18n>({ locale: 'ar', dir: 'rtl', ui: UI.ar, otherUrl: '/en' });

export function LandingI18nProvider({ locale, otherUrl, children }: { locale: Locale; otherUrl: string; children: ReactNode }) {
    return <Ctx.Provider value={{ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', ui: UI[locale], otherUrl }}>{children}</Ctx.Provider>;
}

export const useLandingI18n = () => useContext(Ctx);
