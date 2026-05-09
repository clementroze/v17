import { useRef } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import EffectB from '../components/effects/EffectB';
import work from '../data/work';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="page">
      <Navbar watchHideRef={heroRef} />
      <div ref={heroRef}>
        <Hero
          title="Welcome."
          subtitle="Clément Rozé designs and builds web experiences that are accessible, intentional, and beautifully."
        />
      </div>
      <EffectB projects={work} />
      <Footer />
    </div>
  );
}
