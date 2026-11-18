# RoomMatch Boston — Student Website (V10 · Supabase Connected)

**RoomMatch** is a roommate-matching prototype for college students in Boston. Students can create an account and compare potential roommates based on living habits, budget, school, and preferred neighborhood. Developed for a university innovation project and December 1, 2026 demo day.

## Open the live website

**[Launch RoomMatch Boston](https://lighthearted-fenglisu-d6de66.netlify.app/)**

## Features

- Four-step registration, profile setup, and login using Supabase Auth
- Authenticated member profiles stored in Supabase and visible to authorized RoomMatch administrators
- Duplicate email registration guarded by Supabase Auth; phone-number uniqueness enforced in the database
- 72 **fictional demonstration** roommate profiles, preference filters, compatibility scoring, swipe discovery, saved candidates, and demo messaging
- Korean/English interface and a responsive blue/pastel design

## Technical overview

`index.html` + `assets/` make up the student-facing static app. Supabase Authentication provides accounts and `public.member_profiles` records; the separate administrative dashboard is hosted at its own restricted login site. `SUPABASE_SETUP.sql` contains the database trigger and validation setup; apply it only after reviewing the SQL and its effects.

## Important limitations

- The 72 roommate suggestions, matching and conversations are **demonstrations**, not live student-to-student messaging.
- ID/selfie selections are local visual previews only: **no identity verification** and no server storage. Do **not** upload real identity documents for class demos.
- Registration emails may be rate-limited by the Supabase default mail service.
- Protected access depends on Supabase Row Level Security and admin role checks. Never commit the database password, secret/service-role keys, or personal member records.
- The original GitHub `Introduction` project has now been updated with the student-site source. The currently deployed Netlify application remains a separate deployment and is not changed merely by updating this repository.

## Project team

RoomMatch Boston — student innovation team.

## Development and deployment

Open with a local HTTP server for reliable module/auth behavior, or deploy this directory to a static host such as Netlify. For production, confirm allowed redirect URLs, database policies, duplicate-number handling, and security review before inviting real users.
