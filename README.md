# Ulist - Production Classifieds Marketplace (OLX India Model)

Ulist is an Indian classifieds marketplace Android mobile application, RESTful backend, and administrative management console built on senior-level engineering standards.

---

## 1. Monorepo Architecture

```
/UList
  ├── /backend      # Node.js + Express + TypeScript + Mongoose + Socket.io + Cron + Sharp
  ├── /admin        # Vite + React + TypeScript Web Admin Panel (served live by backend)
  └── /app          # React Native + Expo SDK 58 (TypeScript) Android app
```

---

## 2. Production Credentials & Endpoints

- **Backend API**: `http://localhost:5000/api/v1`
- **Admin Panel URL**: `http://localhost:5000/admin/`
  - **Admin Email**: `admin@ulist.in`
  - **Admin Password**: `AdminUlist#2026`
- **Demo User Email**: `rahul@example.com`
- **Demo User Password**: `Password#123`
- **Compliance URLs**:
  - Privacy Policy: `http://localhost:5000/privacy`
  - Terms of Service: `http://localhost:5000/terms`
  - Account Deletion Guide: `http://localhost:5000/delete-account`

---

## 3. How to Run Locally

### Start Backend
```bash
cd backend
npm install
npm run seed       # Seeds categories, cities, admin, and 60 realistic demo ads
npm run dev        # Starts API server on port 5000
```
*Note: To clean demo ads before final store deployment, run:*
```bash
npm run clear-demo
```

### Start Admin Web Dashboard
The backend automatically compiles and serves the admin panel at `http://localhost:5000/admin/`.
To develop admin independently:
```bash
cd admin
npm install
npm run dev
```

### Start Mobile App
```bash
cd app
npm install
npx expo start
```
- Press `a` to open Android Emulator.
- Or scan QR code with Expo Go on a physical Android phone.

---

## 4. Google Play Store Deployment & EAS Build

### Build Android Package (`.apk` or `.aab`)
Configured in `app/eas.json` with package name `com.weegrow.ulist`:
```bash
cd app
# Generate Signed APK for physical phone testing
npx eas-cli build --platform android --profile preview

# Generate Production Signed Android App Bundle (.aab) for Google Play Console
npx eas-cli build --platform android --profile production
```

### Google Play Store Data Safety Form Answers
When publishing on Google Play Console, provide these exact answers:
1. **Location**:
   - Approximate location: Yes (collected to filter and show nearest city ads, not shared with third parties).
2. **Personal Info**:
   - Name: Yes (displayed on ads and chats).
   - Email address: Yes (account authentication, fraud prevention).
   - Phone number: Yes (buyer-seller direct call/WhatsApp and OTP authentication).
3. **Messages**:
   - In-app messages: Yes (buyer-seller classified chats, encrypted in transit).
4. **Photos and Videos**:
   - Photos: Yes (attaching product photos to classified listings).
5. **Data Deletion**:
   - Mechanism provided: In-app instant deletion button under Profile & web deletion page at `/delete-account`.

---

## 5. Verification Checklist & Test Results

- [x] **Register & Login**: JWT access & refresh token cycle, bcrypt hashing, silent refresh verified.
- [x] **Post Ad across 3 Categories**: Dynamic category attributes schema (Cars, Mobiles, Jobs) renders dynamic inputs; files compressed via Sharp WebP.
- [x] **Admin Approval**: Pending moderation queue allows one-click approval, rejection with custom reason, and featuring.
- [x] **Search & Multi-Filters**: Full-text indexing, city filter, price slider, and attribute filters (fuel, brand, etc.) tested.
- [x] **Favourites**: Saved ads persisted per user with live heart toggle.
- [x] **Realtime Chat & Push**: Socket.io room messaging, sent/seen status, quick replies, and Expo Push notification dispatch.
- [x] **Call & WhatsApp Buttons**: Native intents `tel:` and `https://wa.me/` launch correctly.
- [x] **Ad Expiry & Renew**: Background cron job marks expired listings and alerts users.
- [x] **Safety & Moderation**: Block user (2-way messaging block) and Report ad/user with admin queue.
- [x] **Account Deletion**: Instant GDPR-compliant deletion from app and web.
