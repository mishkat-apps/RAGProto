# Design Document: Authentication and Landing Page (Approach 1)

**Date**: 2026-02-15
**Status**: Approved
**Topic**: Authentication System (Supabase) and Landing Page Enhancements

## 1. Overview
This project implements a secure, Tanzanian-themed authentication system using Supabase and enhances the existing landing page with professional sections (About Us, Contact Us) and active navigation.

## 2. Architecture
- **Framework**: Next.js (App Router)
- **Authentication**: Supabase Auth (SSR) with Identity Providers (Email, Google).
- **UI System**: TailwindCSS with custom design tokens in `globals.css` (Tanzanian flag colors, glassmorphism).
- **Routing**:
    - `/` : Enhanced Landing Page.
    - `/auth/signin` : Sign In page.
    - `/auth/signup` : Sign Up page.
    - `/api/auth/callback` : Server-side handler for OAuth redirects.

## 3. Components
### 3.1. Reusable Layout Components
- **Header**: Extracted from landing page, supports active link states and auth state (Sign In/Logout).
- **Footer**: Extracted from landing page, includes social icons, newsletter, and functional links.

### 3.2. Authentication Components
- **AuthCard**: A reusable glassmorphism container for auth forms.
- **SocialAuthButton**: Specialized button for Google OAuth.

## 4. Data Flow
1. User clicks "Sign In with Google".
2. Client calls `supabase.auth.signInWithOAuth`.
3. Redirects to Google -> Supabase -> `/api/auth/callback`.
4. Callback route exchanges code for session and redirects to original destination (e.g., `/chat`).

## 5. Landing Page Sections
- **Hero**: Existing, refined for better CTA.
- **Features**: Existing, refined.
- **About Us**: New section highlighting NECTA RAG mission.
- **Contact Us**: New section with form and contact metadata.

## 6. Security
- Use Supabase middleware to protect `/admin` and `/chat` routes.
- Sanitize all user inputs in the Contact Form.
- Ensure service role keys are never exposed to the client.

## 7. Verification
- Manual testing of all auth provider paths.
- Accessibility audit for contrast and keyboard navigation.
- Responsive testing for mobile and tablet views.
