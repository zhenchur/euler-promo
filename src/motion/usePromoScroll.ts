import { useRef, useState, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(useGSAP, ScrollTrigger);
gsap.ticker.lagSmoothing(0);

export function usePromoScroll(root: RefObject<HTMLDivElement | null>, enabled = true) {
  const [showHeaderCta, setShowHeaderCta] = useState(false);
  const headerCtaVisible = useRef(false);

  useGSAP(() => {
    const page = root.current;
    if (!page || !enabled) return;
    const hero = page.querySelector<HTMLElement>('.hero')!;
    const heroVisual = hero.querySelector<HTMLElement>('.hero__visual')!;
    const header = page.querySelector<HTMLElement>('.header')!;
    const panels = [...page.querySelectorAll<HTMLElement>('.white-panel')].map((element) => ({
      element, top: 0, height: 0, maskTop: NaN, maskBottom: NaN,
    }));
    let lenis: Lenis | undefined;
    let disposed = false;
    let refreshFrame = 0;
    let panelTop = 0;
    let panelBottom = 0;
    let initialPanelBottom = 0;
    let heroRecession: gsap.core.Tween | undefined;

    const measure = () => {
      const headerRect = header.getBoundingClientRect();
      // Mirror the space above the centered menu below it, including its CTA.
      panelTop = headerRect.top + headerRect.bottom;
      const panelStyle = getComputedStyle(panels[0].element);
      // The lower edge of the window has the same gap as its sides.
      panelBottom = window.innerHeight - parseFloat(panelStyle.marginLeft);
      // Initially keep the entire lower arc beyond the viewport, not just its edge.
      initialPanelBottom = window.innerHeight + parseFloat(panelStyle.borderBottomLeftRadius) + 1;
      for (const panel of panels) {
        const rect = panel.element.getBoundingClientRect();
        panel.top = rect.top + window.scrollY;
        panel.height = rect.height;
      }
    };

    const render = (scroll: number) => {
      const firstPanel = panels[0];
      const overlap = gsap.utils.clamp(0, 1, scroll / Math.max(1, firstPanel.top - panelTop));
      // Reveal the bottom edge during the last 40% of the approach to the menu.
      const reveal = gsap.utils.clamp(0, 1, (overlap - 0.6) / 0.4);
      const easedReveal = reveal * reveal * (3 - 2 * reveal);
      const firstPanelBottom = initialPanelBottom + (panelBottom - initialPanelBottom) * easedReveal;
      for (const panel of panels) {
        // The window intersects the panel's rounded box without changing its radii.
        const bottomEdge = panel === firstPanel ? firstPanelBottom : panelBottom;
        const maskTop = scroll + panelTop - panel.top;
        const maskBottom = panel.top + panel.height - scroll - bottomEdge;
        if (maskTop !== panel.maskTop || maskBottom !== panel.maskBottom) {
          panel.element.style.setProperty('--mask-top', `${maskTop}px`);
          panel.element.style.setProperty('--mask-bottom', `${maskBottom}px`);
          panel.element.inert = maskTop >= panel.height;
          panel.maskTop = maskTop;
          panel.maskBottom = maskBottom;
        }
      }
      heroRecession?.progress(overlap);
      const showCta = scroll >= firstPanel.top - panelTop;
      if (showCta !== headerCtaVisible.current) {
        headerCtaVisible.current = showCta;
        setShowHeaderCta(showCta);
      }
      if (hero.inert !== showCta) hero.inert = showCta;
    };

    // Keep the original hero footprint; all following sections retain native flow.
    ScrollTrigger.create({
      id: 'promo-hero',
      trigger: hero,
      start: 'top top',
      end: 'max',
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
    });

    ScrollTrigger.create({
      id: 'promo-panels',
      start: 0,
      end: 'max',
      onUpdate: (self) => render(self.scroll()),
      onRefresh: (self) => {
        measure();
        render(self.scroll());
      },
    });

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      // Keep the same 3D layer at both endpoints and during scroll/reverse.
      // Only the inner visual moves; the pinned shell and menu stay stable.
      heroRecession = gsap.fromTo(heroVisual,
        { scale: 1, opacity: 1, force3D: true },
        { scale: 0.94, opacity: 0, force3D: true, duration: 1, ease: 'none', paused: true });
      const smooth = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
      lenis = smooth;
      const tick = (seconds: number) => smooth.raf(seconds * 1000);
      smooth.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      page.dataset.smoothScroll = 'true';
      measure();
      render(window.scrollY);
      return () => {
        gsap.ticker.remove(tick);
        smooth.off('scroll', ScrollTrigger.update);
        smooth.destroy();
        lenis = undefined;
        heroRecession = undefined;
        delete page.dataset.smoothScroll;
      };
    });

    const scrollToTarget = (target: HTMLElement, immediate = false) => {
      const offset = target.id === 'capabilities' ? panelTop : panelTop + 16;
      const destination = target === hero ? 0 : target.getBoundingClientRect().top + window.scrollY - offset;
      const complete = () => {
        render(window.scrollY);
        target.focus({ preventScroll: true });
      };
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      if (lenis) lenis.scrollTo(destination, { immediate, onComplete: complete });
      else {
        window.scrollTo({ top: destination, behavior: 'instant' });
        complete();
      }
    };

    const handleAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const hash = link?.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.getElementById(hash.slice(1));
      if (!target || !page.contains(target)) return;
      event.preventDefault();
      if (window.location.hash !== hash) window.history.pushState(null, '', hash);
      scrollToTarget(target);
    };
    page.addEventListener('click', handleAnchor);

    const scheduleRefresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const observer = new ResizeObserver(scheduleRefresh);
    observer.observe(page);
    panels.forEach(({ element }) => observer.observe(element));
    ScrollTrigger.refresh();
    // The intro has cleared its transforms before measuring or resolving a deep link.
    const target = document.getElementById(window.location.hash.slice(1));
    if (target && page.contains(target)) scrollToTarget(target, true);
    const initialScroll = window.scrollY;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      const stayedAtAnchor = target && page.contains(target) && Math.abs(window.scrollY - initialScroll) < 2;
      ScrollTrigger.refresh();
      // A direct deep link skips the intro and may precede font readiness.
      if (stayedAtAnchor) scrollToTarget(target, true);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(refreshFrame);
      page.removeEventListener('click', handleAnchor);
      media.revert();
      panels.forEach(({ element }) => {
        element.style.removeProperty('--mask-top');
        element.style.removeProperty('--mask-bottom');
        element.inert = false;
      });
      hero.inert = false;
    };
  }, { scope: root, dependencies: [enabled], revertOnUpdate: true });

  return showHeaderCta;
}
