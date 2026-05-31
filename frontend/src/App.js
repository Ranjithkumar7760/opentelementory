import React, { useState, useEffect } from 'react';

const API_BASE = '';
const PRODUCTS = [
  { id: 1, name: 'Laptop', price: 999, img: '💻', desc: 'High performance laptop' },
  { id: 2, name: 'Phone', price: 699, img: '📱', desc: 'Latest smartphone' },
  { id: 3, name: 'Headphones', price: 199, img: '🎧', desc: 'Noise cancelling' },
  { id: 4, name: 'Watch', price: 249, img: '⌚', desc: 'Smart watch' },
  { id: 5, name: 'Tablet', price: 399, img: '📟', desc: '10 inch display' },
  { id: 6, name: 'Camera', price: 549, img: '📷', desc: 'DSLR camera' },
];

const s = {
  container: { maxWidth: 960, margin: '0 auto', padding: 20, fontFamily: 'Segoe UI, Arial' },
  card: { border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 20, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  input: { padding: '10px 12px', margin: 5, width: 220, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { padding: '10px 24px', margin: 5, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  btnPrimary: { background: '#2563eb', color: '#fff' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  btnSuccess: { background: '#16a34a', color: '#fff' },
  btnWarning: { background: '#f59e0b', color: '#fff' },
  btnSmall: { padding: '6px 14px', fontSize: 13 },
  btnOutline: { background: 'transparent', border: '2px solid #2563eb', color: '#2563eb' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  success: { background: '#dcfce7', color: '#166534' },
  warning: { background: '#fef3c7', color: '#92400e' },
  error: { background: '#fee2e2', color: '#991b1b' },
  nav: { background: '#1e293b', color: '#fff', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, marginBottom: 24 },
  navLink: { padding: '16px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 15, borderBottom: '3px solid transparent' },
  navLinkActive: { borderBottom: '3px solid #3b82f6', color: '#60a5fa' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 },
  productCard: { border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  productImg: { fontSize: 48, marginBottom: 10 },
  productName: { fontSize: 16, fontWeight: 600, marginBottom: 4 },
  productPrice: { fontSize: 20, fontWeight: 700, color: '#2563eb', marginBottom: 4 },
  productDesc: { fontSize: 13, color: '#666', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { borderBottom: '2px solid #e0e0e0', padding: 12, textAlign: 'left', color: '#666', fontWeight: 600 },
  td: { borderBottom: '1px solid #f0f0f0', padding: 12 },
  badge2: { padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 8 },
  cartItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f0f0f0' },
  statusDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block', marginRight: 8 },
  pageTitle: { fontSize: 22, fontWeight: 700, marginBottom: 16 },
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(localStorage.getItem('user') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [page, setPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [serviceStatus, setServiceStatus] = useState({});

  useEffect(() => { if (token) { checkServices(); fetchOrders(); fetchPayments(); fetchNotifications(); fetchHistory(); } }, [token]);

  const checkServices = async () => {
    const ss = {};
    for (const n of ['auth', 'order', 'payment', 'notification', 'user']) {
      try { ss[n] = (await fetch(`${API_BASE}/api/${n}/health`)).ok ? 'up' : 'down'; }
      catch { ss[n] = 'down'; }
    }
    setServiceStatus(ss);
  };

  const login = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const d = await r.json();
      if (d.token) { setToken(d.token); setUser(username); localStorage.setItem('token', d.token); localStorage.setItem('user', username); setMessage('Login successful!'); }
      else setMessage('Login failed: ' + (d.error || ''));
    } catch (e) { setMessage('Login error: ' + e.message); }
  };

  const logout = () => {
    setToken(''); setUser(''); setPage('home');
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setOrders([]); setPayments([]); setNotifications([]); setHistory([]);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === product.id);
      if (existing) return prev.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
    setMessage(`${product.name} added to cart!`);
    setTimeout(() => setMessage(''), 2000);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    try {
      const r = await fetch(`${API_BASE}/api/order/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items: cart.map(c => c.name), total: cartTotal })
      });
      const d = await r.json();
      if (r.ok) {
        setMessage(`Order #${d.id} placed! Go to Orders to pay.`);
        setCart([]); fetchOrders(); setPage('orders');
      } else setMessage('Order failed: ' + (d.error || ''));
    } catch (e) { setMessage('Order error: ' + e.message); }
  };

  const payOrder = async (orderId, amount) => {
    try {
      const r = await fetch(`${API_BASE}/api/payment/charge`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ order_id: orderId, amount })
      });
      const d = await r.json();
      if (r.ok) {
        setMessage(`Payment successful! TXN: ${d.transaction_id}`);
        fetchOrders(); fetchPayments(); fetchNotifications(); fetchHistory();
      } else setMessage('Payment failed: ' + (d.error || ''));
    } catch (e) { setMessage('Payment error: ' + e.message); }
  };

  const fetchOrders = async () => {
    try { const r = await fetch(`${API_BASE}/api/order/orders`, { headers: { 'Authorization': `Bearer ${token}` } }); if (r.ok) setOrders(await r.json()); } catch {}
  };
  const fetchPayments = async () => {
    try { const r = await fetch(`${API_BASE}/api/payment/payments`); if (r.ok) setPayments(await r.json()); } catch {}
  };
  const fetchNotifications = async () => {
    try { const r = await fetch(`${API_BASE}/api/notification/notifications`); if (r.ok) setNotifications(await r.json()); } catch {}
  };
  const fetchHistory = async () => {
    try { const r = await fetch(`${API_BASE}/api/user/history/${user}`); if (r.ok) setHistory(await r.json()); } catch {}
  };

  if (!token) {
    return (
      <div style={{...s.container, maxWidth: 440, marginTop: 80}}>
        <div style={{textAlign: 'center', marginBottom: 32}}>
          <h1 style={{fontSize: 28, margin: 0}}>🛒 ShopPOC</h1>
          <p style={{color: '#666', margin: '4px 0'}}>Microservices Demo Store</p>
        </div>
        <div style={s.card}>
          <h2 style={{marginTop: 0}}>Sign In</h2>
          <input style={{...s.input, width: '90%'}} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <br />
          <input style={{...s.input, width: '90%'}} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <br />
          <button style={{...s.btn, ...s.btnPrimary, width: '96%', margin: '10px 0'}} onClick={login}>Sign In</button>
          <p style={{fontSize: 13, color: '#999'}}>Demo: demo / demo123</p>
          {message && <p style={{color: message.includes('success') ? '#16a34a' : '#dc2626', fontSize: 14}}>{message}</p>}
        </div>
        <div style={{...s.card, fontSize: 13, color: '#666'}}>
          <strong>Flow:</strong> Sign In → Browse → Cart → Order → Pay (user-initiated) → Notification
        </div>
      </div>
    );
  }

  const NavLink = ({ name, label }) => (
    <span style={{...s.navLink, ...(page === name ? s.navLinkActive : {})}} onClick={() => setPage(name)}>{label}</span>
  );

  const Pages = {
    home: (
      <>
        <h2 style={s.pageTitle}>Products</h2>
        <div style={s.grid}>
          {PRODUCTS.map(p => (
            <div key={p.id} style={s.productCard}>
              <div style={s.productImg}>{p.img}</div>
              <div style={s.productName}>{p.name}</div>
              <div style={s.productPrice}>${p.price}</div>
              <div style={s.productDesc}>{p.desc}</div>
              <button style={{...s.btn, ...s.btnPrimary, ...s.btnSmall, width: '80%'}} onClick={() => addToCart(p)}>Add to Cart</button>
            </div>
          ))}
        </div>
      </>
    ),

    cart: (
      <>
        <h2 style={s.pageTitle}>Cart ({cartCount} items)</h2>
        <div style={s.card}>
          {cart.length === 0 ? (
            <p style={{color: '#999', textAlign: 'center', padding: 20}}>Your cart is empty. Browse products!</p>
          ) : (
            <>
              {cart.map(c => (
                <div key={c.id} style={s.cartItem}>
                  <div><span style={{fontSize: 20, marginRight: 8}}>{c.img}</span><strong>{c.name}</strong> x{c.qty}</div>
                  <div><strong>${c.price * c.qty}</strong>
                    <button style={{...s.btn, ...s.btnDanger, ...s.btnSmall, marginLeft: 12}} onClick={() => removeFromCart(c.id)}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0'}}>
                <strong style={{fontSize: 18}}>Total: ${cartTotal}</strong>
                <button style={{...s.btn, ...s.btnSuccess}} onClick={placeOrder}>Place Order</button>
              </div>
            </>
          )}
        </div>
      </>
    ),

    orders: (
      <>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={s.pageTitle}>My Orders</h2>
          <button style={{...s.btn, ...s.btnPrimary, ...s.btnSmall}} onClick={() => { fetchOrders(); fetchPayments(); fetchNotifications(); fetchHistory(); }}>Refresh</button>
        </div>
        <div style={s.card}>
          {orders.length === 0 ? <p style={{color: '#999', textAlign: 'center', padding: 20}}>No orders yet</p> : (
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Order</th>
                <th style={s.th}>Items</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Action</th>
              </tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={s.td}><strong>#{o.id}</strong></td>
                    <td style={s.td}>{o.items?.join(', ')}</td>
                    <td style={s.td}><strong>${o.total}</strong></td>
                    <td style={s.td}>
                      <span style={{...s.badge, ...(o.status === 'paid' ? s.success : s.warning)}}>{o.status}</span>
                    </td>
                    <td style={s.td}>
                      {o.status === 'pending' ? (
                        <button style={{...s.btn, ...s.btnWarning, ...s.btnSmall}} onClick={() => payOrder(o.id, o.total)}>Pay Now</button>
                      ) : (
                        <span style={{color: '#16a34a', fontWeight: 600}}>✓ Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20}}>
          <div style={s.card}>
            <h3 style={{marginTop: 0}}>Payments</h3>
            {payments.length === 0 ? <p style={{color: '#999'}}>No payments</p> : (
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>TXN</th>
                  <th style={s.th}>Order</th>
                  <th style={s.th}>Amount</th>
                  <th style={s.th}>Status</th>
                </tr></thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td style={s.td} style={{fontFamily: 'monospace', fontSize: 12}}>{p.transaction_id}</td>
                      <td style={s.td}>#{p.order_id}</td>
                      <td style={s.td}>${p.amount}</td>
                      <td style={s.td}><span style={{...s.badge, ...s.success}}>Success</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div style={s.card}>
            <h3 style={{marginTop: 0}}>Notifications</h3>
            {notifications.length === 0 ? <p style={{color: '#999'}}>No notifications</p> : (
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Order</th>
                  <th style={s.th}>Message</th>
                </tr></thead>
                <tbody>
                  {notifications.map((n, i) => (
                    <tr key={i}>
                      <td style={s.td}>#{n.order_id}</td>
                      <td style={s.td}>{n.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={s.card}>
          <h3 style={{marginTop: 0}}>Order History</h3>
          {history.length === 0 ? <p style={{color: '#999'}}>No history</p> : (
            <table style={s.table}>
              <thead><tr>
                <th style={s.th}>Order ID</th>
                <th style={s.th}>Total</th>
                <th style={s.th}>Status</th>
              </tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td style={s.td}>#{h.order_id}</td>
                    <td style={s.td}>${h.total}</td>
                    <td style={s.td}>{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    ),

    services: (
      <>
        <h2 style={s.pageTitle}>Service Status</h2>
        <div style={s.card}>
          {Object.entries(serviceStatus).map(([name, status]) => (
            <div key={name} style={{display: 'flex', alignItems: 'center', padding: 14, borderBottom: '1px solid #f0f0f0'}}>
              <span style={{...s.statusDot, background: status === 'up' ? '#16a34a' : '#dc2626'}} />
              <strong style={{width: 180}}>{name}-service</strong>
              <span style={{color: status === 'up' ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13}}>
                {status === 'up' ? '● Running' : '● Down'}
              </span>
              <span style={{marginLeft: 'auto', fontSize: 12, color: '#999'}}>
                {name === 'auth' ? ':5001' : name === 'order' ? ':5002' : name === 'payment' ? ':5003' : name === 'notification' ? ':5004' : ':5005'}
              </span>
            </div>
          ))}
          <button style={{...s.btn, ...s.btnPrimary, ...s.btnSmall, marginTop: 12}} onClick={checkServices}>Check Status</button>
        </div>
      </>
    ),
  };

  return (
    <div style={s.container}>
      {/* Navbar */}
      <div style={s.nav}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span style={{fontSize: 20, marginRight: 8}}>🛒</span>
          <span style={{fontWeight: 700, fontSize: 18, marginRight: 24}}>ShopPOC</span>
          <NavLink name="home" label="Home" />
          <NavLink name="cart" label={`Cart${cartCount ? ` (${cartCount})` : ''}`} />
          <NavLink name="orders" label="Orders" />
          <NavLink name="services" label="Services" />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{fontSize: 14}}>{user}</span>
          <button style={{...s.btn, ...s.btnDanger, ...s.btnSmall, margin: 0}} onClick={logout}>Logout</button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500,
          background: message.includes('failed') || message.includes('error') ? '#fee2e2' : '#dcfce7',
          color: message.includes('failed') || message.includes('error') ? '#991b1b' : '#166534'
        }}>
          {message}
          <span style={{float: 'right', cursor: 'pointer'}} onClick={() => setMessage('')}>✕</span>
        </div>
      )}

      {Pages[page]}
    </div>
  );
}

export default App;
