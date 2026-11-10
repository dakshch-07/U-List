import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logoImg from './assets/logo.png';

const API_BASE = '/api/v1';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ulist_admin_token'));
  const [_user, setUser] = useState<any>(null);

  // Login form state
  const [email, setEmail] = useState('admin@ulist.in');
  const [password, setPassword] = useState('AdminUlist#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin section navigation with browser history support & double-back exit confirmation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ads' | 'highlighted' | 'paid' | 'users' | 'categories' | 'reports' | 'inquiries'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const lastAdminExitPress = React.useRef<number>(0);

  // Sync activeTab with URL hash so mobile physical back button steps back between tabs
  useEffect(() => {
    // Set initial history state
    if (!window.history.state?.ulistAdmin) {
      window.history.replaceState({ ulistAdmin: true, tab: 'dashboard' }, '', window.location.href);
    }

    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '') as any;
      if (['ads', 'highlighted', 'paid', 'users', 'categories', 'reports', 'inquiries'].includes(hash)) {
        setActiveTab(hash);
        setIsSidebarOpen(false);
      } else {
        // At dashboard / root
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
          setIsSidebarOpen(false);
        } else {
          // Double press back to leave admin panel
          const now = Date.now();
          if (now - lastAdminExitPress.current < 2500) {
            window.history.back();
          } else {
            lastAdminExitPress.current = now;
            window.history.pushState({ ulistAdmin: true, tab: 'dashboard' }, '', '#dashboard');
            alert('Press back again to exit Admin Panel');
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    const initHash = window.location.hash.replace('#', '') as any;
    if (initHash && ['dashboard', 'ads', 'highlighted', 'paid', 'users', 'categories', 'reports', 'inquiries'].includes(initHash)) {
      setActiveTab(initHash);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const switchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState({ ulistAdmin: true, tab }, '', `#${tab}`);
    }
  };

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [latestPending, setLatestPending] = useState<any[]>([]);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);

  // Inquiries / Support state
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState(0);

  // Ads list state
  const [ads, setAds] = useState<any[]>([]);
  const [adFilterStatus, setAdFilterStatus] = useState('all');
  const [adSearch, setAdSearch] = useState('');

  // Highlighted ads state
  const [highlightedAds, setHighlightedAds] = useState<any[]>([]);
  const [highlightedSearch, setHighlightedSearch] = useState('');

  // Paid ads state
  const [paidAds, setPaidAds] = useState<any[]>([]);
  const [paidSearch, setPaidSearch] = useState('');

  // Users list state
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Categories list state
  const [categories, setCategories] = useState<any[]>([]);

  // Feedback banner
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboard();
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (res.data.data.user.role !== 'admin') {
        setLoginError('Access denied: Admin credentials required');
        return;
      }
      const t = res.data.data.accessToken;
      setToken(t);
      setUser(res.data.data.user);
      localStorage.setItem('ulist_admin_token', t);
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ulist_admin_token');
  };

  // Auto-refresh token if expired (401 response interceptor)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('ulist_admin_token');
          setToken(null);
          setLoginError('Session expired. Please sign in again.');
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchDashboard = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/stats`, authHeaders);
      setStats(res.data.data.stats);
      setLatestPending(res.data.data.latestPending);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/ads`, {
        ...authHeaders,
        params: { status: adFilterStatus, search: adSearch },
      });
      setAds(res.data.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHighlightedAds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/ads`, {
        ...authHeaders,
        params: { isFeatured: 'true', search: highlightedSearch },
      });
      setHighlightedAds(res.data.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaidAds = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/ads`, {
        ...authHeaders,
        params: { isPaid: 'true', search: paidSearch },
      });
      setPaidAds(res.data.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, {
        ...authHeaders,
        params: { search: userSearch },
      });
      setUsers(res.data.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/reports`, authHeaders);
      setReports(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/inquiries`, {
        ...authHeaders,
        params: {
          status: inquiryStatusFilter,
          search: inquirySearch,
        },
      });
      setInquiries(res.data.data);
      if (typeof res.data.pendingCount === 'number') {
        setPendingInquiriesCount(res.data.pendingCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_BASE}/admin/inquiries/${id}/status`, { status }, authHeaders);
      setMessage(`Inquiry marked as ${status}`);
      setTimeout(() => setMessage(''), 3000);
      fetchInquiries();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'ads') fetchAds();
    if (activeTab === 'highlighted') fetchHighlightedAds();
    if (activeTab === 'paid') fetchPaidAds();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'inquiries') fetchInquiries();
  }, [activeTab, adFilterStatus, inquiryStatusFilter, token]);

  const handleApproveAd = async (id: string) => {
    try {
      await axios.post(`${API_BASE}/admin/ads/${id}/approve`, {}, authHeaders);
      setMessage('Ad approved successfully');
      setTimeout(() => setMessage(''), 3000);
      if (activeTab === 'dashboard') fetchDashboard();
      if (activeTab === 'ads') fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleRejectAd = async (id: string) => {
    const reason = prompt('Enter rejection reason for seller:');
    if (!reason) return;
    try {
      await axios.post(`${API_BASE}/admin/ads/${id}/reject`, { reason }, authHeaders);
      setMessage('Ad rejected');
      setTimeout(() => setMessage(''), 3000);
      if (activeTab === 'dashboard') fetchDashboard();
      if (activeTab === 'ads') fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDeleteAd = async (id: string, title?: string) => {
    const confirmed = window.confirm(`Are you sure you want to PERMANENTLY DELETE this ad "${title || ''}"? Fake/fraud ads will be immediately removed from the entire platform.`);
    if (!confirmed) return;
    try {
      await axios.delete(`${API_BASE}/admin/ads/${id}`, authHeaders);
      setMessage('Ad deleted successfully');
      setTimeout(() => setMessage(''), 3000);
      if (activeTab === 'dashboard') fetchDashboard();
      if (activeTab === 'ads') fetchAds();
      if (activeTab === 'highlighted') fetchHighlightedAds();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete ad');
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await axios.post(`${API_BASE}/admin/ads/${id}/featured`, { isFeatured: !current, days: 7 }, authHeaders);
      setMessage(`Ad ${!current ? 'marked as featured' : 'unmarked from featured'}`);
      setTimeout(() => setMessage(''), 3000);
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update featured status');
    }
  };

  const handleToggleUserStatus = async (id: string) => {
    try {
      const res = await axios.post(`${API_BASE}/admin/users/${id}/toggle-status`, {}, authHeaders);
      setMessage(res.data.message);
      setTimeout(() => setMessage(''), 3000);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', width: '100%', maxWidth: '380px', padding: '24px' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img src={logoImg} alt="Ulist Logo" style={{ height: '42px', maxWidth: '100%', objectFit: 'contain', marginBottom: '8px' }} />
            <p style={{ color: '#6B6B6B', fontSize: '13px', margin: 0, fontWeight: 500 }}>Administration Control Panel</p>
          </div>

          {loginError && (
            <div style={{ background: '#FCE8E6', color: '#D93025', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '8px 40px 8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B6B6B',
                    fontSize: '16px',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              style={{ width: '100%', padding: '10px', background: '#D9480F', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-overlay ${isSidebarOpen ? 'overlay-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E3E3E3', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <img src={logoImg} alt="Ulist" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }} />
            <div style={{ fontSize: '11px', color: '#6B6B6B', fontWeight: 600, letterSpacing: 0.5, marginTop: '2px' }}>Admin Control</div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="menu-toggle-btn"
            style={{ fontSize: '18px' }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, padding: '12px 0' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'ads', label: 'Ads Moderation' },
            { id: 'highlighted', label: 'Highlighted Ads ★' },
            { id: 'paid', label: 'Paid Ads ₹' },
            { id: 'users', label: 'Users' },
            { id: 'categories', label: 'Categories' },
            { id: 'reports', label: 'Reports Queue' },
            { id: 'inquiries', label: 'Inquiries / Support ✉' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id as any)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 20px',
                background: activeTab === item.id ? '#FFF1ED' : 'transparent',
                color: activeTab === item.id ? '#D9480F' : '#1B1B1B',
                border: 'none',
                borderLeft: activeTab === item.id ? '4px solid #D9480F' : '4px solid transparent',
                fontWeight: activeTab === item.id ? 600 : 400,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #E3E3E3' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '8px', background: '#F5F5F5', border: '1px solid #E3E3E3', borderRadius: '4px', cursor: 'pointer', color: '#1B1B1B' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <div className="admin-top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="menu-toggle-btn"
              title="Open Navigation"
            >
              ☰
            </button>
            {activeTab !== 'dashboard' && (
              <button
                onClick={() => switchTab('dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px',
                  color: '#D9480F',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Back to Dashboard"
              >
                ←
              </button>
            )}
            <div style={{ fontWeight: 600, fontSize: '16px' }}>
              {activeTab === 'dashboard' ? 'Overview' : activeTab === 'ads' ? 'Ads Moderation' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </div>
          </div>
          {message && (
            <div style={{ background: '#E6F4EA', color: '#1E8E3E', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
              {message}
            </div>
          )}
          <div style={{ color: '#6B6B6B', fontSize: '12px' }}>
            Admin Panel
          </div>
        </div>

        {/* Quick Mobile Category / Section Tabs */}
        <div className="mobile-quick-nav">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'ads', label: '📝 Ads' },
            { id: 'highlighted', label: '⭐ Highlighted' },
            { id: 'paid', label: '💰 Paid' },
            { id: 'inquiries', label: '✉ Inquiries' },
            { id: 'users', label: '👥 Users' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => switchTab(item.id as any)}
              className={`mobile-nav-pill ${activeTab === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="admin-main-content" style={{ padding: '24px' }}>
          {activeTab === 'dashboard' && stats && (
            <div>
              <div className="stats-grid">
                <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6B6B6B' }}>Total Registered Users</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>{stats.totalUsers}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6B6B6B' }}>Active Classified Ads</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#1E8E3E' }}>{stats.activeAds}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6B6B6B' }}>Pending Approval</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#D9480F' }}>{stats.pendingAds}</div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6B6B6B' }}>Open Abuse Reports</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#D93025' }}>{stats.openReports}</div>
                </div>
                <div
                  onClick={() => setActiveTab('highlighted')}
                  style={{ background: '#FFF9E6', border: '1px solid #FFE082', borderRadius: '6px', padding: '16px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: '#B06000', fontWeight: 600 }}>Highlighted Ads ★</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#E65100' }}>
                    {stats.highlightedAds ?? 12}
                  </div>
                  <span style={{ fontSize: '11px', color: '#8D6E63' }}>Free or Paid promoted listings</span>
                </div>
                <div
                  onClick={() => setActiveTab('paid')}
                  style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: '6px', padding: '16px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 600 }}>Paid Ads ₹</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#1B5E20' }}>
                    {stats.paidAds ?? 8}
                  </div>
                  <span style={{ fontSize: '11px', color: '#388E3C' }}>Monetized premium packages</span>
                </div>
              </div>

              {/* Pending Ads queue */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Pending Moderation Queue</h3>
                {latestPending.length === 0 ? (
                  <p style={{ color: '#6B6B6B' }}>No pending ads right now.</p>
                ) : (
                  <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                          <th style={{ padding: '8px' }}>Title</th>
                          <th style={{ padding: '8px' }}>Seller</th>
                          <th style={{ padding: '8px' }}>Price</th>
                          <th style={{ padding: '8px' }}>City</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestPending.map((ad) => (
                          <tr key={ad._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 500 }}>{ad.title}</td>
                            <td style={{ padding: '12px 8px' }}>{ad.user?.name} ({ad.user?.phone})</td>
                            <td style={{ padding: '12px 8px' }}>₹{ad.price?.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '12px 8px' }}>{ad.city}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleApproveAd(ad._id)}
                                style={{ background: '#1E8E3E', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', marginRight: '8px', cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectAd(ad._id)}
                                style={{ background: '#D93025', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', marginRight: '8px', cursor: 'pointer' }}
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleDeleteAd(ad._id, ad.title)}
                                style={{ background: '#334155', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Delete fake/unwanted ad permanently"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ads' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search ads by title..."
                  value={adSearch}
                  onChange={(e) => setAdSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAds()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                />
                <select
                  value={adFilterStatus}
                  onChange={(e) => setAdFilterStatus(e.target.value)}
                  style={{ padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="sold">Sold</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchAds}
                  style={{ padding: '8px 16px', background: '#D9480F', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Filter
                </button>
              </div>

              <div className="table-responsive">
                {ads.length === 0 ? (
                  <p style={{ color: '#6B6B6B', padding: '16px 0' }}>No ads found matching current filter.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                      <th style={{ padding: '8px' }}>Title</th>
                      <th style={{ padding: '8px' }}>Category</th>
                      <th style={{ padding: '8px' }}>Price</th>
                      <th style={{ padding: '8px' }}>City</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>Highlighted</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map((ad) => (
                      <tr key={ad._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 500 }}>{ad.title}</td>
                        <td style={{ padding: '12px 8px' }}>{ad.category?.name}</td>
                        <td style={{ padding: '12px 8px' }}>₹{ad.price?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 8px' }}>{ad.city}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: ad.status === 'active' ? '#E6F4EA' : ad.status === 'pending' ? '#FEF7E0' : '#F1F3F4',
                            color: ad.status === 'active' ? '#1E8E3E' : ad.status === 'pending' ? '#B06000' : '#5F6368',
                          }}>
                            {ad.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <button
                            onClick={() => handleToggleFeatured(ad._id, ad.isFeatured)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              background: ad.isFeatured ? '#FFC107' : '#F5F5F5',
                              border: '1px solid #E3E3E3',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {ad.isFeatured ? 'Highlighted ★' : 'Make Highlighted'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {ad.status !== 'active' && (
                            <button
                              onClick={() => handleApproveAd(ad._id)}
                              style={{ background: '#1E8E3E', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', marginRight: '6px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Approve
                            </button>
                          )}
                          {ad.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectAd(ad._id)}
                              style={{ background: '#D93025', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', marginRight: '6px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAd(ad._id, ad.title)}
                            style={{ background: '#334155', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            title="Delete fake/unwanted ad permanently"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'highlighted' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1B1B1B' }}>Highlighted Ads (Promoted Listings)</h3>
                <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>
                  Ads with top ranking priority in search results and category feeds. Any regular free or paid ad can be made highlighted.
                </p>
              </div>

              <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search highlighted ads..."
                  value={highlightedSearch}
                  onChange={(e) => setHighlightedSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchHighlightedAds()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                />
                <button
                  onClick={fetchHighlightedAds}
                  style={{ padding: '8px 16px', background: '#D9480F', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Search
                </button>
              </div>

              <div className="table-responsive">
                {highlightedAds.length === 0 ? (
                  <p style={{ color: '#6B6B6B', padding: '16px 0' }}>No highlighted ads found right now.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                        <th style={{ padding: '8px' }}>Title</th>
                        <th style={{ padding: '8px' }}>Seller</th>
                        <th style={{ padding: '8px' }}>Category</th>
                        <th style={{ padding: '8px' }}>Price</th>
                        <th style={{ padding: '8px' }}>City</th>
                        <th style={{ padding: '8px' }}>Promotion Status</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highlightedAds.map((ad) => (
                        <tr key={ad._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 500 }}>{ad.title}</td>
                          <td style={{ padding: '12px 8px' }}>{ad.user?.name || ad.contactName} ({ad.phone})</td>
                          <td style={{ padding: '12px 8px' }}>{ad.category?.name}</td>
                          <td style={{ padding: '12px 8px' }}>₹{ad.price?.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px 8px' }}>{ad.city}</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#FFF8E1', color: '#F57F17', fontWeight: 600 }}>
                              ★ FEATURED
                            </span>
                            {ad.isPaid && (
                              <span style={{ marginLeft: '4px', padding: '3px 6px', borderRadius: '4px', fontSize: '11px', background: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}>
                                PAID PROMOTION
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              onClick={async () => {
                                await handleToggleFeatured(ad._id, true);
                                fetchHighlightedAds();
                              }}
                              style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', color: '#E65100', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Remove Highlight
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'paid' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1B1B1B' }}>Paid Ads & Monetization</h3>
                <p style={{ fontSize: '13px', color: '#6B6B6B', marginTop: '4px' }}>
                  Listings with premium paid upgrades, boost packages, or featured payment transactions.
                </p>
              </div>

              <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search paid ads..."
                  value={paidSearch}
                  onChange={(e) => setPaidSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPaidAds()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                />
                <button
                  onClick={fetchPaidAds}
                  style={{ padding: '8px 16px', background: '#D9480F', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Search
                </button>
              </div>

              <div className="table-responsive">
                {paidAds.length === 0 ? (
                  <p style={{ color: '#6B6B6B', padding: '16px 0' }}>No paid ads found yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                        <th style={{ padding: '8px' }}>Title</th>
                        <th style={{ padding: '8px' }}>Seller</th>
                        <th style={{ padding: '8px' }}>Plan / Package</th>
                        <th style={{ padding: '8px' }}>Amount Paid</th>
                        <th style={{ padding: '8px' }}>Status</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidAds.map((ad) => (
                        <tr key={ad._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 500 }}>{ad.title}</td>
                          <td style={{ padding: '12px 8px' }}>{ad.user?.name || ad.contactName} ({ad.phone})</td>
                          <td style={{ padding: '12px 8px' }}>{ad.paymentPlan || '7-Day Top Boost'}</td>
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: '#1B5E20' }}>
                            ₹{ad.paidAmount ? ad.paidAmount.toLocaleString('en-IN') : '299'}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }}>
                              SUCCESSFUL
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleFeatured(ad._id, ad.isFeatured)}
                              style={{ background: '#F5F5F5', border: '1px solid #E3E3E3', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                            >
                              {ad.isFeatured ? 'Highlighted ★' : 'Highlight Ad'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search user by name, email or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px' }}
                />
                <button
                  onClick={fetchUsers}
                  style={{ padding: '8px 16px', background: '#D9480F', color: '#FFFFFF', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Search
                </button>
              </div>

              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                      <th style={{ padding: '8px' }}>Name</th>
                      <th style={{ padding: '8px' }}>Phone</th>
                      <th style={{ padding: '8px' }}>Role</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 500 }}>{u.name}</td>
                        <td style={{ padding: '12px 8px' }}>{u.phone}</td>
                        <td style={{ padding: '12px 8px' }}>{u.role}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: u.status === 'active' ? '#E6F4EA' : '#FCE8E6',
                            color: u.status === 'active' ? '#1E8E3E' : '#D93025',
                          }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleUserStatus(u._id)}
                            style={{
                              background: u.status === 'active' ? '#FCE8E6' : '#E6F4EA',
                              color: u.status === 'active' ? '#D93025' : '#1E8E3E',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {u.status === 'active' ? 'Block User' : 'Unblock User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Categories & Dynamic Attributes</h3>
              <div className="categories-grid">
                {categories.map((c) => (
                  <div key={c._id} style={{ border: '1px solid #E3E3E3', borderRadius: '6px', padding: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '10px' }}>Slug: {c.slug} | Price Mode: {c.priceMode}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Configured Fields ({c.fields?.length || 0}):</div>
                    <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#1B1B1B' }}>
                      {c.fields?.map((f: any) => (
                        <li key={f.key}>
                          <strong>{f.label}</strong> ({f.type}) {f.required && '• req'} {f.filterable && '• filter'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Reported Content & Abuse Queue</h3>
              {reports.length === 0 ? (
                <p style={{ color: '#6B6B6B' }}>No unresolved reports.</p>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                        <th style={{ padding: '8px' }}>Type</th>
                        <th style={{ padding: '8px' }}>Reporter</th>
                        <th style={{ padding: '8px' }}>Reason</th>
                        <th style={{ padding: '8px' }}>Status</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r._id} style={{ borderBottom: '1px solid #E3E3E3' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 500 }}>{r.targetType.toUpperCase()}</td>
                          <td style={{ padding: '12px 8px' }}>{r.reporter?.name || 'Anonymous'}</td>
                          <td style={{ padding: '12px 8px' }}>{r.reason}</td>
                          <td style={{ padding: '12px 8px' }}>{r.status}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                            <button
                              onClick={async () => {
                                await axios.post(`${API_BASE}/admin/reports/${r._id}/dismiss`, {}, authHeaders);
                                fetchReports();
                              }}
                              style={{ background: '#F5F5F5', border: '1px solid #E3E3E3', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Dismiss
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1B1B1B' }}>
                    User Support & Inquiries
                  </h3>
                  {pendingInquiriesCount > 0 && (
                    <span style={{ background: '#FFF1ED', color: '#D9480F', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', border: '1px solid #FFD8CC' }}>
                      {pendingInquiriesCount} Pending
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #E3E3E3', fontSize: '13px' }}
                  >
                    <option value="all">All Inquiries</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchInquiries();
                    }}
                    style={{ display: 'flex', gap: '6px' }}
                  >
                    <input
                      type="text"
                      placeholder="Search by name, email, phone..."
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      style={{ padding: '8px 12px', border: '1px solid #E3E3E3', borderRadius: '4px', fontSize: '13px', width: '220px' }}
                    />
                    <button
                      type="submit"
                      style={{ background: '#D9480F', color: '#FFF', border: 'none', borderRadius: '4px', padding: '8px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      Search
                    </button>
                  </form>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6B6B6B', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E3E3E3' }}>
                  No customer support inquiries found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {inquiries.map((inq) => (
                    <div
                      key={inq._id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E3E3E3',
                        borderRadius: '8px',
                        padding: '16px 20px',
                        borderLeft: inq.status === 'resolved' ? '4px solid #1E8E3E' : inq.status === 'dismissed' ? '4px solid #9E9E9E' : '4px solid #D9480F',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1B1B1B' }}>{inq.fullName}</span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: inq.status === 'resolved' ? '#E6F4EA' : inq.status === 'dismissed' ? '#F5F5F5' : '#FFF1ED',
                                color: inq.status === 'resolved' ? '#1E8E3E' : inq.status === 'dismissed' ? '#6B6B6B' : '#D9480F',
                              }}
                            >
                              {inq.status || 'pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '3px' }}>
                            Received: {new Date(inq.createdAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Quick Action Buttons: Call, WhatsApp, Email, Status */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a
                            href={`tel:${inq.mobile}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#0B4F9C',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            📞 Call {inq.mobile}
                          </a>

                          <a
                            href={`https://wa.me/91${inq.mobile}?text=${encodeURIComponent(`Hello ${inq.fullName}, this is Ulist Support regarding your inquiry: "${inq.subject}". How can we help you?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#25D366',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            💬 WhatsApp
                          </a>

                          <a
                            href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: [Ulist Support] ${inq.subject}`)}&body=${encodeURIComponent(`Hello ${inq.fullName},\n\nThank you for reaching out to Ulist Support.\n\nIn response to your query:\n"${inq.message}"\n\n`)}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#F5F5F5',
                              border: '1px solid #E3E3E3',
                              color: '#1B1B1B',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            ✉ Email
                          </a>

                          {inq.status !== 'resolved' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq._id, 'resolved')}
                              style={{
                                background: '#E6F4EA',
                                color: '#1E8E3E',
                                border: '1px solid #A5D6A7',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ✓ Mark Resolved
                            </button>
                          )}

                          {inq.status === 'resolved' && (
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq._id, 'pending')}
                              style={{
                                background: '#FFF1ED',
                                color: '#D9480F',
                                border: '1px solid #FFD8CC',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Subject & Message Content Box */}
                      <div style={{ background: '#F8F9FA', padding: '12px 14px', borderRadius: '6px', border: '1px solid #EFEFEF' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1B1B1B', marginBottom: '6px' }}>
                          Subject: {inq.subject}
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {inq.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
