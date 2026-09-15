/* Single source of content for both pages. Edit this file to fill in the real site;
   the markup and the chat fallback both read from here. */

window.SITE = {
  profile: {
    name: "Rodarly",
    initial: "★",
    role: "Full-stack developer",
    location: "Moncton, NB",
    bio: "Hello, I’m Rodarly, a 19-year-old computer science student in Canada. I taught myself how to code after graduating high school in 2025 and quickly developed a passion for software engineering. Since then, I’ve deployed real-world full-stack applications, including a complete school management platform that my family’s private school currently relies on for its daily operations. I’m a fast learner and a self-taught developer, constantly looking for ways to grow—not just as a coder, but as an engineer who solves real problems while having a little fun along the way.",
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
      slug: "project-one",
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
        { src: "assets/media/formel/01-dashboard.jpg", caption: "Administrator dashboard: enrollment, today’s attendance, payments and upcoming deadlines" },
        { src: "assets/media/formel/02-student-file.jpg", caption: "A student file: personal details, arrears from past years, balance and attendance" },
        { src: "assets/media/formel/03-class-fees.jpg", caption: "A class’s fee schedule, split into installments with due dates" },
        { src: "assets/media/formel/04-payment.jpg", caption: "A recorded payment, allocated automatically to what the family owes" },
        { src: "assets/media/formel/05-finance-overview.jpg", caption: "Finance overview: expected, collected and outstanding, by class" },
        { src: "assets/media/formel/06-school-calendar.jpg", caption: "The school calendar: holidays, exams, meetings and activities" },
        { src: "assets/media/formel/07-messaging.jpg", caption: "Email messaging: payment reminders and announcements to families" },
        { src: "assets/media/formel/08-audit-log.jpg", caption: "Audit log: every action in the system, with who did it and when" },
        { src: "assets/media/formel/09-staff.jpg", caption: "Staff records with positions, contracts and pay" },
        { src: "assets/media/formel/10-kiosk.jpg", caption: "The clock-in kiosk staff use at the school entrance" },
        { src: "assets/media/formel/11-schedules.jpg", caption: "Work schedules assigned to hourly staff" },
        { src: "assets/media/formel/12-payroll.jpg", caption: "A monthly payroll run: gross pay, deductions and net pay per employee" },
        { src: "assets/media/formel/13-treasury.jpg", caption: "Treasury: the school’s revenue and expenses month by month" },
        { src: "assets/media/formel/14-budgets.jpg", caption: "Monthly budgets, with warnings as spending nears the limit" },
        { src: "assets/media/formel/15-class-subjects.jpg", caption: "A class’s academic setup: subjects, coefficients and grading categories" },
        { src: "assets/media/formel/16-teachers.jpg", caption: "Teachers and the class subjects they are assigned to" },
        { src: "assets/media/formel/17-attendance.jpg", caption: "Daily attendance, taken class by class" },
        { src: "assets/media/formel/18-teacher-homework.jpg", caption: "Teacher portal: reviewing a homework assignment and its submissions" },
        { src: "assets/media/formel/19-teacher-gradebook.jpg", caption: "Teacher portal: evaluations for the term, ready to grade and publish" },
        { src: "assets/media/formel/20-student-homework.jpg", caption: "Student portal: homework to hand in, with deadlines" },
        { src: "assets/media/formel/21-messaging-student.jpg", caption: "Student–teacher messaging inside the student portal" },
        { src: "assets/media/formel/22-report-card.jpg", caption: "A finalized trimester report card" },
        { src: "assets/media/formel/23-academic-stats.jpg", caption: "Academic statistics: success rate and grade distribution" },
        { src: "assets/media/formel/24-parent-children.jpg", caption: "Parent portal: one account, every child at the school" },
        { src: "assets/media/formel/25-parent-attendance.jpg", caption: "Parent portal: attendance, with an absence excuse awaiting the school" },
        { src: "assets/media/formel/26-parent-grades.jpg", caption: "Parent portal: newly published grades" },
        { src: "assets/media/formel/27-parent-fees.jpg", caption: "Parent portal: the family’s balance, installments and payment history" },
        { src: "assets/media/formel/28-parent-requests.jpg", caption: "The office reviews parents’ change requests and absence excuses" },
        { src: "assets/media/formel/29-parent-mobile.jpg", caption: "The parent portal on a phone" }
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
      whatILearned: ""
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
