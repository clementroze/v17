import { Reveal } from "../lib/reveal";

type HeroProps = {
  title: string;
  subtitle: string;
  tag?: string;
};

export default function Hero({ title, subtitle, tag }: HeroProps) {
  return (
    <div className="container-wrapper">
      <div className="container">
        <div className="hero">
          <div className="hero__row">
            <div className="hero__left">
              <Reveal>
                <h1 className="hero__title">{title}</h1>
              </Reveal>
            </div>
            <div className="hero__right" />
          </div>
          <div className="hero__row hero__row--right">
            <div className="hero__left" />
            <div className="hero__right">
              <Reveal delay={80}>
                <p className="hero__subtitle">
                  {subtitle}
                  {tag && <> <span className="hero__tag">{tag}</span></>}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
