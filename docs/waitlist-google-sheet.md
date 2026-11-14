# Waitlist → Google Sheet: one-time setup (about 5 minutes)

Every "Join waitlist" sign-up becomes a row in a Google Sheet that you own: **time, name, phone or email, where they signed up**. No server or paid account is needed.

## 1. Create the sheet

1. Go to sheets.google.com and create a blank sheet. Name it **Zend waitlist**.
2. In row 1, type these headers: `Time` | `Name` | `Phone` | `Email` | `Source`

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Delete what's in the editor and paste the whole script below.
3. Click **Save** (the disk icon).

```js
// Zend waitlist: receives sign-ups from the website and adds a row.
// Columns: Time | Name | Phone | Email | Source
const SHEET_NAME = ''; // leave empty to use the first tab

// How many people have joined (for "50+ people have joined Zend" on the
// site). Cached for 5 minutes so busy pages don't hit the sheet every time.
function doGet() {
  const cache = CacheService.getScriptCache();
  let count = cache.get('count');
  if (count === null) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    count = String(Math.max(0, sheet.getLastRow() - 1));
    cache.put('count', count, 300);
  }
  return ContentService.createTextOutput(JSON.stringify({ count: Number(count) })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const out = (o) => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return out({ ok: true }); // honeypot: bots fill the hidden field

    const name = String(data.name || '').trim().slice(0, 80);
    if (name.length < 2) return out({ ok: false, error: 'name' });

    let phone = '';
    let email = '';
    if (data.email) {
      email = String(data.email).trim().toLowerCase().slice(0, 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return out({ ok: false, error: 'contact' });
    } else {
      phone = String(data.phone || '').replace(/[^\d+]/g, '');
      if (phone.startsWith('+234')) phone = phone.slice(4);
      else if (phone.startsWith('234')) phone = phone.slice(3);
      if (phone.startsWith('0')) phone = phone.slice(1);
      if (!/^[789][01]\d{8}$/.test(phone)) return out({ ok: false, error: 'contact' });
      phone = '+234' + phone;
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
      // Already on the list? Don't add twice.
      const last = sheet.getLastRow();
      if (last > 1) {
        const rows = sheet.getRange(2, 3, last - 1, 2).getValues();
        const seen = rows.some((r) => (phone && r[0] === phone) || (email && r[1] === email));
        if (seen) return out({ ok: true, already: true });
      }
      sheet.appendRow([new Date(), name, phone, email, String(data.source || '').slice(0, 40)]);
      CacheService.getScriptCache().remove('count');
    } finally {
      lock.releaseLock();
    }
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: 'server' });
  }
}
```

## 3. Publish it

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Fill it in:
   - Description: `Zend waitlist`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and allow access when Google asks. It's your own script: choose your account → Advanced → Go to project → Allow.
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/…/exec`.

## 4. Give the URL to the website

In the project folder, create a file named `.env` (or add a line to it if it exists):

```
PUBLIC_WAITLIST_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

Then rebuild the site. Or just paste the URL in chat and I'll add it.

## Notes

- **Changing the script later:** use Deploy → **Manage deployments** → edit (pencil) → Version: **New version** → Deploy. That keeps the same URL.
- **What's checked:** the name must be at least 2 characters. People give either a phone number or an email. A phone must be a Nigerian mobile number (080…, 081…, 070…, 090…, 091…), and it's saved as `+234…`. An email must look like `name@site.com`.
- **Duplicates:** a phone or email that's already on the list isn't added again, and the person still sees "You're on the list".
- **Spam:** a hidden field that real people never fill catches simple bots.
- **Privacy:** the sheet is private to your Google account. Share it only with people who should see the phone numbers.

## What's actually set up (14 Nov 2026)

Claude set this up in your account a little differently from the steps above, but it works the same way:
- The script is a **standalone** Apps Script project called "Zend waitlist". It opens the sheet by its ID, so the sheet itself has no script attached.
- A `setup()` function adds the header row.
- `doGet` returns the sign-up count for "50+ people have joined Zend". The site shows it once there are 10 or more sign-ups, rounded down (10+, 20+ … then 50s, then 100s).
