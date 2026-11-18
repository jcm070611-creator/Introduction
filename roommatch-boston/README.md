# RoomMatch Boston — Latest Prototype (V8)

RoomMatch Boston is an interactive student roommate-matching prototype. This folder contains **the newest version**.

## View the website

- Visit the deployed website if GitHub Pages has been enabled, or download this folder and open `index.html` in a browser.
- No build tools or installations are required.
- To enable GitHub Pages, go to repository **Settings → Pages**, then deploy the `main` branch from `/(root)`. The resulting site path is `/Introduction/roommatch-boston/`.

## Features

- Soft pastel pink / blue landing page and sign-in/sign-up experience
- Email or mobile sign-in and separate sign-up form
- Four-step onboarding: university, contact details, identity-upload UI, preferences, photo and bio
- Form validation with inline feedback, `Other` values for university and neighborhoods
- 72 sample roommate profiles with progressive loading
- Swipe matchmaking, compatibility scores, area/school filters, saved profiles
- Mutual-match gates for private profile details
- Browser-only chat simulation: responses, typing states, receipts and presence indicators
- Korean / English interface, editable personal profile, first-time guidance

## Source structure

```
roommatch-boston/
  index.html
  README.md
  assets/
    css/
      styles.css
      onboarding.css
      auth-feed.css
      auth-improvements.css
    js/
      profiles.js
      app.js
      experience.js
      onboarding.js
      feed.js
      auth.js
    images/
      roommate-01.jpg ... roommate-28.jpg
```

## Prototype safety and limitations

The 72 profiles and 28 avatar images are **illustrative AI-generated examples**. Account and identity verification, social sign-in, server-side AI, real-time status, receipts and message delivery are not live services; these are browser-only interactions. Do **not** provide real IDs, passwords or sensitive data. Some settings and sign-in demonstrations use local browser state, which is not shared with other users or devices. Opening or refreshing the website starts from the sign-in screen.
