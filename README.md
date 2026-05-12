# PPE Quote Tool

Web-based quoting tool for **Power Panels & Electrical**. Estimators build detailed quotes for electrical distribution boards — BOM, labour, copper fabrication, and PDF output — all from a browser with no desktop software required.

---

## Features

- **Quote Builder** — multi-tab editor for customer details, panels, BOM, labour, copper fabrication, and summary
- **Pricing Database** — master item catalogue with CSV import/export and bulk delete
- **PDF Preview & Print** — formatted client quote with company logo, grouped or itemised layout
- **Customer Database** — reusable customer records with typeahead search in the quote builder
- **Dashboard** — pipeline KPIs, status filters, search, and one-click duplicate
- **Revision History** — tracks last saved date and user on every quote
- **User Management** — admin-only: create/edit users, reset passwords, activate/deactivate
- **Settings** — company details, logo upload, copper prices, labour rates, VAT defaults
- **My Account** — any user can change their own password
- **Dark / Light theme**

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 (CDN + Babel standalone — no build step) |
| Styling  | Vanilla CSS with CSS custom properties (dark/light themes) |
| Backend  | PHP 8.3 REST API |
| Database | MySQL 8 / MariaDB |
| PDF      | [DomPDF](https://github.com/dompdf/dompdf) via Composer |
| Hosting  | cPanel shared hosting |

---

## Project Structure

```
app/
├── api/
│   ├── base.php          # CORS, session, auth helpers, body() parser
│   ├── config.php        # DB credentials (not in repo — see config.example.php)
│   ├── config.example.php
│   ├── db.php            # PDO singleton
│   ├── auth.php          # Login, logout, session check, change password
│   ├── quotes.php        # Quote CRUD, save_full, duplicate, set_status
│   ├── customers.php     # Customer CRUD + typeahead search
│   ├── pricing.php       # Pricing DB CRUD, bulk import/export
│   ├── users.php         # User management (admin only)
│   ├── settings.php      # App settings key/value store
│   ├── logo.php          # Logo upload/delete
│   └── pdf.php           # DomPDF quote rendering
├── components/
│   └── ui.jsx            # Icons, Brand, StatusBadge, Toast, API client
├── screens/
│   ├── login.jsx
│   ├── dashboard.jsx
│   ├── quote-builder.jsx
│   ├── pdf-preview.jsx
│   ├── customers.jsx
│   ├── pricing.jsx
│   ├── users.jsx
│   └── settings.jsx
├── app.jsx               # App shell, routing, sidebar, topbar
├── index.html
└── styles.css

database/
├── schema.sql                    # Full table definitions — run once
├── seed.sql                      # Optional sample data
├── migrate_add_panels.sql        # Panel support migration
└── migrate_add_updated_by.sql    # Revision history + customer soft-delete
```

---

## Setup

### 1. Database

```sql
-- Create the database, then run in order:
SOURCE database/schema.sql;
SOURCE database/migrate_add_panels.sql;
SOURCE database/migrate_add_updated_by.sql;

-- Optional sample data:
SOURCE database/seed.sql;
```

### 2. Configuration

```bash
cp app/api/config.example.php app/api/config.php
```

Edit `config.php` with your database credentials and set `APP_ENV` to `'development'` for local work (shows full PHP errors) or `'production'` for live.

### 3. DomPDF (PDF generation)

```bash
cd app
composer install
```

Requires [Composer](https://getcomposer.org/). If Composer is unavailable on shared hosting, run it locally and upload the `vendor/` directory.

### 4. Deploy

Upload the `app/` directory to your web root (or a subdirectory). The `database/` folder does not need to be web-accessible.

Ensure `app/assets/` is writable by the web server (used for logo uploads).

---

## Default Login

After running `seed.sql` the default admin account is:

| Field    | Value   |
|----------|---------|
| Username | `admin` |
| Password | `admin123` |

**Change this immediately after first login** via Users → reset password, or My Account.

---

## API Overview

All endpoints return `{"ok": true, "data": ...}` on success or `{"ok": false, "error": "..."}` on failure. Request bodies are sent as `application/x-www-form-urlencoded`; nested arrays/objects are JSON-encoded as individual fields.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `api/auth.php` | POST | login, logout, check, change_password |
| `api/quotes.php` | GET, POST | list / create / full save / duplicate / set status |
| `api/customers.php` | GET, POST, PUT, DELETE | customer CRUD + typeahead |
| `api/pricing.php` | GET, POST, PUT, DELETE | pricing item CRUD + bulk import/delete |
| `api/users.php` | GET, POST, PUT | user management (admin only) |
| `api/settings.php` | GET, POST | app settings |
| `api/logo.php` | POST, DELETE | company logo upload/remove |
| `api/pdf.php` | GET | render quote as PDF |

---

## Development Notes

- **No build step** — edit JSX files and refresh the browser. Babel transpiles in the browser via CDN.
- **php://input** is unavailable on some shared hosting setups. All write requests use `application/x-www-form-urlencoded` via `URLSearchParams`. PUT requests are sent as POST with `?_method=PUT`.
- **DomPDF** cannot load remote URLs, so the company logo is base64-embedded in the PDF HTML template.
