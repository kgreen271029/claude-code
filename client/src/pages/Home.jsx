import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>🎬 Content Repurposer</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid white',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background: 'white',
                  color: '#5b21b6',
                  border: 'none',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Get Started
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'white',
                color: '#5b21b6',
                border: 'none',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Dashboard
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 20px', color: 'white' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: '700' }}>
          One Video.<br />Infinite Platforms.
        </h1>
        <p style={{ fontSize: '20px', marginBottom: '40px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 40px' }}>
          Upload once. AI generates platform-optimized captions for TikTok, Instagram, YouTube & Pinterest.
        </p>
        <button
          onClick={() => navigate('/signup')}
          style={{
            background: 'white',
            color: '#5b21b6',
            border: 'none',
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Start Free →
        </button>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>No credit card required. 1 video free.</p>
      </div>

      {/* Features */}
      <div style={{ background: 'white', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px', color: '#333' }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {[
              {
                icon: '📹',
                title: 'Upload Video',
                desc: 'Upload your video once from your phone'
              },
              {
                icon: '🤖',
                title: 'AI Generates Captions',
                desc: 'Claude creates platform-specific captions'
              },
              {
                icon: '🚀',
                title: 'Multi-Platform Ready',
                desc: 'Copy captions for TikTok, Instagram, YouTube, Pinterest'
              }
            ].map((feature, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '30px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>{feature.icon}</div>
                <h3 style={{ color: '#333', marginBottom: '10px' }}>{feature.title}</h3>
                <p style={{ color: '#666' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ background: '#f9fafb', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '36px', marginBottom: '50px', color: '#333' }}>
            Simple Pricing
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {[
              { name: 'Free', price: '$0', videos: '1/month', platforms: '2', color: '#e5e7eb' },
              { name: 'Pro', price: '$19', videos: 'Unlimited', platforms: 'All 4', color: '#5b21b6' }
            ].map((plan, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                border: `2px solid ${plan.color}`,
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#333', marginBottom: '10px' }}>{plan.name}</h3>
                <div style={{ fontSize: '36px', fontWeight: '700', color: plan.color, marginBottom: '20px' }}>
                  {plan.price}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                  <li>✓ {plan.videos} videos</li>
                  <li>✓ {plan.platforms} platforms</li>
                  <li>✓ AI captions</li>
                </ul>
                <button style={{ width: '100%', padding: '10px', background: plan.color, color: 'white' }}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>Ready to Multiply Your Content?</h2>
        <button
          onClick={() => navigate('/signup')}
          style={{
            background: 'white',
            color: '#5b21b6',
            border: 'none',
            padding: '15px 40px',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Start Free →
        </button>
      </div>
    </div>
  );
}
