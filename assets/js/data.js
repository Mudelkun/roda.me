/* Single source of content for both pages. Edit this file to fill in the real site;
   the markup and the chat fallback both read from here. */

window.SITE = {
  profile: {
    name: "Rodarly",
    initial: "★",
    role: "Full-stack developer",
    location: "Moncton, NB",
    bio: "Hello, I’m Rodarly, a 19-year-old computer science student and software developer. I taught myself how to code after graduating high school in 2025 and quickly developed a passion for software engineering. Since then, I’ve deployed real-world full-stack applications, including a complete school management platform that my family’s private school currently relies on for its daily operations. I’m a fast learner and a self-taught developer, constantly looking for ways to grow—not just as a coder, but as an engineer who solves real problems while having a little fun along the way.",
    photo: "assets/media/portrait.jpeg",
    resume: "assets/media/resume.pdf",
    email: "perilusrodarly@gmail.com",
    github: "https://github.com/Mudelkun",
    githubHandle: "Mudelkun",
    instagram: "https://www.instagram.com/rod_arly/",
    contactBlurb: "Open to full-time roles and interesting contract work. The fastest way to reach me is email.",
    openToWork: true
  },

  /* Live GitHub activity. Nothing here needs a token, and nothing needs a rebuild:
     the page re-reads these while it is open, so a push lands on the site by itself.
       handle                  - defaults to the name in profile.github
       contributionEndpoints   - tried in order, first one to answer wins. Both are
                                 public CORS-open mirrors of the profile graph, so
                                 private-repo commits count as long as GitHub is set to
                                 "include private contributions on my profile".
       graphRefreshSeconds     - poll interval while the tab is visible. */
  github: {
    handle: "Mudelkun",
    contributionEndpoints: [
      "https://github-contributions-api.jogruber.de/v4/{handle}?y=last",
      "https://github-contributions.vercel.app/api/v1/{handle}"
    ],
    graphRefreshSeconds: 60
  },

  /* French switch. There is no French copy of this file and there never should be:
     assets/js/i18n.js reads whatever text is on the page, translates the strings it
     has not seen before, and caches them in the browser. Anything added below is
     translated the first time someone flips the switch.
       providers  - tried in order, first to answer wins. Both are public and key-less.
       protect    - names that must survive untouched. Project tags, stack items, the
                    profile name and the GitHub handle are protected automatically.
       enabled    - false hides the switch and leaves the site English-only. */
  translate: {
    enabled: true,
    lang: "fr",
    source: "en",
    providers: ["google", "mymemory"],
    protect: ["Formel", "Louvo", "Rodarly", "École Horizon", "Mudelkun", "Hairify", "Fal.ai"],
    /* Short labels carry no sentence for a translator to read, so a few come back
       wrong: "May" as the verb, "Wed" as "marry". These are settled here; every
       other string on the site is left to the provider. */
    overrides: {
      Jan: "janv.", Feb: "févr.", Mar: "mars", Apr: "avr.", May: "mai", Jun: "juin",
      Jul: "juil.", Aug: "août", Sep: "sept.", Oct: "oct.", Nov: "nov.", Dec: "déc.",
      Mon: "lun.", Wed: "mer.", Fri: "ven.",
      Contributions: "Contributions",
      "Current streak": "Série en cours",
      "Longest streak": "Plus longue série",
      "Commit history · live": "Historique des commits · en direct",
      "What's his stack?": "Quelles technologies utilise-t-il ?",
      "Full-stack developer": "Développeur full-stack",
      /* {n} stands in for a number that changes, so one line covers every count. */
      "{n} contributions in the last 12 months": "{n} contributions sur les 12 derniers mois",
      "{n} GitHub contributions in the last 12 months": "{n} contributions GitHub sur les 12 derniers mois",
      "last 12 months": "sur 12 mois",
      "so far": "à ce jour",
      "rolling": "glissant",
      "consecutive": "consécutifs",
      "best day · {n}": "meilleur jour · {n}"
    }
  },

  /* Where the "ask me a question" panel posts.
     Leave null and the panel answers locally from the content in this file.
     Set to your own endpoint: POST { message, history } -> { reply }. */
  chatEndpoint: null,

  chatSuggestions: [
    "What's his stack?",
    "Open to work?",
    "Tell me about Formel"
  ],

  projects: [
    {
      slug: "formel",
      index: "01",
      title: "Formel: School management plateforme",
      pitch: "One-line pitch — what it is, and who it is for.",
      summary: "Formel is the biggest project I’ve worked on so far. It is a complete school management platform built for my family’s private school in Haiti. I created it to make it easier to manage and operate the school remotely from Canada.\n\nThe platform was officially implemented in April, with the school’s existing data transferred from Excel into the system. It now serves more than 400 users, and for the 2026–2027 school year, we made a major update by introducing dedicated portals for students, teachers, and parents.",
      tags: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Drizzle ORM"],
      /* Private school system: no public URL or repo, so no live/source buttons. */
      poster: "assets/media/formel/01-dashboard.jpg",
      /* The screenshots are light UI: a dark box around them keeps them easy to spot. */
      showcaseDark: true,
      /* Captured from the real app running on a local demo database: a fictional school
         ("École Horizon") with placeholder names, seeded to look like years of use. */
      screens: [
        { src: "assets/media/formel/01-dashboard.jpg", caption: "The morning check: who’s enrolled, who showed up today, what came in and what is still owed" },
        { src: "assets/media/formel/02-student-file.jpg", caption: "One student on one page — who they are, what they owe from past years, and how often they show up" },
        { src: "assets/media/formel/03-class-fees.jpg", caption: "Price a class once: the year split into installments with due dates, and every student in it follows" },
        { src: "assets/media/formel/04-payment.jpg", caption: "Record a payment and the system decides what it settles — oldest due date first, balance updated on the spot" },
        { src: "assets/media/formel/05-finance-overview.jpg", caption: "How much of the year’s tuition has actually come in, class by class — collected, outstanding, scholarships" },
        { src: "assets/media/formel/06-school-calendar.jpg", caption: "The school year on one calendar: holidays, exams, meetings and outings, with what’s coming up beside it" },
        { src: "assets/media/formel/07-messaging.jpg", caption: "Payment reminders and announcements emailed to every family at once, with proof of what was delivered" },
        { src: "assets/media/formel/08-audit-log.jpg", caption: "Every action in the system is recorded — who did what, and when. Nothing changes without a trace" },
        { src: "assets/media/formel/09-staff.jpg", caption: "The staff directory: position, department, contract and pay for everyone the school employs" },
        { src: "assets/media/formel/10-kiosk.jpg", caption: "The kiosk at the school entrance — staff type their number to clock in and out, and the hours feed payroll" },
        { src: "assets/media/formel/11-schedules.jpg", caption: "The week each employee is expected to work — what a clock-in is measured against to flag a late arrival" },
        { src: "assets/media/formel/12-payroll.jpg", caption: "A month’s payroll on one screen: hours, gross, deductions and net for every employee, ready to publish" },
        { src: "assets/media/formel/13-treasury.jpg", caption: "What the school earned and spent this month, and whether it finished the month ahead" },
        { src: "assets/media/formel/14-budgets.jpg", caption: "A spending cap per category, with a warning the moment one is close to it or past it" },
        { src: "assets/media/formel/15-class-subjects.jpg", caption: "How a class is graded: its subjects, how much each one weighs, and which grading model it follows" },
        { src: "assets/media/formel/16-teachers.jpg", caption: "Every teacher and the class subjects they are responsible for — this is what opens their grading space" },
        { src: "assets/media/formel/17-attendance.jpg", caption: "Attendance taken class by class: present, absent or late in one tap, with the day’s totals above" },
        { src: "assets/media/formel/18-teacher-homework.jpg", caption: "A teacher’s view of an assignment: who handed in, who is late, who is missing, and what is left to grade" },
        { src: "assets/media/formel/19-teacher-gradebook.jpg", caption: "The term’s evaluations for one subject, each with its weight — graded, then published when the teacher is ready" },
        { src: "assets/media/formel/20-student-homework.jpg", caption: "What a student owes and when: assignments to hand in, their deadlines, and what is already submitted" },
        { src: "assets/media/formel/21-messaging-student.jpg", caption: "Students and teachers message each other in the app, so homework questions never go through the office" },
        { src: "assets/media/formel/22-report-card.jpg", caption: "The official trimester report card, assembled from published grades and ready to print" },
        { src: "assets/media/formel/23-academic-stats.jpg", caption: "How the school is doing academically: pass rate, general average, and how the grades are spread" },
        { src: "assets/media/formel/24-parent-children.jpg", caption: "One parent account for the whole family — pick a child to see their grades, attendance and fees" },
        { src: "assets/media/formel/25-parent-attendance.jpg", caption: "Parents see every absence and late arrival, and send an excuse for the ones still unjustified" },
        { src: "assets/media/formel/26-parent-grades.jpg", caption: "Grades reach parents the moment a teacher publishes them, with what is new since their last visit" },
        { src: "assets/media/formel/27-parent-fees.jpg", caption: "What the family still owes, installment by installment — scholarship, what is paid, what is overdue" },
        { src: "assets/media/formel/28-parent-requests.jpg", caption: "Nothing a parent sends touches a student file until the office approves it — address changes, excuses, re-enrollments" },
        { src: "assets/media/formel/29-parent-mobile.jpg", caption: "The parent portal on a phone, which is how most families actually open it" }
      ],
      /* Copied from formel-scale/frontend/public. The reverse mark is used in both themes. */
      logo: "assets/media/formel-logo-reverse.png",
      logoRound: true,
      facts: { Role: "Sole developer", Timeline: "Feb – Apr 2026", Status: "In production" },
      description: "Formel is a complete school management platform I built alongside my father for our family’s private school in Haiti. I handled the software development, while my father provided the real-world context and helped define the features the school needed.\n\nThe platform was created to replace paper-based and Excel workflows with one centralized system that can be managed remotely from Canada. It now brings together the school’s core operations and includes dedicated portals for administrators, teachers, students, and parents. Formel was officially implemented in April and now supports more than 400 users.",
      /* Features by area. The detail page shows one area at a time as tabs.
         icon: a key from assets/js/icons.js; short: the tab label. */
      featureGroups: [
        {
          name: "Main administrator portal", short: "Administration", icon: "dashboard",
          intro: "Where the school office runs day to day: students, classes, payments and who can access what.",
          items: [
            { icon: "user-plus", text: "Create student profiles with their personal information" },
            { icon: "school", text: "Add classes with their financial details" },
            { icon: "receipt", text: "Register student payments" },
            { icon: "repeat", text: "Handle new school year re-enrollments" },
            { icon: "calendar-days", text: "Manage school calendar events" },
            { icon: "mail", text: "Send individual and bulk email messages" },
            { icon: "user-cog", text: "Add users with custom permissions and restrictions" },
            { icon: "history", text: "Audit log to track all actions performed in the system" }
          ]
        },
        {
          name: "Finance and HR", short: "Finance & HR", icon: "wallet",
          intro: "The school’s staff, hours and pay, alongside its revenue and expenses.",
          items: [
            { icon: "id-card", text: "Manage employees and their information with personalized profiles" },
            { icon: "clock", text: "Kiosk for employee clock-in and clock-out" },
            { icon: "calendar-clock", text: "Schedule management" },
            { icon: "banknote", text: "Payroll processing" },
            { icon: "trending-up", text: "Revenue and expense management" }
          ]
        },
        {
          name: "Formel Academic", short: "Academic", icon: "academic",
          intro: "Classes, attendance and grades, with portals for teachers and students.",
          items: [
            { icon: "sliders-horizontal", text: "Configure classes with subjects and grading policies" },
            { icon: "user-check", text: "Assign teachers to class subjects" },
            { icon: "clipboard-check", text: "Register daily student attendance" },
            { icon: "notebook-pen", text: "Teacher portal where teachers can assign homework to students and enter their grades" },
            { icon: "file-up", text: "Student portal where students can submit assignments and view their published grades" },
            { icon: "messages-square", text: "Student-teacher communication through real-time messaging" },
            { icon: "file-text", text: "Generate report cards at the end of every trimester" }
          ]
        },
        {
          name: "Parent portal", short: "Parents", icon: "parents",
          intro: "Parents follow their child’s attendance, grades, documents and balance in one place.",
          items: [
            { icon: "key-round", text: "Dedicated parent portal where parents can add their students using their permanent school identifier generated by the platform" },
            { icon: "square-pen", text: "Request changes to student information" },
            { icon: "clipboard-list", text: "Track student attendance and view their published grades" },
            { icon: "calendar-x", text: "Submit absence excuses to justify late arrivals or absences" },
            { icon: "download", text: "Download documents added by the school" },
            { icon: "calendar", text: "View the school calendar" },
            { icon: "circle-dollar-sign", text: "View the student’s financial standing" }
          ]
        }
      ],
      /* From formel-scale's package.json files and README. Logos: assets/js/icons.js. */
      stack: [
        { layer: "Front-end", items: ["React", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "TanStack Query"] },
        { layer: "Back-end", items: ["Node.js", "Express", "PostgreSQL", "Drizzle ORM"] },
        { layer: "Auth + services", items: ["Clerk", "Cloudflare R2", "Resend", "Sentry"] },
        { layer: "Hosting", items: ["Railway"] }
      ],
      /* Fill in to show the "What I learned" section after the tech stack. */
      whatILearned: "Formel was one of the first projects I deployed to production, and it taught me a lot about what goes into building and maintaining real software.\n\nAt the time, I had just finished learning SQL, so designing the Formel database was one of my first experiences making architectural decisions that would affect the rest of the application. It taught me the importance of planning before writing code and understanding how early decisions can influence future development.\n\nBecause Formel is used by many people every day, I also learned how important it is to design interfaces that are clear, efficient, and easy to understand. I had to constantly think about how users would interact with each part of the application and adapt the interface to make common tasks smoother.\n\nI also created more than two hours of training videos covering the platform’s functionality. This gave me a better understanding of the business side of software development: building a feature is only part of the job. The software also needs to be understandable, usable, and supported by the people who rely on it."
    },
    {
      slug: "louvo",
      index: "02",
      title: "Louvo: Ai Hairstyle try-on website",
      pitch: "An AI hairstyle try-on — see the haircut on your own face before you are sitting in the chair.",
      summary: "Louvo is a simple AI-powered app that lets anyone see what they could look like with a different hairstyle before actually getting it. Just upload a photo of yourself, choose a hairstyle, and Louvo generates a realistic preview of you with that hairstyle.\n\nLouvo uses advanced AI image generation to create realistic results while keeping your facial features and overall appearance as close to the original photo as possible. The goal is simple: **try the hairstyle before you commit to it.**",
      tags: ["Next.js", "React", "TypeScript", "Fastify", "Postgres", "Stripe", "Fal.ai"],
      live: "https://www.louvo.app",
      source: "https://github.com/Mudelkun/Hairify",
      poster: "assets/media/louvo-poster.jpg",
      /* The app's mark, copied from Hairify/web/public/luvo-mark.png. Shown on the detail page. */
      logo: "assets/media/louvo-logo.png",
      facts: { Role: "Solo build", Timeline: "2026", Domain: "Louvo.app" },
      /* Louvo's type and shape (Instrument Serif + Inter, 20px plates) with the
         portfolio's own colours. Add a `colors` block to draw a card in its product's
         palette instead - see assets/js/brand.js for the keys. */
      brand: {
        id: "louvo",
        fonts: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap",
        display: "'Instrument Serif', ui-serif, Georgia, serif",
        body: "Inter, ui-sans-serif, system-ui, sans-serif",
        radius: "20px",
        ease: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      description: "Louvo is a simple AI-powered web app that lets anyone see what they could look like with a different hairstyle before actually getting it. Upload a photo of yourself, choose a hairstyle, and Louvo generates a realistic preview of you with that hairstyle.\n\nLouvo uses advanced AI image editing to create realistic results while keeping your facial features and overall appearance as close to the original photo as possible.\n\nThe goal is simple: try the hairstyle before you commit to it.",
      /* icon: a key from assets/js/icons.js */
      features: [
        { icon: "catalogue", name: "Hairstyle catalogue", text: "Browse a catalogue of 64+ hairstyles organized into different categories. Some hairstyles allow you to customize the hair length and hair type. Each hairstyle includes four different views that you can easily navigate through." },
        { icon: "preview", name: "Photo to preview", text: "Choose a hairstyle from the catalogue, upload a selfie, and click \"Generate My Preview.\" Louvo uses AI image editing to create a realistic preview of you with the selected hairstyle." },
        { icon: "compare", name: "Before & after", text: "Compare your original photo with your generated preview using the \"Compare with Your Photo\" feature, making it easy to see the difference." },
        { icon: "pricing", name: "Free & paid previews", text: "Your first preview is free. To get an additional free preview, you can create an account. Once your previews are used, you can purchase additional preview packs starting at $4.99." }
      ],
      /* Each item's logo comes from assets/js/icons.js, looked up by name. */
      stack: [
        { layer: "Front-end", items: ["Next.js", "React", "Tailwind CSS", "TypeScript"] },
        { layer: "Back-end", items: ["Node.js", "Fastify", "PostgreSQL", "Cloudflare R2"] },
        { layer: "Auth + payments", items: ["Clerk", "Stripe"] },
        { layer: "AI", items: ["Fal.ai"] },
        { layer: "Hosting", items: ["Railway"] }
      ],
      whatILearned: "Louvo was an interesting project to build because it was my first time integrating AI into a web application. Through the project, I learned a lot about building applications around AI image generation, especially how to optimize the experience while keeping AI costs as low as possible without sacrificing the quality of the results.\n\nI also learned how to work more effectively with AI coding agents by giving clear instructions, breaking down problems, and guiding the development process toward the result I wanted.\n\nMost importantly, Louvo showed me how powerful AI can be when combined with a well-designed product. It pushed me toward exploring and building more AI-powered applications in the future.",
      /* Detail page only: leads the screens stage and holds for one full loop (ms). */
      demo: { src: "assets/media/The%20louvo%20app.gif", caption: "The app in motion — upload a photo, pick a cut, see the preview", hold: 24600 },
      screens: [
        { src: "assets/media/louvo-poster.jpg", caption: "The home page is the try-on — upload box on the left, a real before-and-after beside it" },
        { src: "assets/media/louvo-screen-2.jpg", caption: "The catalogue: sixty-four cuts, filterable by audience, texture and shape" },
        { src: "assets/media/louvo-screen-3.jpg", caption: "A haircut's own page — four angles, four hair types, its own URL and og:image" }
      ]
    }
  ]
};
