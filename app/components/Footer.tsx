export default function Footer() {
  return (
    <section className="footer-section">
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="footer-container">
          <div className="footer-row">
            <a
              href="/"
              aria-current="page"
              className="footer-logo-wrapper w-inline-block w--current"
            >
              <img
                src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c99_Saasdesk%20logo%20white.svg"
                loading="lazy"
                alt=""
                className="footer-logo"
              />
            </a>
            <a href="#Home" className="scroll-to-top-link w-inline-block">
              <div className="scroll-to-top-embed w-embed">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.8347 6.52239V16.6654H9.16805V6.52239L4.69804 10.9924L3.51953 9.81386L10.0014 3.33203L16.4831 9.81386L15.3046 10.9924L10.8347 6.52239Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </a>
            <div className="footer-app-links-wrapper">
              <div className="h6">Available on</div>
              <a
                href="https://www.apple.com/in/app-store/"
                target="_blank"
                className="footer-app-link w-inline-block"
              >
                <div className="header-app-embed w-embed">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
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
                className="footer-app-link w-inline-block"
              >
                <div className="header-app-embed w-embed">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
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
          <div className="footer-divider"></div>
          <div className="footer-columns-wrapper">
            <div className="footer-contact-and-social-links-wrapper">
              <div className="footer-links-container">
                <div className="h6">Pre-sales questions?</div>
                <div className="animated-links-wrapper">
                  <a
                    href="mailto:support@site.com"
                    className="animated-link-block font-white w-inline-block"
                  >
                    <img
                      src="https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/653378e962589ce54acc6fd5_Vectors-Wrapper.svg"
                      loading="lazy"
                      width="41.26829147338867"
                      height="36"
                      alt=""
                      className="link-icon"
                    />
                    <div className="faq-link-text-wrapper">
                      <div className="body-small">support@site.com</div>
                      <div className="link-animated-line-wrapper">
                        <div className="link-animated-line"></div>
                      </div>
                    </div>
                  </a>
                  <a
                    href="tel:123-456-7890"
                    className="animated-link-block font-white w-inline-block"
                  >
                    <img
                      src="https://cdn.prod.website-files.com/6507f776b9661ba4aa7204b4/653378eb26923f878e6e2cb9_Vectors-Wrapper.svg"
                      loading="lazy"
                      width="41.53845977783203"
                      height="36"
                      alt=""
                      className="link-icon"
                    />
                    <div className="faq-link-text-wrapper">
                      <div className="body-small">123-456-7890</div>
                      <div className="link-animated-line-wrapper">
                        <div className="link-animated-line"></div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
              <div className="footer-social-links-wrapper">
                <a
                  href="https://www.facebook.com/"
                  target="_blank"
                  className="footer-social-link w-inline-block"
                >
                  <div className="footer-social-embed w-embed">
                    <svg
                      width="8"
                      height="16"
                      viewBox="0 0 8 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.28994 7.8505H5.19811C5.19811 11.1926 5.19811 15.3063 5.19811 15.3063H2.09844C2.09844 15.3063 2.09844 11.2324 2.09844 7.8505H0.625V5.2154H2.09844V3.51097C2.09844 2.29026 2.6785 0.382812 5.2266 0.382812L7.52351 0.391617V2.94956C7.52351 2.94956 6.12775 2.94956 5.85637 2.94956C5.58499 2.94956 5.19915 3.08525 5.19915 3.66737V5.21591H7.5608L7.28994 7.8505Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </a>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  className="footer-social-link w-inline-block"
                >
                  <div className="footer-social-embed w-embed">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 26 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6317 6.10969C14.7573 6.10969 15.0068 6.11916 15.847 6.15706C16.6239 6.1918 17.044 6.3213 17.3251 6.43184C17.6978 6.57713 17.9631 6.74768 18.241 7.02562C18.519 7.30355 18.6927 7.56886 18.8348 7.94155C18.9422 8.22264 19.0748 8.64271 19.1096 9.41967C19.1475 10.2598 19.157 10.5093 19.157 12.6349C19.157 14.7605 19.1475 15.01 19.1096 15.8501C19.0748 16.6271 18.9453 17.0472 18.8348 17.3283C18.6895 17.7009 18.519 17.9662 18.241 18.2442C17.9631 18.5221 17.6978 18.6958 17.3251 18.838C17.044 18.9453 16.6239 19.078 15.847 19.1127C15.0068 19.1506 14.7573 19.1601 12.6317 19.1601C10.5062 19.1601 10.2566 19.1506 9.41651 19.1127C8.63955 19.078 8.21948 18.9485 7.93839 18.838C7.5657 18.6927 7.3004 18.5221 7.02246 18.2442C6.74452 17.9662 6.57081 17.7009 6.42868 17.3283C6.3213 17.0472 6.18865 16.6271 6.1539 15.8501C6.116 15.01 6.10653 14.7605 6.10653 12.6349C6.10653 10.5093 6.116 10.2598 6.1539 9.41967C6.18865 8.64271 6.31814 8.22264 6.42868 7.94155C6.57397 7.56886 6.74452 7.30355 7.02246 7.02562C7.3004 6.74768 7.5657 6.57397 7.93839 6.43184C8.21948 6.32446 8.63955 6.1918 9.41651 6.15706C10.2566 6.116 10.5062 6.10969 12.6317 6.10969ZM12.6317 4.67578C10.4714 4.67578 10.1998 4.68526 9.35018 4.72316C8.50374 4.76106 7.92575 4.89687 7.42041 5.09269C6.89612 5.29483 6.45395 5.5696 6.01178 6.01178C5.5696 6.45395 5.29798 6.89928 5.09269 7.42041C4.89687 7.92575 4.76106 8.50374 4.72316 9.35334C4.68526 10.1998 4.67578 10.4714 4.67578 12.6317C4.67578 14.7921 4.68526 15.0637 4.72316 15.9133C4.76106 16.7597 4.89687 17.3377 5.09269 17.8462C5.29483 18.3705 5.5696 18.8127 6.01178 19.2549C6.45395 19.697 6.89928 19.9687 7.42041 20.174C7.92575 20.3698 8.50374 20.5056 9.35334 20.5435C10.2029 20.5814 10.4714 20.5909 12.6349 20.5909C14.7984 20.5909 15.0669 20.5814 15.9165 20.5435C16.7629 20.5056 17.3409 20.3698 17.8494 20.174C18.3737 19.9718 18.8158 19.697 19.258 19.2549C19.7002 18.8127 19.9718 18.3674 20.1771 17.8462C20.3729 17.3409 20.5087 16.7629 20.5466 15.9133C20.5845 15.0637 20.594 14.7952 20.594 12.6317C20.594 10.4683 20.5845 10.1998 20.5466 9.35018C20.5087 8.50374 20.3729 7.92575 20.1771 7.41726C19.975 6.89296 19.7002 6.45079 19.258 6.00862C18.8158 5.56644 18.3705 5.29483 17.8494 5.08953C17.344 4.89371 16.7661 4.7579 15.9165 4.72C15.0637 4.68526 14.7921 4.67578 12.6317 4.67578Z"
                        fill="currentColor"
                      />
                      <path
                        d="M12.6299 8.54297C10.3748 8.54297 8.54297 10.3717 8.54297 12.6299C8.54297 14.8882 10.3748 16.7169 12.6299 16.7169C14.885 16.7169 16.7169 14.885 16.7169 12.6299C16.7169 10.3748 14.885 8.54297 12.6299 8.54297ZM12.6299 15.283C11.1644 15.283 9.97687 14.0954 9.97687 12.6299C9.97687 11.1644 11.1644 9.97687 12.6299 9.97687C14.0954 9.97687 15.283 11.1644 15.283 12.6299C15.283 14.0954 14.0954 15.283 12.6299 15.283Z"
                        fill="currentColor"
                      />
                      <path
                        d="M16.8796 9.33735C17.4064 9.33735 17.8334 8.9103 17.8334 8.38352C17.8334 7.85673 17.4064 7.42969 16.8796 7.42969C16.3528 7.42969 15.9258 7.85673 15.9258 8.38352C15.9258 8.9103 16.3528 9.33735 16.8796 9.33735Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  className="footer-social-link w-inline-block"
                >
                  <div className="footer-social-embed w-embed">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 26 26"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20.3052 14.1278V19.6439H17.1054V14.4947C17.1054 13.2001 16.644 12.3202 15.4862 12.3202C14.6007 12.3202 14.0784 12.9159 13.8452 13.4892C13.7613 13.6957 13.7358 13.9848 13.7358 14.2702V19.6433H10.5391C10.5391 19.6433 10.582 10.9255 10.5391 10.0226H13.7364V11.3862C13.7321 11.3974 13.7228 11.4067 13.7184 11.4192H13.7364V11.3862C14.1636 10.7309 14.9203 9.79688 16.6197 9.79688C18.7289 9.79688 20.3052 11.1717 20.3052 14.1278Z"
                        fill="currentColor"
                      />
                      <path
                        d="M7.19289 5.38281C6.09914 5.38281 5.38281 6.10039 5.38281 7.0468C5.38281 7.96771 6.07801 8.70954 7.15185 8.70954H7.17114C8.28914 8.70954 8.98184 7.96771 8.98184 7.0468C8.96009 6.10039 8.28917 5.38281 7.19289 5.38281Z"
                        fill="currentColor"
                      />
                      <path
                        d="M5.57422 19.6414H8.7722V10.0195H5.57422V19.6414Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </a>
              </div>
            </div>
            <div className="footer-content">
              <div
                id="w-node-_413552e3-8bdb-f177-44d9-7c96feed5b37-feed5b11"
                className="footer-column"
              >
                <div className="footer-column-title-wrapper">
                  <div className="h6 white-font-color">Navigations</div>
                </div>
                <a href="#Benefits" className="footer-link">
                  Benefits
                </a>
                <a href="#Feature" className="footer-link">
                  Features
                </a>
                <a href="#Pricing" className="footer-link">
                  Pricing
                </a>
                <a href="#FAQs" className="footer-link">
                  FAQs
                </a>
              </div>
              <div className="footer-column">
                <div className="footer-column-title-wrapper">
                  <div className="h6 white-font-color">Account</div>
                </div>
                <a href="/login" className="footer-link">
                  Login
                </a>
                <a href="/signup" className="footer-link">
                  Signup
                </a>
              </div>
              <div className="footer-column">
                <div className="footer-column-title-wrapper">
                  <div className="h6 white-font-color">Legal</div>
                </div>
                <a href="/template-info/license" className="footer-link">
                  License
                </a>
                <a href="/template-info/changelog" className="footer-link">
                  Changelog
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright-text-container">
        <div className="copyright-text-wrapper">
          <div className="body-small">
            © 2026 Neurallift. All Rights Reserved.
          </div>
          <div className="body-small">
            Built by{" "}
            <a
              href="https://mgalihpp.vercel.app"
              target="_blank"
              className="webflow-link"
            >
              mgalihpp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
