export default function Hero() {
  return (
    <section id="Home" className="home-hero-section">
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="home-hero-container">
          <div className="home-hero-text-wrapper">
            <div className="home-hero-heading">
              <h1 className="display-h1">
                All-in-one <span className="yellow-highlighted-text">Payroll</span>{" "}
                and <span className="pink-highlighted-text">HR</span> System for small
                team
              </h1>
            </div>
            <div className="home-hero-para-wrapper">
              <p className="body-large">
                Helping them establish efficient{" "}
                <span className="heading-font-color">HR operations</span>, manage
                growing teams, and{" "}
                <span className="heading-font-color">stay compliant.</span>
              </p>
              <div className="button-and-cc-details-wrapper">
                <a href="#Home" className="primary-button w-inline-block">
                  <div className="button-arrow-wrapper">
                    <div className="button-arrow-bg white-bg" />
                    <div className="button-arrow-embed w-embed">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.2298 4.29312L1.62319 12.8997L0.208984 11.4855L8.81557 2.87891H1.2298V0.878906H12.2298V11.8789H10.2298V4.29312Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="button-text">Start 14-day free trial</div>
                </a>
                <div className="body-small body-font-color">
                  *No credit card required
                </div>
              </div>
            </div>
          </div>

          <div className="home-hero-image-wrapper">
            <img
              src="/hero-image.webp"
              loading="lazy"
              width={1176}
              height={674}
              alt=""
              className="home-hero-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
