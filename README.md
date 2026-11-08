<div align="center">
  <img src="public/favicon.svg" alt="Fuudr Logo" width="80" />
  <h1>Fuudr Web Application</h1>
  <p>Discover meals through short-form videos. Swipe, watch, order.</p>
</div>

<br/>

## Overview
Fuudr is a modern, mobile-first web application designed to bridge the gap between food discovery and ordering. It features a responsive layout with a robust waitlist capture system and client-side routing.

## Features
- **Mobile-First Feed UI:** An interactive, vertical-scrolling video feed interface tailored for food discovery.
- **Modern Aesthetic:** Built with a custom dark theme, utilizing glassmorphism and deep orange accents.
- **Responsive Layout:** Enforces a locked, desktop-optimized view on larger screens while retaining native scroll behaviors on mobile devices.
- **Client-Side Routing:** Implements hash-based routing to seamlessly navigate to Terms of Service and Privacy Policy pages without full page reloads.

## Tech Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** CSS Modules & Variables
- **Icons:** Lucide React
- **Hosting:** Vercel

## Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NEGO2522/reelish-web.git
   cd reelish-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Deployment Configuration
This project is configured for Vercel deployment. The included `vercel.json` file ensures that all client-side routes fallback to `index.html`, preventing routing errors in production. 

- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### Mux partner uploads

1. Apply the `202611070001_add_mux_reel_uploads.sql` migration to the Supabase project shared with Fuudr App.
2. Set `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` for a Mux Video read/write token, and `SUPABASE_SERVICE_ROLE_KEY` for the shared Supabase project in Vercel. Set `MUX_UPLOAD_ORIGINS` to a comma-separated list of Directory origins if using a preview or local deployment.
3. In the same Mux environment as the token, register `https://fuudr.com/api/mux-webhook` as a webhook endpoint and set its signing secret as `MUX_WEBHOOK_SECRET` in Vercel. The upload flow handles `video.asset.ready` and `video.asset.errored`.
4. Deploy Directory, then upload a reel through the partner menu and confirm it plays in Fuudr App. Directory saves the reel when Mux has prepared its public HLS stream. If a webhook is delayed or unavailable, Directory checks Mux directly during the upload.

Keep the Bunny Stream credentials in Vercel to support deletion of existing Bunny reels.
