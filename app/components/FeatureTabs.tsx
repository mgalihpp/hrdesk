"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { BENEFITS } from "@/lib/benefits";

type DescriptionSegment = { text: string; highlight?: boolean };

// §3.2 boilerplate — identical for all four benefits in the reference.
const DESCRIPTION: DescriptionSegment[] = [
  { text: "Saasland HR provides cost-effective HR solutions for " },
  { text: "startups and SMBs", highlight: true },
  { text: ", helping them establish efficient" },
  { text: " HR operations", highlight: true },
  { text: ", manage growing teams." },
];

type BenefitTab = {
  id: string;
  label: string;
  icon: string;
  image: string;
  widget?: string;
};

// Each tab swaps to a distinct screen mockup. Tab 1 uses the Benefit tab image
// with the floating benefit widget; tabs 2-4 use Interactive element 1/2/3.
const TABS: BenefitTab[] = BENEFITS.map((benefit, i) => ({
  ...benefit,
  image: i === 0 ? "/benefit-tab-image.webp" : `/interactive-element-${i}.webp`,
  widget: i === 0 ? "/benefit-widget.webp" : undefined,
}));

export default function FeatureTabs() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const select = (index: number) => {
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        select((index + 1) % TABS.length);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        select((index - 1 + TABS.length) % TABS.length);
        break;
      case "Home":
        event.preventDefault();
        select(0);
        break;
      case "End":
        event.preventDefault();
        select(TABS.length - 1);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        setActive(index);
        break;
    }
  };

  return (
    <section
      className="w-layout-blockcontainer main-container w-container"
      style={{ paddingBlock: "var(--spacing-section)" }}
    >
      <div className="benefits-tab w-tabs" data-current={`Tab ${active + 1}`}>
        <div
          className="benefits-tab-menu w-tab-menu"
          role="tablist"
          aria-label="Benefit features"
        >
          {TABS.map((tab, index) => {
            const isActive = index === active;
            const tabId = `benefit-tab-${tab.id}`;
            const paneId = `benefit-pane-${tab.id}`;
            return (
              <a
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                href={`#${paneId}`}
                className={`benefits-tab-menu-link w-inline-block w-tab-link${isActive ? " w--current" : ""}${index === TABS.length - 1 ? " without-border" : ""}`}
                id={tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={paneId}
                tabIndex={isActive ? 0 : -1}
                onClick={(event) => {
                  event.preventDefault();
                  setActive(index);
                }}
                onKeyDown={(event) => onKeyDown(event, index)}
              >
                <div className="benefits-tab-link-title-wrapper">
                  <img
                    width={24}
                    height={24}
                    alt=""
                    src={tab.icon}
                    loading="lazy"
                    className="benefits-tab-link-icon"
                  />
                  <div className={isActive ? "h6 text-brand" : "h6"}>{tab.label}</div>
                </div>
                {isActive && (
                  <div
                    className="benefits-tab-link-para-wrapper"
                    style={{ width: "100%", display: "block" }}
                  >
                    <div className="_20px-spacing" />
                    <p className="body-small">
                      {DESCRIPTION.map((segment) =>
                        segment.highlight ? (
                          <span className="heading-font-color" key={segment.text}>
                            {segment.text}
                          </span>
                        ) : (
                          <span key={segment.text}>{segment.text}</span>
                        ),
                      )}
                    </p>
                  </div>
                )}
              </a>
            );
          })}
        </div>

        <div className="benefits-tabs-content w-tab-content">
          {TABS.map((tab, index) => {
            const isActive = index === active;
            const paneId = `benefit-pane-${tab.id}`;
            return (
              <div
                key={tab.id}
                data-w-tab={`Tab ${index + 1}`}
                className={`benefits-tab-pane w-tab-pane${isActive ? " w--tab-active" : ""}`}
                id={paneId}
                role="tabpanel"
                aria-labelledby={`benefit-tab-${tab.id}`}
              >
                <div className="benefits-tab-pane-wrapper">
                  <div className="benefits-tab-image-wrapper">
                    <img
                      src={tab.image}
                      loading="lazy"
                      width={tab.widget ? 800 : 600}
                      height={tab.widget ? 621 : 600}
                      alt=""
                      className="benefits-tab-image"
                    />
                    {tab.widget && (
                      <img
                        src={tab.widget}
                        loading="lazy"
                        alt="benefit widget"
                        className="benefit-widget"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
