import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'
import ThemeToggle from '../components/ThemeToggle'
import Disclaimer from '../components/Disclaimer'
import Preloader from '../components/Preloader'
import Reveal from '../components/Reveal'
import { DoodleSquiggle, DoodleCircle } from '../components/Doodles'
import { TEAM, CONTACT, avatarGradient, initials } from '../data/team'
import {
  GlobeIcon, ChatIcon, ChartIcon, ShieldIcon, AlertIcon, PinIcon, LockIcon, CheckIcon, PlusIcon, ArrowIcon,
} from '../components/icons'

export default function Landing() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrollY(y)
      setScrolled(y > 12)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hero fades/parallaxes out as you scroll (Kry-style).
  const heroFade = Math.max(0, 1 - scrollY / 480)
  const heroShift = Math.min(scrollY * 0.25, 120)

  const features = [
    { Icon: GlobeIcon, key: 'f1' },
    { Icon: ChatIcon, key: 'f2' },
    { Icon: ChartIcon, key: 'f3' },
    { Icon: LockIcon, key: 'f4' },
    { Icon: AlertIcon, key: 'f5' },
    { Icon: PinIcon, key: 'f6' },
  ]
  const stats = ['stat1', 'stat2', 'stat3', 'stat4']
  const secItems = ['sec1', 'sec2', 'sec3', 'sec4']
  const quotes = ['t1', 't2', 't3']
  const faqs = ['faq1', 'faq2', 'faq3', 'faq4']

  return (
    <div>
      <Preloader />

      {/* Nav — centered brand, split links left/right (Alto style) */}
      <nav className={`lp-nav ${scrolled ? 'scrolled card-glass' : ''}`}>
        <div className="lp-nav-side start">
          <a href="#features" className="lp-nav-link">{t('landing.navFeatures')}</a>
          <a href="#how" className="lp-nav-link">{t('landing.navHow')}</a>
          <Link to="/pricing" className="lp-nav-link">{t('pricing.navTitle')}</Link>
        </div>
        <div className="lp-brand">
          <span className="lp-logo">◎</span>
          <span>{t('app.name')}</span>
        </div>
        <div className="lp-nav-side end">
          <LanguageToggle />
          <ThemeToggle />
          <Link to="/signin" className="btn btn-ghost" style={{ padding: '9px 18px' }}>{t('auth.signIn')}</Link>
        </div>
      </nav>

      {/* Hero — full-bleed image background with animated effects */}
      <header className="lp-hero lp-hero-image">
        <div className="lp-hero-bg" style={{ opacity: heroFade, transform: `translateY(${heroShift * 0.3}px)` }}>
          <img src="/hero.jpg" alt="" className="lp-hero-bgimg" loading="eager" />
          <div className="lp-hero-veil" />
          {/* Animated particle overlay */}
          <div className="lp-hero-particles" aria-hidden="true">
            <span className="lp-particle p1" />
            <span className="lp-particle p2" />
            <span className="lp-particle p3" />
            <span className="lp-particle p4" />
            <span className="lp-particle p5" />
            <span className="lp-particle p6" />
            <span className="lp-particle p7" />
            <span className="lp-particle p8" />
            <span className="lp-particle p9" />
            <span className="lp-particle p10" />
            <span className="lp-particle p11" />
            <span className="lp-particle p12" />
          </div>
          {/* Pulsing glow overlay */}
          <div className="lp-hero-glow" />
          <DoodleSquiggle className="lp-doodle d1" />
          <DoodleCircle className="lp-doodle d2" />
        </div>

        <div className="lp-hero-content" style={{ opacity: heroFade, transform: `translateY(${heroShift}px)` }}>
          <div className="lp-badge"><span className="dot" />{t('landing.badge')}</div>
          <h1 className="lp-title">
            {t('landing.heroKicker')} — <span className="grad">{t('landing.heading')}</span>
          </h1>
          <p className="lp-hero-lead">{t('landing.subheading')}</p>
          <div className="lp-hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">{t('landing.getStarted')}</Link>
            <a href="#how" className="btn btn-ghost btn-lg">{t('landing.heroCta2')}</a>
          </div>

          {/* Floating sample-result card */}
          <div className="lp-hero-visual">
            <div className="lp-mock">
              <div className="row spread" style={{ marginBottom: 8 }}>
                <strong>{t('results.flaggedTitle')}</strong>
                <span className="pill pill-normal">{t('results.status.normal')}</span>
              </div>
              <div className="lp-mock-row"><span className="muted">CEA</span><span><strong>2.1</strong> ng/mL</span></div>
              <div className="lp-mock-row"><span className="muted">CA-125</span><span><strong>18</strong> U/mL</span></div>
              <div className="lp-mock-row">
                <span className="muted">PSA</span>
                <span className="row" style={{ gap: 8 }}><strong>5.2</strong> ng/mL <span className="pill pill-elevated">{t('results.status.elevated')}</span></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="lp-section lp-section-tight">
        <Reveal className="lp-stats stagger" as="div">
          {stats.map((s) => (
            <div key={s}>
              <div className="lp-stat-num">{t(`landing.${s}Num`)}</div>
              <div className="lp-stat-label">{t(`landing.${s}Label`)}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Features */}
      <section className="lp-section" id="features">
        <Reveal className="lp-center" style={{ marginBottom: 44 }}>
          <div className="lp-eyebrow">{t('landing.badge')}</div>
          <h2 className="lp-h2">{t('landing.featuresTitle')}</h2>
          <p className="lp-lead lp-center">{t('landing.featuresSubtitle')}</p>
        </Reveal>
        <div className="lp-features stagger">
          {features.map(({ Icon, key }) => (
            <div className="lp-feature" key={key}>
              <div className="lp-feature-icon"><Icon width={24} height={24} /></div>
              <h3 className="mt-0">{t(`landing.${key}Title`)}</h3>
              <p className="muted mt-0">{t(`landing.${key}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section" id="how">
        <Reveal className="lp-center" style={{ marginBottom: 44 }}>
          <div className="lp-eyebrow" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {t('nav.upload')}
            <span className="flow-arrow"><ArrowIcon width={16} height={16} /></span>
            {t('results.title')}
          </div>
          <h2 className="lp-h2">{t('landing.howTitle')}</h2>
        </Reveal>
        <div className="grid-3 stagger">
          {[1, 2, 3].map((i) => (
            <div className="card" key={i}>
              <div className="step-dot done" style={{ marginBottom: 12 }}>{i}</div>
              <h3 className="mt-0">{t(`landing.step${i}Title`)}</h3>
              <p className="muted small mt-0">{t(`landing.step${i}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="lp-section">
        <div className="lp-security">
          <div>
            <div className="lp-feature-icon" style={{ width: 56, height: 56 }}>
              <ShieldIcon width={28} height={28} />
            </div>
            <h2 className="lp-h2">{t('landing.securityTitle')}</h2>
            <p className="lp-lead">{t('landing.securitySubtitle')}</p>
          </div>
          <div>
            {secItems.map((s) => (
              <div className="lp-sec-item" key={s}>
                <span className="lp-sec-check"><CheckIcon width={15} height={15} /></span>
                <span>{t(`landing.${s}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="lp-section">
        <Reveal className="lp-center" style={{ marginBottom: 44 }}>
          <h2 className="lp-h2">{t('landing.testimonialTitle')}</h2>
        </Reveal>
        <div className="lp-quotes stagger">
          {quotes.map((q) => (
            <div className="lp-quote" key={q}>
              <div className="lp-quote-mark">“</div>
              <p className="mt-0">{t(`landing.${q}Body`)}</p>
              <div className="lp-quote-author">
                <span className="lp-avatar">{t(`landing.${q}Name`).charAt(0)}</span>
                <div>
                  <strong>{t(`landing.${q}Name`)}</strong>
                  <div className="muted small">{t(`landing.${q}Role`)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="lp-section" id="team">
        <Reveal className="lp-center" style={{ marginBottom: 44 }}>
          <div className="lp-eyebrow">{t('landing.footerCompany')}</div>
          <h2 className="lp-h2">{t('landing.teamTitle')}</h2>
          <p className="lp-lead lp-center">{t('landing.teamSubtitle')}</p>
        </Reveal>
        <div className="lp-team stagger">
          {TEAM.map((m, i) => (
            <div className="lp-member" key={m.name}>
              <div className="lp-member-avatar" style={{ background: avatarGradient(i) }}>
                {initials(m.name)}
              </div>
              <div className="lp-member-name">{m.name}</div>
              <div className="muted small">{m.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="lp-section" id="contact">
        <div className="lp-contact">
          <div>
            <div className="lp-eyebrow">{t('landing.contactTitle')}</div>
            <h2 className="lp-h2">{t('landing.contactSubtitle')}</h2>
            <a href={`mailto:${CONTACT.email}`} className="lp-contact-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="lp-contact-icon"><ChatIcon width={22} height={22} /></span>
              <div>
                <div className="muted small">{t('landing.contactEmail')}</div>
                <strong style={{ wordBreak: 'break-all' }}>{CONTACT.email}</strong>
              </div>
            </a>
            <div className="lp-contact-card">
              <span className="lp-contact-icon"><PinIcon width={22} height={22} /></span>
              <div>
                <div className="muted small">{t('landing.contactLocation')}</div>
                <strong>{CONTACT.location}</strong>
              </div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section">
        <div className="lp-center" style={{ marginBottom: 40 }}>
          <h2 className="lp-h2">{t('landing.faqTitle')}</h2>
        </div>
        <div className="lp-faq">
          {faqs.map((f, i) => (
            <div className={`lp-faq-item ${openFaq === i ? 'open' : ''}`} key={f}>
              <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                {t(`landing.${f}Q`)}
                <span className="lp-faq-icon"><PlusIcon width={18} height={18} /></span>
              </button>
              <div className="lp-faq-a"><div className="lp-faq-a-inner">{t(`landing.${f}A`)}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-section">
        <div className="lp-cta">
          <h2>{t('landing.ctaTitle')}</h2>
          <p>{t('landing.ctaBody')}</p>
          <Link to="/signup" className="btn btn-lg">{t('landing.getStarted')}</Link>
        </div>
        <div style={{ maxWidth: 760, margin: '28px auto 0' }}><Disclaimer /></div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div>
            <div className="lp-brand" style={{ marginBottom: 12 }}>
              <span className="lp-logo">◎</span><span>{t('app.name')}</span>
            </div>
            <p className="muted small" style={{ maxWidth: 260 }}>{t('landing.footerTagline')}</p>
          </div>
          <div>
            <h4>{t('landing.footerProduct')}</h4>
            <a href="#features">{t('landing.navFeatures')}</a>
            <a href="#how">{t('landing.navHow')}</a>
            <Link to="/signup">{t('landing.getStarted')}</Link>
          </div>
          <div>
            <h4>{t('landing.footerCompany')}</h4>
            <a href="#team">{t('landing.teamNav')}</a>
            <a href="#contact">{t('landing.contactTitle')}</a>
            <Link to="/pricing">{t('pricing.navTitle')}</Link>
          </div>
          <div>
            <h4>{t('landing.footerLegal')}</h4>
            <a href="#faq">{t('landing.faqNav')}</a>
            <a href={`mailto:${CONTACT.email}`}>{t('landing.contactEmail')}</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          © {t('app.name')} — {t('landing.footerRights')}
        </div>
      </footer>
    </div>
  )
}

// Contact form. Composes a mailto: link so it works without a mail backend —
// the user's email client opens pre-filled. Swap for a POST /contact endpoint later.
function ContactForm() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    const subject = encodeURIComponent(`DETECTA — message from ${form.name || 'a visitor'}`)
    const body = encodeURIComponent(`${form.message}\n\nFrom: ${form.name} <${form.email}>`)
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <form className="card" onSubmit={submit}>
      {sent && <div className="form-success">{t('landing.contactSent')}</div>}
      <div className="field">
        <input placeholder={t('landing.contactNamePlaceholder')} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="field">
        <input type="email" placeholder={t('landing.contactEmailPlaceholder')} value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div className="field">
        <textarea rows="4" placeholder={t('landing.contactMessagePlaceholder')} value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      </div>
      <button className="btn btn-primary btn-block">{t('landing.contactSend')}</button>
    </form>
  )
}
