# Specification – Electrical Distribution Board Quoting Tool (Web-Based)

## 1. Project Overview

Develop a professional web-based Quoting Tool for an Electrical Distribution Board manufacturing and assembly business.

The tool must allow estimators to quickly and accurately price complete projects including:

- Enclosures
- Circuit breakers and protection devices
- Copper busbar work
- DIN rail and trunking
- Cable and wiring
- PLC/automation components
- Metering
- Labour
- Engineering/design
- Testing and commissioning
- Consumables
- Markup and margins
- Optional extras
- Installation costs

Primary objective:
Reduce quoting time, improve pricing consistency, standardize margins, and minimize missed items.

---

# 2. Platform Requirements

## Software Platform
- Web application — runs in any modern browser
- Deployed to a subfolder on existing shared hosting (e.g. `yourdomain.com/quotes`)
- No installation required on client machines

## Hosting Requirements
- cPanel shared hosting
- PHP 8.0+
- MySQL / MariaDB database
- HTTPS (SSL certificate on domain)

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui component library |
| Backend | PHP (REST API) |
| Database | MySQL |
| PDF Generation | DomPDF (server-side PHP) |
| Authentication | PHP session-based login |

## Technical Requirements
- Must function with standard cPanel shared hosting — no Node.js server process required
- React frontend compiled to static files and uploaded to host
- All business logic and data access handled via PHP API endpoints
- Fully responsive — works on desktop and tablet
- No external SaaS dependencies

---

# 3. High-Level Functional Requirements

The system must include:

| Module | Description |
|---|---|
| Dashboard | Main navigation and quote overview |
| Customer Details | Client/project information |
| BOM Builder | Add all project items |
| Pricing Database | Master item pricing |
| Labour Calculator | Auto labour estimation |
| Copper Calculator | Busbar sizing and costing |
| Markup Engine | Margin calculations |
| Quote Generator | Professional quotation output |
| Reporting | Profitability and costing breakdown |
| Settings/Admin | Rates, markup rules, labour rates |

---

# 4. Authentication & Access

- Login page — username and password required before accessing any part of the app
- PHP session-based authentication
- Support for 2 user accounts (owner + one additional user)
- Session timeout after period of inactivity
- Admin account has access to Settings/Admin and pricing database management
- No public registration — accounts created by admin only

---

# 5. Dashboard Requirements

Main landing page (post-login) must include:

- New Quote button
- Open / search existing quotes
- Generate PDF button per quote
- Quote totals summary
- Profit margin display
- Quick navigation to all modules

Dashboard must be visually professional — clean layout, consistent branding, modern UI.

---

# 6. Customer & Project Information

Fields required:

## Customer Information
- Customer Name
- Contact Person
- Phone Number
- Email Address
- Physical Address

## Project Information
- Project Name
- Site Location
- Quote Number (auto-generated)
- Estimator Name
- Date
- Validity Period
- Currency
- Project Notes

---

# 7. Pricing Database Requirements

A master pricing table in MySQL must contain:

| Field | Description |
|---|---|
| Item Code | Unique item identifier |
| Description | Item description |
| Category | Breakers, enclosure, copper, etc |
| Supplier | Preferred supplier |
| Unit | Each, meter, kg, etc |
| Cost Price | Purchase price |
| Sell Price | Optional predefined sell price |
| Lead Time | Optional |
| Stock Status | Optional |
| Last Updated | Timestamp |
| Default Markup % | Standard markup |

Admin can add, edit, and deactivate items via the UI — no developer involvement required for pricing maintenance.

---

# 8. Categories Required

The system must support at minimum:

## Enclosures
- Floor standing
- Wall mount
- Stainless steel
- Outdoor/IP-rated

## Circuit Protection
- MCCB
- MCB
- RCCB
- RCBO
- ACB
- Isolators
- Surge protection

## Copper Work
- Busbars
- Earth bars
- Neutral bars
- Copper links
- Supports and insulation

## Internal Components
- DIN rail
- Trunking
- Terminals
- Ferrules
- Labels
- Cable glands

## Wiring
- Power cable
- Control cable
- Lugs
- Heat shrink

## Automation
- PLCs
- Relays
- Power supplies
- HMIs
- Network devices

## Metering
- Power meters
- CTs
- Indication lamps
- Selector switches

## Labour
- Mechanical assembly
- Copper fabrication
- Wiring
- Testing
- QC
- Engineering
- Site work

## Miscellaneous
- Consumables
- Delivery
- Freight
- Packaging

---

# 9. BOM Builder Requirements

Estimator must be able to:

- Search and add items via a live search input (search by code or description)
- Auto-fill pricing from the database on selection
- Enter quantities
- Override pricing (logged with a flag visible to admin)
- Add custom one-off items not in the database
- Add notes per line item
- Reorder line items via drag-and-drop

Each line item must calculate:
- Quantity
- Unit price
- Total cost
- Markup %
- Sell value
- Margin %

---

# 10. Labour Calculation Module

System must calculate labour automatically based on configurable rules.

## Labour Categories
- Enclosure preparation
- Mechanical assembly
- Copper fabrication
- Wiring
- PLC/automation
- Testing & FAT
- Site commissioning

## Labour Inputs
- Hours
- Hourly rate
- Skill level
- Overtime multiplier

## Labour Outputs
- Total hours
- Labour cost
- Labour sell value
- Labour breakdown per category

---

# 11. Copper Work Calculation Module

This module is critical.

Must support:

## Inputs
- Busbar dimensions
- Length
- Quantity
- Copper type
- Tin plating option

## Calculations
- Weight
- Material cost
- Fabrication labour
- Waste factor
- Drilling/bending allowance

## Outputs
- Total copper cost
- Fabrication time
- Final sell value

Must allow configurable copper pricing per kg via the Settings/Admin module.

---

# 12. Markup & Margin Engine

The system must support:

## Markup Rules
- Per category markup
- Per project markup override
- Manual line-item override
- Customer-specific pricing tiers (optional)

## Margin Display
- GP%
- Markup %
- Material margin
- Labour margin

## Warnings
System must highlight:
- Low margin items (configurable threshold)
- Negative margin
- Missing pricing

---

# 13. Quote Output Requirements

The generated quotation must be professional and client-ready.

## Quote Layout
- Company branding / logo
- Customer details
- Project details
- Itemized or grouped pricing (estimator's choice per quote)
- Exclusions section
- Terms & conditions
- Validity period
- Signature area

## Export / Delivery
- PDF generated server-side via DomPDF
- Download PDF button
- Print-ready formatting
- Clean, branded layout — indistinguishable from a professionally typeset document

---

# 14. Reporting Requirements

Reports required:

## Internal Costing Report
- Full material breakdown
- Labour breakdown
- Profit analysis

## Management Summary
- Total sell value
- Total cost
- GP%
- Labour / material split

## Historical Quote Tracking
- List of all quotes with status (draft, sent, won, lost)
- Customer trends
- Most used items

---

# 15. Automation Requirements

The tool must automate:

- Quote number generation (sequential, configurable prefix)
- Margin calculations (real-time as items are added)
- Totals and subtotals
- VAT / tax calculations (configurable rate)
- PDF generation on demand
- Data validation and inline error highlighting

---

# 16. Validation & Error Handling

System must:

- Prevent saving a quote with missing required fields
- Highlight missing or zero pricing
- Warn when margin falls below threshold
- Prevent duplicate quote numbers
- Validate numeric inputs client-side and server-side
- Show clear, user-friendly error messages (not raw PHP errors)

---

# 17. Performance Requirements

The application must:

- Load the dashboard in under 2 seconds on standard shared hosting
- Handle large BOMs (1000+ line items) without UI lag
- Use paginated or virtualized lists where needed
- Minimize unnecessary API calls (cache pricing data client-side during a session)

---

# 18. UI/UX Requirements

The application must:

- Look modern and professional (shadcn/ui component library, Tailwind CSS)
- Use consistent colour scheme aligned with company branding
- Minimize manual typing — live search, dropdowns, smart defaults
- Provide clear navigation between modules
- Show real-time totals and margin as the BOM is built
- Be fully usable on a desktop or laptop browser
- Tablet support desirable but not required

---

# 19. Security Requirements

- All pages require authenticated session — no data accessible without login
- Passwords stored as bcrypt hashes — never plain text
- HTTPS enforced (SSL on domain)
- PHP API endpoints validate session on every request
- Pricing database and formula logic not exposed to client
- Admin-only sections protected by role check
- SQL queries use prepared statements — no SQL injection risk

---

# 20. Future Expansion Requirements

The architecture must allow future integration with:

- SQL database migration to a dedicated server or VPS
- Supplier price list imports (CSV / API)
- ERP / accounting system integration
- Stock management system
- Power BI or reporting dashboard (data already in MySQL — connect directly)
- Upgrade to a hosted VPS if shared hosting becomes a limitation

---

# 21. Deliverables

Developer must provide:

## Application
- Fully functional web application deployed to subfolder on client's shared hosting
- Database schema (MySQL) with seed data for categories and sample items
- React frontend (compiled static build)
- PHP REST API backend

## Source Code
- Full source code in a version-controlled repository (GitHub or similar)
- React / TypeScript source
- PHP API source
- Database migration scripts

## Documentation
- User manual (how to create and manage quotes)
- Admin manual (how to manage pricing, users, settings)
- Deployment guide (how to redeploy after updates)

## Training
- Walkthrough session on first deployment

---

# 22. Preferred Technical Approach

| Area | Preferred Method |
|---|---|
| Data storage | MySQL via cPanel |
| Item search | React live search against PHP API |
| Calculations | React (real-time UI) + PHP (server-side validation) |
| Reporting | Dedicated report views with filtered MySQL queries |
| PDF output | DomPDF (PHP, server-side) |
| Navigation | React Router — single page app feel |
| Auth | PHP session + bcrypt |
| Deployment | Compiled React build + PHP files uploaded via cPanel File Manager or FTP |

---

# 23. Acceptance Criteria

The project is considered complete when:

- Quotes can be generated end-to-end and exported as professional PDFs
- Pricing calculations are accurate and match manual verification
- Labour calculations function correctly
- PDF output is professionally formatted and client-ready
- Large BOMs (500+ lines) remain responsive
- Admin can maintain pricing, users, and settings without developer involvement
- Application is deployed and accessible on client's domain

---

# 24. Key Business Objectives

The final system must:

- Reduce quoting time significantly
- Standardize pricing methodology
- Reduce human error
- Improve profitability visibility
- Prevent under-quoting
- Create professional client-facing quotations
- Scale with business growth
