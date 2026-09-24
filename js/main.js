document.addEventListener("DOMContentLoaded", () => {
  // AOS
  if (typeof AOS !== "undefined") {
    AOS.init();
  }

  // Mobile menu
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("menuIconOpen");
  const iconClose = document.getElementById("menuIconClose");

  const toggleMenu = () => {
    if (!mobileMenu) return;
    const isOpen = !mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", isOpen);
    if (iconOpen) iconOpen.classList.toggle("hidden", !isOpen);
    if (iconClose) iconClose.classList.toggle("hidden", isOpen);
  };

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  document.querySelectorAll("#mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenu && !mobileMenu.classList.contains("hidden")) toggleMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!menuToggle || !mobileMenu) return;
    const isClickInside =
      menuToggle.contains(event.target) || mobileMenu.contains(event.target);
    if (!isClickInside && !mobileMenu.classList.contains("hidden")) {
      toggleMenu();
    }
  });

  // Active nav underline (scroll spy + sliding line)
  const desktopNav = document.getElementById("desktop-nav");
  const indicator = document.getElementById("nav-indicator");
  const desktopLinks = Array.from(document.querySelectorAll("#desktop-nav .nav-link"));
  const mobileLinks = Array.from(document.querySelectorAll(".nav-link-mobile"));
  const sectionIds = ["home", "about", "services", "staff", "training", "contact"];
  let activeSection = "";
  let indicatorBootstrapped = false;

  const placeIndicator = (link, { expand = false } = {}) => {
    if (!desktopNav || !indicator || !link) {
      if (indicator) {
        indicator.classList.remove("is-visible", "is-ready");
      }
      return;
    }

    const label = link.querySelector(".nav-label") || link;
    const navRect = desktopNav.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const left = labelRect.left - navRect.left;
    const width = labelRect.width;
    const top = labelRect.bottom - navRect.top + 3;

    if (expand) {
      indicator.style.transition = "none";
      indicator.classList.remove("is-ready");
      indicator.style.top = `${top}px`;
      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
      indicator.style.transform = "scaleX(0)";
      indicator.classList.add("is-visible");
      void indicator.offsetWidth;
      indicator.style.transition = "";
      requestAnimationFrame(() => {
        indicator.classList.add("is-ready");
        indicator.style.transform = "";
      });
      return;
    }

    indicator.style.top = `${top}px`;
    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
    indicator.classList.add("is-visible", "is-ready");
    indicator.style.transform = "";
  };

  const setActiveSection = (id) => {
    if (!id) return;

    const changed = id !== activeSection;
    const firstPaint = !indicatorBootstrapped;
    activeSection = id;

    desktopLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.section === id);
    });

    mobileLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.section === id);
    });

    const activeLink = desktopLinks.find((l) => l.dataset.section === id);
    if (activeLink) {
      if (firstPaint) {
        indicatorBootstrapped = true;
        placeIndicator(activeLink, { expand: true });
      } else if (changed) {
        placeIndicator(activeLink, { expand: false });
      }
    } else if (changed) {
      indicator?.classList.remove("is-visible", "is-ready");
    }
  };

  // ——— Top email bar + scroll / nav ————————————————————————————————
  const topBar = document.getElementById("top-bar");
  const siteHeader = document.getElementById("site-header");
  const headerSlide = document.getElementById("header-slide");
  const siteNav = siteHeader ? siteHeader.querySelector("header") : null;
  const topBarMq = window.matchMedia("(min-width: 900px)");

  const canShowTopBar = () =>
    !!(topBar && headerSlide && siteHeader && topBarMq.matches);

  let lastScrollY = window.scrollY || 0;
  let spyLockUntil = 0;
  let layoutQuietUntil = 0;
  let programmaticScroll = false;
  let scrollTimer = 0;
  let headerCompact = false;
  let measuredTopBarH = 36;
  let pinnedNavSection = null; // clicked section stays active until user scrolls manually
  let pinnedReleaseY = null;

  const getScrollY = () => window.scrollY || document.documentElement.scrollTop || 0;
  const getNavHeight = () => (siteNav ? siteNav.offsetHeight : 68);

  const measureTopBarHeight = () => {
    if (!topBar || !topBarMq.matches) {
      measuredTopBarH = 0;
      return 0;
    }
    // Read natural height while expanded (temporarily clear compact transform)
    const wasCompact = headerCompact;
    if (wasCompact && headerSlide) {
      headerSlide.style.transition = "none";
      headerSlide.style.transform = "translateY(0)";
      if (siteHeader) siteHeader.style.height = "";
    }
    measuredTopBarH = topBar.offsetHeight || 36;
    if (wasCompact && headerSlide) {
      headerSlide.style.transform = `translateY(-${measuredTopBarH}px)`;
      if (siteHeader) siteHeader.style.height = `${getNavHeight()}px`;
      void headerSlide.offsetHeight;
      headerSlide.style.transition = "";
    }
    return measuredTopBarH;
  };

  const getHeaderOffset = () => {
    const navH = getNavHeight();
    if (!canShowTopBar() || headerCompact) return navH;
    return navH + measuredTopBarH;
  };

  const syncHeaderHeightVar = () => {
    document.documentElement.style.setProperty("--site-header-height", `${getHeaderOffset()}px`);
  };

  const applyHeaderLayout = (compact) => {
    if (!siteHeader || !headerSlide) return;
    const navH = getNavHeight();

    if (!canShowTopBar()) {
      headerCompact = false;
      headerSlide.style.transform = "translateY(0)";
      siteHeader.style.height = `${navH}px`;
      syncHeaderHeightVar();
      return;
    }

    const topH = measuredTopBarH || measureTopBarHeight() || 36;
    headerCompact = compact;

    if (compact) {
      // Slide email bar up and out; sticky box shrinks to navbar only → nav at top:0
      siteHeader.style.height = `${navH}px`;
      headerSlide.style.transform = `translateY(-${topH}px)`;
    } else {
      siteHeader.style.height = `${navH + topH}px`;
      headerSlide.style.transform = "translateY(0)";
    }
    syncHeaderHeightVar();
  };

  const setTopBarCollapsed = (collapsed) => {
    if (!canShowTopBar()) return;
    if (headerCompact === collapsed) return;

    layoutQuietUntil = Date.now() + 360;
    lastScrollY = getScrollY();
    applyHeaderLayout(collapsed);
  };

  const syncTopBarOnScroll = () => {
    if (!canShowTopBar() && !pinnedNavSection) return;

    const y = getScrollY();

    if (programmaticScroll || Date.now() < layoutQuietUntil) {
      lastScrollY = y;
      return;
    }

    const delta = y - lastScrollY;
    lastScrollY = y;

    // First real manual scroll after a nav jump — release the pinned active item
    if (pinnedNavSection && pinnedReleaseY != null && Math.abs(y - pinnedReleaseY) >= 12) {
      pinnedNavSection = null;
      pinnedReleaseY = null;
    }

    if (!canShowTopBar()) return;

    if (y <= 16) {
      setTopBarCollapsed(false);
      return;
    }

    if (delta >= 8) setTopBarCollapsed(true);
    else if (delta <= -8) setTopBarCollapsed(false);
  };

  const getActiveFromScroll = () => {
    const y = getScrollY();
    if (y < 20) return "home";

    const line = getHeaderOffset() + 24;
    let current = "home";
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= line) current = id;
    }
    return current;
  };

  const syncActiveNav = () => {
    // Nav click wins until the user scrolls themselves
    if (pinnedNavSection) {
      setActiveSection(pinnedNavSection);
      return;
    }
    if (Date.now() < spyLockUntil) return;
    setActiveSection(getActiveFromScroll());
  };

  const endProgrammaticScroll = (showTopBarAfter) => {
    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = 0;
    }
    programmaticScroll = false;
    if (showTopBarAfter) setTopBarCollapsed(false);
    // Reinforce clicked item; release pin only after user moves
    if (pinnedNavSection) setActiveSection(pinnedNavSection);
    pinnedReleaseY = getScrollY();
    lastScrollY = pinnedReleaseY;
    layoutQuietUntil = Date.now() + 200;
  };

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    if (scrollTimer) {
      clearTimeout(scrollTimer);
      scrollTimer = 0;
    }

    const start = getScrollY();
    // Always aim with navbar height only — expanding the email bar before an
    // upward jump overshoots and the spy lights the section above
    const destination = Math.max(
      0,
      target.getBoundingClientRect().top + start - getNavHeight()
    );
    const goingUp = destination < start - 24;
    const goingDown = destination > start + 24;
    const nearTop = id === "home" || destination <= 16;
    const showBarAfter = nearTop || goingUp;

    // Hide bar before scrolling down; show bar only AFTER scrolling up lands
    if (goingDown) setTopBarCollapsed(true);

    const distance = destination - start;

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || Math.abs(distance) < 2) {
      document.documentElement.scrollTop = destination;
      endProgrammaticScroll(showBarAfter);
      return;
    }

    programmaticScroll = true;
    const duration = Math.min(800, Math.max(320, Math.abs(distance) * 0.35));
    const startTime = performance.now();

    const tick = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      document.documentElement.scrollTop = start + distance * eased;
      if (t < 1) {
        scrollTimer = setTimeout(tick, 16);
      } else {
        document.documentElement.scrollTop = destination;
        endProgrammaticScroll(showBarAfter);
      }
    };

    scrollTimer = setTimeout(tick, 0);
  };

  const handleNavClick = (event) => {
    const link = event.currentTarget;
    const id = link.dataset.section;
    if (!id || id === "ai") return;
    if (!document.getElementById(id)) return;

    event.preventDefault();
    event.stopPropagation();

    pinnedNavSection = id;
    pinnedReleaseY = null;
    spyLockUntil = Date.now() + 1000;
    setActiveSection(id);
    scrollToSection(id);
    history.replaceState(null, "", `#${id}`);
  };

  desktopLinks.forEach((link) => link.addEventListener("click", handleNavClick, true));
  mobileLinks.forEach((link) => link.addEventListener("click", handleNavClick, true));
  document.querySelectorAll(".nav-link-contact").forEach((link) => {
    link.addEventListener("click", handleNavClick, true);
  });

  const refreshHeaderMetrics = () => {
    measureTopBarHeight();
    applyHeaderLayout(headerCompact);
    const activeLink = desktopLinks.find((l) => l.dataset.section === activeSection);
    if (activeLink) placeIndicator(activeLink, { expand: false });
  };

  window.addEventListener("resize", refreshHeaderMetrics);
  if (typeof topBarMq.addEventListener === "function") {
    topBarMq.addEventListener("change", refreshHeaderMetrics);
  } else if (typeof topBarMq.addListener === "function") {
    topBarMq.addListener(refreshHeaderMetrics);
  }

  let hasBootedHome = false;
  const bootToHome = () => {
    if (hasBootedHome) return false;
    hasBootedHome = true;
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    measureTopBarHeight();
    applyHeaderLayout(false);
    setActiveSection("home");
    lastScrollY = 0;
    programmaticScroll = false;
    spyLockUntil = 0;
    layoutQuietUntil = 0;
    pinnedNavSection = null;
    pinnedReleaseY = null;
    return true;
  };

  measureTopBarHeight();
  applyHeaderLayout(false);
  bootToHome();

  let spyEnabled = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!spyEnabled) return;
      syncTopBarOnScroll();
      syncActiveNav();
    },
    { passive: true }
  );
  window.addEventListener("hashchange", () => {
    if (!spyEnabled) return;
    if (Date.now() < spyLockUntil) return;
    syncActiveNav();
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      measureTopBarHeight();
      applyHeaderLayout(false);
      spyEnabled = true;
      lastScrollY = getScrollY();
      const activeLink = desktopLinks.find((l) => l.dataset.section === activeSection);
      if (activeLink) placeIndicator(activeLink, { expand: false });
    });
  });

  window.addEventListener("load", () => {
    measureTopBarHeight();
    applyHeaderLayout(headerCompact);
    spyEnabled = true;
    lastScrollY = getScrollY();
  });

  // Team modal
  const teamModal = document.getElementById("teamModal");
  const closeTeamModal = document.getElementById("closeModal");
  const modalName = document.getElementById("modalName");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");

  document.querySelectorAll(".open-modal").forEach((button) => {
    button.addEventListener("click", () => {
      if (!teamModal) return;
      modalName.textContent = button.getAttribute("data-name") || "";
      modalTitle.textContent = button.getAttribute("data-title") || "";
      modalDescription.textContent = button.getAttribute("data-description") || "";
      teamModal.classList.remove("hidden");
      teamModal.classList.add("flex");
      document.body.style.overflow = "hidden";
    });
  });

  const closeTeam = () => {
    if (!teamModal) return;
    teamModal.classList.remove("flex");
    teamModal.classList.add("hidden");
    document.body.style.overflow = "auto";
  };

  if (closeTeamModal) closeTeamModal.addEventListener("click", closeTeam);

  if (teamModal) {
    teamModal.addEventListener("click", (e) => {
      if (e.target === teamModal) closeTeam();
    });
  }

  // AI Integration modal (#ai)
  const aiModal = document.getElementById("aiModal");
  const closeAiModalBtn = document.getElementById("closeAiModal");

  const openAiModal = () => {
    if (!aiModal) return;
    aiModal.classList.remove("hidden");
    aiModal.classList.add("flex");
    document.body.style.overflow = "hidden";
  };

  const closeAiModal = () => {
    if (!aiModal) return;
    aiModal.classList.remove("flex");
    aiModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    history.replaceState(null, null, " ");
    syncActiveNav();
  };

  const checkAiHash = () => {
    if (window.location.hash === "#ai") openAiModal();
  };

  checkAiHash();
  window.addEventListener("hashchange", checkAiHash);

  if (closeAiModalBtn) closeAiModalBtn.addEventListener("click", closeAiModal);

  if (aiModal) {
    aiModal.addEventListener("click", (e) => {
      if (e.target === aiModal) closeAiModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (teamModal && !teamModal.classList.contains("hidden")) closeTeam();
    if (aiModal && !aiModal.classList.contains("hidden")) closeAiModal();
  });
});
