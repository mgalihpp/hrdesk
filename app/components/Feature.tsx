"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Background per feature, taken from the Saasdesk brand palette (globals.css
 * §14.2) — these are exactly the colors the reference applies as you scroll the
 * feature section: PAYOUTS = orange, Recruitment = yellow, Payroll = pink.
 */
const FEATURE_BG = ["#fff3e6", "#f8ffe6", "#f4d4eb"];

export default function Feature() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const blocks = Array.from(
      root.querySelectorAll<HTMLElement>("[data-feature-index]"),
    );
    if (!("IntersectionObserver" in window) || blocks.length === 0) return;

    // A block is "active" only while it crosses the viewport middle, so exactly
    // one feature drives the sticky visual + section background at a time.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.featureIndex);
            setActive(idx);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    blocks.forEach((b) => {
      io.observe(b);
    });
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-w-id="ac979be1-8054-1f64-8065-d802f446a1b8"
      className="feature-section"
      style={{ backgroundColor: FEATURE_BG[active] }}
    >
      <div id="Feature" className="anchor-div" />
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="feature-scroll-wrapper">
          <div className="feature-block-images-wrapper">
            <img
              src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c73_Interactive%20element%201.webp"
              loading="lazy"
              width={600}
              height={600}
              alt=""
              className="interactive-element-1"
              style={{ opacity: active === 0 ? 1 : 0 }}
            />
            <div
              className="interactive-element-2"
              style={{ opacity: active === 1 ? 1 : 0 }}
            >
              <div className="widget">
                <img
                  width={55}
                  height={55}
                  alt=""
                  src="https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/651ab3d167ca2c62095e6ded_Vectors-Wrapper.svg"
                  loading="lazy"
                  className="widget-image"
                />
                <div>Interviewing Sofia Miller</div>
              </div>
            </div>
            <img
              src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c7d_Interactive%20element%203.webp"
              loading="lazy"
              width={600}
              height={600}
              alt=""
              className="interactive-element-3"
              style={{ opacity: active === 2 ? 1 : 0 }}
            />
          </div>
          <div className="feature-block-container">
            <div className="feature-spacing" />
            <div className="feature-block" data-feature-index={0}>
              <img
                src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c73_Interactive%20element%201.webp"
                loading="lazy"
                width={600}
                height={600}
                alt=""
                className="feature-block-image"
              />
              <div className="feature-block-text-wrapper">
                <div className="tag white-font-color">
                  <div className="upper-heading">PAYOUTS</div>
                </div>
                <h3 className="h2">
                  Automate payroll processing, tax calculations
                </h3>
                <div className="feature-block-para">
                  <p className="body-large">
                    Saasland HR provides cost-effective HR solutions for{" "}
                    <span className="heading-font-color">
                      startups and SMBs
                    </span>
                    , helping them establish efficient{" "}
                    <span className="heading-font-color">HR operations</span>,
                    manage growing teams.
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-spacing" />
            <div className="feature-spacing" />
            <div className="feature-block" data-feature-index={1}>
              <img
                src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c7c_Interactive%20element%202.webp"
                loading="lazy"
                width={600}
                height={600}
                alt=""
                className="feature-block-image"
              />
              <div className="feature-block-text-wrapper">
                <div className="tag white-font-color">
                  <div className="upper-heading">Recruitment</div>
                </div>
                <h3 className="h2">
                  Interviews and assessments within platform
                </h3>
                <div className="feature-block-para">
                  <p className="body-large">
                    Recruitment firms can utilize Saasland HR to{" "}
                    <span className="heading-font-color">
                      streamline candidate
                    </span>{" "}
                    management, track placements, and
                    <span className="heading-font-color">
                      {" "}
                      enhance communication
                    </span>{" "}
                    between clients, candidates.
                  </p>
                </div>
              </div>
            </div>
            <div className="feature-spacing" />
            <div className="feature-spacing" />
            <div className="feature-block" data-feature-index={2}>
              <img
                src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c7d_Interactive%20element%203.webp"
                loading="lazy"
                width={600}
                height={600}
                alt=""
                className="feature-block-image"
              />
              <div className="feature-block-text-wrapper">
                <div className="tag white-font-color">
                  <div className="upper-heading">Payroll</div>
                </div>
                <h3 className="h2">Generate payroll reports and pay stubs</h3>
                <div className="feature-block-para">
                  <p className="body-large">
                    Non-profits can use Saasland HR to effectively
                    <span className="heading-font-color">
                      {" "}
                      manage volunteer
                    </span>{" "}
                    programs, track donor contributions, and maintain compliance
                    with <span className="heading-font-color">non-profit</span>{" "}
                    regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
