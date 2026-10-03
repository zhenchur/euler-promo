import { useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(useGSAP, CustomEase);

const sweepEase = CustomEase.create('intro-sweep', 'M0,0 C0.496,0.004 0,1 1,1');
const revealEase = CustomEase.create('intro-reveal', 'M0,0 C0,0.202 0.204,1 1,1');
const logo = `${import.meta.env.BASE_URL}assets/1f481.svg`;

type Props = {
  pageRef: RefObject<HTMLDivElement | null>;
  onComplete: () => void;
};

/** Cold-load entrance only. Scroll motion starts after all intro transforms are cleared. */
export default function SiteIntro({ pageRef, onComplete }: Props) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useGSAP((_context, contextSafe) => {
    const page = pageRef.current;
    const loader = loaderRef.current;
    if (!page || !loader || !contextSafe) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || (window.location.hash && window.location.hash !== '#top')) {
      onComplete();
      return;
    }

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    const previousGutter = html.style.scrollbarGutter;
    const previousBackground = html.style.backgroundColor;
    const previousUnit = html.style.getPropertyValue('--u');
    const previousRestoration = history.scrollRestoration;
    const text = page.querySelectorAll('[data-intro-reveal]');
    const benefits = page.querySelectorAll('.hero__benefits li');
    const navigation = page.querySelectorAll('.header__logo, .header__navigation a');
    const mark = loader.querySelector('.site-intro__mark');
    const fill = loader.querySelector('.site-intro__fill');
    let disposed = false;
    let finished = false;
    let minimumElapsed = false;
    let assetsReady = false;
    let revealing = false;
    let entrance: gsap.core.Timeline | undefined;

    // Keep the usual scrollbar footprint, even while scrolling is locked.
    // CSS vw changes with a stable hidden scrollbar in Chromium. Freeze the design
    // unit to the normal viewport width so type and navigation don't jump on unlock.
    const syncDesignUnit = () => html.style.setProperty('--u', `${Math.min(window.innerWidth / 1920, 1)}px`);
    syncDesignUnit();
    window.addEventListener('resize', syncDesignUnit);
    html.style.scrollbarGutter = 'stable';
    html.style.overflow = 'hidden';
    html.style.backgroundColor = 'var(--ink)';
    history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });

    gsap.set(page, {
      scale: 1.3, rotation: 7, y: window.innerHeight / 2,
      transformOrigin: '50% 50vh', force3D: true, willChange: 'transform',
    });
    gsap.set([text, navigation], { autoAlpha: 0, rotation: 7, yPercent: 100, transformOrigin: '0 0' });
    gsap.set(benefits, { autoAlpha: 0, y: 24 });

    const restoreDocument = () => {
      html.style.overflow = previousOverflow;
      html.style.scrollbarGutter = previousGutter;
      html.style.backgroundColor = previousBackground;
      if (previousUnit) html.style.setProperty('--u', previousUnit);
      else html.style.removeProperty('--u');
      history.scrollRestoration = previousRestoration;
    };

    const finish = contextSafe(() => {
      if (disposed || finished) return;
      finished = true;
      clearTimeout(assetTimeout);
      clearTimeout(watchdog);
      filling.kill();
      entrance?.kill();
      gsap.set(page, { clearProps: 'transform,transformOrigin,willChange' });
      gsap.set([text, benefits, navigation], { clearProps: 'transform,transformOrigin,opacity,visibility' });
      restoreDocument();
      onComplete();
    });

    const reveal = contextSafe(() => {
      if (disposed || finished || revealing || !minimumElapsed || !assetsReady) return;
      revealing = true;
      loader.dataset.phase = 'revealing';
      entrance = gsap.timeline({ onComplete: finish });
      entrance
        .fromTo(loader,
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 110%, 0% 100%)' },
          { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', duration: 1, ease: sweepEase }, 0)
        .to(mark, { scale: 0, opacity: 0, duration: 1, ease: sweepEase }, 0)
        // Keep the identity transform until unlock so the fixed menu retains its containing block.
        .to(page, { scale: 1, rotation: 0, y: 0, duration: 1, ease: sweepEase }, 0)
        .to(text, { autoAlpha: 1, rotation: 0, yPercent: 0, duration: 1, stagger: 0.1, ease: revealEase }, 0.5)
        .to(benefits, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: revealEase }, 0.85)
        .to(navigation, { autoAlpha: 1, rotation: 0, yPercent: 0, duration: 1, stagger: 0.06, ease: revealEase }, 1);
    });

    const filling = gsap.to(fill, {
      clipPath: 'inset(0% 0 0)', duration: 2, ease: 'power2.inOut',
      onComplete: () => { minimumElapsed = true; reveal(); },
    });
    const markReady = () => {
      if (disposed || finished) return;
      assetsReady = true;
      reveal();
    };
    const heroImage = page.querySelector<HTMLImageElement>('.hero__art img');
    const logoImage = loader.querySelector<HTMLImageElement>('img');
    // Only the first screen gates entry; a failed asset must never trap the visitor.
    void Promise.allSettled([
      heroImage?.decode(), logoImage?.decode(),
      document.fonts.load('400 16px "TT Neoris"'), document.fonts.ready,
    ]).then(markReady);
    const assetTimeout = window.setTimeout(markReady, 5500);
    const watchdog = window.setTimeout(finish, 8000);
    const handleMotionChange = () => { if (reducedMotion.matches) finish(); };
    reducedMotion.addEventListener('change', handleMotionChange);

    return () => {
      disposed = true;
      clearTimeout(assetTimeout);
      clearTimeout(watchdog);
      reducedMotion.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', syncDesignUnit);
      restoreDocument();
    };
  }, { scope: loaderRef, dependencies: [pageRef, onComplete] });

  return (
    <div className="site-intro" ref={loaderRef} role="status" aria-label="Загружаем Эйлер" data-phase="loading">
      <div className="site-intro__mark" aria-hidden="true">
        <img className="site-intro__base" src={logo} alt="" width="120" height="30" />
        <img className="site-intro__fill" src={logo} alt="" width="120" height="30" />
      </div>
    </div>
  );
}
