const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const revealItems = document.querySelectorAll(".reveal");
const backToTop = document.querySelector(".back-to-top");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", isActive);
      });
    });
  },
  {
    rootMargin: "-38% 0px -54% 0px",
    threshold: 0
  }
);

sections.forEach((section) => sectionObserver.observe(section));

const updateBackToTop = () => {
  backToTop.classList.toggle("visible", window.scrollY > 520);
};

window.addEventListener("scroll", updateBackToTop, { passive: true });
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
updateBackToTop();
