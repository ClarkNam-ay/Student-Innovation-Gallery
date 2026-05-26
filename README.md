# Student Project Showcase
**Instructor Portfolio & Student Achievement Gallery**

## Folder Structure
```
showcase/
├── index.html        ← Main HTML file (single page, all sections)
├── css/
│   └── style.css     ← All styles (design tokens, layout, responsive)
├── js/
│   └── script.js     ← All interactivity (canvas, filters, animations)
└── images/           ← Place student project screenshots here
```

## Customization Guide

### 1. Personalize the Instructor Info
In `index.html`, search for:
- `"Instructor Name"` → Replace with your name
- `"Your University / College"` → Replace with your institution
- `"instructor@university.edu"` → Replace with your email
- `IN` (initials in the portrait) → Replace with your initials

### 2. Add Student Projects
Copy any `<article class="project-card">` block in the Projects section and update:
- `data-tags="php mysql"` → Add applicable tech tags (used for filtering)
- `student__avatar` text → Student initials
- `student__name` → Student's name
- `project__title` → Project title
- `project__desc` → Project description
- `tech__tag` elements → Technologies used
- `href="#"` on buttons → Real deployment URL and GitHub URL

### 3. Update Statistics
In the Stats section, change `data-target="48"` values to your real numbers.

### 4. Update the Featured Project
Edit the Featured section with your best student project details.

### 5. Add Screenshots
Place `screenshot-studentname.png` files in the `images/` folder.
Replace `.project-card__placeholder` divs with:
```html
<img src="images/screenshot-juan.png" alt="Library Management System" />
```

### 6. Colors
Edit CSS variables at the top of `style.css` under `:root` to change the color palette.

## Features
- ✅ Particle canvas hero animation
- ✅ Dark / Light mode toggle (persisted in localStorage)
- ✅ Sticky glassmorphism navbar
- ✅ Scroll reveal animations
- ✅ Animated number counters
- ✅ Project search + filter by technology
- ✅ Subtle 3D card tilt effect
- ✅ Mobile-responsive (hamburger menu)
- ✅ Scroll-to-top button
- ✅ Timeline journey section
- ✅ Loading screen
- ✅ Active nav link highlighting

## Deployment Security Features

- Firebase project ratings with one anonymous vote per browser
- Firestore rules that allow rating creation only by the current anonymous user
- Vercel security headers through `vercel.json`
- `.gitignore` and `.vercelignore` to keep local secrets and deployment state out of Git/Vercel uploads
- Outbound links hardened with `noopener`, `noreferrer`, and no referrer

## Firebase Rating Setup

The rating feature uses Firebase Authentication anonymous sign-in plus Cloud Firestore.
Firebase gives each browser a persistent anonymous user ID, then the site writes one vote document per project:

```
projectRatings/{projectId}/votes/{anonymousUid}
```

### 1. Create Firebase services

1. Go to https://console.firebase.google.com and create a Firebase project.
2. In Project Overview, add a Web app.
3. In Build > Authentication > Sign-in method, enable Anonymous.
4. In Build > Firestore Database, create a database.
5. If you deploy to a custom domain, add it in Authentication > Settings > Authorized domains.
6. Choose Production mode, then replace the rules with the rules below.

### 2. Paste your Firebase web config

Open `js/script.js` and paste your Firebase config into `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  appCheckSiteKey: "",
};
```

This config is public client configuration, not a private service-account secret. Do not add Firebase service-account JSON, private keys, admin SDK keys, or other server-only secrets to this static frontend.

For deployment, also restrict the Firebase browser API key in Google Cloud Console:

- Application restriction: HTTP referrers for your Vercel domain and local development domain.
- API restriction: Firebase/Google APIs used by this app, especially Identity Toolkit and Cloud Firestore.
- Quotas: set reasonable limits for Auth and Firestore usage.

### 3. Optional Firebase App Check

For better protection against automated rating abuse:

1. Create a reCAPTCHA v3 or reCAPTCHA Enterprise key.
2. In Firebase Console > App Check, register the web app.
3. Paste the public site key into `appCheckSiteKey`.
4. Deploy and confirm ratings still work.
5. Enable App Check enforcement for Firestore only after testing the deployed site.

### 4. Firestore Security Rules

Use these rules in Firestore Database > Rules:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /projectRatings/{projectId}/votes/{voteId} {
      allow read: if true;

      allow create: if request.auth != null
        && voteId == request.auth.uid
        && !exists(/databases/$(database)/documents/projectRatings/$(projectId)/votes/$(voteId))
        && request.resource.data.keys().hasOnly(["projectId", "rating"])
        && request.resource.data.projectId == projectId
        && (
          request.resource.data.rating == 1
          || request.resource.data.rating == 2
          || request.resource.data.rating == 3
          || request.resource.data.rating == 4
          || request.resource.data.rating == 5
        );

      allow update, delete: if false;
    }
  }
}
```

### 5. Test locally

Because the page loads project files and Firebase scripts, run the site through a local server:

```powershell
python -m http.server 5500
```

Then open:

```
http://localhost:5500
```

If you use VS Code Live Server, that works too.

## Vercel Deployment Checklist

1. Push only the site files needed for deployment. `.gitignore` and `.vercelignore` are included to keep `.env`, `.vercel`, logs, and local dependencies out.
2. In Vercel, import this folder as a static project. No build command is required.
3. Keep `index.html` as the output entry file.
4. Confirm Vercel uses the included `vercel.json`; it adds CSP, frame protection, referrer policy, content-type protection, and permissions policy.
5. In Firebase Console, add your Vercel domain under Authentication > Settings > Authorized domains.
6. Publish the Firestore rules above before sharing the site.
7. For stronger anti-abuse protection, configure `appCheckSiteKey`, test the deployed site, then enable Firebase App Check enforcement for Firestore.
8. After deploy, test project loading, project images, one-browser rating, duplicate rating blocking, and featured project updates.

## Opening the Site
Run the local server command above or deploy the folder to hosting. For best results with Google Fonts and Firebase, open with an internet connection.
