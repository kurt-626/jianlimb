const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const revealItems = document.querySelectorAll(".reveal");
const backToTop = document.querySelector(".back-to-top");
const portfolioGrid = document.querySelector(".portfolio-grid");
const portfolioCards = document.querySelectorAll(".portfolio-card");
const magneticItems = document.querySelectorAll(".button, .back-to-top");
const scrollProgress = document.querySelector(".scroll-progress span");
const sectionDots = Array.from(document.querySelectorAll(".section-dots a"));
const projectList = document.querySelector(".project-list");
const sectionBoxes = document.querySelectorAll(".section-box");
const geoDog = document.querySelector(".geo-dog");
const particleTitle = document.querySelector(".particle-title");
const particleCanvas = document.querySelector(".title-particles");
const modal = document.querySelector(".portfolio-modal");
const modalImage = document.querySelector(".modal-image");
const modalTitle = document.querySelector("#modal-title");
const modalMeta = document.querySelector(".modal-meta");
const modalDescription = document.querySelector(".modal-description");
const modalTags = document.querySelector(".modal-tags");
const modalClose = document.querySelector(".modal-close");
const modalBackdrop = document.querySelector(".modal-backdrop");
const counters = document.querySelectorAll("[data-count]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activePortfolioCard = null;
let isPortfolioPaused = false;
let lastPortfolioFrame = 0;
let portfolioDirection = 1;
let activeDogSection = null;
let dogPeekTimer = 0;
let dogSettleTimer = 0;

const setScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  document.body.style.setProperty("--scroll-progress", progress.toFixed(4));
};

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

const animateCounter = (item) => {
  const target = Number(item.dataset.count);
  const decimals = Number(item.dataset.decimals || 0);

  if (reduceMotion || Number.isNaN(target)) {
    item.textContent = target.toFixed(decimals);
    return;
  }

  const duration = 900;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    item.textContent = (target * eased).toFixed(decimals);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.8 }
);

counters.forEach((item) => counterObserver.observe(item));

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

      sectionDots.forEach((link) => {
        const isTop = link.getAttribute("href") === "#top" && entry.target.id === "top";
        const isActive = link.getAttribute("href") === `#${entry.target.id}` || isTop;
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

const setupTitleParticles = () => {
  if (!particleTitle || !particleCanvas || reduceMotion) {
    particleTitle?.classList.add("is-ready");
    return null;
  }

  const ctx = particleCanvas.getContext("2d", { alpha: true });
  const titleText = particleTitle.querySelector("span")?.textContent?.trim() || "";
  const particles = [];
  const pointer = { x: -9999, y: -9999, active: false };
  let animationFrame = 0;

  const buildParticles = () => {
    const rect = particleTitle.getBoundingClientRect();
    const style = window.getComputedStyle(particleTitle);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * 1.2));
    const height = Math.max(1, Math.round(rect.height * 1.36));
    const sampleScale = 0.72;
    const sampleWidth = Math.max(1, Math.round(width * sampleScale));
    const sampleHeight = Math.max(1, Math.round(height * sampleScale));
    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d");

    particleCanvas.width = Math.round(width * dpr);
    particleCanvas.height = Math.round(height * dpr);
    particleCanvas.style.width = `${width}px`;
    particleCanvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleCtx.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleCtx.fillStyle = "#ffffff";
    sampleCtx.textAlign = "center";
    sampleCtx.textBaseline = "middle";
    sampleCtx.font = `${style.fontWeight} ${parseFloat(style.fontSize) * sampleScale}px ${style.fontFamily}`;
    sampleCtx.fillText(titleText, sampleWidth / 2, sampleHeight / 2 + sampleHeight * 0.02);

    const pixels = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    const targets = [];
    const step = Math.max(3, Math.round(sampleWidth / 96));

    for (let y = 0; y < sampleHeight; y += step) {
      for (let x = 0; x < sampleWidth; x += step) {
        const alpha = pixels[(y * sampleWidth + x) * 4 + 3];
        if (alpha > 80) {
          targets.push({
            x: x / sampleScale + width * 0.02,
            y: y / sampleScale + height * 0.02
          });
        }
      }
    }

    particles.length = 0;
    const limit = Math.min(targets.length, 1180);
    const stride = Math.max(1, Math.floor(targets.length / limit));

    for (let i = 0; i < targets.length && particles.length < limit; i += stride) {
      const target = targets[i];
      particles.push({
        x: width * (Math.random() * 1.9 - 0.45),
        y: height * (Math.random() * 1.9 - 0.45),
        tx: target.x,
        ty: target.y,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.9 + 1.2,
        tone: Math.random()
      });
    }

    particleTitle.classList.add("is-ready");
  };

  const render = () => {
    const width = particleCanvas.width / Math.min(window.devicePixelRatio || 1, 2);
    const height = particleCanvas.height / Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      const previousX = particle.x;
      const previousY = particle.y;
      const dx = particle.tx - particle.x;
      const dy = particle.ty - particle.y;
      const pointerDx = particle.x - pointer.x;
      const pointerDy = particle.y - pointer.y;
      const pointerDistance = Math.hypot(pointerDx, pointerDy);
      const force = pointer.active && pointerDistance < 150 ? (150 - pointerDistance) / 150 : 0;

      particle.vx += dx * 0.052 + (pointerDx / Math.max(pointerDistance, 1)) * force * 6.2;
      particle.vy += dy * 0.052 + (pointerDy / Math.max(pointerDistance, 1)) * force * 6.2;
      particle.vx *= 0.74;
      particle.vy *= 0.74;
      particle.x += particle.vx;
      particle.y += particle.vy;

      const speed = Math.hypot(particle.x - previousX, particle.y - previousY);
      if (speed > 0.7) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(98, 230, 213, 0.28)";
        ctx.lineWidth = Math.min(2.2, particle.size * 0.75);
        ctx.moveTo(previousX, previousY);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.fillStyle = particle.tone > 0.58 ? "rgba(163, 255, 243, 0.98)" : "rgba(238, 248, 251, 0.94)";
      ctx.shadowBlur = particle.tone > 0.58 ? 18 : 10;
      ctx.shadowColor = "rgba(98, 230, 213, 0.55)";
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    animationFrame = requestAnimationFrame(render);
  };

  const updatePointer = (event) => {
    const rect = particleCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  particleTitle.addEventListener("pointerenter", () => {
    pointer.active = true;
    particleTitle.classList.add("is-hovered");
  });

  particleTitle.addEventListener("pointermove", updatePointer, { passive: true });

  particleTitle.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.x = -9999;
    pointer.y = -9999;
    particleTitle.classList.remove("is-hovered");
  });

  buildParticles();
  render();

  return () => {
    cancelAnimationFrame(animationFrame);
    buildParticles();
    render();
  };
};

const moveDogToSection = (section) => {
  if (!geoDog || !section || window.innerWidth < 760) {
    return;
  }

  const rect = section.getBoundingClientRect();
  const x = Math.min(window.innerWidth - 118, Math.max(18, rect.right - 108));
  const y = Math.max(88, rect.top + 14);

  geoDog.style.setProperty("--dog-x", `${x}px`);
  geoDog.style.setProperty("--dog-y", `${y}px`);
  geoDog.classList.add("is-visible");

  if (activeDogSection !== section) {
    geoDog.classList.remove("is-hopping");
    void geoDog.offsetWidth;
    geoDog.classList.add("is-hopping");
    geoDog.style.setProperty("--dog-peek", "0.82");
    window.clearTimeout(dogPeekTimer);
    window.clearTimeout(dogSettleTimer);
    dogPeekTimer = window.setTimeout(() => {
      geoDog.style.setProperty("--dog-peek", "1.08");
    }, 130);
    dogSettleTimer = window.setTimeout(() => {
      geoDog.style.setProperty("--dog-peek", "1");
    }, 420);
    activeDogSection = section;
  }
};

const updateDogLook = (event) => {
  if (!geoDog || window.innerWidth < 760) {
    return;
  }

  const rect = geoDog.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = event.clientX - centerX;
  const dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  const pull = Math.max(0, 1 - distance / 520);
  const directionX = dx / Math.max(distance, 1);
  const directionY = dy / Math.max(distance, 1);
  const lookX = reduceMotion ? 0 : Math.max(-10, Math.min(10, directionX * 10 * pull));
  const lookY = reduceMotion ? 0 : Math.max(-8, Math.min(8, directionY * 8 * pull));
  const eyeX = Math.max(-2.4, Math.min(2.4, directionX * 2.4 * Math.max(pull, 0.42)));
  const eyeY = Math.max(-2.2, Math.min(6, directionY * 6 * Math.max(pull, 0.42)));
  const tilt = reduceMotion ? 0 : Math.max(-8, Math.min(8, directionX * 8 * pull));

  geoDog.style.setProperty("--dog-look-x", `${lookX.toFixed(2)}px`);
  geoDog.style.setProperty("--dog-look-y", `${lookY.toFixed(2)}px`);
  geoDog.style.setProperty("--dog-eye-x", `${eyeX.toFixed(2)}px`);
  geoDog.style.setProperty("--dog-eye-y", `${eyeY.toFixed(2)}px`);
  geoDog.style.setProperty("--dog-tilt", `${tilt.toFixed(2)}deg`);
  geoDog.classList.toggle("is-curious", pull > 0.18);
};

const dogObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      moveDogToSection(visible.target);
    }
  },
  {
    rootMargin: "-20% 0px -45% 0px",
    threshold: [0.2, 0.45, 0.7]
  }
);

sectionBoxes.forEach((section) => dogObserver.observe(section));

const setActivePortfolioCard = () => {
  if (!portfolioGrid || portfolioCards.length === 0) {
    return;
  }

  const gridRect = portfolioGrid.getBoundingClientRect();
  const gridCenter = gridRect.left + gridRect.width / 2;
  let closestCard = null;
  let closestDistance = Infinity;

  portfolioCards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.left + cardRect.width / 2;
    const distance = Math.abs(gridCenter - cardCenter);
    const signedDistance = cardCenter - gridCenter;
    const focus = Math.max(0, 1 - distance / Math.max(gridRect.width * 0.48, 1));
    const easedFocus = 1 - Math.pow(1 - focus, 2);
    const rotate = Math.max(-18, Math.min(18, -signedDistance / gridRect.width * 34));

    card.style.setProperty("--gallery-scale", (0.68 + easedFocus * 0.44).toFixed(3));
    card.style.setProperty("--gallery-y", `${(38 - easedFocus * 52).toFixed(1)}px`);
    card.style.setProperty("--gallery-depth", `${(-220 + easedFocus * 240).toFixed(1)}px`);
    card.style.setProperty("--gallery-rotate", `${rotate.toFixed(2)}deg`);
    card.style.setProperty("--gallery-opacity", (0.34 + easedFocus * 0.66).toFixed(3));
    card.style.setProperty("--gallery-brightness", (0.38 + easedFocus * 0.68).toFixed(3));
    card.style.setProperty("--gallery-blur", `${(1.8 - easedFocus * 1.8).toFixed(2)}px`);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestCard = card;
    }
  });

  portfolioCards.forEach((card) => {
    card.classList.toggle("is-active", card === closestCard);
  });
};

const activatePortfolioCard = (activeCard) => {
  portfolioCards.forEach((card) => {
    card.classList.toggle("is-active", card === activeCard);
  });
};

const setPortfolioPaused = (paused) => {
  isPortfolioPaused = paused;
  portfolioGrid?.classList.toggle("is-paused", paused);
};

const animatePortfolioTrack = (timestamp) => {
  if (!portfolioGrid) {
    return;
  }

  if (!lastPortfolioFrame) {
    lastPortfolioFrame = timestamp;
  }

  const delta = Math.min(timestamp - lastPortfolioFrame, 32);
  lastPortfolioFrame = timestamp;

  if (!isPortfolioPaused && !document.body.classList.contains("modal-open")) {
    const maxScroll = portfolioGrid.scrollWidth - portfolioGrid.clientWidth;
    portfolioGrid.scrollLeft += delta * 0.075 * portfolioDirection;

    if (portfolioGrid.scrollLeft >= maxScroll - 1) {
      portfolioGrid.scrollLeft = maxScroll;
      portfolioDirection = -1;
    } else if (portfolioGrid.scrollLeft <= 1) {
      portfolioGrid.scrollLeft = 0;
      portfolioDirection = 1;
    }

    setActivePortfolioCard();
  }

  requestAnimationFrame(animatePortfolioTrack);
};

const openPortfolioModal = (card) => {
  const tags = card.dataset.tags.split(",");
  activePortfolioCard = card;

  modalImage.src = card.dataset.image;
  modalImage.alt = card.querySelector("img").alt;
  modalTitle.textContent = card.dataset.title;
  modalMeta.textContent = card.dataset.meta;
  modalDescription.textContent = card.dataset.description;
  modalTags.replaceChildren(
    ...tags.map((tag) => {
      const item = document.createElement("span");
      item.textContent = tag.trim();
      return item;
    })
  );

  modal.hidden = false;
  document.body.classList.add("modal-open");
  setPortfolioPaused(true);
  modalClose.focus();
};

const closePortfolioModal = () => {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  modalImage.src = "";
  setPortfolioPaused(false);
  activePortfolioCard?.focus();
};

portfolioCards.forEach((card) => {
  card.addEventListener("click", () => openPortfolioModal(card));
  card.addEventListener("pointerenter", () => {
    activatePortfolioCard(card);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPortfolioModal(card);
    }
  });
});

portfolioGrid?.addEventListener("pointerenter", () => setPortfolioPaused(true));
portfolioGrid?.addEventListener("pointerleave", () => setPortfolioPaused(false));
portfolioGrid?.addEventListener("focusin", () => setPortfolioPaused(true));
portfolioGrid?.addEventListener("focusout", (event) => {
  if (!portfolioGrid.contains(event.relatedTarget)) {
    setPortfolioPaused(false);
  }
});
portfolioGrid?.addEventListener("scroll", setActivePortfolioCard, { passive: true });

modalClose.addEventListener("click", closePortfolioModal);
modalBackdrop.addEventListener("click", closePortfolioModal);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closePortfolioModal();
  }
});

const updateBackToTop = () => {
  backToTop.classList.toggle("visible", window.scrollY > 520);
};

const updateTimelineProgress = () => {
  if (!projectList) {
    return;
  }

  const rect = projectList.getBoundingClientRect();
  const viewport = window.innerHeight;
  const progress = Math.min(Math.max((viewport - rect.top) / (viewport + rect.height), 0), 1);
  projectList.style.setProperty("--timeline-progress", progress.toFixed(3));
};

const rebuildTitleParticles = setupTitleParticles();

window.addEventListener(
  "scroll",
  () => {
    updateBackToTop();
    setScrollProgress();
    updateTimelineProgress();
    moveDogToSection(activeDogSection);
  },
  { passive: true }
);

window.addEventListener(
  "resize",
  () => {
    rebuildTitleParticles?.();
    moveDogToSection(activeDogSection || sectionBoxes[0]);
  },
  { passive: true }
);

window.addEventListener("pointermove", updateDogLook, { passive: true });

if (!reduceMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
    },
    { passive: true }
  );

  portfolioCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * 5;
      const tiltY = (x - 0.5) * 6;

      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--shine-x", "50%");
      card.style.setProperty("--shine-y", "20%");
    });
  });

  magneticItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.18;

      item.style.setProperty("--magnet-x", `${x.toFixed(1)}px`);
      item.style.setProperty("--magnet-y", `${y.toFixed(1)}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--magnet-x", "0px");
      item.style.setProperty("--magnet-y", "0px");
    });
  });
}

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
updateBackToTop();
setScrollProgress();
updateTimelineProgress();
setActivePortfolioCard();
moveDogToSection(sectionBoxes[0]);
requestAnimationFrame(animatePortfolioTrack);
