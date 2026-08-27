"use client";

import { useEffect } from "react";

/** Activates Webflow tab widgets: clicking a `.w-tab-link` shows the matching
 *  `.w-tab-pane` by toggling the same classes Webflow's CSS keys off
 *  (`.w--current` on links, `.w--tab-active` on panes). This covers the
 *  Benefits tabs, the Pricing period tabs, and the FAQ accordion (where the
 *  "only one open" behaviour falls out of a single active pane). */
function activateTabs(root: ParentNode, signal: AbortSignal) {
  root.querySelectorAll<HTMLElement>(".w-tabs").forEach((group) => {
    const links = Array.from(group.querySelectorAll<HTMLElement>(".w-tab-link"));
    const panes = Array.from(group.querySelectorAll<HTMLElement>(".w-tab-pane"));
    if (links.length === 0) return;

    const select = (link: HTMLElement) => {
      const key = link.getAttribute("data-w-tab");
      links.forEach((l) => l.classList.toggle("w--current", l === link));
      panes.forEach((p) =>
        p.classList.toggle("w--tab-active", p.getAttribute("data-w-tab") === key),
      );
    };

    links.forEach((l) =>
      l.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          select(l);
        },
        { signal },
      ),
    );

    if (!panes.some((p) => p.classList.contains("w--tab-active"))) select(links[0]);
  });
}

/** Activates Webflow slider widgets: translates the mask and toggles dots. */
function activateSliders(root: ParentNode, signal: AbortSignal) {
  root.querySelectorAll<HTMLElement>(".w-slider").forEach((slider) => {
    const mask = slider.querySelector<HTMLElement>(".w-slider-mask");
    if (!mask) return;
    const slides = Array.from(mask.querySelectorAll<HTMLElement>(".w-slide"));
    if (slides.length === 0) return;

    const nav = slider.querySelector<HTMLElement>(".w-slider-nav");
    const dots: HTMLElement[] = [];
    if (nav) {
      if (nav.classList.contains("hide-element") && nav.children.length === 0) {
        slides.forEach((_, i) => {
          const dot = document.createElement("div");
          dot.className = "w-slider-dot";
          dot.addEventListener("click", () => go(i), { signal });
          nav.appendChild(dot);
          dots.push(dot);
        });
        nav.classList.remove("hide-element");
      } else {
        dots.push(...(Array.from(nav.children) as HTMLElement[]));
      }
    }

    let index = 0;
    mask.style.transition = "transform .5s ease";
    const go = (i: number) => {
      index = (i + slides.length) % slides.length;
      mask.style.transform = `translateX(${-index * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("w-active", di === index));
    };
    go(0);

    slider
      .querySelector<HTMLElement>(".w-slider-arrow-left")
      ?.addEventListener("click", () => go(index - 1), { signal });
    slider
      .querySelector<HTMLElement>(".w-slider-arrow-right")
      ?.addEventListener("click", () => go(index + 1), { signal });
  });
}

/** Adds a cursor-tracking 3D tilt to the use-case cards, matching the
 *  hover interaction on the reference site. The row supplies the
 *  `perspective` and the block keeps `transform-style: preserve-3d`, so the
 *  image (which carries `translateZ` on hover) lifts out of the card. */
function activateCardTilt(root: ParentNode, signal: AbortSignal) {
  const MAX = 9;
  root.querySelectorAll<HTMLElement>(".use-case-block").forEach((card) => {
    const onMove = (e: MouseEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateX(${-py * MAX * 2}deg) rotateY(${px * MAX * 2}deg)`;
    };
    const reset = () => {
      card.style.transform = "";
    };
    card.addEventListener("mousemove", onMove, { signal });
    card.addEventListener("mouseleave", reset, { signal });
  });
}

/** Wires the pricing Monthly/Yearly switch. Toggles the panes and the
 *  `is-yearly` class directly (rather than delegating to a synthetic link
 *  click) so it cannot be broken by another widget failing to initialise. */
function activatePricingToggle(root: ParentNode, signal: AbortSignal) {
  root.querySelectorAll<HTMLElement>(".tab-switch").forEach((sw) => {
    sw.style.cursor = "pointer";
    const tabs = sw.parentElement?.querySelector<HTMLElement>(".pricing-tabs");
    if (!tabs) return;
    const links = Array.from(tabs.querySelectorAll<HTMLElement>(".w-tab-link"));
    const panes = Array.from(tabs.querySelectorAll<HTMLElement>(".w-tab-pane"));
    if (links.length < 2 || panes.length < 2) return;

    const apply = (yearly: boolean) => {
      const active = yearly ? links[1] : links[0];
      const key = active.getAttribute("data-w-tab");
      links.forEach((l, i) => l.classList.toggle("w--current", i === (yearly ? 1 : 0)));
      panes.forEach((p) =>
        p.classList.toggle("w--tab-active", p.getAttribute("data-w-tab") === key),
      );
      sw.classList.toggle("is-yearly", yearly);
    };

    sw.addEventListener(
      "click",
      () => apply(!sw.classList.contains("is-yearly")),
      { signal },
    );
    links.forEach((l) =>
      l.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          apply(l === links[1]);
        },
        { signal },
      ),
    );
  });
}

export default function WebflowWidgets() {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const inits = [
      activateTabs,
      activateSliders,
      activatePricingToggle,
      activateCardTilt,
    ];
    for (const init of inits) {
      try {
        init(document, signal);
      } catch (err) {
        console.error("WebflowWidgets init failed:", err);
      }
    }
    return () => controller.abort();
  }, []);
  return null;
}
