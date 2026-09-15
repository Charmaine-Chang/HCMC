import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Lang = 'zh' | 'en';
type Page = 'home' | 'register' | 'calendar' | 'scripture' | 'dashboard';
type Activity = { id: string; title: string; startTime: string; location: string; ministry: string };

const copy = (lang: Lang, zh: string, en: string) => (lang === 'zh' ? zh : en);

export function Home({ lang, activities, onNavigate }: { lang: Lang; activities: Activity[]; onNavigate: (page: Page) => void }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.from('.hero-photo', { scale: 1.08, duration: 1.8, ease: 'power2.out' });
    gsap.from('.hero-caption > *', { y: 24, opacity: 0, duration: .9, stagger: .12, delay: .35, ease: 'power2.out' });
    gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((item) => {
      gsap.from(item, { y: 42, opacity: 0, duration: .9, ease: 'power2.out', scrollTrigger: { trigger: item, start: 'top 88%', once: true } });
    });
  }, { scope: root });

  return (
    <main ref={root} className="home-premium">
      <section className="ccmc-hero">
        <img className="hero-photo" src="/images/hcmc-community-hero.png" alt={copy(lang, '教会会友在聚会后自然交谈', 'Church community members talking after a gathering')} />
        <div className="hero-tint" />
        <div className="hero-caption">
          <p>{copy(lang, '汉美顿怀恩堂', 'Hamilton Chinese Methodist Church')}</p>
          <h1>{copy(lang, '与神连接，和人同行', 'Connected with God and people')}</h1>
        </div>
        <a className="scroll-cue" href="#welcome">{copy(lang, '向下探索', 'Discover more')} <span aria-hidden="true">&#8595;</span></a>
      </section>

      <section id="welcome" className="scripture-band">
        <p className="reveal-up">{copy(lang, '因为只有一位神，在神和人中间，只有一位中保，乃是降世为人的基督耶稣。', 'For there is one God and one mediator between God and mankind, the man Christ Jesus.')}</p>
        <span className="reveal-up">{copy(lang, '提摩太前书 2:5', '1 Timothy 2:5')}</span>
      </section>

      <section className="new-here">
        <div className="new-here-photo reveal-up"><img src="/images/hcmc-community-hero.png" alt="" /></div>
        <div className="new-here-copy reveal-up">
          <p>{copy(lang, '第一次来吗？', 'New here?')}</p>
          <h2>{copy(lang, '很高兴认识你。', 'We would love to meet you.')}</h2>
          <span>{copy(lang, '你不需要熟悉任何仪式，也不需要准备好答案。先来坐坐，认识一些人。', 'You do not need to know the rituals or have the answers. Come, take a seat, and meet a few people.')}</span>
          <button onClick={() => onNavigate('register')}>{copy(lang, '告诉我们你会来', 'Tell us you are coming')} <b aria-hidden="true">&#8594;</b></button>
        </div>
      </section>

      <section className="services-block">
        <div className="section-heading reveal-up"><p>{copy(lang, '聚会与资源', 'Services')}</p><h2>{copy(lang, '加入我们的主日。', 'Join our Sunday service.')}</h2></div>
        <div className="service-columns">
          <article className="service-column reveal-up"><span className="service-symbol">S</span><h3>{copy(lang, '主日聚会', 'Sunday service')}</h3><p>{copy(lang, '我们相信耶稣与圣经是生活和家庭的重要根基，也带来智慧与祝福。', 'We believe Jesus and the Bible are important foundations for our lives and families.')}</p><button onClick={() => onNavigate('calendar')}>{copy(lang, '查看时间', 'View times')} <span aria-hidden="true">&#8594;</span></button></article>
          <article className="service-column reveal-up"><span className="service-symbol">N</span><h3>{copy(lang, '初次来访', 'New to church')}</h3><p>{copy(lang, '了解停车、语言、儿童安排，以及第一次到访时会发生什么。', 'Find out about parking, languages, children, and what to expect on your first visit.')}</p><button onClick={() => onNavigate('register')}>{copy(lang, '计划来访', 'Plan a visit')} <span aria-hidden="true">&#8594;</span></button></article>
          <article className="service-column reveal-up"><span className="service-symbol">W</span><h3>{copy(lang, '每周消息', 'Weekly bulletin')}</h3><p>{copy(lang, '查看近期聚会与教会生活消息，找到适合你和家人的群体。', 'See recent gatherings and church updates, and find a community for you and your family.')}</p><button onClick={() => onNavigate('calendar')}>{copy(lang, '近期活动', 'Upcoming events')} <span aria-hidden="true">&#8594;</span></button></article>
        </div>
      </section>

      <section className="church-life">
        <div className="life-heading reveal-up"><p>{copy(lang, '教会生活', 'Church life')}</p><h2>{copy(lang, '与神连接，和人同行。', 'Connected with God and people.')}</h2></div>
        <div className="life-grid">
          <article className="life-card life-card-photo reveal-up"><img src="/images/hcmc-community-hero.png" alt="" /><div><p>{copy(lang, '家庭与儿童', 'Kids and families')}</p><span>{copy(lang, '每周日 10:00', 'Every Sunday, 10 AM')}</span></div></article>
          <article className="life-card life-card-dark reveal-up"><p>{copy(lang, '青年团契', 'Youth')}</p><h3>{copy(lang, '一起提问、成长，也一起生活。', 'Ask questions, grow, and share life together.')}</h3><button onClick={() => onNavigate('calendar')}>{copy(lang, '了解更多', 'Read more')} <span aria-hidden="true">&#8594;</span></button></article>
          <article className="life-card life-card-light reveal-up"><p>{copy(lang, '成人与家庭', 'Adults and families')}</p><h3>{copy(lang, '在异乡，成为彼此的家人。', 'Finding family, far from home.')}</h3><button onClick={() => onNavigate('calendar')}>{copy(lang, '了解更多', 'Read more')} <span aria-hidden="true">&#8594;</span></button></article>
        </div>
      </section>

      <section className="about-band">
        <div className="about-photo reveal-up"><img src="/images/hcmc-cross-hero.png" alt="" /></div>
        <div className="about-copy reveal-up"><p>{copy(lang, '汉美顿怀恩堂', 'Hamilton Chinese Methodist Church')}</p><h2>{copy(lang, '一群爱耶稣、忠于圣经，也认真彼此相爱的人。', 'A community learning to love, support, and encourage one another.')}</h2><button onClick={() => onNavigate('scripture')}>{copy(lang, '从经文开始', 'Start with Scripture')} <span aria-hidden="true">&#8594;</span></button></div>
      </section>

      <section className="next-gathering">
        <div><p>{copy(lang, '下次相聚', 'Next gathering')}</p><h2>{activities[0]?.title || copy(lang, '星期日主日聚会', 'Sunday service')}</h2></div>
        <div><p>{activities[0]?.location || 'Hamilton, New Zealand'}</p><button onClick={() => onNavigate('register')}>{copy(lang, '我想来看看', 'I am new')} <span aria-hidden="true">&#8594;</span></button></div>
      </section>
    </main>
  );
}
