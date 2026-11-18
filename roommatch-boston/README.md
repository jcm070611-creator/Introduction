# RoomMatch Boston

The latest RoomMatch Boston interactive website is in this folder.

## Website
After GitHub Pages deployment succeeds: https://jcm070611-creator.github.io/Introduction/

## Structure
- `index.html`: entry page
- `assets/css/`: styling and signup/login layout
- `assets/js/`: profiles, matching, preferences, onboarding and chat logic
- `assets/images/`: example profile photos

## Features
Includes a pastel login screen, school selection and signup flow, 72 roommate profiles, neighborhood and university filtering, swipe matching, private matched-profile details, and a chat-style interface with simulated replies.

## Important limitations
This is a front-end prototype. Real identity document verification, external account authentication, online user status and live multi-user messaging are **not** implemented. Browser-stored demo accounts are not secure real accounts. Do not enter real passwords or upload real ID documents. Data is stored locally on the visitor's own device.

## Deploy
The workflow in `.github/workflows/roommatch-pages.yml` publishes this folder to GitHub Pages upon pushes to `main`. If the GitHub Pages site is not enabled, the repository owner may need to select **Settings → Pages → Build and deployment → Source: GitHub Actions** and then rerun the workflow.
