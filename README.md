# Zend website

The Zend waitlist site (zendpay.io): a scroll-story home page plus Privacy, Terms, Partners and Contact pages. Built with Astro and GSAP.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The site is written to `dist/`, with pre-compressed copies and the offline cache script. See `docs/deploy-vps.md` (VPS/nginx) or `netlify.toml` (Netlify).

Waitlist sign-ups and contact messages go to a Google Sheet through a Google Apps Script web app (`docs/waitlist-google-sheet.md`).
