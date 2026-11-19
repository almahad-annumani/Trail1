# Al-Maʿhad An-Nuʿmānī — frontend

React + Vite static frontend intended for GitHub Pages. It integrates with the existing Google Apps Script / Google Sheets backend; it does not replace or modify that backend.

## Project structure

```text
.
├── .github/workflows/deploy.yml   # GitHub Pages deployment workflow
├── index.html                     # document shell, Google Fonts / Material Symbols
├── package.json
├── vite.config.js                 # repository-aware Pages base path
└── src/
    ├── App.jsx                    # HashRouter and page routes
    ├── config.js                  # API URL, contact and document placeholders
    ├── main.jsx
    ├── styles.css                 # navy/gold responsive styling
    ├── components/
    │   ├── Forms.jsx               # registration, enquiry and message forms
    │   └── Site.jsx                # header, timezone, footer, cookie notice
    ├── lib/
    │   ├── api.js                  # GET/POST integration and error mapping
    │   └── referral.js             # resolveRef, attribution and consent storage
    └── pages/Pages.jsx             # home, about, course listings/details, contact, documents
```

## Run locally

Requirements: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

The development server prints a local URL. The API URL is configured in `src/config.js`.

## First GitHub Pages deployment

1. Create a new GitHub repository (for example `al-mahad-website`). Choose public if you want the standard GitHub Pages offering without additional organisation configuration.
2. Copy the contents of this project folder into the repository root. Do not upload the ZIP backend or workbook into the public frontend repository.
3. Review `src/config.js`. The Apps Script `/exec` URL is preconfigured. Replace contact and document placeholders only with institute-approved details.
4. Commit and push the project to the `main` branch.
5. In GitHub, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
6. The workflow in `.github/workflows/deploy.yml` installs dependencies, builds the site and publishes `dist`. GitHub Actions supplies `GITHUB_REPOSITORY`; `vite.config.js` uses the repository name as the base path.
7. Open the Pages URL shown in the workflow deployment summary. Standard project-site URLs are typically `https://OWNER.github.io/REPOSITORY/`.
8. For a custom domain or a GitHub user/organisation site, change `vite.config.js` to `base: '/'` and configure the domain in GitHub Pages.
9. The app uses `HashRouter` (URLs such as `/#/course/CRS-0001`) so direct refreshes and internal navigation do not depend on a server-side rewrite rule.

To reproduce the Pages build locally after setting the repository name:

```bash
GITHUB_PAGES=true VITE_REPO_NAME=al-mahad-website npm run build
```

On Windows PowerShell:

```powershell
$env:GITHUB_PAGES='true'; $env:VITE_REPO_NAME='al-mahad-website'; npm run build
```

## Backend integration

The frontend uses the supplied endpoint from `src/config.js`:

`https://script.google.com/macros/s/AKfycbxMHi3E0iZojFEtzQWlAClegEcP3rXriBQbNR41jRInw96q7pjJiBEfITesfrVYbrU8jw/exec`

GET actions used: `getHomepageCards`, `getCourses`, `getCourse`, `getSubjects`, `getFaculty`, `getFormOptions`, `resolveRef`.

POST form types used: `register`, `enquiry`, `message`. Every POST includes `form`, `origin`, `loaded_at`, `website: ''`, and `ref`. POST uses `Content-Type: text/plain;charset=utf-8` to avoid a CORS preflight. Form submission is only shown as successful after `{ok:true}` is returned by Apps Script.

The frontend maps form data to the exact backend keys. Student first and last names are joined into `student_name`; guardian names are joined into `guardian_name`; the enquiry preferred platform controls whether WhatsApp or Telegram details are required. Registration always requests a WhatsApp number because the current backend requires it.

## Central configuration

Edit `src/config.js` for:

- `apiUrl`
- institute email, WhatsApp, Telegram and Instagram values
- Terms, Privacy Policy and Code of Conduct URLs
- site name and category labels

Blank contact/document values intentionally render as “To be supplied” or a document placeholder. No contact details or document URLs have been fabricated.

## Backend / workbook launch checklist

The supplied Apps Script source and workbook should remain unchanged unless the institute approves a specific backend change.

1. Open `Website_Workbook_v6.xlsx` in Google Sheets (or the existing production spreadsheet) and run **Website backend → Validate workbook**.
2. Confirm the spreadsheet time zone is GMT/UTC.
3. In Apps Script Project Settings, set Script Property `TELEGRAM_BOT_TOKEN`.
4. Set Script Property `ALLOWED_ORIGIN` to the exact published site origin, with no trailing slash. For a project site this is `https://OWNER.github.io`; the repository path is not part of the origin.
5. Set Settings `site_base_url` to the full published website URL, including `/REPOSITORY` for a project site, with no trailing slash.
6. Set Settings `telegram_chat_id`.
7. Set `SPREADSHEET_ID` only if the Apps Script project is not bound to the workbook.
8. Verify `customer_email_enabled` and `customer_email_reply_to` against institute policy.
9. Deploy the Apps Script web app to execute as the owner and allow the intended public access. Use the deployed `/exec` URL.
10. Run **Test endpoints** and **Send Telegram test** from the workbook menu.
11. Clear `EX-` example rows only when the workbook is ready for production; the action is destructive and should be done by the workbook owner.
12. Re-run validation and test the production website origin against `ALLOWED_ORIGIN`.

Do not put the Telegram token, spreadsheet ID, or other private credentials in this frontend repository.

## Tests and verification status

### Completed in this implementation environment

- Opened and extracted `9(1).zip`.
- Inspected all six Apps Script files, `appsscript.json`, `SETUP.md`, and the embedded `SETUP.pdf`.
- Opened `Website_Workbook_v6.xlsx` directly from the ZIP and checked all sheet names and headers.
- Inspected the single-page `V3(1).pdf` mockup montage and its extracted text.
- Checked JSX/JavaScript syntax for all source files using the TypeScript parser.
- Parsed the stylesheet with PostCSS and checked the package manifest JSON.
- Confirmed frontend source contains no Telegram token or spreadsheet ID.
- Confirmed `PUBLIC.Groups` in the supplied backend excludes `Seats taken` and `PUBLIC.Courses` excludes private notes / visibility fields.
- Confirmed forms use the supplied GET/POST action names, backend field names, honeypot and minimum-fill timestamp contract.

### Not completed / requires owner access or a functioning deployment

- `npm install` and a production Vite build: dependency installation timed out in this environment, so no successful bundle build is claimed.
- Live `ping`, GET endpoint and POST endpoint tests: the supplied Apps Script URL could not be reached from this environment because external DNS/network access was unavailable. It must be tested from the deployed site/browser.
- Workbook validation, Telegram test, Apps Script Script Properties and deployment settings: these require access to the institute's Google account/spreadsheet.
- End-to-end registrations, enquiries, messages, referral attribution, timezone rendering and responsive visual QA in real browsers: pending deployment and live API availability.

## Outstanding institute information

- Confirm the final public site URL / GitHub repository name.
- Confirm approved email, WhatsApp, Telegram and Instagram contact details.
- Supply final Terms and Conditions, Privacy Policy and Code of Conduct URLs/documents.
- Supply approved course records, group schedules, faculty profiles and Homepage_Cards entries in the workbook. Current records are examples prefixed `EX-`.
- Confirm whether the currently enabled customer confirmation email setting (`customer_email_enabled = Yes`) is intended for production.
- Confirm the desired final logo asset and any full-resolution image assets. The current header mark is a typographic placeholder, not a recovered original logo. The supplied V3 PDF is a single-page composite with very small individual screen mockups; no separate image asset bundle was included.
- Confirm the exact Google Font families and icon artwork used in the original design if they differ from the provisional Google-hosted Cormorant Garamond, Amiri, Inter and Material Symbols selections.

## Source issues / decisions requiring attention

1. **V3 includes an FAQ navigation/page**, but the project brief explicitly says to remove the FAQ page. This implementation omits it.
2. **The V3 PDF contains repeated, unrelated placeholder/garbled text** in the document/mockup area. It has not been copied into the site.
3. **The workbook has a `README` sheet** in addition to the operational tabs listed in the brief. It is preserved and not modified.
4. **The workbook contains `EX-` examples only** for course, group, faculty and sample transactions; these are not treated as live course content. The API may currently return no public courses once those example rows are cleared.
5. **`Settings.telegram_chat_id` is blank**, and `Settings.site_base_url` is still `https://example.com`. These must be completed before launch.
6. **`ALLOWED_ORIGIN` and `TELEGRAM_BOT_TOKEN` are Script Properties**, not values in the ZIP. Their actual deployed values cannot be verified from the supplied source archive.
7. The backend requires `whatsapp` for all registrations, including self-registration. The frontend reflects this even if a design field label appears optional.
8. The backend's `getFormOptions` exposes age rules through `settings`; the frontend uses these values rather than fixed age limits.
9. A course-specific referral code submitted for another course is intentionally handled as a General link by the supplied `commissionBasis_()` logic. The frontend does not introduce a different commission rule.
10. The current Apps Script endpoint was not confirmed reachable during this inspection. Do not treat its presence in configuration as proof that its deployment is active or correctly configured.
