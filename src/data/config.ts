const config = {
  title: "Guru Saran Kannan | Aspiring AI Researcher & Software Engineer",
  description: {
    long: "Explore the portfolio of Guru Saran Kannan, an aspiring AI researcher and software engineer specializing in reinforcement learning, LLMs, and real-world AI deployments. Discover research projects including RL traffic simulation, LLM-powered customer support, and AI-driven pronunciation training. Seeking MS in AI/CS to scale impactful projects.",
    short:
      "Aspiring AI Researcher & Software Engineer | B.Tech AI '25 | GRE 327 | Building Intelligent Systems",
  },
  keywords: [
    "Guru Saran Kannan",
    "portfolio",
    "AI researcher",
    "machine learning",
    "reinforcement learning",
    "LLM",
    "NLP",
    "artificial intelligence",
    "software engineer",
    "research projects",
    "Python",
    "TensorFlow",
    "PyTorch",
    "Chennai",
    "SRM",
  ],
  author: "Guru Saran Kannan",
  email: "gurusarank@icloud.com",
  site: "https://gurusarank.site",

  // for github stars button
  githubUsername: "gurusarank",
  githubRepo: "portfolio",

  // CV/Resume file path
  cvPath: "/assets/cv.pdf", // Add your CV file to /public/assets/cv.pdf

  get ogImg() {
    return this.site + "/assets/seo/og-image.png";
  },
  social: {
    linkedin: "https://www.linkedin.com/in/gurusarank",
    github: "https://github.com/BigSmoKe07",
  },
};
export { config };
