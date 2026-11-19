#!/usr/bin/env bash
# First install on the server (cPanel), run once as root after cloning the repo:
#   sudo -u alrasikhoon git clone https://github.com/ahmmedhashem/eid-al-etihad-offer.git /home/alrasikhoon/eid-al-etihad-offer
#   bash /home/alrasikhoon/eid-al-etihad-offer/server-setup.sh eid-al-etihad-offer.alrasikhoon.ae <admin-email>
# After that, every update is just: bash /home/alrasikhoon/eid-al-etihad-offer/deploy.sh
set -euo pipefail

DOMAIN="${1:?Usage: bash server-setup.sh <domain> <admin-email>}"
ADMIN_EMAIL="${2:?Usage: bash server-setup.sh <domain> <admin-email>}"

# Everything else comes from where the project was cloned.
APP=$(cd "$(dirname "$0")" && pwd)
U=$(stat -c %U "$APP")
# Where cPanel serves this domain from (falls back to the usual public_html/<domain>).
DOCROOT=$(uapi --user="$U" DomainInfo single_domain_data domain="$DOMAIN" 2>/dev/null | awk '/^ *documentroot:/ {print $2; exit}')
DOCROOT=${DOCROOT:-/home/$U/public_html/$DOMAIN}
if [ "$DOCROOT" = "/home/$U/public_html" ] || [ "$DOCROOT" = "/home/$U" ]; then
    echo "!! $DOMAIN is served from $DOCROOT, which holds other sites. Give it its own folder in cPanel first." >&2
    exit 1
fi
PHP=/opt/cpanel/ea-php83/root/usr/bin/php
SLUG=$(basename "$APP" | tr -cd 'a-zA-Z0-9')
DB=${U}_${SLUG:0:30}
DB_USER=${U}_${SLUG:0:16}
as_user() { sudo -u "$U" bash -c "cd $APP && $*"; }
step() { echo; echo "==> $*"; }
# Keeps the server-render (SSR) process running: cPanel has no Supervisor, so a per-minute cron
# starts it if it isn't running. Cron's PATH is minimal, so give it node's full location.
# If SSR is ever down the page still works (it renders in the browser instead).
install_ssr_watchdog() {
    local node_dir cron
    node_dir=$(dirname "$(as_user 'command -v node')")
    cron="* * * * * cd $APP && export PATH=$node_dir:/usr/local/bin:/usr/bin:/bin && (pgrep -u $U -f 'bootstrap/ssr/ssr.js' >/dev/null || nohup $PHP artisan inertia:start-ssr >> storage/logs/ssr.log 2>&1 &)"
    ( crontab -u "$U" -l 2>/dev/null | grep -v "$APP.*inertia:start-ssr"; echo "$cron" ) | crontab -u "$U" -
}

trap 'echo; echo "!! Setup stopped at line $LINENO. Send this output over." >&2' ERR

# Calls a cPanel API function and stops with its error message if it fails
# (something that already exists from an earlier run is fine).
uapi_call() {
    local out
    out=$(uapi --user="$U" "$@" 2>&1)
    if ! grep -q '^ *status: 1' <<<"$out" && ! grep -qi 'already exists' <<<"$out"; then
        echo "$out" | grep -A3 -i 'errors' >&2
        return 1
    fi
}

step "Fixing file ownership"
chown -R "$U:$U" "$APP"

# MySQL database and user, through cPanel so they show up in the cPanel UI.
if [ ! -f "$APP/.env" ]; then
    step "Creating MySQL database $DB"
    DB_PASS="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9')"
    uapi_call Mysql create_database name="$DB"
    uapi_call Mysql create_user name="$DB_USER" password="$DB_PASS"
    uapi_call Mysql set_password user="$DB_USER" password="$DB_PASS"
    uapi_call Mysql set_privileges_on_database user="$DB_USER" database="$DB" privileges="ALL PRIVILEGES"

    as_user "cp .env.example .env"
    as_user "sed -i \
        -e 's|^APP_ENV=.*|APP_ENV=production|' \
        -e 's|^APP_DEBUG=.*|APP_DEBUG=false|' \
        -e 's|^APP_URL=.*|APP_URL=https://$DOMAIN|' \
        -e 's|^LOG_LEVEL=.*|LOG_LEVEL=error|' \
        -e 's|^DB_CONNECTION=.*|DB_CONNECTION=mysql|' \
        -e 's|^# *DB_HOST=.*|DB_HOST=localhost|' \
        -e 's|^# *DB_PORT=.*|DB_PORT=3306|' \
        -e 's|^# *DB_DATABASE=.*|DB_DATABASE=$DB|' \
        -e 's|^# *DB_USERNAME=.*|DB_USERNAME=$DB_USER|' \
        -e 's|^# *DB_PASSWORD=.*|DB_PASSWORD=$DB_PASS|' \
        -e '/^DEV_ADMIN_/d' \
        .env"
    as_user "grep -q '^SESSION_SECURE_COOKIE=' .env || echo 'SESSION_SECURE_COOKIE=true' >> .env"
    chmod 600 "$APP/.env"
fi

step "Installing PHP packages"
as_user "$PHP -d allow_url_fopen=On /usr/local/bin/composer.phar install --no-dev --optimize-autoloader --no-interaction"
as_user "grep -q '^APP_KEY=base64' .env || $PHP artisan key:generate --force"
step "Building the frontend (browser + server-render bundles)"
as_user "npm ci --no-audit --no-fund && npm run build:ssr"
step "Setting up the database tables"
as_user "$PHP artisan migrate --force"
as_user "[ -L public/storage ] || $PHP artisan storage:link"
as_user "$PHP artisan optimize"

step "Keeping the server-render (SSR) process running"
install_ssr_watchdog

step "Serving $DOMAIN with PHP 8.3"
# New domains get cPanel's default PHP, which is older than this app needs.
whmapi1 php_set_vhost_versions version=ea-php83 vhost="$DOMAIN" >/dev/null

step "Pointing $DOMAIN at the app"
# Point the subdomain at public/, keeping whatever cPanel put there as a backup.
if [ ! -L "$DOCROOT" ]; then
    [ -e "$DOCROOT" ] && mv "$DOCROOT" "$DOCROOT.bak-$(date +%s)"
    sudo -u "$U" ln -s "$APP/public" "$DOCROOT"
fi

step "Requesting the SSL certificate"
# New subdomains can start out excluded from AutoSSL, which blocks the certificate.
uapi --user="$U" SSL remove_autossl_excluded_domains domains="$DOMAIN" >/dev/null 2>&1 || true
/usr/local/cpanel/bin/autossl_check --user="$U" >/dev/null 2>&1 || true

echo
as_user "$PHP artisan admin:create $ADMIN_EMAIL"
echo "Done: https://$DOMAIN  (English: https://$DOMAIN/en, dashboard: https://$DOMAIN/login)"
