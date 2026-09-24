# Trade Fair Wala — Mobile App

Expo / React Native app with **BookMyShow-style** UI and **full web feature parity** — same backend API as `Trade-fair-frontend`.

## Setup

```bash
cd trade-fair-mobile
npm install
cp .env.example .env
# EXPO_PUBLIC_API_BASE_URL=https://your-api.com/api/v1
# EXPO_PUBLIC_WEB_BASE_URL=https://your-web.com  (marketing/legal WebView pages)
npx expo start
```

## Feature parity

Mobile implements the same capabilities as web (`WEB_FEATURES_BY_ROLE.md`):

| Area | Mobile |
|------|--------|
| **Public** | Home, trade fairs (all filters), industries, event detail, reviews, marketplace, 20+ marketing/legal pages (`/pages/*`), contact form |
| **Auth** | Email login, phone OTP, forgot/reset password, 3-step registration, profile photo, phone verify |
| **Visitor** | Tickets + Razorpay, QR passes, share, receipts, marketplace enquiries/chat, service bookings pay/review/refund, support |
| **Exhibitor** | Event detail + floor map, favorites, stall book/hold/checkout, bookings, payments, profile, contracts via chat |
| **Organizer** | Create/edit event, stall floor, ticket types, bookings approve/reject/reassign, scan, volunteers, reminders, media, announcements, comms, KYC, payouts, subscription |
| **Service provider** | Profile, KYC, services CRUD + images, enquiries + contracts, bookings, payments, reviews, subscription |
| **Volunteer** | Assigned events, profile, per-event gate scan |
| **Admin** | Overview, users, RBAC, sub-admins, KYC, monetization, transactions, refunds, disputes, support, contact queries, moderation, featured, banners, notifications, analytics, reports, settings |

## Design

- Dark hero headers, red CTA (`#e23744`), poster event cards
- Admin banners on app home (`GET /home-banners`)
- Razorpay checkout via WebView modal

## Dependencies

After pulling: `npm install`

Key packages: `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-sharing`, `react-native-webview`, `react-native-qrcode-svg`

## OTP (dev/stub)

Phone OTP login and account verification use stub code **`123456`** when backend SMS is not configured (same as web).
