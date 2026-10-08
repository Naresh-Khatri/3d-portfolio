const config = {
  title: "Naresh Khatri | Full-Stack Developer",
  description: {
    long: "Explore the portfolio of Naresh, a full-stack developer and creative technologist specializing in interactive web experiences, 3D animations, and innovative projects. Discover my latest work, including Coding Ducks, The Booking Desk, Ghostchat, and more. Let's build something amazing together!",
    short:
      "Discover the portfolio of Naresh, a full-stack developer creating interactive web experiences and innovative projects.",
  },
  keywords: [
    "Naresh",
    "portfolio",
    "full-stack developer",
    "creative technologist",
    "web development",
    "3D animations",
    "interactive websites",
    "Coding Ducks",
    "The Booking Desk",
    "Ghostchat",
    "web design",
    "GSAP",
    "React",
    "Next.js",
    "Framer Motion",
  ],
  author: "Naresh Khatri",
  email: "naresh.khatri2345@gmail.com",
  site: "https://nareshkhatri.dev",

  // for github stars button
  githubUsername: "naresh-khatri",
  githubRepo: "3d-portfolio",

  get ogImg() {
    return this.site + "/assets/seo/og-image.png";
  },
  social: {
    twitter: "https://x.com/nothotchaddi",
    linkedin: "https://www.linkedin.com/in/naresh-khatri/",
    instagram: "https://www.instagram.com/hotchaddi",
    facebook: "https://www.facebook.com/HotChaddi/",
    github: "https://github.com/Naresh-Khatri",
  },
};
export { config };
