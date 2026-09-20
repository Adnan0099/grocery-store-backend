import StatCard from '../components/StatCard';

function Dashboard() {
  return (
    <div>

      <div className="page-heading">

        <div>
          <h2>Dashboard Overview</h2>
          <p>
            Here's what's happening with your store today.
          </p>
        </div>

        <button className="date-button">
          📅 Today
        </button>

      </div>


      {/* Statistics */}

      <div className="stats-grid">

        <StatCard
          icon="💰"
          title="Total Sales"
          value="Rs. 125,450"
          change="+12.5% from last month"
          type="green"
        />

        <StatCard
          icon="📦"
          title="Total Orders"
          value="248"
          change="+8.2% from last month"
          type="blue"
        />

        <StatCard
          icon="🛍️"
          title="Products"
          value="86"
          change="+4 new this month"
          type="orange"
        />

        <StatCard
          icon="👥"
          title="Customers"
          value="1,248"
          change="+18.4% from last month"
          type="purple"
        />

      </div>


      {/* Lower Section */}

      <div className="dashboard-grid">

        <div className="dashboard-card sales-card">

          <div className="card-header">

            <div>
              <h3>Sales Overview</h3>
              <p>Monthly sales performance</p>
            </div>

            <select>
              <option>Last 7 months</option>
              <option>Last 30 days</option>
              <option>This year</option>
            </select>

          </div>

          <div className="chart-placeholder">

            <div className="chart-bars">

              {[45, 65, 52, 78, 60, 88, 72].map(
                (height, index) => (
                  <div
                    className="chart-column"
                    key={index}
                  >
                    <div
                      className="chart-bar"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                    <span>
                      {
                        [
                          'Jan',
                          'Feb',
                          'Mar',
                          'Apr',
                          'May',
                          'Jun',
                          'Jul',
                        ][index]
                      }
                    </span>
                  </div>
                )
              )}

            </div>

          </div>

        </div>


        <div className="dashboard-card">

          <div className="card-header">

            <div>
              <h3>Recent Orders</h3>
              <p>Latest customer orders</p>
            </div>

            <button className="view-all">
              View all
            </button>

          </div>

          <div className="recent-orders">

            <div className="recent-order">
              <div className="order-product">
                🥬
              </div>

              <div>
                <strong>
                  ORD-10245
                </strong>
                <small>
                  Ali Khan • 3 items
                </small>
              </div>

              <span className="order-status pending">
                Pending
              </span>
            </div>


            <div className="recent-order">
              <div className="order-product">
                🍎
              </div>

              <div>
                <strong>
                  ORD-10244
                </strong>
                <small>
                  Ahmed Raza • 5 items
                </small>
              </div>

              <span className="order-status confirmed">
                Confirmed
              </span>
            </div>


            <div className="recent-order">
              <div className="order-product">
                🛒
              </div>

              <div>
                <strong>
                  ORD-10243
                </strong>
                <small>
                  Sara Malik • 2 items
                </small>
              </div>

              <span className="order-status delivered">
                Delivered
              </span>
            </div>


            <div className="recent-order">
              <div className="order-product">
                🥛
              </div>

              <div>
                <strong>
                  ORD-10242
                </strong>
                <small>
                  Usman Ali • 4 items
                </small>
              </div>

              <span className="order-status cancelled">
                Cancelled
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;