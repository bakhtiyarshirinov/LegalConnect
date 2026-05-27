import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Scale, ArrowRight, Shield, Star, Zap, MessageSquare, Calendar, CheckCircle, Users } from 'lucide-react'
import { Button } from '../components/ui/Button'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const },
  }),
}
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#0A0A0A' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 48px', height: 64, borderBottom: '1px solid #E8E8E8',
        position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#0A0A0A', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Scale size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: '#0A0A0A' }}>LegalConnect</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
          <Button variant="primary" onClick={() => navigate('/register')}>Get Started</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '96px 24px 72px', textAlign: 'center' }}>
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F5F5F5', border: '1px solid #E8E8E8', borderRadius: 20,
              padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 28,
            }}>
              <CheckCircle size={12} color="#16a34a" /> Trusted by 500+ clients in Azerbaijan
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} style={{
            fontSize: 'clamp(40px, 7vw, 68px)', fontWeight: 800,
            lineHeight: 1.08, letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: 24,
          }}>
            Find Your Legal<br />
            <span style={{ color: '#6B6B6B' }}>Expert in Azerbaijan</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} style={{
            fontSize: 18, color: '#6B6B6B', lineHeight: 1.65,
            maxWidth: 540, margin: '0 auto 40px', fontWeight: 400,
          }}>
            Connect with verified lawyers instantly. Book consultations, get legal advice,
            and resolve your issues — all in one place.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => navigate('/lawyers')} style={{ gap: 8 }}>
              Find a Lawyer <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => { window.location.href = 'http://localhost:5174' }}>
              Join as Lawyer
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ background: '#F5F5F5', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', padding: '48px 24px' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}
          style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
        >
          {[
            { num: '500+', label: 'Verified Lawyers', icon: <Users size={22} /> },
            { num: '2,000+', label: 'Cases Resolved', icon: <CheckCircle size={22} /> },
            { num: '4.9★', label: 'Average Rating', icon: <Star size={22} /> },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} style={{
              background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16,
              padding: '28px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#0A0A0A' }}>{stat.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: '#0A0A0A', marginBottom: 6 }}>{stat.num}</div>
              <div style={{ fontSize: 14, color: '#6B6B6B', fontWeight: 500 }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 920, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>How it works</h2>
            <p style={{ color: '#6B6B6B', fontSize: 16 }}>Three simple steps to get legal help</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { step: '01', icon: <Users size={22} />, title: 'Find a Lawyer', desc: 'Browse verified lawyers by specialization, city, and price. Read reviews from real clients.' },
              { step: '02', icon: <Calendar size={22} />, title: 'Book Appointment', desc: 'Choose a convenient time slot. Online or in-person consultations available.' },
              { step: '03', icon: <MessageSquare size={22} />, title: 'Get Legal Help', desc: 'Consult via chat. Get expert legal advice tailored to your situation.' },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i + 1} style={{
                background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: 16,
                padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  width: 48, height: 48, background: '#0A0A0A', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: 20,
                }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#A3A3A3', letterSpacing: '0.1em', marginBottom: 8 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '72px 24px', textAlign: 'center' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
            <Shield size={20} color="#A3A3A3" /><Zap size={20} color="#A3A3A3" /><Star size={20} color="#A3A3A3" />
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontSize: 38, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Ready to find your lawyer?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#A3A3A3', marginBottom: 36 }}>
            Join thousands of clients who've found legal help on LegalConnect.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" style={{ background: '#FFFFFF', color: '#0A0A0A' }} onClick={() => navigate('/register')}>
              Create Free Account <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="ghost" style={{ color: '#A3A3A3', borderColor: '#262626' }} onClick={() => navigate('/lawyers')}>
              Browse Lawyers
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #E8E8E8', padding: '28px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#0A0A0A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={12} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>LegalConnect</span>
        </div>
        <span style={{ fontSize: 13, color: '#A3A3A3' }}>© 2024 LegalConnect. All rights reserved.</span>
      </footer>
    </div>
  )
}
