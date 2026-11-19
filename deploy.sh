#!/usr/bin/env bash
# Updates the live site from GitHub. Run on the server as root:
#   bash /home/alrasikhoon/eid-al-etihad-offer/deploy.sh
set -euo pipefail

# The project folder is wherever this script lives, owned by the cPanel user.
APP=$(cd "$(dirname "$0")" && pwd)
U=$(stat -c %U "$APP")
PHP=/opt/cpanel/ea-php83/root/usr/bin/php
as_user() { sudo -u "$U" bash -c "cd $APP && $*"; }
# Keeps the server-render (SSR) process running: cPanel has no Supervisor, so a per-minute cron
# starts it if it isn't running. Cron's PATH is minimal, so give it node's full location.
# If SSR is ever down the page still works (it renders in the browser instead).
install_ssr_watchdog() {
    local node_dir cron
    node_dir=$(dirname "$(as_user 'command -v node')")
    cron="* * * * * cd $APP && export PATH=$node_dir:/usr/local/bin:/usr/bin:/bin && (pgrep -u $U -f 'bootstrap/ssr/ssr.js' >/dev/null || nohup $PHP artisan inertia:start-ssr >> storage/logs/ssr.log 2>&1 &)"
    ( crontab -u "$U" -l 2>/dev/null | grep -v "$APP.*inertia:start-ssr"; echo "$cron" ) | crontab -u "$U" -
}

# Everything runs inside main(), so bash has read the whole script before `git pull`
# replaces this file mid-run.
main() {
    as_user "$PHP artisan down --retry=15 || true"
    trap 'as_user "$PHP artisan up"' EXIT

    # cPanel (MultiPHP INI Editor) appends its PHP settings to public/.htaccess:
    # set them aside for the update and put them back after.
    KEEP=$APP/storage/app/cpanel-htaccess.part
    as_user "sed -n '/# BEGIN cPanel-generated/,/# END cPanel-generated/p' public/.htaccess > $KEEP"
    as_user "git checkout -- public/.htaccess"
    as_user "git pull --ff-only origin main"
    as_user "[ -s $KEEP ] && { echo; cat $KEEP; } >> public/.htaccess; rm -f $KEEP"
    as_user "$PHP -d allow_url_fopen=On /usr/local/bin/composer.phar install --no-dev --optimize-autoloader --no-interaction"
    as_user "npm ci --no-audit --no-fund && npm run build:ssr"
    as_user "$PHP artisan migrate --force"
    as_user "$PHP artisan optimize"
    # Restart server-side rendering on the new build: the cron watchdog starts it again within a minute.
    install_ssr_watchdog
    as_user "$PHP artisan inertia:stop-ssr >/dev/null 2>&1 || true"

    echo "Deployed $(as_user 'git log --oneline -1')"
}

main "$@"
