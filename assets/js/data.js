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
    "Tell me about Project One"
  ],

  projects: [
    {
      slug: "project-one",
      index: "01",
      title: "Project One",
      pitch: "One-line pitch — what it is, and who it is for.",
      summary: "Two or three sentences for the card on the home page: what it does, why it exists, and the one interesting technical thing about it.",
      tags: ["React", "TypeScript", "Node", "Postgres", "Docker"],
      live: "https://example.com",
      source: "https://github.com/your-handle/project-one",
      video: "assets/media/project-one.mp4",
      poster: "assets/media/project-one-poster.jpg",
      videoLength: "1:24",
      facts: { Role: "Solo build", Timeline: "6 weeks, 2025", Status: "Live" },
      whatItDoes: "What the project does, in plain language. Describe the job it performs for the person using it, not the architecture.",
      whyIBuiltIt: "The problem or itch that made this worth building, and what you wanted to learn from it.",
      features: [
        { icon: "◈", name: "Feature one", text: "One line on what it does and why it matters." },
        { icon: "◉", name: "Feature two", text: "One line on what it does and why it matters." },
        { icon: "▲", name: "Feature three", text: "One line on what it does and why it matters." },
        { icon: "■", name: "Feature four", text: "One line on what it does and why it matters." }
      ],
      stack: [
        { layer: "Front-end", items: ["React", "TypeScript", "Tailwind"], why: "Why each choice, in a line." },
        { layer: "Back-end", items: ["Node", "Express", "Postgres"], why: "Why each choice, in a line." },
        { layer: "Infra", items: ["Docker", "Fly.io", "GH Actions"], why: "Why each choice, in a line." }
      ],
      architecture: { image: "assets/media/project-one-arch.svg", caption: "Architecture sketch — request path from client to database." },
      howItsBuilt: "A paragraph on the shape of the system: the pieces, how they talk, and the one decision you would defend in an interview.",
      whatILearned: "What broke, what you would do differently, and the thing you now know that you did not before.",
      screens: [
        { src: "assets/media/project-one-screen-1.jpg", caption: "Main view" },
        { src: "assets/media/project-one-screen-2.jpg", caption: "Detail view" }
      ]
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
        { layer: "AI", items: ["Fal.ai"] }
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
