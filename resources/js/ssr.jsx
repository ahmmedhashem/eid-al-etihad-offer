import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// SSR entry (built with `npm run build:ssr`, served by `php artisan inertia:start-ssr`).
// Only the public landing page is sent here — see resources/views/app.blade.php.
createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        // Same rule as app.tsx: the landing page sets its own full SEO title.
        title: (title) => (page.component === 'landing' ? title : title ? `${title} - ${appName}` : appName),
        // Only the landing page is server-rendered; bundling just it keeps the SSR build small and free of
        // dashboard code that relies on browser-only APIs (window, localStorage).
        resolve: (name) => {
            const pages = import.meta.glob('./pages/landing.tsx', { eager: true });
            const resolved = pages[`./pages/${name}.tsx`];
            if (!resolved) throw new Error(`Page "${name}" is not server-rendered`);
            return resolved;
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
);
