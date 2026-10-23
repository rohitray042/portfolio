const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#mobile-nav");
function closeMenu() {
  menu.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "Menu +";
}
toggle.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "Close −" : "Menu +";
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menu.hidden) {
    closeMenu();
    toggle.focus();
  }
});
matchMedia("(min-width: 761px)").addEventListener("change", (e) => {
  if (e.matches) closeMenu();
});
const stages = [...document.querySelectorAll(".pipeline-stage")];
const descriptions = [
  "Raw records begin in source systems.",
  "Cloud Storage and Pub/Sub bring data into the platform.",
  "Distributed compute with Apache Spark on Dataproc.",
  "Transform, validate, and prepare trustworthy datasets.",
  "Snowflake / BigQuery organize data for analytical access.",
  "Cortex and GenAI add validation and intelligent enrichment.",
  "Curated data becomes accessible insight.",
];
let selected = -1;
function selectStage(index) {
  if (index === selected) return;
  selected = index;
  const scene = document.querySelector(".infrastructure-scene");
  if (scene.scrollWidth > scene.clientWidth) {
    scene.scrollTo({
      left:
        ((88 + index * 152) / 1100) * scene.scrollWidth - scene.clientWidth / 2,
      behavior: "instant",
    });
  }
  document.querySelectorAll("[data-object]").forEach((object, i) => {
    object.classList.toggle("active", i === index);
    object.classList.toggle("complete", i < index);
  });
  document
    .querySelectorAll("[data-link]")
    .forEach((link, i) => link.classList.toggle("energized", i < index));
  const samples = [
    '{ "source": "event", "value": "42" }',
    '{ "batch": "demo-01", "received": true }',
    '{ "partition": 2, "value": 42 }',
    '{ "value": 42, "valid": true }',
    '{ "table": "curated_events", "ready": true }',
    '{ "quality": "checked", "review": false }',
    '{ "metric": "event_value", "result": 42 }',
  ];
  document.querySelector("#sample-record").textContent = samples[index];
  stages.forEach((button, i) => {
    button.classList.toggle("active", i === index);
    button.classList.toggle("complete", i < index);
    button.setAttribute("aria-pressed", String(i === index));
  });
  document.querySelector("#stage-index").textContent = `0${index + 1} / 07`;
  document.querySelector("#stage-title").textContent =
    stages[index].lastElementChild.textContent;
  document.querySelector("#stage-description").textContent =
    descriptions[index];
}
stages.forEach((button, i) =>
  button.addEventListener("click", () => selectStage(i)),
);
const pipeline = document.querySelector("#pipeline");
let pending = false;
function onScroll() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    const rect = pipeline.getBoundingClientRect();
    const travel = rect.height - innerHeight;
    if (travel > 100 && rect.top < innerHeight && rect.bottom > 0)
      selectStage(
        Math.min(6, Math.max(0, Math.floor((-rect.top / travel) * 7))),
      );
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
selectStage(0);
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.querySelectorAll(".navigation nav a").forEach((a) => {
          if (a.hash === `#${entry.target.id}`)
            a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        });
      }
    });
  },
  { rootMargin: "-15% 0px -65% 0px" },
);
document
  .querySelectorAll("main section[id]")
  .forEach((section) => observer.observe(section));
import("./animation.js").then(({ initAnimation }) => initAnimation());

// Progressive enhancement: content remains visible if motion is unavailable.
let motionPaused = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (!motionPaused)
        entry.target.animate(
          [
            {
              opacity: 0.25,
              transform: "translateY(32px)",
              filter: "blur(5px)",
            },
            { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
          ],
          { duration: 850, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12 },
);
document
  .querySelectorAll(
    ".section-heading, .case, .experience-row, .stack-grid article, .certifications article",
  )
  .forEach((el) => revealObserver.observe(el));
document.addEventListener("portfolio:motion", ({ detail }) => {
  motionPaused = detail.paused;
  if (motionPaused) {
    document
      .getAnimations()
      .filter((animation) => animation.effect?.target?.closest?.("main"))
      .forEach((animation) => {
        if (animation.constructor.name !== "CSSAnimation") animation.finish();
      });
    document.querySelectorAll(".case-visual").forEach((el) => {
      el.style.removeProperty("--tilt-x");
      el.style.removeProperty("--tilt-y");
    });
  }
});
for (const card of document.querySelectorAll(".case-visual")) {
  card.addEventListener("pointermove", (event) => {
    if (motionPaused || !finePointer.matches) return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width,
      y = (event.clientY - box.top) / box.height;
    card.style.setProperty("--tilt-x", `${(y - 0.5) * -9}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 10}deg`);
    card.style.setProperty("--light-x", `${x * 100}%`);
    card.style.setProperty("--light-y", `${y * 100}%`);
  });
  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
}
let scrollFrame = 0;
function updateScene() {
  scrollFrame = 0;
  const total = document.documentElement.scrollHeight - innerHeight;
  document.querySelector(".reading-progress").style.transform =
    `scaleX(${total > 0 ? scrollY / total : 0})`;
  const hero = document.querySelector(".hero");
  if (!motionPaused && innerWidth > 760 && scrollY < hero.offsetHeight) {
    hero.style.setProperty("--hero-drift", `${scrollY * 0.16}px`);
  } else hero.style.setProperty("--hero-drift", "0px");
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScene);
  },
  { passive: true },
);
updateScene();
