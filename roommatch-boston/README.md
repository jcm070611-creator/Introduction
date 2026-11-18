# RoomMatch Boston

Bilingual roommate matching prototype for Boston university students.

## Run

From the repository root, run `python3 -m http.server 8000`, then open `http://localhost:8000/roommatch-boston/`. The project uses HTML, CSS, and JavaScript with no build step.

## Structure

```
roommatch-boston/
├── index.html                  # Landing page, signup, dashboard
├── README.md                   # Team documentation
└── assets/
    ├── css/
    │   ├── styles.css         # App UI, profile cards, swipe and chat
    │   └── onboarding.css     # Landing, registration and matching UI
    ├── js/
    │   ├── profiles.js        # 12 roommate profiles and image paths
    │   ├── app.js             # Score calculations, filters, swipe, language
    │   ├── experience.js      # Mutual matches, privacy gates, chat replies
    │   └── onboarding.js      # Required 4-step registration
    └── images/
        └── roommate-01.jpg ... roommate-12.jpg
```

## What to test

1. Enter through the marketing landing page and complete all registration steps: university/name/email/phone, ID and selfie selection, budget/lifestyle, and profile bio/photo.
2. Explore 12 profiles, browse by neighborhood and school, or swipe. Like a candidate to request a match.
3. A subset reciprocates. Detailed rent, commuting, lifestyle rows and activity indicators unlock only after reciprocal interest.
4. Send an introductory message, see typing and read receipts, and receive context-sensitive automatic replies. Try Korean / English.
5. Update your profile, preferences and saved candidates.

## Editing guide

- Profiles: `assets/js/profiles.js`
- Portraits: `assets/images/`
- Base scoring and UI: `assets/js/app.js`
- Match gates and messages: `assets/js/experience.js`
- Signup and language: `assets/js/onboarding.js`
- Styles: `assets/css/`

Use Git branches and pull requests. Do not duplicate old project files; rely on Git commit history.

## Important — prototype limits

This is not a production site. The 12 profiles and AI-generated portraits are fictional examples. **No actual identity verification or facial comparison occurs.** ID and selfie images are displayed locally only, are not uploaded, and are not retained. Do not upload real identity documents for testing. Email and phone are entered in the UI but are not verified or sent. Profile preferences and messages are browser-local.

**No real AI service or live person is connected.** Mutual matches, online state, read receipts, typing and contextual automatic replies are locally simulated. Detailed profile restrictions are UI-only, not secure server authorization. A real launch would require secure authentication, a privacy-reviewed identity verification provider, database, real-time messages, access control, moderation, consent and secure retention policies.
