function Header() {
  const user = JSON.parse(
    localStorage.getItem('adminUser') || '{}'
  );

  return (
    <header className="top-header">

      <div>
        <p className="header-small">
          Grocery Store Management
        </p>

        <h1>Admin Dashboard</h1>
      </div>

      <div className="header-right">

        <button className="notification-button">
          🔔
          <span></span>
        </button>

        <div className="header-user">

          <div className="header-avatar">
            {(user.name || 'A')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user.name || 'Admin'}
            </strong>

            <small>
              {user.email || 'admin@grocery.com'}
            </small>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Header;