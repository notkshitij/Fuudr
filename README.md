<div align="center">
  <img src="public/favicon.svg" alt="Reelish Logo" width="80" />
  <h1>Reelish Web Application</h1>
  <p>Discover meals through short-form videos. Swipe, watch, order.</p>
</div>

<br/>

## Overview
Reelish is a modern, mobile-first web application designed to bridge the gap between food discovery and ordering. It features a responsive layout with a robust waitlist capture system and client-side routing.

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
