"use client";

import { useEffect } from "react";

/**
 * Approximates Webflow's IX2 scroll-entrance animations. Webflow marks every
 * animated node with `data-w-id`; we fade/slide those in on intersect.
 * Initial hidden state is gated on `.ix-ready` (added here) so no-JS users
 * still see content.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ix-ready");

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-w-id]:not([role="banner"])',
      ),
    );

    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("ix-reveal", "ix-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("ix-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    targets.forEach((t) => {
      t.classList.add("ix-reveal");
      io.observe(t);
    });

    return () => io.disconnect();
  }, []);

  return null;
}
