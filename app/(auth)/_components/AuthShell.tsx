import Link from "next/link";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="login-section">
      <div className="w-layout-blockcontainer main-container w-container">
        <div className="login-container">
          <div className="login-text-wrapper">
            <h1 className="display-h1">
              All-in-one{" "}
              <span className="yellow-highlighted-text">Payroll</span> and{" "}
              <span className="pink-highlighted-text">HR</span> System for small
              team
            </h1>
            <div className="form-points-wrapper">
              <div className="point-wrappper">
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c95_checkmark.svg"
                  alt="check mark"
                  className="check-icon bigger"
                />
                <div className="point-text">*No Credit Card Required</div>
              </div>
              <div className="point-wrappper">
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c95_checkmark.svg"
                  alt="check mark"
                  className="check-icon bigger"
                />
                <div className="point-text">30-day Free Trial</div>
              </div>
              <div className="point-wrappper">
                <img
                  loading="lazy"
                  src="https://cdn.prod.website-files.com/6543eed5397deb6f75475c49/6543eed5397deb6f75475c95_checkmark.svg"
                  alt="check mark"
                  className="check-icon bigger"
                />
                <div className="point-text">Cancel Anytime</div>
              </div>
            </div>
          </div>
          <div className="utility-form-wrapper w-form">
            <div className="utility-form">
              <div className="utility-form-title">
                <h2 className="h3">{title}</h2>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuthFormLink({
  text,
  linkText,
  href,
}: {
  text: string;
  linkText: string;
  href: string;
}) {
  return (
    <div className="utility-form-link-wrapper">
      <div>
        {text}{" "}
        <Link href={href} className="utility-form-link">
          {linkText}
        </Link>
      </div>
    </div>
  );
}
