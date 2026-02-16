# Authentication and Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a secure authentication system using Supabase and enhance the landing page with professional "About Us" and "Contact Us" sections.

**Architecture:** Approach 1 - Integrated single-page landing with smooth-scroll navigation and dedicated standalone authentication pages (`/auth/signin`, `/auth/signup`). Uses `@supabase/ssr` for session management.

**Tech Stack:** Next.js (App Router), TailwindCSS, Supabase Auth, Lucide React (Icons).

---

### Task 1: Refactor Landing Page Layout

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Extract Header into Component**
Copy the `<header>` block from `src/app/page.tsx` into `src/components/Header.tsx`. Add props for navigation.

**Step 2: Extract Footer into Component**
Copy the `<footer>` block from `src/app/page.tsx` into `src/components/Footer.tsx`.

**Step 3: Update `src/app/page.tsx`**
Import and use the new `<Header />` and `<Footer />` components.

**Step 4: Commit**
```bash
git add src/components/Header.tsx src/components/Footer.tsx src/app/page.tsx
git commit -m "refactor: extract header and footer components"
```

---

### Task 2: Implement "About Us" and "Contact Us" Sections

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add "About Us" Content**
Create a new `<section id="about">` with Tanzanian-themed storytelling. Use a two-column responsive grid.

**Step 2: Add "Contact Us" Content**
Create a new `<section id="contact">` with a contact form and info cards.

**Step 3: Update Navigation Links**
Update links in `Header.tsx` and `Footer.tsx` to use `#about` and `#contact` hashes.

**Step 4: Commit**
```bash
git add src/app/page.tsx src/components/Header.tsx src/components/Footer.tsx
git commit -m "feat: add about and contact sections to landing page"
```

---

### Task 3: Setup Authentication Callback

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

**Step 1: Write Callback Route**
Implement code to exchange the Auth Code for a Session.

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth-callback-failed`)
}
```

**Step 2: Commit**
```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat: add supabase auth callback route"
```

---

### Task 4: Create Authentication Pages

**Files:**
- Create: `src/app/auth/signin/page.tsx`
- Create: `src/app/auth/signup/page.tsx`

**Step 1: Implement Sign In Page**
Use a "glassmorphism" container with the `gradient-tz` background. Add Email/Password and "Login with Google" buttons.

**Step 2: Implement Sign Up Page**
Similar consistent design with sign-up specific labels.

**Step 3: Commit**
```bash
git add src/app/auth/signin/page.tsx src/app/auth/signup/page.tsx
git commit -m "feat: add themed signin and signup pages"
```

---

### Git Workspace Explanation

Since you mentioned being confused about branches, here is how our workspace is structured:

1.  **The Root Project (`RagProto/`)**: This is on the `master` branch. Vercel watches this branch for changes.
2.  **The Worktree (`.worktrees/auth-feat/`)**: This is a separate folder where I built the new features on a branch called `feature/auth-landing`. This keeps the "real" project safe while I work.

### The Plan to Deploy:
- **Step 1: Commit**: I will "save" all my work in the worktree folder.
- **Step 2: Merge**: I will tell Git to take everything from the `feature/auth-landing` branch and copy it into the `master` branch.
- **Step 3: Push**: I will upload the `master` branch to your server. Vercel will see this and start building.

---

## Phase 4: Deployment

### [Deployment]
#### [Tasks]
1.  **Commit changes** in the worktree.
2.  **Merge feature branch** into `master`.
3.  **Push to main/master** to trigger Vercel.

#### [Verification]
- Verify Vercel build starts and completes successfully.
- Verify Google Login (requires Dashboard config).
- Verify Footer social media icons and newsletter input.

**Step 2: Walkthrough**
Create `walkthrough.md` with screenshots of the new landing sections and auth pages.
