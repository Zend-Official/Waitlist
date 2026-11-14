#!/usr/bin/env bash
# One-time setup of the Zend website on an Ubuntu/Debian VPS.
#
#   curl -fsSL https://raw.githubusercontent.com/Zend-Official/Waitlist/main/scripts/server/setup.sh | sudo bash
#
# What it does (safe to run again):
#   - installs nginx, git, rsync, certbot and Node.js
#   - adds swap on small servers so the build doesn't run out of memory
#   - downloads the site from GitHub into /opt/zend/site and builds it
#   - publishes the built files to /var/www/zend
#   - adds an nginx site for zendpay.io (other sites on the server are left alone)
#   - installs two commands:
#       sudo zend-update            pull the latest from GitHub and republish
#       sudo zend-https you@mail    turn on HTTPS (after the domain points here)
set -euo pipefail

DOMAIN="zendpay.io"
REPO="https://github.com/Zend-Official/Waitlist.git"
BRANCH="main"
APP_DIR="/opt/zend"
SRC="$APP_DIR/site"
WEB="/var/www/zend"
NODE_MAJOR=24

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mStopped: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run it with sudo (… | sudo bash)"
command -v apt-get >/dev/null || die "this script is for Ubuntu/Debian (apt). Send the output of: cat /etc/os-release"
export DEBIAN_FRONTEND=noninteractive

# Something other than nginx already answering on port 80/443 (e.g. Apache)?
if command -v ss >/dev/null; then
  busy=$(ss -ltnpH '( sport = :80 or sport = :443 )' 2>/dev/null | grep -v nginx || true)
  [ -z "$busy" ] || die "another program is using port 80/443:
$busy
Send this output to Claude before going further."
fi

say "Installing nginx, git, rsync, certbot"
apt-get update -y
apt-get install -y nginx git rsync curl ca-certificates gnupg certbot python3-certbot-nginx
BROTLI=0
if apt-get install -y libnginx-mod-http-brotli-static >/dev/null 2>&1; then BROTLI=1; fi

have_node=0
if command -v node >/dev/null; then
  v=$(node -p 'process.versions.node.split(".")[0]')
  [ "$v" -ge 22 ] && have_node=1
fi
if [ "$have_node" -eq 0 ]; then
  say "Installing Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
echo "node $(node -v), npm $(npm -v)"

# The image build needs ~1.5 GB of memory; give small servers some swap.
mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
swap_mb=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 2000 ] && [ "$swap_mb" -lt 1000 ] && [ ! -e /swapfile ]; then
  say "Adding 2 GB swap (server has ${mem_mb} MB memory)"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Builds run as their own user, not root.
if ! id zend >/dev/null 2>&1; then
  useradd --system --home-dir "$APP_DIR" --create-home --shell /usr/sbin/nologin zend
fi
mkdir -p "$APP_DIR" "$WEB"
chown zend:zend "$APP_DIR"

say "Installing the zend-update command"
cat > /usr/local/bin/zend-update <<EOF
#!/usr/bin/env bash
# Pull the latest site from GitHub, build it and publish it.
set -euo pipefail
[ "\$(id -u)" -eq 0 ] || { echo "run: sudo zend-update"; exit 1; }
as_zend() { runuser -u zend -- env HOME="$APP_DIR" "\$@"; }
if [ ! -d "$SRC/.git" ]; then
  as_zend git clone --branch "$BRANCH" "$REPO" "$SRC"
fi
cd "$SRC"
as_zend git fetch --quiet origin "$BRANCH"
as_zend git reset --quiet --hard "origin/$BRANCH"
echo "Building \$(as_zend git log -1 --format='%h %s')"
lock=\$(sha1sum package-lock.json | cut -d' ' -f1)
if [ ! -d node_modules ] || [ "\$lock" != "\$(cat .lock-hash 2>/dev/null)" ]; then
  as_zend npm ci --no-audit --no-fund
  echo "\$lock" | as_zend tee .lock-hash >/dev/null
fi
as_zend env SITE_URL="https://$DOMAIN" npm run build
rsync -a --delete "$SRC/dist/" "$WEB/"
chown -R www-data:www-data "$WEB"
echo "Published to $WEB"
EOF
chmod 755 /usr/local/bin/zend-update

cat > /usr/local/bin/zend-https <<EOF
#!/usr/bin/env bash
# Turn on HTTPS for $DOMAIN (run once the domain points at this server).
set -euo pipefail
[ "\$(id -u)" -eq 0 ] || { echo "run: sudo zend-https you@example.com"; exit 1; }
[ -n "\${1:-}" ] || { echo "usage: sudo zend-https you@example.com"; exit 1; }
ip=\$(curl -4 -fsS https://api.ipify.org || true)
for h in $DOMAIN www.$DOMAIN; do
  got=\$(getent ahostsv4 "\$h" | awk 'NR==1{print \$1}')
  if [ "\$got" != "\$ip" ]; then
    echo "\$h points to '\${got:-nothing}', not this server (\$ip). Fix the DNS record, wait a few minutes, try again."
    exit 1
  fi
done
certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect --agree-tos -m "\$1" --non-interactive
echo "HTTPS is on: https://$DOMAIN"
EOF
chmod 755 /usr/local/bin/zend-https

say "Downloading and building the site (takes a few minutes)"
/usr/local/bin/zend-update

say "Configuring nginx"
SITE_CONF=/etc/nginx/sites-available/zend
if [ ! -f "$SITE_CONF" ] || ! grep -q 'managed by Certbot' "$SITE_CONF"; then
  br_line="# brotli module not available: gzip copies are used"
  [ "$BROTLI" -eq 1 ] && br_line="brotli_static on;"
  cat > "$SITE_CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $WEB;
    index index.html;

    # Send the pre-compressed copies the build made.
    gzip_static on;
    $br_line

    # Hashed file names: cache for a year.
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }
    location /fonts/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files \$uri =404;
    }

    # The service worker must never be cached, or updates stall.
    location = /sw.js {
        add_header Cache-Control "no-cache";
        try_files \$uri =404;
    }

    error_page 404 /404.html;

    location / {
        add_header Cache-Control "no-cache";
        try_files \$uri \$uri/ \$uri.html =404;
    }
}
EOF
fi
ln -sf "$SITE_CONF" /etc/nginx/sites-enabled/zend
# The stock "Welcome to nginx" page would answer instead of the site.
if [ -L /etc/nginx/sites-enabled/default ] && grep -q 'default_server' /etc/nginx/sites-available/default \
   && [ -f /var/www/html/index.nginx-debian.html ]; then
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t
systemctl enable --now nginx
systemctl reload nginx

if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then
  ufw allow 'Nginx Full' >/dev/null
fi

ip=$(curl -4 -fsS https://api.ipify.org || echo "unknown")
say "Done"
cat <<EOF
The site is running on this server.
  Test it now:     http://$ip  (or curl -H 'Host: $DOMAIN' http://$ip)
  Server IP:       $ip
  Next:            point $DOMAIN and www.$DOMAIN at $ip (A records),
                   then run: sudo zend-https you@example.com
  Later updates:   sudo zend-update
EOF
