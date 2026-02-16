# Guest Feature Design: Anonymous Auth & Question Limits

## Overview
Implement a guest access feature that allows users to explore the NECTA RAG chatbot for up to 10 questions without a permanent account. This uses Supabase Anonymous Authentication and server-side tracking to enforce limits while providing a premium, low-friction entry point from the landing page.

## Core Pillars

### 1. Infrastructure & Identity
- **Supabase Anonymous Auth**: Enable anonymous sign-ins in Supabase dashboard.
- **Database Tracking**: 
    - Add `user_id` (UUID) to `queries_log` table.
    - Enable RLS or use Service Role for tracking question counts per user.
- **Session Transition**: Seamlessly transition anonymous sessions to permanent accounts (Google/Email) during sign-up to preserve chat history.

### 2. Backend Logic (API Protection)
- **Auth Enforcement**: `api/ask` route will require a valid Supabase session (anonymous or authenticated).
- **Quota Check**:
    - Query `queries_log` for the current `user_id` count.
    - If user is anonymous and count >= 10, return `403 Forbidden` with error code `LIMIT_REACHED`.
- **In-Memory/DB Logging**: Increment count only on successful AI generation.

### 3. Frontend Experience
- **Landing Page (Instant Ask)**:
    - User types question -> Clicks "Ask" -> Silent Anonymous Sign-in -> Redirect to `/chat?q=...`.
- **Chat Page (Auto-trigger)**:
    - Detect `q` parameter on mount.
    - Execute question immediately.
- **Usage Feedback**:
    - Sidebar usage badge (e.g., "Guest: 4/10 questions used").
    - Post-10th-question Modal: Prompt to sign up with Google/Email to save progress and keep chatting.
    - Disable input field once limit is reached.

## Implementation Phases
1. **Phase 1 (DB & Auth)**: Database migrations and Supabase config.
2. **Phase 2 (API)**: Protect `api/ask` and add limit logic.
3. **Phase 3 (Frontend)**: Landing page "Instant Ask" and Chat UI usage tracking.
