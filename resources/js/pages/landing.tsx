import { LandingI18nProvider, type Locale } from '@/landing/i18n';
import { Footer, Header, Hero, MobileCtaBar, SECTION_COMPONENTS } from '@/landing/sections';
import type { LandingContent } from '@/landing/types';
import { Head } from '@inertiajs/react';
import { Fragment } from 'react';

interface Props {
    content: LandingContent;
    locale: Locale;
    alternates: Record<Locale, string>;
}

export default function Landing({ content, locale, alternates }: Props) {
    const other: Locale = locale === 'ar' ? 'en' : 'ar';
    return (
        <LandingI18nProvider locale={locale} otherUrl={alternates[other]}>
            <div className="landing min-h-screen" dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
                <Head title={content.seo.title} />
                <Header content={content} />
                <main>
                    <Hero content={content} />
                    {content.sections
                        .filter((s) => s.enabled && SECTION_COMPONENTS[s.key])
                        .map((s) => {
                            const Comp = SECTION_COMPONENTS[s.key];
                            return (
                                <Fragment key={s.key}>
                                    <Comp content={content} />
                                </Fragment>
                            );
                        })}
                </main>
                <Footer content={content} />
                <MobileCtaBar content={content} />
            </div>
        </LandingI18nProvider>
    );
}
