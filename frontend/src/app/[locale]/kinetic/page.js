import {
  ArrowRight,
  Bell,
  CreditCard,
  Fingerprint,
  Flame,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  MessageCircle,
  Network,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wrench,
} from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'Airbcar Kinetic Concierge',
  description:
    'A cinematic, social-first showcase for Airbcar agency management and marketplace vision.',
};

const agencyFeatures = [
  {
    icon: LayoutDashboard,
    title: 'Command Center',
    description:
      'Manage your fleet and bookings from one high-fidelity control surface.',
  },
  {
    icon: LineChart,
    title: 'Real-Time Analytics',
    description:
      'Track utilization and revenue trends with precision signals built for Morocco.',
  },
  {
    icon: ShieldCheck,
    title: 'Identity Lock',
    description:
      'Instant verification for Moroccan and international IDs with automated checks.',
  },
];

const footerLinks = ['Privacy Policy', 'Terms of Service', 'Agency Portal', 'Contact Us'];

export default function KineticPage() {
  return (
    <div className={styles.pageShell}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>Airbcar</div>
        <div className={styles.navLinks}>
          <a href="#">Fleet</a>
          <a href="#">Agencies</a>
          <a href="#">Community</a>
          <a href="#" className={styles.activeNavLink}>
            Heritage
          </a>
        </div>
        <div className={styles.navActions}>
          <button aria-label="Notifications" className={styles.iconButton}>
            <Bell size={18} />
          </button>
          <button aria-label="Profile" className={styles.avatarButton}>
            <User size={18} />
          </button>
          <button className={styles.primaryPill}>Get Started</button>
        </div>
      </nav>

      <main>
        <section className={styles.heroSection}>
          <div className={styles.heroBackdrop}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBx4OOR8aHBisKrfPu05inMIl3elatJLexfA0jzqzvUwqFfTtvZEEpzAYJmnbgUYTYB6hFZV8dG1J9GM2o02BjJGT6QzDM2ypFBvC6QEXtOKBKax0MLXWAAYX0uo9KXY8ROYhVfNn8Qn5k5afq0a-Q-M97pYIebNvBj16G_jexXEHg0YllGJVyq3-AZZEJQI1UN_VbX7I4-MmKDLWNtKJRdpNQc41K9L_OPsWTlM7fV2xkbgTFduqqKPnXdA-fYVCp8QMa3WwF-hro"
              alt="Premium sports car in cinematic studio lighting"
            />
            <div className={styles.heroOverlay} />
          </div>

          <div className={styles.heroContent}>
            <span className={styles.eyebrowBadge}>The Kinetic Concierge</span>
            <h1 className={styles.heroTitle}>
              <span>The Future of</span>
              <span className={styles.orangeGradient}>Moroccan Mobility</span>
            </h1>
            <p>
              We are redefining the road by blending high-velocity fleet operations
              with authentic local hospitality and confidence.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.ctaPrimary}>
                Discover the Fleet
                <ArrowRight size={18} />
              </button>
              <button className={styles.ctaSecondary}>View Our Heritage</button>
            </div>
          </div>

          <div className={styles.heroMeta}>Studio Model RL-2026</div>
        </section>

        <section className={styles.visionSection}>
          <div className={styles.visionGrid}>
            <div className={styles.visionImages}>
              <img
                className={styles.visionImageTall}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlE84zFkA7hxgczpyQFd7OX_cY3kK8vRVuHIW8lLb46-xqm4q45rGF4v_Cl_-XzQhDluaGMEGkfGXARvBxgCzUXjoyHtZ2vZxWWZKQlx6B7w1lX0DGmk3uoas6C-k7iqW5ySg8k4tWVqN-nKhTDpluHgDZGq1thPe7rMqAF0aYXFNG3j0GXsd9qO9aV3FJpsh29EyIB9KEcPdU1WdR_uFXXJoF-rF6X9IgpO2qs6PrwWd9OJC-6cHy9_bLbtNrJc_0le0iB0yeeZM"
                alt="Premium agency office interior"
              />
              <div className={styles.statCard}>
                <strong>12+</strong>
                <span>Major Cities</span>
              </div>
              <div className={styles.statCard}>
                <strong>98%</strong>
                <span>Client Trust</span>
              </div>
              <img
                className={styles.visionImageTall}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAHUQJBRQlusxtFNgio5Kj92XiOOBhex_AS_6lSiRdITJY9v2tvTshSEpJrZlCbKUDJylEFREiZClQx5gTw8ALvs60tvD-q7NVfXb3JghJqA_s9m61fbIzY_8Xf1c_rzdtz8xjSz7ivmOwzEG0_j-Ep1kLQUtLhu2yoJLuJeEJybdLHSVwLNwQg1xgclQjiSAVX5uOu2O4E4TtImrs-Kf_U_b1WSjdQ682zQP5Ffa4EIR-XbRXrrY-PoUirV_0AUJsNqFeNaWWN0E"
                alt="Car key handover moment"
              />
            </div>

            <div className={styles.visionCopy}>
              <span className={styles.eyebrow}>Our Philosophy</span>
              <h2>
                Social-First,
                <br />
                <em>Agency-Powered</em>
              </h2>
              <p>
                In Morocco, trust is the currency of the road. Airbcar bridges
                professional management with community-driven confidence.
              </p>

              <div className={styles.infoStack}>
                <article className={styles.infoCard}>
                  <Network size={26} />
                  <div>
                    <h3>Integrated Ecosystem</h3>
                    <p>Every booking is anchored to a verified agency network.</p>
                  </div>
                </article>
                <article className={styles.infoCard}>
                  <MessageCircle size={26} />
                  <div>
                    <h3>Community Pulse</h3>
                    <p>Live reviews and local insights shape each travel decision.</p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.agencySection}>
          <div className={styles.sectionHeading}>
            <span>Partner Advantage</span>
            <h2>Mission Control</h2>
            <p>
              Enterprise-grade infrastructure for the modern Moroccan fleet owner.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {agencyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className={styles.featureCard} key={feature.title}>
                  <Icon size={34} />
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.travelerSection}>
          <div className={styles.travelerHeading}>
            <div>
              <span className={styles.eyebrow}>For The Traveler</span>
              <h2>
                More than a
                <br />
                <em>Rental</em>
              </h2>
            </div>
            <p>
              Experience Morocco with the confidence of a local and the precision
              of a digital concierge.
            </p>
          </div>

          <div className={styles.bentoGrid}>
            <article className={`${styles.bentoCard} ${styles.bentoWide}`}>
              <h3>Verdict Matches</h3>
              <p>
                AI sentiment analysis maps you to the right vehicle profile for
                every journey type and terrain.
              </p>
              <div className={styles.tagRow}>
                <span className={styles.tagPrimary}>98% Match for Roadtrips</span>
                <span className={styles.tagMuted}>Top Rated: Agadir to Dakhla</span>
              </div>
            </article>

            <article className={`${styles.bentoCard} ${styles.bentoAccent}`}>
              <LifeBuoy size={44} />
              <h3>Concierge Q&amp;A</h3>
              <p>Live community answers from local experts and agencies.</p>
            </article>

            <article className={styles.bentoCard}>
              <h3>Reactions</h3>
              <div className={styles.reactionWrap}>
                <span>
                  <Flame size={16} /> 42
                </span>
                <span>
                  <Star size={16} /> 4.9
                </span>
              </div>
            </article>

            <article className={`${styles.bentoCard} ${styles.bentoImage}`}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbeeS2B5Jad6a8SinBGtJTDmOFVc1gxsjtrKreSUGRTyVZ1MAWIe9pIKzWcoOviCihkT6xuq5tY017WmUZL421v2Eg1m_H_yk__9-700i8QC7kD1EtUnyPfS_YbVhWxr3DUdWs2dFSsd8n6xdGAtMSxSVtuHED1D5fxuKFFtM9LdNX_PkSHD7zgrIM_QeFrAPWsjom-AhHZGYllYkbFfuUQQpZBwuHyWLqk3K1jiaiRQMbN1xjoALxmcxRTZ-a2ci6OrN1Kc-cHX0"
                alt="Travelers with premium SUV in Morocco"
              />
              <div className={styles.imageOverlay}>
                <h3>Build Your Heritage</h3>
                <p>
                  Every booking unlocks premium access and community-based rewards.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.standardSection}>
          <div className={styles.sectionHeading}>
            <span>Local Trust Layer</span>
            <h2>The Moroccan Standard</h2>
            <p>Trust built on transparency, not just tradition.</p>
          </div>

          <div className={styles.dualCards}>
            <article className={styles.standardCard}>
              <CreditCard size={32} />
              <h3>The Caution System</h3>
              <p>
                Digitized security deposits with escrow-backed release for faster,
                cleaner handovers.
              </p>
            </article>
            <article className={styles.standardCard}>
              <Fingerprint size={32} />
              <h3>Identity Verification</h3>
              <p>
                Rigorous checks for hosts and guests ensure accountability across
                the kingdom.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow}>
              <Wrench size={190} />
            </div>
            <span>Ready for the Road?</span>
            <h2>
              Join the
              <br />
              <strong>Kinetic Motion</strong>
            </h2>
            <p>The future of Moroccan mobility starts here.</p>
            <div className={styles.heroActions}>
              <button className={styles.ctaPrimary}>Rent a Car</button>
              <button className={styles.ctaSecondary}>Partner with Us</button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <div className={styles.logo}>Airbcar</div>
          <p>© 2026 AIRBCAR MOROCCO. BUILT FOR THE KINETIC JOURNEY.</p>
          <div className={styles.footerIcons}>
            <button aria-label="Share">
              <Share2 size={16} />
            </button>
            <button aria-label="Languages">
              <Languages size={16} />
            </button>
          </div>
        </div>

        <div className={styles.footerLinks}>
          {footerLinks.map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
