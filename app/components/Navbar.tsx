"use client";

import { useEffect, useRef, useState } from "react";

const NAV_SECTIONS = [
  "Home",
  "Benefits",
  "Feature",
  "Use-Cases",
  "Integrations",
  "Pricing",
] as const;
type SectionId = (typeof NAV_SECTIONS)[number];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<SectionId>("Home");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: SectionId,
  ) => {
    e.preventDefault();
    const anchor = document.getElementById(id);
    const target = (anchor?.closest("section") as HTMLElement | null) ?? anchor;
    if (target) {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";
      const NAV_OFFSET = 88;
      const top =
        target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top, behavior });
      history.pushState(null, "", `#${id}`);
    }
    setActive(id);
    setOpen(false);
  };

  useEffect(() => {
    const onScroll = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const offset = Math.min(window.scrollY * 0.6, 40);
      el.style.transform = `translateY(${-offset}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const sections: { id: SectionId; el: Element }[] = [];
    for (const id of NAV_SECTIONS) {
      const el = document.getElementById(id)?.closest("section");
      if (el) sections.push({ id, el });
    }
    if (sections.length === 0) return;
    const idByEl = new Map(sections.map((s) => [s.el, s.id]));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = idByEl.get(entry.target);
          if (id) setActive(id);
        }
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      observer.observe(s.el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="navbar-wrapper" ref={wrapperRef}>
      <div className="header">
        <div className="header-container w-container">
          <div className="header-wrapper">
            <div className="header-left">
              <a href="#Home" className="header-link w-inline-block">
                <div>Support</div>
              </a>
              <div className="divider-circle" />
              <a href="#Home" className="header-link w-inline-block">
                <div>Privacy</div>
              </a>
            </div>
            <div className="header-right">
              <div className="header-app-links-wrapper">
                <div>App available on</div>
                <a
                  href="https://www.apple.com/in/app-store/"
                  target="_blank"
                  rel="noreferrer"
                  className="header-app-link w-inline-block"
                >
                  <div className="header-app-embed w-embed">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.72653 6.01899C8.99653 6.01899 7.86651 5.18899 6.67651 5.21899C5.10651 5.23899 3.66651 6.12899 2.85651 7.53899C1.22651 10.369 2.43651 14.549 4.02651 16.849C4.80651 17.969 5.72651 19.229 6.94651 19.189C8.11651 19.139 8.55653 18.429 9.97653 18.429C11.3865 18.429 11.7865 19.189 13.0265 19.159C14.2865 19.139 15.0865 18.019 15.8565 16.889C16.7465 15.589 17.1165 14.329 17.1365 14.259C17.1065 14.249 14.6865 13.319 14.6565 10.519C14.6365 8.17899 16.5665 7.05899 16.6565 7.00899C15.5565 5.39899 13.8665 5.21899 13.2765 5.17899C11.7365 5.05899 10.4465 6.01899 9.72653 6.01899ZM12.3265 3.65899C12.9765 2.87899 13.4065 1.78899 13.2865 0.708984C12.3565 0.748984 11.2365 1.32899 10.5665 2.10899C9.96653 2.79899 9.44653 3.90899 9.58653 4.96899C10.6165 5.04899 11.6765 4.43899 12.3265 3.65899Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </a>
                <a
                  href="https://play.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="header-app-link w-inline-block"
                >
                  <div className="header-app-embed w-embed">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.00728 1.51172L11.4934 10.0001L3.0082 18.4888C2.84732 18.4208 2.7064 18.3018 2.61214 18.139C2.53868 18.0121 2.5 17.8681 2.5 17.7214V2.27886C2.5 1.93433 2.70908 1.63863 3.00728 1.51172ZM12.0825 10.5893L14.0008 12.5076L4.88667 17.7851L12.0825 10.5893ZM14.7483 7.92422L17.0876 9.279C17.4859 9.50958 17.6219 10.0194 17.3913 10.4177C17.3183 10.5437 17.2137 10.6484 17.0876 10.7213L14.7475 12.0759L12.6717 10.0001L14.7483 7.92422ZM4.88667 2.21505L14.0017 7.49172L12.0825 9.41092L4.88667 2.21505Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div data-collapse="medium" role="banner" className="navbar w-nav">
        <div className="overlay" />
        <div className="nav-container">
          <a
            href="/"
            aria-current="page"
            className="nav-logo w-inline-block w--current"
          >
            <img
              src="/saasdesk-logo.svg"
              alt="Saasdesk"
              className="mobile-nav-logo"
            />
          </a>

          <nav
            role="navigation"
            className={`nav-menu w-nav-menu${open ? " w--open" : ""}`}
          >
            <div className="nav-menu-wrapper">
              <a
                href="/"
                aria-current="page"
                className="brand w-nav-brand w--current"
              >
                <img src="/saasdesk-logo.svg" alt="Saasdesk" className="logo" />
              </a>
              <div className="nav-links">
                <a
                  href="#Home"
                  onClick={(e) => scrollToSection(e, "Home")}
                  className={`nav-link w-nav-link${active === "Home" ? " w--current" : ""}`}
                >
                  Home
                </a>
                <a
                  href="#Benefits"
                  onClick={(e) => scrollToSection(e, "Benefits")}
                  className={`nav-link w-nav-link${active === "Benefits" ? " w--current" : ""}`}
                >
                  Benefits
                </a>
                <a
                  href="#Feature"
                  onClick={(e) => scrollToSection(e, "Feature")}
                  className={`nav-link w-nav-link${active === "Feature" ? " w--current" : ""}`}
                >
                  Features
                </a>
                <a
                  href="#Use-Cases"
                  onClick={(e) => scrollToSection(e, "Use-Cases")}
                  className={`nav-link w-nav-link${active === "Use-Cases" ? " w--current" : ""}`}
                >
                  Use Cases
                </a>
                <a
                  href="#Integrations"
                  onClick={(e) => scrollToSection(e, "Integrations")}
                  className={`nav-link w-nav-link${active === "Integrations" ? " w--current" : ""}`}
                >
                  Integrations
                </a>
                <a
                  href="#Pricing"
                  onClick={(e) => scrollToSection(e, "Pricing")}
                  className={`nav-link w-nav-link${active === "Pricing" ? " w--current" : ""}`}
                >
                  Pricing
                </a>
              </div>
              <div className="nav-buttons">
                <a
                  href="/login"
                  className="nav-link change-font-color w-nav-link"
                >
                  Login
                </a>
                <div className="nav-btn">
                  <a
                    href="/signup"
                    className="secondary-button equal-padding w-button"
                  >
                    Signup
                  </a>
                </div>
              </div>
            </div>
          </nav>

          <div
            role="button"
            tabIndex={0}
            aria-label="Toggle menu"
            aria-expanded={open}
            className={`menu-button w-nav-button${open ? " w--open" : ""}`}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((v) => !v);
              }
            }}
          >
            <div className="menu-button-elements">
              <div className="menu-button-line" />
              <div className="menu-button-line" />
              <div className="menu-button-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
