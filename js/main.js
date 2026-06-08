/* =====================================================================
   HANAMI - Interactions
   - Nav : état "scrolled" via IntersectionObserver (pas de scroll listener)
   - Menu mobile : ouverture, morph hamburger, focus trap léger, Echap
   - Reveal au scroll : IntersectionObserver
   - Lien de nav actif selon la section visible
   - Galerie : lightbox accessible (clavier + tactile)
   - Formulaire : validation, date minimale, message de succès
   ===================================================================== */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* -------------------- Année footer -------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -------------------- Nav : état au scroll -------------------- */
  const nav = $("#nav");
  // Sentinelle invisible en haut de page : tant qu'elle est visible, nav "top".
  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:90px;pointer-events:none;";
  document.body.prepend(sentinel);

  const navObserver = new IntersectionObserver(
    ([entry]) => {
      nav.dataset.state = entry.isIntersecting ? "top" : "scrolled";
    },
    { rootMargin: "0px" }
  );
  navObserver.observe(sentinel);

  /* -------------------- Menu mobile -------------------- */
  const toggle = $("#navToggle");
  const mobileMenu = $("#mobileMenu");

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }

  toggle.addEventListener("click", () => {
    setMenu(!document.body.classList.contains("menu-open"));
  });

  $$(".mobile-menu__links a, .mobile-menu__foot a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false))
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });

  /* -------------------- Reveal au scroll -------------------- */
  const revealEls = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revObserver.observe(el));
  }

  /* -------------------- Lien de nav actif -------------------- */
  const navLinks = $$(".nav__links a");
  const linkById = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  const sections = $$("main section[id]").filter((s) => linkById.has(s.id));

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("is-active"));
            const link = linkById.get(entry.target.id);
            if (link) link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* -------------------- Galerie / Lightbox -------------------- */
  const items = $$(".gallery__item");
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbClose = $("#lbClose");
  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  let current = 0;
  let lastFocused = null;

  const sources = items.map((btn) => ({
    src: btn.dataset.full,
    alt: btn.querySelector("img") ? btn.querySelector("img").alt : "",
  }));

  function showImage(i) {
    current = (i + sources.length) % sources.length;
    lbImg.src = sources[current].src;
    lbImg.alt = sources[current].alt;
  }

  function openLightbox(i) {
    lastFocused = document.activeElement;
    showImage(i);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  items.forEach((btn, i) => btn.addEventListener("click", () => openLightbox(i)));
  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", () => showImage(current - 1));
  lbNext.addEventListener("click", () => showImage(current + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showImage(current - 1);
    if (e.key === "ArrowRight") showImage(current + 1);
  });

  // Glissement tactile dans la lightbox
  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showImage(current + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  /* -------------------- Formulaire de réservation -------------------- */
  const form = $("#reserveForm");
  const success = $("#formSuccess");

  // Date minimale = aujourd'hui
  const dateInput = $("#r-date");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
  }

  function validateField(field) {
    const input = field.querySelector("input, select, textarea");
    const errorEl = field.querySelector(".field__error");
    if (!input || !input.hasAttribute("required")) return true;

    let message = "";
    const value = input.value.trim();

    if (!value) {
      message = "Ce champ est requis.";
    } else if (input.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      message = "Adresse email invalide.";
    } else if (input.type === "tel" && value.replace(/[\s.\-+()]/g, "").length < 8) {
      message = "Numéro de téléphone invalide.";
    }

    field.classList.toggle("is-invalid", Boolean(message));
    if (errorEl) errorEl.textContent = message;
    return !message;
  }

  if (form) {
    $$(".field input, .field select, .field textarea", form).forEach((input) => {
      input.addEventListener("blur", () => validateField(input.closest(".field")));
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fields = $$(".field", form);
      let ok = true;
      fields.forEach((field) => {
        if (!validateField(field)) ok = false;
      });

      if (!ok) {
        const firstInvalid = form.querySelector(".field.is-invalid input, .field.is-invalid select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Pas de backend : on simule l'envoi et on confirme.
      form.querySelector('button[type="submit"]').disabled = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" });
      form.reset();
      setTimeout(() => {
        form.querySelector('button[type="submit"]').disabled = false;
      }, 4000);
    });
  }
})();
