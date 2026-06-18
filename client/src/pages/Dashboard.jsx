import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ total_videos: 0, total_captions: 0, platform_breakdown: {} });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok', 'youtube']);
  const [expandedVideo, setExpandedVideo] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchVideos();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/analytics/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axios.get('/api/videos/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(response.data.videos);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);

    try {
      await axios.post('/api/videos/upload', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchVideos();
      fetchStats();
    } catch (error) {
      alert('Error uploading video');
    } finally {
      setUploading(false);
    }
  };

  const handleRepurpose = async (videoId) => {
    try {
      const response = await axios.post(
        `/api/videos/${videoId}/repurpose`,
        { platforms: selectedPlatforms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpandedVideo(videoId);
      // Refresh the video and stats to show new repurposed content
      fetchVideos();
      fetchStats();
    } catch (error) {
      alert('Error repurposing video');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      alert('Failed to copy');
    }
  };

  const downloadCaptions = (video) => {
    const getRepurposedStmt = async () => {
      try {
        const response = await axios.get(
          `/api/videos/${video.id}/repurposed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const repurposed = response.data.repurposed;

        let csvContent = 'Platform,Caption,Hashtags\n';
        repurposed.forEach(item => {
          const escapedCaption = `"${item.caption.replace(/"/g, '""')}"`;
          const escapedHashtags = `"${item.hashtags.replace(/"/g, '""')}"`;
          csvContent += `${item.platform},${escapedCaption},${escapedHashtags}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${video.title || 'captions'}-repurposed.csv`;
        a.click();
      } catch (error) {
        alert('Error downloading captions');
      }
    };
    getRepurposedStmt();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div>
          <h1>Content Repurposer</h1>
          <p>Multiply your content across platforms with AI-generated captions</p>
        </div>
        <div className="user-info">
          <p>Welcome, <strong>{user?.name || 'Creator'}</strong></p>
          <p>{user?.email}</p>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#5b21b6' }}>
            {stats.total_videos}
          </div>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Videos Uploaded</p>
        </div>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#5b21b6' }}>
            {stats.total_captions}
          </div>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>Captions Generated</p>
        </div>
        {Object.entries(stats.platform_breakdown).map(([platform, count]) => (
          <div key={platform} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#5b21b6' }}>
              {count}
            </div>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '12px', textTransform: 'capitalize' }}>
              {platform}
            </p>
          </div>
        ))}
      </div>

      <div className="video-upload">
        <h2>Upload Your Video</h2>
        <div className="upload-area">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="video-input"
            disabled={uploading}
          />
          <label htmlFor="video-input" style={{ cursor: 'pointer', width: '100%' }}>
            <p>📹 Click to upload or drag and drop</p>
            <p style={{ fontSize: '12px', color: '#999' }}>
              Supports MP4, MOV, WebM (Max 500MB)
            </p>
            {uploading && <p>Uploading...</p>}
          </label>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="video-list">
          <h2>Your Videos</h2>
          {videos.map(video => (
            <div key={video.id} className="video-item">
              <h3>{video.title || 'Untitled Video'}</h3>
              <p>Uploaded: {new Date(video.created_at).toLocaleDateString()}</p>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', display: 'block' }}>
                  Select Platforms:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {['tiktok', 'instagram', 'youtube', 'pinterest'].map(platform => (
                    <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms([...selectedPlatforms, platform]);
                          } else {
                            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                          }
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="video-actions">
                <button onClick={() => handleRepurpose(video.id)}>
                  🚀 Repurpose
                </button>
                <button onClick={() => setExpandedVideo(expandedVideo === video.id ? null : video.id)}>
                  {expandedVideo === video.id ? '▼ Hide' : '▶ View'} Versions
                </button>
              </div>

              {expandedVideo === video.id && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>Generated Captions:</p>
                    <button
                      onClick={() => downloadCaptions(video)}
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                    >
                      📥 Download All
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {selectedPlatforms.map(platform => {
                      const fullCaption = `${platform.charAt(0).toUpperCase() + platform.slice(1)} caption goes here with AI-generated content`;
                      const hashtags = '#viral #trending #content';
                      return (
                        <div key={platform} style={{
                          background: '#f9fafb',
                          padding: '15px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <h4 style={{ textTransform: 'uppercase', fontSize: '12px', color: '#5b21b6', marginBottom: '10px', margin: '0 0 10px 0' }}>
                            📱 {platform}
                          </h4>
                          <div style={{
                            background: 'white',
                            padding: '10px',
                            borderRadius: '3px',
                            marginBottom: '10px',
                            minHeight: '60px',
                            maxHeight: '120px',
                            overflowY: 'auto'
                          }}>
                            <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                              {fullCaption}
                            </p>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {hashtags}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => copyToClipboard(fullCaption)}
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', flex: 1, minWidth: '140px' }}
                            >
                              📋 Copy Caption
                            </button>
                            <button
                              onClick={() => copyToClipboard(hashtags)}
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', flex: 1, minWidth: '140px' }}
                            >
                              #️⃣ Copy Tags
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <p>No videos yet. Upload your first video to get started!</p>
        </div>
      )}
    </div>
  );
}
