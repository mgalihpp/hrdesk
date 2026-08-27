"use client";

import { useState } from "react";

type BenefitTab = {
  id: string;
  title: string;
  icon: string;
  last?: boolean;
};

const TABS: BenefitTab[] = [
  {
    id: "Tab 1",
    title: "Set and track employee goals",
    icon: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6517e8fb5b776fa13165c4a6_Vectors-Wrapper.svg",
  },
  {
    id: "Tab 2",
    title: "Automate payroll processing",
    icon: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6517e8fd918135f76f4829b9_Vectors-Wrapper.svg",
  },
  {
    id: "Tab 3",
    title: "Track employee attendance",
    icon: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6517e8fd06ecafe37b7ad9fa_Vectors-Wrapper.svg",
  },
  {
    id: "Tab 4",
    title: "Time tracking solutions",
    icon: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6517e8fe226e832cc1555a91_Vectors-Wrapper.svg",
    last: true,
  },
];

const PANE_IMAGE =
  "https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c7a_Benefit%20tab%20image.webp";
const PANE_WIDGET =
  "https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c79_benefit%20widget.webp";

export default function Benefits() {
  const [active, setActive] = useState("Tab 1");

  return (
    <section className="benefits-section">
      <div id="Benefits" className="anchor-div"></div>
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="benefits-container">
          <div className="benefits-heading-wrapper">
            <div className="upper-heading">TOP BENEFITS</div>
            <h2 className="section-title-h2">
              Saasland HR is a cutting-edge, cloud-based Human Resources Management
              Software designed to streamline.
            </h2>
          </div>
          <div
            data-current={active}
            data-easing="ease"
            data-duration-in="300"
            data-duration-out="100"
            className="benefits-tab w-tabs"
          >
            <div className="benefits-tab-menu w-tab-menu" role="tablist">
              {TABS.map((tab) => {
                const isActive = active === tab.id;
                return (
                  <a
                    key={tab.id}
                    data-w-tab={tab.id}
                    href="#"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={(e) => {
                      e.preventDefault();
                      setActive(tab.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActive(tab.id);
                      }
                    }}
                    className={
                      "benefits-tab-menu-link w-inline-block w-tab-link" +
                      (isActive ? " w--current" : "") +
                      (tab.last ? " without-border" : "")
                    }
                  >
                    <div className="benefits-tab-link-title-wrapper">
                      <img
                        width="24"
                        height="24"
                        alt=""
                        src={tab.icon}
                        loading="lazy"
                        className="benefits-tab-link-icon"
                      />
                      <div className="h6">{tab.title}</div>
                    </div>
                    <div className="benefits-tab-link-para-wrapper">
                      <div className="_20px-spacing"></div>
                      <p className="body-small">
                        Saasland HR provides cost-effective HR solutions for{" "}
                        <span className="heading-font-color">startups and SMBs</span>,
                        helping them establish efficient
                        <span className="heading-font-color"> HR operations</span>,
                        manage growing teams.
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
            <div className="benefits-tabs-content w-tab-content">
              {TABS.map((tab) => {
                const isActive = active === tab.id;
                return (
                  <div
                    key={tab.id}
                    data-w-tab={tab.id}
                    role="tabpanel"
                    className={
                      "benefits-tab-pane w-tab-pane" +
                      (isActive ? " w--tab-active" : "")
                    }
                  >
                    <div className="benefits-tab-pane-wrapper">
                      <div className="benefits-tab-image-wrapper">
                        <img
                          src={PANE_IMAGE}
                          loading="lazy"
                          width="800"
                          height="621"
                          alt=""
                          sizes="(max-width: 767px) 88vw, (max-width: 991px) 77vw, (max-width: 1279px) 45vw, 575px"
                          className="benefits-tab-image"
                        />
                        <img
                          src={PANE_WIDGET}
                          loading="lazy"
                          alt="benefit widget"
                          className="benefit-widget"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
