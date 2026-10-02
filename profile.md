<!--
  Everything the chat panel knows about me. server.mjs sends this whole file to the
  model with every question, and the model is told to answer only from it: if a fact
  is not written here, the chat says it doesn't know and points to my email.

  - Anything in this file can end up in a reply, so treat it all as public.
  - Comments like this one are stripped before the file is sent.
  - Changes take effect on the next deploy (or restart, locally).

  Worth adding, because recruiters ask: the kind of roles I want (full-time,
  internship, contract), start date, remote / on-site / relocation, work
  authorization in Canada, and anything else I'd happily say in an interview.
-->

# Rodarly Perilus

## At a glance
- Full name: Rodarly Clavensky Perilus
- Role: full-stack developer and computer science student
- Age: 19
- Based in: Moncton, New Brunswick, Canada
- Languages spoken: French, English and Haitian Creole
- Email: perilusrodarly@gmail.com (the best way to reach him)
- Website: www.rodarly.me
- GitHub: https://github.com/Mudelkun (handle: Mudelkun)
- Instagram: https://www.instagram.com/rod_arly/
- Résumé: downloadable from the site
- Availability: open to full-time roles

## About
Rodarly is a 19-year-old computer science student and software developer. He taught himself to code after graduating from high school in 2025 and quickly developed a passion for software engineering. Since then he has deployed real-world full-stack applications, including a complete school management platform that his family's private school relies on for its daily operations. He describes himself as a fast learner and a self-taught developer who is always looking for ways to grow, not just as a coder but as an engineer who solves real problems while having a little fun along the way.

## Education
- BTS SIO (Software Solutions and Business Applications), CNED, 2026 – 2028
- High school diploma, 2025

## Experience

### Technology Lead, École Fierbout (fierbout.com) — Sept 2025 to present, remote
École Fierbout is his family's private school in Haiti.
- Owns all technology at the school: the Formel platform the staff use daily, the school website, and the deployments behind both.
- First-line technical support: the person staff call when something breaks, from diagnosing the issue through to resolution.
- Manages the school's security camera system and equipment, and decides what hardware the school buys and keeps in supply.
- Recorded more than 2 hours of training videos that staff learn the system from, so non-technical users can work independently.

## Skills
- Languages: JavaScript, HTML, CSS, SQL, Bash
- Frameworks: Node.js, Express
- Tools: Git and GitHub, Railway, Claude Code
- He builds his projects with Claude Code. The other technologies named in each project's tech stack below are what that project is built with, not skills he lists for himself; if asked about one of them, say the project uses it rather than claiming expertise in it.
- Practices: REST API design, deployment and production monitoring, data migration, user training and support

## Projects

### Formel — school management platform
- Page on the site: rodarly.me/formel
- Status: in production. The codebase is private, so there is no public link or repository.
- Timeline: February – April 2026; officially implemented in April 2026.
- Role: sole developer. He built it alongside his father: Rodarly did all of the software development, and his father provided the real-world context and helped define the features the school needed.

What it is: a complete school management platform for his family's private school in Haiti. He built it so the school could be managed and operated remotely from Canada. It replaced the school's paper and Excel workflows with one centralized system, and it serves more than 400 users every day: students, parents, teachers and administration. For the 2026–2027 school year, a major update added dedicated portals for students, teachers and parents. The parent portal also exists as a mobile app published to the App Store, Formel Parents (see below).

Highlights:
- Turned administrative work that used to take the school weeks (records, tuition billing, grades, report cards) into hours.
- Designed the data model and four role-based portals (administration, teachers, students, parents), each scoped to its own role.
- Built it as a secure system: authenticated accounts, per-user permissions, rate limiting, and an audit log of every action taken.
- Migrated years of existing records off spreadsheets in the middle of the school year without interrupting the school's day-to-day operations.
- Recorded more than two hours of training videos covering the platform.

Features:
- Administration: student profiles; classes with their financial details; registering payments (a payment settles the oldest due installment first); re-enrollment for a new school year; school calendar; individual and bulk email; users with custom permissions and restrictions; an audit log of all actions.
- Finance and HR: employee profiles; a kiosk at the school entrance where staff clock in and out; work schedules used to flag late arrivals; payroll processing; revenue and expense tracking; budgets per spending category with warnings.
- Academic: classes configured with subjects, weights and grading policies; assigning teachers to class subjects; daily attendance; a teacher portal for homework and grades; a student portal to submit assignments and view published grades; real-time messaging between students and teachers; trimester report cards; academic statistics.
- Parent portal: parents link their children using a permanent school identifier; request changes to student information; follow attendance and published grades; submit absence excuses; download documents from the school; view the school calendar; see what the family owes, installment by installment.

Tech stack:
- Front-end: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- Back-end: Node.js, Express, PostgreSQL, Drizzle ORM
- Auth and services: Clerk, Cloudflare R2, Resend, Sentry
- Hosting: Railway

What he learned: Formel was one of the first projects he deployed to production, and it taught him a lot about building and maintaining real software. He had just finished learning SQL, so designing the database was one of his first experiences making architectural decisions that affect the rest of an application, which taught him to plan before writing code. Because many people use Formel every day, he learned to design interfaces that are clear, efficient and easy to understand, and to keep adapting them so common tasks are smoother. Recording the training videos showed him the business side of software: building a feature is only part of the job; software also has to be understandable, usable and supported.

### Formel Parents — mobile app for parents (published to the App Store)
- App Store: https://apps.apple.com/ci/app/formel-parents/id6816535369 (free; the seller listed is Rodarly Clavensky Perilus)
- Page on the site: rodarly.me/formel-parents
- Status: published to the App Store in September 2026. It runs on iOS 17 or later. The codebase is private.
- App Review: Apple approved the first build he submitted, in under 48 hours, with no rejection and no resubmission. He recorded a demo video walking Apple's review team through the app and describing how it works; the clip on the project page is cut from that video.
- Timeline: September 2026
- Role: solo build

What it is: the mobile version of Formel's parent portal, a native mobile app built with React Native and Expo. Parents follow their children's school life from their phone: grades and report cards, attendance, fees and payments, homework, the school's documents and announcements, with push notifications as soon as the school publishes something new. It is a client of the same back-end and database as Formel's web parent portal, so parents see exactly what the school has recorded, and no child's record is stored in the app itself. The app is in French by default, with English available.

Features:
- Grades as soon as a teacher publishes them, also grouped by subject with each coefficient; skills-based assessment for younger classes; official trimester report cards and grade transcripts downloadable as PDFs.
- Attendance as a list or on a calendar; parents send an excuse for an unjustified absence from the app.
- Fees: what the family still owes, installment by installment, scholarships, what is paid and the payment history.
- Push notifications for grades and homework, attendance, fees, documents and report cards, school announcements and the student's file, each group with its own switch, plus quiet hours at night (urgent announcements always get through).
- The school's announcements feed; urgent announcements are pushed to every family.
- One parent account for the whole family: parents link each child with the school's access code and switch between them. Light and dark mode.
- Sign in with Apple and Sign in with Google, which he implemented in the app, alongside email and password. Parents can manage or delete their account from the app.

Highlights:
- Approved by App Review on the first submission, in under 48 hours. He prepared a demo account for Apple's reviewers and recorded a demo video explaining the app.
- Implemented push notifications and sign-in with Apple and Google.
- Built and released with EAS (Expo Application Services), with over-the-air updates for JavaScript changes.
- Shares its data rules with the web portal so both clients show the same grades, fees and attendance.

Tech stack:
- Mobile: React Native, Expo, TypeScript, Expo Router, TanStack Query
- Back-end (shared with Formel): Node.js, Express, PostgreSQL
- Auth and notifications: Clerk, Expo Notifications
- Build and release: EAS, App Store

What he learned: Formel Parents was his first mobile app and his first time shipping software through the App Store. Building for a phone meant rethinking the interface for a small screen, the keyboard and touch, and handling notifications that arrive while the app is closed. Publishing it taught him the release side of software: EAS builds, App Review's requirements (it was approved on the first try), and planning updates, since a change to native code needs a new store build while a JavaScript change can be delivered over the air. It also taught him to keep two clients in step with the same data rules.

### Louvo — AI hairstyle try-on
- Live: https://www.louvo.app
- Source code: https://github.com/Mudelkun/Louvo
- Page on the site: rodarly.me/louvo
- Status: in production
- Timeline: August 2026
- Role: solo build

What it is: a web app that lets anyone see what they would look like with a different hairstyle before getting it. You upload a photo, choose a hairstyle, and Louvo uses AI image editing to generate a realistic preview while keeping your facial features and appearance as close to the original photo as possible. The goal: try the hairstyle before you commit to it.

Features:
- A catalogue of 64+ hairstyles in categories. Some styles let you customize hair length and hair type, and each one has four views. Every haircut has its own page and og:image.
- Photo to preview: pick a style, upload a selfie, click "Generate My Preview".
- Before and after: compare the original photo with the generated preview.
- Pricing: the first preview is free, creating an account gives one more free preview, and preview packs start at $4.99.

Highlights:
- Tuned the Fal.ai pipeline (image pre-processing, prompt tuning and caching) to cut the cost per preview without losing quality.
- Shipped the full product loop: Clerk authentication, Stripe checkout for preview packs, credit accounting, and image storage on Cloudflare R2.
- Runs its deployment, domain and production monitoring.

Tech stack:
- Front-end: Next.js, React, Tailwind CSS, TypeScript
- Back-end: Node.js, Fastify, PostgreSQL, Cloudflare R2
- Auth and payments: Clerk, Stripe
- AI: Fal.ai
- Hosting: Railway

What he learned: Louvo was his first time integrating AI into a web application. He learned how to build around AI image generation, especially how to keep AI costs as low as possible without sacrificing the quality of the results. He also learned to work more effectively with AI coding agents by giving clear instructions, breaking down problems and guiding development toward the result he wanted. Louvo showed him how powerful AI can be inside a well-designed product, and pushed him toward building more AI-powered applications.

### This portfolio (rodarly.me)
A hand-written site in plain HTML, CSS and JavaScript with no framework. It has live GitHub activity, a page per project, an English/French switch that translates the live page, and this chat, which answers from this profile using Claude.
