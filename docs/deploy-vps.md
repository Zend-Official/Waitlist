# Putting the site on the VPS (nginx)

The site is plain static files. `npm run build` writes them to `dist/`, along with pre-compressed `.br` (brotli) and `.gz` copies of the HTML, CSS and JavaScript.

## 1. Build and upload

The site's address (https://zendpay.io) is set in `astro.config.mjs`, so link previews (WhatsApp, X…) point at the right images:

```bash
npm run build
```

Copy everything inside `dist/` to the server, for example to `/var/www/zend`:

```bash
rsync -avz --delete dist/ user@your-vps:/var/www/zend/
```

## 2. nginx site config

```nginx
server {
    listen 80;
    server_name zendpay.io www.zendpay.io;
    root /var/www/zend;
    index index.html;

    # Send the pre-compressed copies the build made.
    gzip_static on;
    brotli_static on;                  # needs the nginx brotli module (see below)

    # Files in /_astro/ have a content hash in their name: cache them for a year.
    location /_astro/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
    location /fonts/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # The service worker must never be cached by the server, or updates stall.
    location = /sw.js {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    # Unknown addresses show the site's own "Page not found" page.
    error_page 404 /404.html;

    # The page itself: always check for a new version.
    location / {
        add_header Cache-Control "no-cache";
        try_files $uri $uri/ =404;
    }
}
```

Then add HTTPS:

```bash
sudo certbot --nginx -d zendpay.io -d www.zendpay.io
```

## Brotli module

- **Ubuntu/Debian:** `sudo apt install libnginx-mod-http-brotli-static`, then `sudo systemctl reload nginx`.
- **If the module isn't available:** delete the `brotli_static on;` line. `gzip_static` still serves the `.gz` copies, which are only slightly bigger.

## Check it works

```bash
curl -sI -H "Accept-Encoding: br" https://zendpay.io/ | grep -i content-encoding
```

You should see `content-encoding: br`.

## Browser caching (repeat visits)

- **HTTP cache:** the `Cache-Control` headers above let browsers keep images, fonts, CSS and JS for a year. Their file names change whenever their content changes, so updates still arrive. The page itself is always rechecked.
- **Service worker:** `dist/sw.js`, made by `npm run build`. It saves the page's code and fonts on the first visit, keeps every image once it has been seen, and serves them from the browser on later visits, so the page also opens offline. The HTML is always fetched fresh when there's a connection. Each build has its own cache version, and old caches are deleted automatically.

## Link previews and share links

- **Home page:** shows `/og/buyers.jpg` (the girl, "Buy and sell on social media without fear").
- **Share links:** each shows its own picture, then opens the site:
  - `https://zendpay.io/s/sellers`: the boy, "Get paid without doubt" (opens the sellers part)
  - `https://zendpay.io/s/chat`: the chat phone, "Just Zend It"
  - `https://zendpay.io/s/zend`: the brand card
- **Images:** they're in `public/og/`. Check a preview with https://www.opengraph.xyz before posting.
