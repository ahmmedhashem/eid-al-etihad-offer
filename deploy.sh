#!/usr/bin/env bash
# Updates the live site from GitHub. Run on the server as root:
#   bash /home/alrasikhoon/eid-al-etihad-offer/deploy.sh
set -euo pipefail

# The project folder is wherever this script lives, owned by the cPanel user.
APP=$(cd "$(dirname "$0")" && pwd)
U=$(stat -c %U "$APP")
PHP=/opt/cpanel/ea-php83/root/usr/bin/php
as_user() { sudo -u "$U" bash -c "cd $APP && $*"; }
# Server-side rendering (SSR) runs as a systemd service: the cPanel user's cron runs inside
# jailshell, where a long-running Node process doesn't survive. The service runs as the cPanel
# user, restarts on crash and starts on boot. If it's ever down, the page still works (it renders
# in the browser instead).
install_ssr_service() {
    local name node
    name="ssr-$(basename "$APP")"
    node=$(command -v node)
    cat > "/etc/systemd/system/$name.service" <<UNIT
[Unit]
Description=Inertia SSR for $(basename "$APP")
After=network.target

[Service]
User=$U
WorkingDirectory=$APP
ExecStart=$node $APP/bootstrap/ssr/ssr.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
UNIT
    systemctl daemon-reload
    systemctl enable "$name" >/dev/null 2>&1
    systemctl restart "$name"
    # Remove the earlier cron-based watchdog, if present.
    crontab -u "$U" -l 2>/dev/null | grep -v "$APP.*inertia:start-ssr" | crontab -u "$U" - || true
    sleep 2
    systemctl is-active --quiet "$name" && echo "SSR service $name is running" || { echo "!! SSR service $name failed to start:" >&2; journalctl -u "$name" -n 20 --no-pager >&2; }
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
    # Restart server-side rendering on the new build.
    install_ssr_service

    echo "Deployed $(as_user 'git log --oneline -1')"
}

main "$@"
