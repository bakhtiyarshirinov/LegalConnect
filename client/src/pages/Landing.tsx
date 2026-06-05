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
        padding: '0 48px', height: 64, borderBottom: '1px solid #F0F0F0',
        position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
          <Button variant="ghost" onClick={() => navigate('/login')}>Daxil ol</Button>
          <Button variant="primary" onClick={() => navigate('/register')}>Başlayın</Button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 860, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} custom={0}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#F5F5F5', border: '1px solid #F0F0F0', borderRadius: 20,
              padding: '5px 14px', fontSize: 12, fontWeight: 600, color: '#6B6B6B', marginBottom: 32,
            }}>
              <CheckCircle size={12} color="#2F9E44" /> Azərbaycanda 500+ müştəri tərəfindən etibar edilir
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} style={{
            fontSize: 'clamp(40px, 7vw, 70px)', fontWeight: 800,
            lineHeight: 1.06, letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: 24,
          }}>
            Azərbaycanda Hüquq Ekspertinizi Tapın
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} style={{
            fontSize: 18, color: '#6B6B6B', lineHeight: 1.65,
            maxWidth: 520, margin: '0 auto 44px', fontWeight: 400,
          }}>
            Təsdiqlənmiş vəkillərlə dərhal əlaqə saxlayın
          </motion.p>

          <motion.div variants={fadeUp} custom={3} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" onClick={() => navigate('/lawyers')} style={{ gap: 8 }}>
              Vəkil tap <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => { window.location.href = 'http://localhost:5174' }}>
              Vəkil kimi qoşul
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section style={{ background: '#FAFAFA', borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', padding: '56px 24px' }}>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}
          style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
        >
          {[
            { num: '500+', label: 'Təsdiqlənmiş Vəkillər' },
            { num: '2,000+', label: 'Həll edilmiş İşlər' },
            { num: '4.9', label: 'Orta Reytinq' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} style={{
              background: '#FFFFFF',
              border: '1px solid #F0F0F0',
              borderTop: '3px solid #0A0A0A',
              borderRadius: 16,
              padding: '28px 24px',
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em', color: '#0A0A0A', marginBottom: 8, lineHeight: 1 }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 920, margin: '0 auto', padding: '88px 24px' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.1 }}>Necə işləyir</h2>
            <p style={{ color: '#6B6B6B', fontSize: 16 }}>Hüquqi yardım üçün üç sadə addım</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { step: '01', icon: <Users size={22} />, title: 'Vəkil tap', desc: 'Təsdiqlənmiş vəkilləri ixtisas, şəhər və qiymətə görə axtarın. Real müştərilərin rəylərini oxuyun.' },
              { step: '02', icon: <Calendar size={22} />, title: 'Sifariş et', desc: 'Özünüzə uyğun vaxtda konsultasiya planlaşdırın. Onlayn və ya şəxsi görüş mümkündür.' },
              { step: '03', icon: <MessageSquare size={22} />, title: 'Məsləhət al', desc: 'Söhbət vasitəsilə məsləhət alın. Vəziyyətinizə uyğun ekspert hüquqi məsləhət əldə edin.' },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i + 1} style={{
                background: '#FFFFFF', border: '1px solid #F0F0F0', borderRadius: 16,
                padding: '32px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 16, right: 20,
                  fontSize: 64, fontWeight: 800, color: '#F5F5F5',
                  letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {s.step}
                </div>
                <div style={{
                  width: 48, height: 48, background: '#0A0A0A', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: 20,
                }}>
                  {s.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#0A0A0A' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.65 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section style={{ background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.div variants={fadeUp} style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
            <Shield size={20} color="#A3A3A3" /><Zap size={20} color="#A3A3A3" /><Star size={20} color="#A3A3A3" />
          </motion.div>
          <motion.h2 variants={fadeUp} style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1 }}>
            Vəkilinizi tapmağa hazırsınız?
          </motion.h2>
          <motion.p variants={fadeUp} style={{ fontSize: 16, color: '#A3A3A3', marginBottom: 40 }}>
            LegalConnect-də hüquqi yardım tapan minlərlə müştəriyə qoşulun.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="lg" style={{ background: '#FFFFFF', color: '#0A0A0A' }} onClick={() => navigate('/register')}>
              Pulsuz hesab yarat <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="ghost" style={{ color: '#A3A3A3', borderColor: '#262626' }} onClick={() => navigate('/lawyers')}>
              Vəkillərə bax
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #F0F0F0', padding: '28px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#0A0A0A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={12} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>LegalConnect</span>
        </div>
        <span style={{ fontSize: 13, color: '#A3A3A3' }}>© 2024 LegalConnect. Bütün hüquqlar qorunur.</span>
      </footer>
    </div>
  )
}
