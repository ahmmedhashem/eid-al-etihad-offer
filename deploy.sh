#!/usr/bin/env bash
# Updates the live site from GitHub. Run on the server as root:
#   bash /home/alrasikhoon/eid-al-etihad-offer/deploy.sh
set -euo pipefail

# The project folder is wherever this script lives, owned by the cPanel user.
APP=$(cd "$(dirname "$0")" && pwd)
U=$(stat -c %U "$APP")
PHP=/opt/cpanel/ea-php83/root/usr/bin/php
as_user() { sudo -u "$U" bash -c "cd $APP && $*"; }

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
# Restart server-side rendering on the new build (the cron watchdog starts it again within a minute).
as_user "$PHP artisan inertia:stop-ssr || true"

echo "Deployed $(as_user 'git log --oneline -1')"
