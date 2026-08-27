# Saasdesk — Landing Page Design Spec

> Source: `https://sasdesk.webflow.io/#Home`
> Template: *Saasdesk – Webflow HTML website template* (© 2023 RNN Studio, Powered by Webflow)
> Product: All-in-one Payroll and HR System for small teams (branded internally as **Saasland HR**)

---

## 1. Page Overview

| Attribute | Value |
|---|---|
| Type | Single-page marketing landing (anchor-scroll) |
| Primary CTA | **Start 14-day free trial** (links to `/signup`) |
| Secondary CTA | **Login** (`/login`) |
| Hero headline | "All-in-one Payroll and HR System for small team" |
| Subhead | "Helping them establish efficient HR operations, manage growing teams, and stay compliant." |
| Tone | B2B SaaS, startup/SMB-focused, compliance + growth oriented |
| App store presence | Apple App Store + Google Play (badges in nav & footer) |

**Note (content bug):** Brand is inconsistently named — page title/logo = *Saasdesk*, but body copy repeatedly calls the product *Saasland HR*. Also the FAQ section asks about *SEO services / SEO agency pricing*, which is filler text left from the template and does not match the HR product.

---

## 2. Global Layout & Navigation

**Top nav (sticky header):**
- Logo: `Saasdesk logo white` (SVG)
- App availability badges: App Store, Google Play
- CTA button: `Start 14-day free trial` → `/signup`
- Footer nav (anchor links): Benefits, Features, Pricing, FAQs
- Account links: Login, Signup
- Legal links: License, Changelog

**Anchor sections (in scroll order):**
1. `#Hero` (Home)
2. `#Benefits` — TOP BENEFITS
3. Feature tabs (Benefit tab image + widget)
4. PAYOUTS — Automate payroll
5. Use cases (Recruitment, Payroll, Individuals & Agencies)
6. INTEGRATION — Scale team
7. Testimonials / "What Client Say"
8. Plans and Pricing
9. FAQ
10. "Trusted by 2000+ Clients" logos
11. Final CTA + Footer

---

## 3. Section-by-Section Content

### 3.1 Hero
- **H1:** All-in-one Payroll and HR System for small team
- **Lead:** Helping them establish efficient HR operations, manage growing teams, and stay compliant.
- **CTA:** Start 14-day free trial → `/signup`
- **Microcopy:** *No credit card required*
- **Visual:** Hero image (`Hero image.webp`)
- **Eyebrow/section nav:** Support, Privacy links (top-right utility row)

### 3.2 Top Benefits (`TOP BENEFITS`)
Section lead: "Saasland HR is a cutting-edge, cloud-based Human Resources Management Software designed to streamline."

Four benefit cards (each with an icon `Vectors-Wrapper.svg` and identical boilerplate description):
1. **Set and track employee goals**
2. **Automate payroll processing**
3. **Track employee attendance**
4. **Time tracking solutions**

> Boilerplate description (all four): *"Saasland HR provides cost-effective HR solutions for startups and SMBs, helping them establish efficient HR operations, manage growing teams."*

Supporting visuals: Benefit tab image + benefit widget (interactive tab mockups), Interactive element 1/2/3 (`webp`).
Mini testimonial widget: "Interviewing — Sofia Miller".

### 3.3 Payouts (Payroll automation)
- **Eyebrow:** PAYOUTS
- **H3:** Automate payroll processing, tax calculations
- Copy: same SMB boilerplate.
- Visual: Interactive element 2.

### 3.4 Use Cases
**Recruitment**
- H3: Interviews and assessments within platform
- Copy: *"Recruitment firms can utilize Saasland HR to streamline candidate management, track placements, and enhance communication between clients, candidates."*
- Visual: Interactive element 3.

**Payroll**
- H3: Generate payroll reports and pay stubs
- Copy: *"Non-profits can use Saasland HR to effectively manage volunteer programs, track donor contributions, and maintain compliance with non-profit regulations."*

**Amazing use case for Individuals & Agencies** — four industry cards (icon + heading + copy):
1. **HR Software for small team** — SMB boilerplate
2. **Recruitment Agencies** — *"Recruitment agencies can utilize Saasland HR to streamline candidate management, track placements."*
3. **Educational Institutions** — *"Solutions for startups and SMBs, helping them establish efficient HR operations, manage growing teams"*
4. **Non-profit Organizations** — *"Non-profits can use Saasland HR to effectively manage volunteer programs, track donor contributions."*

### 3.5 Integration (`INTEGRATION`)
- **H:** Scale your team up-and-down
- Copy: SMB boilerplate variant.
- Stat: **100+ Tool Integrations**
- Visual: Integrations Logos (`png`)
- Background video: `pexels-diva-plavalaguna-6985491 (720p)-transcode.mp4`
- CTA: Start 14-day free trial.

### 3.6 Testimonials ("What Client Say")
Two distinct testimonial cards (duplicated in source for carousel):
- **Adam Smith** — Co-Founder & CEO — *"They have a great understanding of HR strategies and how to apply them effectively"* — Stat: **3x Faster Hiring**
- **Linda Anderson** — Co-Founder & CEO — Stat: **85% Relevant Profiles**
- Feature testimonial: **Linda Smith**, Managing Director — **85% Growth** — *"Tailored for both your desktop and mobile devices"* — Company logo SVG.

### 3.7 Pricing (`Plans and Pricing`)
Toggle: **Monthly / Yearly** (Save 30%).

Four tiers (each lists identical feature block: Standard Performance, 2 website, Unmetered bandwidth, 100 GB storage, 1 database, Premium Support — clearly template placeholders):

| Tier | Price | CTA |
|---|---|---|
| Free | $0 / month | Signup Now |
| Starter | $39 / month | Signup Now |
| Professional | $59 / month | Signup Now |
| Business | $99 / month | Signup Now |

> Feature lists are generic hosting-style ("2 website", "100 GB storage", "1 database") and do not reflect HR product capabilities — template filler.

### 3.8 FAQ (`Most common question asked by customers`)
Sales contact: `support@site.com` / `123-456-7890`.
Accordion items (all answered with the same SMB boilerplate):
- Set and track employee goals
- Is there a standard pricing model for SEO services?
- What is included in the typical SEO agency pricing package?
- Do SEO agencies guarantee specific rankings on search engines?
- Solutions for startups and SMBs, helping establish?

### 3.9 Trust Bar (`Trusted by 2000+ Clients Worldwide`)
Row of client logo SVGs (`Vectors-Wrapper.svg` × multiple, `Group-2.svg`, `Group-9495.svg`).

### 3.10 Final CTA + Footer
- Repeat H: **All-in-one Payroll and HR System for small team** + CTA.
- Persona chips: Employee, Freelancer, Vendor, Consultant (with member images).
- **Footer columns:**
  - Brand: logo, app badges, pre-sales contact.
  - Social: Facebook, Instagram, LinkedIn.
  - Navigations: Benefits, Features, Pricing, FAQs.
  - Account: Login, Signup.
  - Legal: License, Changelog.
- **Copyright:** © 2023 RNN Studio. All Rights Reserved. · Powered by Webflow.

---

## 4. Design System (inferred)

### 4.1 Imagery & Media
- Hero: `Hero image.webp`
- Benefit/interactive mockups: `Benefit tab image.webp`, `benefit widget.webp`, `Interactive element 1/2/3.webp`
- Team member images: `team member image.webp`, `team member image 2.webp`
- Client images: `Client image 1/2/3.webp`
- Integrations: `Integrations Logos.png`
- Background video: `pexels-diva-plavalaguna-6985491 (720p)-transcode.mp4`
- Logo (white): `Saasdesk logo white.svg`

### 4.2 Icons
- Inline SVG icons (base64) for: benefit cards, FAQ accordion chevrons, carousel arrows, check marks (`check.svg`).
- `Vectors-Wrapper.svg` used as generic decorative/logo glyphs.

### 4.3 Components
- Sticky top nav with app-store badges + primary CTA.
- Hero with headline + subhead + CTA + microcopy + image.
- Benefit card grid (icon + title + copy).
- Tabbed/interactive feature mockups (image widgets).
- Stat callouts (3x, 85%, 100+).
- Testimonial cards (quote + name + role + stat).
- Pricing table with Monthly/Yearly toggle.
- FAQ accordion.
- Logo marquee/trust bar.
- Multi-column footer.

### 4.4 Visual Language
- Clean B2B SaaS aesthetic; rounded cards, soft shadows implied by "widget"/"tab" mockups.
- Primary action = filled CTA button ("Start 14-day free trial", arrow icon `Button Arrow.svg`).
- Copy is benefit-led, repeats a single SMB boilerplate across most sections.
- Color palette not extractable from HTML text alone (defined in Webflow CSS); key brand asset is the white logo SVG.

---

## 5. Assets Inventory (CDN base)
`https://cdn.prod.website-files.com/650ff2343fda489a4a654c9e/...` and `.../6543eed5397deb6f75475c49/...`

| Asset | Purpose |
|---|---|
| `65216dc9..._Hero image.webp` | OG + hero |
| `6543eed5..._Hero image.webp` | Hero render |
| `6517e8fb..._Vectors-Wrapper.svg` (×4 variants) | Benefit icons |
| `6543eed5..._Benefit tab image.webp` / `_benefit widget.webp` | Feature UI mockup |
| `6543eed5..._Interactive element 1/2/3.webp` | Feature screens |
| `6543eed5..._Integrations Logos.png` | Integration strip |
| `6543eed5..._Client image 1/2/3.webp` | Testimonial avatars |
| `6543eed5..._team member image.webp` / `2.webp` | Persona chips |
| `6543eed5..._check.svg` | Feature checkmarks |
| `6543eed5..._Button Arrow.svg` | CTA arrow |
| `6543eed5..._pexels-...-transcode.mp4` | Background video |
| `6543eed5..._Saasdesk logo white.svg` | Brand logo |

---

## 6. Recommendations / Issues to Fix Before Build
1. **Brand inconsistency** — unify *Saasdesk* vs *Saasland HR* across all copy.
2. **FAQ filler** — replace SEO-service questions with real HR/payroll FAQs.
3. **Pricing features** — "2 website / 100 GB storage / 1 database" are hosting placeholders; swap for HR features (employees, payroll runs, integrations).
4. **Boilerplate repetition** — same paragraph reused in ~8 sections; differentiate per section.
5. **Contact placeholder** — `support@site.com` / `123-456-7890` are dummy values.
6. **Copyright** — "© 2023" likely stale; update year.
