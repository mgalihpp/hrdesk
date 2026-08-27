import { BENEFITS } from "@/lib/benefits";

export default function Benefits() {
  return (
    <section className="benefits-section">
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="benefits-container">
          <div className="benefits-heading-wrapper">
            <div className="upper-heading">TOP BENEFITS</div>
            <h2 className="section-title-h2">
              Saasland HR is a cutting-edge, cloud-based Human Resources Management
              Software designed to streamline.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.id}
                className="flex flex-col gap-4 rounded-[30px] border border-border bg-card p-8"
              >
                <img
                  width={24}
                  height={24}
                  alt=""
                  src={benefit.icon}
                  loading="lazy"
                  className="benefits-tab-link-icon"
                />
                <div className="h6">{benefit.label}</div>
                <p className="body-small text-body">
                  Saasland HR provides cost-effective HR solutions for{" "}
                  <span className="heading-font-color">startups and SMBs</span>, helping
                  them establish efficient
                  <span className="heading-font-color"> HR operations</span>, manage
                  growing teams.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
