#!/usr/bin/env bash
# One-time setup of the stats dashboard (stats.zendpay.io) on the Zend VPS.
# Run after zend-update has pulled a version of the site that has stats/:
#
#   sudo bash /opt/zend/site/scripts/server/stats-setup.sh
#
# What it does (safe to run again):
#   - makes a locked-down system user, zend-stats, that runs the dashboard
#   - copies the backend's STATS_READ_TOKEN into /etc/zend-stats/env
#     (readable by root and zend-stats only; never printed)
#   - copies the dashboard files to /opt/zend-stats and starts the
#     zend-stats service (127.0.0.1:4600 only)
#   - adds the nginx site stats.zendpay.io and turns on HTTPS
#   - installs: sudo zend-stats-user add <name> | remove <name> | list
#   - makes zend-update refresh and restart the dashboard too
set -euo pipefail

DOMAIN="stats.zendpay.io"
SRC="/opt/zend/site"
DEST="/opt/zend-stats"
CONF="/etc/zend-stats"
BACKEND_ENV="/opt/zend-app/.env"
PORT=4600

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }
[ "$(id -u)" -eq 0 ] || die "run it with sudo"
[ -f "$SRC/stats/server.mjs" ] || die "$SRC/stats is missing: run zend-update first"

say "System user"
id zend-stats >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin zend-stats

say "Settings in $CONF"
install -d -m 750 -o root -g zend-stats "$CONF"
token=$(grep -E '^STATS_READ_TOKEN=' "$BACKEND_ENV" | tail -1 | cut -d= -f2- | sed -E "s/^[\"']//; s/[\"']\$//")
[[ "$token" =~ ^[!-~]{32,256}$ ]] || die "STATS_READ_TOKEN in $BACKEND_ENV is missing or not 32-256 characters"
umask 027
cat > "$CONF/env" <<EOF
STATS_READ_TOKEN=$token
STATS_API_BASE=http://127.0.0.1:4567
STATS_USERS_FILE=$CONF/users.json
STATS_PORT=$PORT
STATS_ORIGIN=https://$DOMAIN
EOF
unset token
chown root:zend-stats "$CONF/env"; chmod 640 "$CONF/env"
[ -f "$CONF/users.json" ] || echo '{ "users": {} }' > "$CONF/users.json"
chown root:zend-stats "$CONF/users.json"; chmod 640 "$CONF/users.json"
umask 022

say "Dashboard files in $DEST"
cat > /usr/local/bin/zend-stats-sync <<EOF
#!/usr/bin/env bash
# Copy the dashboard from the site checkout and restart it.
set -euo pipefail
install -d -m 755 "$DEST" "$DEST/public"
rsync -a --delete "$SRC/stats/" "$DEST/stats/"
rsync -a --delete "$SRC/public/fonts/" "$DEST/public/fonts/"
chown -R root:root "$DEST"
systemctl restart zend-stats
EOF
chmod 755 /usr/local/bin/zend-stats-sync

cat > /etc/systemd/system/zend-stats.service <<EOF
[Unit]
Description=Zend stats dashboard ($DOMAIN)
After=network.target

[Service]
User=zend-stats
Group=zend-stats
EnvironmentFile=$CONF/env
ExecStart=/usr/bin/node $DEST/stats/server.mjs
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=true
LockPersonality=true
CapabilityBoundingSet=
ReadOnlyPaths=$DEST $CONF

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable zend-stats >/dev/null
/usr/local/bin/zend-stats-sync

say "User command: zend-stats-user"
cat > /usr/local/bin/zend-stats-user <<EOF
#!/usr/bin/env bash
# Add, remove or list stats dashboard users:
#   sudo zend-stats-user add <name>    (asks for the password)
#   sudo zend-stats-user remove <name>
#   sudo zend-stats-user list
set -euo pipefail
[ "\$(id -u)" -eq 0 ] || { echo "run: sudo zend-stats-user ..."; exit 1; }
STATS_USERS_FILE="$CONF/users.json" node "$DEST/stats/manage-user.mjs" "\$@"
chown root:zend-stats "$CONF/users.json"; chmod 640 "$CONF/users.json"
# A removed user's open sessions end now.
[ "\${1:-}" = remove ] && systemctl restart zend-stats || true
EOF
chmod 755 /usr/local/bin/zend-stats-user

say "zend-update also refreshes the dashboard"
grep -q zend-stats-sync /usr/local/bin/zend-update || echo '[ -x /usr/local/bin/zend-stats-sync ] && /usr/local/bin/zend-stats-sync && echo "Stats dashboard refreshed"' >> /usr/local/bin/zend-update

say "nginx site $DOMAIN"
cat > /etc/nginx/sites-available/zend-stats <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    client_max_body_size 8k;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/zend-stats /etc/nginx/sites-enabled/zend-stats
nginx -t
systemctl reload nginx

say "HTTPS"
certbot --nginx -d "$DOMAIN" --non-interactive --redirect --keep-until-expiring
grep -q 'Strict-Transport-Security' /etc/nginx/sites-available/zend-stats ||
  sed -i "0,/listen 443 ssl/s//add_header Strict-Transport-Security \"max-age=31536000\" always;\n    listen 443 ssl/" /etc/nginx/sites-available/zend-stats
nginx -t && systemctl reload nginx

sleep 1
systemctl is-active --quiet zend-stats || die "zend-stats did not start: journalctl -u zend-stats -n 30"
say "Done. Add the first user:  sudo zend-stats-user add <name>"
echo "Then open https://$DOMAIN"
