# 🌍 Travel Planner – Master Roadmap

## 🎯 Vision

Build a premium travel planning platform that feels comparable to products like Notion, Linear and Apple apps, while remaining simple and enjoyable to use.

---

# ✅ Phase 1 – Core Web App

## Authentication

* [x] Login
* [x] Register
* [x] Password reset
* [x] User profiles

## Trips

* [x] Create Trip
* [x] Edit Trip
* [x] Delete Trip
* [x] Destination autocomplete
* [x] Automatic country detection
* [x] Automatic destination image

## Places

* [x] Google Places Autocomplete
* [x] Google Maps integration
* [x] Categories
* [ ] Drag & Drop ordering
* [ ] Better place cards

## Itinerary

* [x] Multiple days
* [x] Activities
* [x] Google Maps integration
* [x] Activity types
* [ ] Drag & Drop activities
* [ ] Timeline improvements
* [ ] Activity photos
* [ ] Travel time between activities

## Checklist

* [x] Categories
* [x] Progress
* [ ] Drag & Drop
* [ ] Better animations

## Budget

* [x] Budget tracking
* [ ] Charts
* [ ] Spending insights

## Journal

* [x] Basic journal
* [ ] Images
* [ ] Timeline memories

---

# 🗺 World Map

## Current

* [x] Countries visited
* [x] Planned countries
* [x] Flight routes
* [x] Animated airplane

## Future Polish

* [ ] Smoother drag
* [ ] Better zoom
* [ ] Adaptive markers
* [ ] Marker clustering
* [ ] Better labels
* [ ] More vibrant colors
* [ ] Better glow
* [ ] Better country highlighting
* [ ] State/Province support (USA, Canada, Australia...)
* [ ] Cleaner UI when zoomed

---

# 🎨 UX/UI Polish

## Dashboard

* [ ] Better visual hierarchy
* [ ] Better statistics cards
* [ ] Better spacing
* [ ] More premium animations

## Trip Details

* [x] Hero image
* [x] Unified Hero + Tabs
* [ ] Hero parallax
* [ ] Trip Readiness widget
* [ ] Weather widget
* [ ] Better progress cards

## General

* [ ] Consistent spacing
* [ ] Consistent shadows
* [ ] Consistent border radius
* [ ] Better empty states
* [ ] Skeleton loaders
* [ ] Better hover effects
* [ ] Premium transitions

---

# ⚙ Settings

## Account

* [ ] Avatar
* [ ] Username
* [ ] Email
* [ ] Password
* [ ] Country
* [ ] Timezone

## Subscription

* [ ] Free / Pro page
* [ ] Billing placeholders

## Notifications

* [ ] Reminder settings
* [ ] Email notifications
* [ ] Push notifications

## Appearance

* [ ] Theme
* [ ] Accent colors
* [ ] Compact mode

## Language

* [ ] English
* [ ] Lithuanian
* [ ] Polish
* [ ] Russian

## Privacy

* [ ] Private account
* [ ] Export data
* [ ] Delete account

## Mobile Polish

* [ ] Native mobile settings layout
* [ ] Remove desktop sidebar
* [ ] Separate settings pages
* [ ] Better touch targets

---

# 🤖 AI Features (Future)

* [ ] AI itinerary suggestions
* [ ] AI trip optimization
* [ ] Nearby recommendations
* [ ] AI travel assistant
* [ ] AI packing suggestions
* [ ] AI budget recommendations

---

# 🌤 External Integrations

* [ ] Google Calendar
* [ ] Apple Calendar
* [ ] Outlook Calendar
* [ ] Weather API
* [ ] Currency exchange API

---

# 💳 Premium Features

* [ ] Stripe Billing
* [ ] Subscription management
* [ ] Premium badge
* [ ] Usage limits

---

# 📱 Mobile App

Build ONLY after the Web App is complete.

Stack:

* Expo
* React Native
* Supabase
* Shared backend
* Shared business logic

---

# 🚀 Development Workflow

For every feature:

1. Build functionality.
2. Fix bugs.
3. Run `npm run build`.
4. Test desktop.
5. Test mobile.
6. Polish UI.
7. Merge to main.

Never leave half-finished features.

---

# 📂 Git Workflow

Always use feature branches.

Examples:

feature/settings

feature/itinerary

feature/world-map

feature/mobile-ui

feature/multilanguage

Merge into `main` only after testing.

---

# 📌 Rules

* Finish the web application before starting the mobile app.
* Preserve working functionality whenever possible.
* Prefer polishing existing features over constantly adding new ones.
* Every new screen must be responsive.
* Every new feature must feel like part of one consistent premium product.
* Before starting any new major feature, finish the current one completely.
