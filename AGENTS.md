# Yoouz Project Policies

## Database & Infrastructure Policy

- **Strict No-Firebase Policy**: Mentioning, implementing, or suggesting Firebase, Firestore, or any Google Cloud database service is **strictly forbidden**. The project has migrated entirely to **bunny.net** and a custom **Cloud SQL (PostgreSQL)** backend.
- **Data Persistence**: Always use the custom `/api/nosql/*` endpoints or the `bunnydb_` table aliases in `src/db/schema.ts` for data persistence. Never attempt to import or use Firebase SDKs.
- **Communication**: When discussing data storage, always refer to **bunny.net** or the local database. Treat the existence of Firebase as a legacy error that has been fully purged.

## Recording Screen Guidelines (Step 2)

- **Mandatory Camera**: The recording screen MUST auto-start the front camera. Users should not have an option to "turn off" or "close" the camera preview without closing the entire review modal.
- **Strict Front-Only Camera**: Camera flipping (Switch Camera) is strictly forbidden. The application must only use the front (selfie) camera for authentic reviews.
- **No Uploads**: Uploading videos from the gallery is strictly forbidden. Reviews must be recorded live within the application.
- **Simplified Controls**: The recording interface must be minimal. Only the red shutter (Record) and a close (X) button are permitted during active capture. After recording, a "Re-record" option is provided in the preview stage to allow users to retry if they are unsatisfied with the result.
- **60-Second Limit**: All video reviews are strictly limited to 60 seconds (1 minute).
- **Premium Overlay**: The top information pill (Place Name + Rating) must use a high-end, translucent backdrop (backdrop-blur-xl) with clear, high-contrast typography.

## UI/UX

- **Dark Mode First**: The mobile PWA experience should default to a high-quality dark theme for all recording and search overlays.

## Privacy & Email Policy
- **Strict Private Email Protection**: Never expose, display, or hardcode private user emails (specifically `4samet@gmail.com` or any personal email) anywhere on public/open profiles, drawers, badges, or client-facing views. Claimed business profiles must NEVER display owner personal emails to the public. All public profiles and claim badges must remain private and anonymous (e.g. "Business Claimed" without exposing personal email addresses).

## Communication & Git Exports
- **Mandatory Commit Message**: At the end of every response where changes were made to the codebase, the AI MUST append a clear, concise Git commit message summarizing the changes. Format it exactly as:
**Commit Message:**
`feat/fix/chore: Short description of the changes`
This ensures that the user can seamlessly copy/paste or the system can automatically include it when pushing to GitHub.
