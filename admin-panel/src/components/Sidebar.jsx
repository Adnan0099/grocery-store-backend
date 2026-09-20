import { NavLink, useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
    },
    {
      path: '/products',
      icon: '🛍️',
      label: 'Products',
    },
    {
      path: '/categories',
      icon: '📂',
      label: 'Categories',
    },
    {
      path: '/orders',
      icon: '📦',
      label: 'Orders',
    },
    {
      path: '/customers',
      icon: '👥',
      label: 'Customers',
    },
  ];

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    navigate('/');

    window.location.reload();
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          🛒
        </div>

        <div>
          <h2>FreshMart</h2>
          <span>Admin Panel</span>
        </div>

      </div>

      <div className="sidebar-section-title">
        MAIN MENU
      </div>

      <nav className="sidebar-menu">

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? 'active' : ''
              }`
            }
          >
            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-bottom">

        <div className="admin-mini-profile">

          <div className="admin-avatar">
            A
          </div>

          <div className="admin-mini-info">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>

        </div>

        <button
          className="logout-button"
          onClick={logout}
        >
          <span>🚪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;