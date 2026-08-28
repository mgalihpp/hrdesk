type Logo = { src: string; w: number; h: number };

const ROW1_LOGOS: Logo[] = [
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6533867ef1b0b57061825892_Vectors-Wrapper.svg",
    w: 40,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6533867faa4e09c88d98dc25_Vectors-Wrapper.svg",
    w: 121,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6533867fa80e389848da8e06_Vectors-Wrapper.svg",
    w: 40,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338680eb4eec1297b4c264_Vectors-Wrapper.svg",
    w: 46,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338681aa4e09c88d98de10_Vectors-Wrapper.svg",
    w: 40,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6533868254b39b4304aab6ab_Vectors-Wrapper.svg",
    w: 167,
    h: 29,
  },
];

const ROW2_LOGOS: Logo[] = [
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338682455497444de3a414_Vectors-Wrapper.svg",
    w: 53,
    h: 29,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/653386836dda6598f5e0cf31_Vectors-Wrapper.svg",
    w: 156,
    h: 29,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338683e175b0066c274403_Vectors-Wrapper.svg",
    w: 40,
    h: 26,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338684f53438c9616b9b55_Group-2.svg",
    w: 149,
    h: 32,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/6533868555bfcabe242fd0f0_Vectors-Wrapper.svg",
    w: 40,
    h: 40,
  },
  {
    src: "https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/65338685cac485f8d3c94f85_Group-9495.svg",
    w: 157,
    h: 33,
  },
];

// Repeated enough that one half of the track always exceeds the viewport,
// so the -50% loop is seamless at any common width.
const REPEAT = 4;

function LogoTile({ logo }: { logo: Logo }) {
  return (
    <div className="client-logo-wrapper">
      <img
        src={logo.src}
        alt=""
        width={logo.w}
        height={logo.h}
        loading="eager"
        decoding="async"
        className="client-logo-img"
      />
    </div>
  );
}

export default function ClientLogos() {
  const row1 = Array.from({ length: REPEAT }).flatMap(() => ROW1_LOGOS);
  const row2 = Array.from({ length: REPEAT }).flatMap(() => ROW2_LOGOS);

  return (
    <section className="client-section">
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="client-container">
          <h5 className="h2 white-font-color">
            Trusted by 2000+ Clients Worldwide
          </h5>
          <div className="client-logos-rows-wrapper">
            <div className="client-logos-1st-row">
              <div className="client-logos-track">
                {row1.map((logo, i) => (
                  <LogoTile key={`r1-${i}`} logo={logo} />
                ))}
              </div>
            </div>
            <div className="client-logos-2nd-row">
              <div className="client-logos-track">
                {row2.map((logo, i) => (
                  <LogoTile key={`r2-${i}`} logo={logo} />
                ))}
              </div>
            </div>
            <div className="gradient-right"></div>
            <div className="gradient-left"></div>
          </div>
          <a href="/signup" className="secondary-button white w-inline-block">
            <div className="button-arrow-wrapper">
              <div className="button-arrow-bg white-bg"></div>
              <div className="button-arrow-embed w-embed">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
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
        </div>
      </div>
    </section>
  );
}
