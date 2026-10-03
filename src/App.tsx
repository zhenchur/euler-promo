import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Metrics from './components/Metrics';
import SiteIntro from './components/SiteIntro';
import { usePromoScroll } from './motion/usePromoScroll';

const ASSET = `${import.meta.env.BASE_URL}assets/`;
const PLATFORM = 'https://promo.andromedaterminal.ru/';
const desktopMedia = window.matchMedia('(min-width: 1280px) and (any-hover: hover) and (any-pointer: fine)');

function subscribeToViewport(onChange: () => void) {
  desktopMedia.addEventListener('change', onChange);
  return () => desktopMedia.removeEventListener('change', onChange);
}

function getDesktopSnapshot() {
  return desktopMedia.matches;
}

const services = [
  { label: 'Обзоры', lines: ['Анализ фондового', 'рынка'], icon: 'edabf.svg', node: '3303:62' },
  { label: 'Инвестиции', lines: ['Оценка инвестиционных', 'инструментов'], icon: 'bbe69.svg', node: '3303:70' },
  { label: 'Макро', lines: ['Макроэкономические обзоры', 'и прогнозирование'], icon: '9f125.svg', node: '3303:78' },
  { label: 'Помощь', lines: ['Сопровождение размещений', 'ценных бумаг'], icon: '57d95.svg', node: '3303:86' },
];

const features = [
  { label: 'Кастомизация', lines: ['Настраиваемый терминал', 'под разные задачи'], node: '3303:122' },
  { label: 'Фильтрация', lines: ['Мульти -скрининг'], node: '3303:131' },
  { label: 'Кастомизация', lines: ['Отчеты компаний'], node: '3303:138' },
  { label: 'Мобильность', lines: ['Телеграм приложение'], node: '3303:145' },
];

function TextLines({ lines }: { lines: string[] }) {
  return <>{lines.map((line, index) => <span key={line}>{index > 0 ? ' ' : ''}{line}</span>)}</>;
}

function Header({ showCta }: { showCta: boolean }) {
  return (
    <header className="header">
      <a className="header__logo" href="#top" aria-label="Эйлер — на главную" data-node-id="3303:45">
        <img src={`${ASSET}1f481.svg`} alt="Эйлер" width="120" height="30" />
      </a>
      <nav className="header__navigation" aria-label="Основная навигация" data-node-id="3303:94">
        <a href="#capabilities">Возможности</a>
        <a href="#video">Видеообзор<img src={`${ASSET}31ac5.svg`} alt="" width="12" height="12" /></a>
        <a href={`${PLATFORM}#sPrices`} target="_blank" rel="noreferrer">Тарифы</a>
        <a href="https://euler.team/team" target="_blank" rel="noreferrer">Команда</a>
        <a href={`${PLATFORM}#footer`} target="_blank" rel="noreferrer">Контакты</a>
      </nav>
      <a className={`button button--white header__cta${showCta ? ' is-visible' : ''}`} href="https://euler.team/#request-access" target="_blank" rel="noreferrer" aria-hidden={!showCta} tabIndex={showCta ? 0 : -1}>Получить аналитику</a>
    </header>
  );
}

function Hero() {
  const benefits = [
    ['Аналитические сервисы', 'и функции (FA, DES, BS, etc.)'],
    ['Рыночные, макро', 'и индустриальные данные'],
    ['Аналитика Эйлера', 'и других домов'],
    ['Новости от СМИ и Telegram-каналов', 'в одном месте'],
  ];
  return (
    <section className="hero" id="top" aria-labelledby="hero-heading">
      <div className="hero__visual">
        <div className="hero__art" data-node-id="3303:40" aria-hidden="true">
          <img src={`${ASSET}e4f72.png`} alt="" fetchPriority="high" />
        </div>
        <div className="hero__content">
          <h1 id="hero-heading" data-node-id="3303:44"><span className="hero__title-line"><span data-intro-reveal>Единый контур</span></span>{' '}<span className="hero__title-line"><span data-intro-reveal>принятия решений</span></span></h1>
          <div className="hero__intro">
            <div className="hero__description"><p data-intro-reveal data-node-id="3303:41">Данные, метрики, исследования по рынку, макро и секторам в единой инфраструктуре</p></div>
            <a data-intro-reveal className="button button--white" href="https://euler.team/#request-access" target="_blank" rel="noreferrer" data-node-id="3303:42">Получить аналитику</a>
          </div>
        </div>
        <ul className="hero__benefits" data-node-id="3303:102">
          {benefits.map((lines, index) => (
            <li key={lines[0]} data-node-id={`3303:${103 + index * 4}`}>
              <span className="hero__benefit-line" aria-hidden="true"><img src={`${ASSET}412b1.svg`} alt="" width="103" height="1" /></span>
              <p><TextLines lines={lines} /></p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function VideoOverview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    return () => video?.pause();
  }, []);

  const fail = () => {
    const video = videoRef.current;
    video?.pause();
    if (document.fullscreenElement === video) void document.exitFullscreen().catch(() => undefined);
    setFailed(true);
  };
  const play = () => {
    setStarted(true);
    setFailed(false);
    const video = videoRef.current;
    if (video) void video.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) fail();
    });
  };
  const reset = () => {
    videoRef.current?.pause();
    setStarted(false);
    setFailed(false);
  };
  const fullscreen = () => {
    play();
    const video = videoRef.current;
    if (video?.requestFullscreen) void video.requestFullscreen().catch(() => undefined);
  };
  return (
    <div className={`video-overview${started ? ' is-playing' : ''}`} id="video" data-node-id="3303:48">
      <div className="video-overview__poster" aria-hidden="true" data-node-id="3303:49"><img src={`${ASSET}7f34b.png`} alt="" /></div>
      <video ref={videoRef} className="video-overview__player" controls={started} playsInline preload="none" aria-label="Видеообзор компании Эйлер" onError={() => { if (started) fail(); }}>
        <source src="https://storage.yandexcloud.net/euler.team.media/promo-video.webm" type="video/webm" />
        <source src="https://storage.yandexcloud.net/euler.team.media/promo-video.mp4" type="video/mp4" />
      </video>
      {!started && <>
        <button className="video-overview__play" onClick={play} aria-label="Смотреть видеообзор" data-node-id="3303:54">
          <img src={`${ASSET}1daa4.svg`} alt="" width="43" height="51" /><span>Смотреть</span>
        </button>
        <img className="video-overview__timeline" src={`${ASSET}3daeb.svg`} alt="" aria-hidden="true" width="1372" height="10.6667" data-node-id="3303:51" />
        <button className="video-overview__fullscreen" onClick={fullscreen} aria-label="Смотреть на весь экран" data-node-id="3303:50"><img src={`${ASSET}0a775.svg`} alt="" width="24" height="19" /></button>
      </>}
      {failed && <div className="video-overview__error" role="status"><p>Не удалось воспроизвести видео.</p><a href="https://storage.yandexcloud.net/euler.team.media/promo-video.mp4" target="_blank" rel="noreferrer">Открыть видео в новой вкладке</a><button onClick={reset}>Вернуться к обложке</button></div>}
    </div>
  );
}

function About() {
  return (
    <section className="about white-panel" id="capabilities" aria-labelledby="about-heading" data-node-id="3303:47">
      <div className="about__intro">
        <h2 id="about-heading" data-node-id="3303:57">Эйлер — независимая<br /> аналитическая компания</h2>
        <p data-node-id="3303:58">Даём непредвзятую оценку рынку, прогнозируем рыночные сценарии и предоставляем объективную аналитику в единой платформе данных.</p>
      </div>
      <div className="services" data-node-id="3303:59">
        <div className="services__art" aria-hidden="true" data-node-id="3303:60"><img src={`${ASSET}e3933.png`} alt="" /></div>
        <div className="services__grid" data-node-id="3303:61">
          {services.map((service) => (
            <article className="service-card" key={service.label} data-node-id={service.node}>
              <div className="service-card__header"><span className="label">{service.label}</span><img src={`${ASSET}${service.icon}`} alt="" width="24" height="24" /></div>
              <h3><TextLines lines={service.lines} /></h3>
            </article>
          ))}
        </div>
      </div>
      <VideoOverview />
    </section>
  );
}

function Platform() {
  const [active, setActive] = useState(0);
  const change = (direction: number) => setActive((current) => (current + direction + features.length) % features.length);
  return (
    <section className="platform" id="andromeda" aria-labelledby="platform-heading">
      <div className="platform__art" aria-hidden="true" data-node-id="3303:119"><img src={`${ASSET}8ebc1.png`} alt="" /></div>
      <h2 id="platform-heading" data-node-id="3303:120">Информационно-аналитическая <br />платформа “Андромеда”</h2>
      <div className="platform__controls" data-node-id="3303:180">
        <button onClick={() => change(-1)} aria-label="Предыдущая возможность"><img className="platform__previous" src={`${ASSET}02978.svg`} alt="" width="24" height="24" /></button>
        <button onClick={() => change(1)} aria-label="Следующая возможность"><img src={`${ASSET}02978.svg`} alt="" width="24" height="24" /></button>
      </div>
      <div className="platform__cards" data-node-id="3303:121" aria-label="Возможности Андромеды">
        {features.map((feature, index) => (
          <article key={feature.node} className={`feature-card${active === index ? ' is-active' : ''}`} data-node-id={feature.node}>
            <button className="feature-card__select" onClick={() => setActive(index)} aria-label={feature.lines.join(' ')} aria-pressed={active === index} />
            <span className="label">{feature.label}</span>
            <div className="feature-card__content"><h3><TextLines lines={feature.lines} /></h3>{active === index && <a className="button button--blue" href={PLATFORM} target="_blank" rel="noreferrer">Подробнее</a>}</div>
          </article>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">{features[active].lines.join(' ')}</span>
    </section>
  );
}

function DesktopNotice() {
  return (
    <main className="desktop-notice" aria-labelledby="desktop-notice-heading">
      <img className="desktop-notice__logo" src={`${ASSET}1f481.svg`} alt="Эйлер" width="120" height="30" />
      <div className="desktop-notice__message">
        <h1 id="desktop-notice-heading">Откройте проект на компьютере</h1>
        <p>Для просмотра используйте десктопный браузер и разверните окно.</p>
      </div>
    </main>
  );
}

function DesktopPage({ introComplete, onIntroComplete }: { introComplete: boolean; onIntroComplete: () => void }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const showHeaderCta = usePromoScroll(pageRef, introComplete);
  return (
    <>
    <div className="page" ref={pageRef} data-node-id="3303:39" data-intro-pending={!introComplete || undefined} inert={!introComplete} aria-busy={!introComplete}>
      <a className="skip-link" href="#capabilities">Перейти к содержанию</a>
      <Header showCta={showHeaderCta} />
      <main>
        <Hero />
        <div className="page__surface">
          <About />
          <div className="page__continuation"><Platform /><Metrics /></div>
        </div>
      </main>
    </div>
    {!introComplete && <SiteIntro pageRef={pageRef} onComplete={onIntroComplete} />}
    </>
  );
}

export default function App() {
  const isDesktop = useSyncExternalStore(subscribeToViewport, getDesktopSnapshot);
  const [introComplete, setIntroComplete] = useState(false);
  const completeIntro = useCallback(() => setIntroComplete(true), []);
  return isDesktop ? <DesktopPage introComplete={introComplete} onIntroComplete={completeIntro} /> : <DesktopNotice />;
}
