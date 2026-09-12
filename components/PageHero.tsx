import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  footer?: ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  description,
  aside,
  footer,
}: PageHeroProps) {
  return (
    <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.07),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
            {eyebrow}
          </p>

          <div
            className={`mt-4 gap-8 ${aside ? "grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end" : ""}`}
          >
            <div>
              <h1 className="max-w-5xl text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                {description}
              </p>
            </div>

            {aside ? <div className="mt-5 lg:mt-0">{aside}</div> : null}
          </div>
        </div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </section>
  );
}
