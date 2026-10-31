import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = '/api/v1';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ulist_admin_token'));
  const [_user, setUser] = useState<any>(null);

  // Login form state
  const [email, setEmail] = useState('admin@ulist.in');
  const [password, setPassword] = useState('AdminUlist#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin section navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ads' | 'users' | 'categories' | 'reports'>('dashboard');

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [latestPending, setLatestPending] = useState<any[]>([]);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);

  // Ads list state
  const [ads, setAds] = useState<any[]>([]);
  const [adFilterStatus, setAdFilterStatus] = useState('all');
  const [adSearch, setAdSearch] = useState('');

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

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'ads') fetchAds();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'reports') fetchReports();
  }, [activeTab, adFilterStatus, token]);

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', width: '380px', padding: '24px' }}>
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <h1 style={{ color: '#D9480F', fontSize: '24px', fontWeight: 700 }}>Ulist</h1>
            <p style={{ color: '#6B6B6B', fontSize: '14px', marginTop: '4px' }}>Administration Panel</p>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Sidebar */}
      <div style={{ width: '240px', background: '#FFFFFF', borderRight: '1px solid #E3E3E3', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #E3E3E3' }}>
          <h2 style={{ color: '#D9480F', fontSize: '20px', fontWeight: 700 }}>Ulist</h2>
          <span style={{ fontSize: '12px', color: '#6B6B6B' }}>Admin Control</span>
        </div>
        <div style={{ flex: 1, padding: '12px 0' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'ads', label: 'Ads Moderation' },
            { id: 'users', label: 'Users' },
            { id: 'categories', label: 'Categories' },
            { id: 'reports', label: 'Reports Queue' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 20px',
                background: activeTab === item.id ? '#FFF1ED' : 'transparent',
                color: activeTab === item.id ? '#D9480F' : '#1B1B1B',
                border: 'none',
                borderLeft: activeTab === item.id ? '4px solid #D9480F' : '4px solid transparent',
                fontWeight: activeTab === item.id ? 500 : 400,
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top Header */}
        <div style={{ height: '60px', background: '#FFFFFF', borderBottom: '1px solid #E3E3E3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ fontWeight: 500, fontSize: '16px' }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          {message && (
            <div style={{ background: '#E6F4EA', color: '#1E8E3E', padding: '4px 12px', borderRadius: '4px', fontSize: '13px' }}>
              {message}
            </div>
          )}
          <div style={{ color: '#6B6B6B', fontSize: '13px' }}>
            Connected to Live Backend API
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'dashboard' && stats && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
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
              </div>

              {/* Pending Ads queue */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Pending Moderation Queue</h3>
                {latestPending.length === 0 ? (
                  <p style={{ color: '#6B6B6B' }}>No pending ads right now.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                              style={{ background: '#D93025', color: '#FFFFFF', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Reject
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

          {activeTab === 'ads' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        {ad.status === 'pending' && (
                          <button
                            onClick={() => handleApproveAd(ad._id)}
                            style={{ background: '#1E8E3E', color: '#FFFFFF', border: 'none', padding: '4px 8px', borderRadius: '4px', marginRight: '6px', cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                        )}
                        {ad.status !== 'rejected' && (
                          <button
                            onClick={() => handleRejectAd(ad._id)}
                            style={{ background: '#F5F5F5', border: '1px solid #E3E3E3', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E3E3E3', color: '#6B6B6B', fontSize: '12px' }}>
                    <th style={{ padding: '8px' }}>Name</th>
                    <th style={{ padding: '8px' }}>Email</th>
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
                      <td style={{ padding: '12px 8px' }}>{u.email}</td>
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
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u._id)}
                            style={{
                              background: u.status === 'active' ? '#D93025' : '#1E8E3E',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {u.status === 'active' ? 'Block' : 'Unblock'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E3E3E3', borderRadius: '6px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Categories & Dynamic Attributes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
