import { PLANS } from "@/lib/billing/plans";
import type { Plan } from "@/lib/types";

const PLAN_ORDER: Plan[] = ["free", "starter", "professional", "business"];

const PLAN_META: Record<
  Plan,
  {
    label: string;
    color: "blue" | "green" | "orange" | "pink";
    ctaHref: "/signup";
  }
> = {
  free: { label: "Free", color: "blue", ctaHref: "/signup" },
  starter: { label: "Starter", color: "green", ctaHref: "/signup" },
  professional: { label: "Professional", color: "orange", ctaHref: "/signup" },
  business: { label: "Business", color: "pink", ctaHref: "/signup" },
};

const CHECK_SRC =
  "https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c91_check.svg";

function PricingCard({
  planId,
  interval,
}: {
  planId: Plan;
  interval: "monthly" | "yearly";
}) {
  const plan = PLANS[planId];
  const meta = PLAN_META[planId];
  const priceCents =
    interval === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const priceLabel = `$${priceCents / 100}`;
  const suffix = interval === "monthly" ? "/ month" : "/ mo";
  return (
    <div className="pricing-column">
      <div className="pricing-row">
        <div className="h4">{meta.label}</div>
        <div className={`per-month-pricing-wrapper ${meta.color}`}>
          <div className="body-small">
            {priceLabel}
            {suffix}
          </div>
        </div>
        <a
          href={meta.ctaHref}
          className="secondary-button equal-padding w-button"
        >
          Signup Now
        </a>
      </div>
      <div className="pricing-points-wrappper">
        {plan.features.map((feature) => (
          <div key={feature} className="point-wrappper">
            <img
              loading="lazy"
              src={CHECK_SRC}
              alt="check "
              className="check-icon"
            />
            <div>{feature}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="pricing-section">
      <div id="Pricing" className="anchor-div"></div>
      <div className="pricing-container">
        <h3 className="section-title-h2">Plans and Pricing</h3>
        <div className="pricing-tab-wrapper">
          <div className="tab-switch">
            <div className="switch-circle"></div>
          </div>
          <div
            data-current="Monthly"
            data-easing="ease"
            data-duration-in="300"
            data-duration-out="100"
            className="pricing-tabs w-tabs"
          >
            <div className="pricing-tab-menu w-tab-menu">
              <a
                data-w-tab="Monthly"
                data-w-id="06719ab1-ae93-3217-1a83-f7d710e7b18a"
                className="pricing-tab-left-link w-inline-block w-tab-link w--current"
              >
                <div className="body-medium">Monthly</div>
                <div className="pricing-tab-link-spacing"></div>
              </a>
              <a
                data-w-tab="Yearly"
                data-w-id="06719ab1-ae93-3217-1a83-f7d710e7b18d"
                className="pricing-tab-right-link w-inline-block w-tab-link"
              >
                <div className="pricing-tab-link-spacing"></div>
                <div className="body-medium">Yearly</div>
                <div className="saving-percentages-wrapper">
                  <div>Save 30%</div>
                </div>
              </a>
            </div>
            <div className="pricing-tab-content w-tab-content">
              <div
                data-w-tab="Monthly"
                className="pricing-tab-panel w-tab-pane w--tab-active"
              >
                <div className="pricing-columns-wrapper">
                  {PLAN_ORDER.map((planId) => (
                    <PricingCard
                      key={planId}
                      planId={planId}
                      interval="monthly"
                    />
                  ))}
                </div>
              </div>
              <div data-w-tab="Yearly" className="pricing-tab-panel w-tab-pane">
                <div className="pricing-columns-wrapper">
                  {PLAN_ORDER.map((planId) => (
                    <PricingCard
                      key={planId}
                      planId={planId}
                      interval="yearly"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
