import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Pricing() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleSubscribe = async () => {
    if (!token) {
      navigate('/signup');
      return;
    }

    try {
      const response = await axios.post('/api/subscriptions/create-checkout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.href = response.data.url;
    } catch (error) {
      alert('Error starting checkout');
    }
  };

  return (
    <div className="container">
      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Simple, Transparent Pricing</h1>
          <p>Choose the plan that works for you</p>
        </div>

        <div className="pricing-cards">
          <div className="pricing-card">
            <h3>Free</h3>
            <div className="pricing-price">$0</div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Forever free</p>
            <ul className="pricing-features">
              <li>Upload 1 video/month</li>
              <li>Basic caption generation</li>
              <li>2 platforms per repurpose</li>
              <li>Community support</li>
            </ul>
            <button onClick={() => navigate('/signup')}>Get Started</button>
          </div>

          <div className="pricing-card" style={{ borderColor: '#5b21b6', boxShadow: '0 4px 12px rgba(91, 33, 182, 0.15)' }}>
            <div style={{ background: '#5b21b6', color: 'white', padding: '5px 10px', borderRadius: '4px', display: 'inline-block', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
              POPULAR
            </div>
            <h3>Pro</h3>
            <div className="pricing-price">$19<span style={{ fontSize: '20px', color: '#666' }}>/mo</span></div>
            <p style={{ color: '#666', marginBottom: '20px' }}>Save 20% on annual</p>
            <ul className="pricing-features">
              <li>Unlimited videos</li>
              <li>AI-optimized captions</li>
              <li>All 4 platforms</li>
              <li>Priority support</li>
              <li>Analytics dashboard</li>
              <li>Bulk repurpose (10 videos)</li>
            </ul>
            <button onClick={handleSubscribe} style={{ background: '#5b21b6' }}>Start Free Trial</button>
          </div>

          <div className="pricing-card">
            <h3>Agency</h3>
            <div className="pricing-price">$59<span style={{ fontSize: '20px', color: '#666' }}>/mo</span></div>
            <p style={{ color: '#666', marginBottom: '20px' }}>For teams</p>
            <ul className="pricing-features">
              <li>Everything in Pro</li>
              <li>Up to 5 team members</li>
              <li>Bulk repurpose (50 videos)</li>
              <li>API access</li>
              <li>Custom branding</li>
              <li>Dedicated support</li>
            </ul>
            <button onClick={handleSubscribe}>Contact Sales</button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', marginTop: '40px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px' }}>All plans include:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'left' }}>
            <div>✓ No credit card required for free plan</div>
            <div>✓ Cancel anytime</div>
            <div>✓ 14-day free trial (Pro & Agency)</div>
            <div>✓ Email support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
