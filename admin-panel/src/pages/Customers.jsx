import React, { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:5000/api/orders';

const formatCurrency = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function Customers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [error, setError] = useState('');

  // =====================================
  // FETCH ORDERS
  // =====================================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');

      if (!token) {
        setError('Admin token not found. Please login again.');
        return;
      }

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch customers');
      }

      setOrders(data.orders || data.data || []);
    } catch (err) {
      console.error('Customers Error:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =====================================
  // CREATE CUSTOMERS FROM ORDERS
  // =====================================
  const customers = useMemo(() => {
    const customerMap = {};

    orders.forEach((order) => {
      const customer = order.customer;

      if (!customer) return;

      const email = (customer.email || '').toLowerCase().trim();

      if (!email) return;

      if (!customerMap[email]) {
        customerMap[email] = {
          id:
            customer.userId ||
            email,

          name: customer.name || 'Unknown Customer',

          email: customer.email || '',

          phone: customer.phone || '',

          orders: [],

          totalOrders: 0,

          totalSpent: 0,

          deliveredOrders: 0,

          pendingOrders: 0,

          cancelledOrders: 0,

          firstOrderDate: order.createdAt,

          lastOrderDate: order.createdAt,
        };
      }

      const currentCustomer = customerMap[email];

      currentCustomer.orders.push(order);

      currentCustomer.totalOrders += 1;

      if (order.status !== 'Cancelled') {
        currentCustomer.totalSpent += Number(order.total || 0);
      }

      if (order.status === 'Delivered') {
        currentCustomer.deliveredOrders += 1;
      }

      if (order.status === 'Pending') {
        currentCustomer.pendingOrders += 1;
      }

      if (order.status === 'Cancelled') {
        currentCustomer.cancelledOrders += 1;
      }

      if (
        new Date(order.createdAt) <
        new Date(currentCustomer.firstOrderDate)
      ) {
        currentCustomer.firstOrderDate = order.createdAt;
      }

      if (
        new Date(order.createdAt) >
        new Date(currentCustomer.lastOrderDate)
      ) {
        currentCustomer.lastOrderDate = order.createdAt;
      }
    });

    return Object.values(customerMap).sort(
      (a, b) =>
        new Date(b.lastOrderDate) -
        new Date(a.lastOrderDate)
    );
  }, [orders]);

  // =====================================
  // FILTER CUSTOMERS
  // =====================================
  const filteredCustomers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name
          .toLowerCase()
          .includes(searchText) ||
        customer.email
          .toLowerCase()
          .includes(searchText) ||
        customer.phone
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [customers, search]);

  // =====================================
  // STATS
  // =====================================
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.totalOrders > 0
  ).length;

  const totalCustomerOrders = customers.reduce(
    (sum, customer) => sum + customer.totalOrders,
    0
  );

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  // =====================================
  // AVATAR LETTER
  // =====================================
  const getInitial = (name) => {
    return (name || 'C').charAt(0).toUpperCase();
  };

  // =====================================
  // LOADING
  // =====================================
  if (loading) {
    return (
      <div className="customers-page">
        <div className="customers-loading">
          <div className="loading-spinner"></div>
          <p>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customers-page">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="customers-header">
        <div>
          <h1>Customers</h1>

          <p>
            Manage and view all your customers
          </p>
        </div>

        <button
          className="refresh-btn"
          onClick={fetchOrders}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ================================= */}
      {/* ERROR */}
      {/* ================================= */}

      {error && (
        <div className="customers-error">
          <span>⚠</span>

          <div>
            <strong>
              Unable to load customers
            </strong>

            <p>{error}</p>
          </div>

          <button onClick={fetchOrders}>
            Retry
          </button>
        </div>
      )}

      {/* ================================= */}
      {/* STATS */}
      {/* ================================= */}

      <div className="customer-stats">

        <div className="customer-stat-card">
          <div className="stat-icon blue">
            👥
          </div>

          <div>
            <span>Total Customers</span>
            <strong>{totalCustomers}</strong>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon green">
            ✓
          </div>

          <div>
            <span>Active Customers</span>
            <strong>{activeCustomers}</strong>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon orange">
            📦
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{totalCustomerOrders}</strong>
          </div>
        </div>

        <div className="customer-stat-card">
          <div className="stat-icon purple">
            ₨
          </div>

          <div>
            <span>Customer Revenue</span>
            <strong>
              {formatCurrency(totalRevenue)}
            </strong>
          </div>
        </div>

      </div>

      {/* ================================= */}
      {/* CUSTOMERS CARD */}
      {/* ================================= */}

      <div className="customers-card">

        {/* TOOLBAR */}

        <div className="customers-toolbar">

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search customer, email or phone..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="customer-count">
            {filteredCustomers.length} customers
          </div>

        </div>

        {/* ================================= */}
        {/* TABLE */}
        {/* ================================= */}

        <div className="customers-table-wrapper">

          <table className="customers-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Activity</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filteredCustomers.length === 0 ? (

                <tr>
                  <td colSpan="7">

                    <div className="empty-customers">

                      <div className="empty-icon">
                        👥
                      </div>

                      <h3>
                        No customers found
                      </h3>

                      <p>
                        {search
                          ? 'Try another search.'
                          : 'Customers will appear here when orders are placed.'}
                      </p>

                    </div>

                  </td>
                </tr>

              ) : (

                filteredCustomers.map((customer) => (

                  <tr key={customer.id}>

                    {/* CUSTOMER */}

                    <td>

                      <div className="customer-main">

                        <div className="customer-avatar">
                          {getInitial(customer.name)}
                        </div>

                        <div>

                          <strong>
                            {customer.name}
                          </strong>

                          <small>
                            Customer
                          </small>

                        </div>

                      </div>

                    </td>

                    {/* CONTACT */}

                    <td>

                      <div className="contact-cell">

                        <span>
                          {customer.email || '-'}
                        </span>

                        <small>
                          {customer.phone || 'No phone'}
                        </small>

                      </div>

                    </td>

                    {/* ORDERS */}

                    <td>

                      <span className="orders-badge">
                        {customer.totalOrders}
                      </span>

                    </td>

                    {/* SPENDING */}

                    <td>

                      <strong className="spent-value">
                        {formatCurrency(
                          customer.totalSpent
                        )}
                      </strong>

                    </td>

                    {/* LAST ORDER */}

                    <td>

                      <span className="last-order">
                        {formatDate(
                          customer.lastOrderDate
                        )}
                      </span>

                    </td>

                    {/* ACTIVITY */}

                    <td>

                      <div className="activity-cell">

                        {customer.deliveredOrders >
                          0 && (
                          <span className="activity-delivered">
                            {customer.deliveredOrders}{' '}
                            delivered
                          </span>
                        )}

                        {customer.pendingOrders >
                          0 && (
                          <span className="activity-pending">
                            {customer.pendingOrders}{' '}
                            pending
                          </span>
                        )}

                        {customer.cancelledOrders >
                          0 && (
                          <span className="activity-cancelled">
                            {customer.cancelledOrders}{' '}
                            cancelled
                          </span>
                        )}

                      </div>

                    </td>

                    {/* ACTION */}

                    <td>

                      <button
                        className="view-customer-btn"
                        onClick={() =>
                          setSelectedCustomer(
                            customer
                          )
                        }
                      >
                        👁 View
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================================= */}
      {/* CUSTOMER DETAILS MODAL */}
      {/* ================================= */}

      {selectedCustomer && (

        <div
          className="customer-modal-overlay"
          onClick={() =>
            setSelectedCustomer(null)
          }
        >

          <div
            className="customer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div className="modal-customer-title">

                <div className="large-avatar">
                  {getInitial(
                    selectedCustomer.name
                  )}
                </div>

                <div>

                  <h2>
                    {selectedCustomer.name}
                  </h2>

                  <span>
                    {selectedCustomer.email}
                  </span>

                </div>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedCustomer(null)
                }
              >
                ×
              </button>

            </div>

            {/* CUSTOMER SUMMARY */}

            <div className="customer-summary">

              <div>
                <span>Total Orders</span>

                <strong>
                  {selectedCustomer.totalOrders}
                </strong>
              </div>

              <div>
                <span>Total Spent</span>

                <strong>
                  {formatCurrency(
                    selectedCustomer.totalSpent
                  )}
                </strong>
              </div>

              <div>
                <span>Delivered</span>

                <strong>
                  {selectedCustomer.deliveredOrders}
                </strong>
              </div>

            </div>

            {/* CONTACT INFO */}

            <div className="modal-section">

              <h3>
                Customer Information
              </h3>

              <div className="customer-info-grid">

                <div>
                  <span>Name</span>

                  <strong>
                    {selectedCustomer.name}
                  </strong>
                </div>

                <div>
                  <span>Email</span>

                  <strong>
                    {selectedCustomer.email}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>

                  <strong>
                    {selectedCustomer.phone ||
                      'Not provided'}
                  </strong>
                </div>

                <div>
                  <span>First Order</span>

                  <strong>
                    {formatDate(
                      selectedCustomer.firstOrderDate
                    )}
                  </strong>
                </div>

                <div>
                  <span>Last Order</span>

                  <strong>
                    {formatDate(
                      selectedCustomer.lastOrderDate
                    )}
                  </strong>
                </div>

              </div>

            </div>

            {/* ORDER HISTORY */}

            <div className="modal-section">

              <h3>
                Order History
              </h3>

              <div className="customer-orders">

                {selectedCustomer.orders
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt) -
                      new Date(a.createdAt)
                  )
                  .map((order) => (

                    <div
                      className="customer-order"
                      key={order._id}
                    >

                      <div>

                        <strong>
                          #{order.orderNumber}
                        </strong>

                        <small>
                          {formatDate(
                            order.createdAt
                          )}
                        </small>

                      </div>

                      <div>
                        <strong>
                          {formatCurrency(
                            order.total
                          )}
                        </strong>
                      </div>

                      <span
                        className={`order-status ${
                          order.status
                            ?.toLowerCase()
                            .replace(
                              /\s+/g,
                              '-'
                            )
                        }`}
                      >
                        {order.status}
                      </span>

                    </div>

                  ))}

              </div>

            </div>

            {/* FOOTER */}

            <div className="modal-footer">

              <button
                className="close-modal-btn"
                onClick={() =>
                  setSelectedCustomer(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================================= */}
      {/* CSS */}
      {/* ================================= */}

      <style>{`

        .customers-page {
          padding: 28px;
          min-height: 100%;
          background: #f6f7fb;
          color: #172033;
        }

        .customers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .customers-header h1 {
          margin: 0 0 6px;
          font-size: 30px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .customers-header p {
          margin: 0;
          color: #7b8497;
          font-size: 14px;
        }

        .refresh-btn {
          border: 1px solid #e3e7ef;
          background: white;
          color: #273149;
          padding: 11px 18px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .refresh-btn:hover {
          background: #f0f3f8;
        }

        /* ERROR */

        .customers-error {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff3f3;
          border: 1px solid #ffd5d5;
          padding: 15px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .customers-error > span {
          font-size: 24px;
        }

        .customers-error strong {
          color: #c53030;
        }

        .customers-error p {
          margin: 3px 0 0;
          color: #777;
          font-size: 13px;
        }

        .customers-error button {
          margin-left: auto;
          border: none;
          background: #c53030;
          color: white;
          padding: 8px 15px;
          border-radius: 7px;
          cursor: pointer;
        }

        /* STATS */

        .customer-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .customer-stat-card {
          background: white;
          border: 1px solid #e9ecf2;
          border-radius: 15px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 2px 8px rgba(20, 30, 50, 0.025);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 19px;
        }

        .stat-icon.blue {
          background: #eaf2ff;
          color: #2877d4;
        }

        .stat-icon.green {
          background: #e9f9f0;
          color: #24a564;
        }

        .stat-icon.orange {
          background: #fff3df;
          color: #e89b21;
        }

        .stat-icon.purple {
          background: #f1eaff;
          color: #8656d8;
        }

        .customer-stat-card span {
          display: block;
          color: #8a93a5;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .customer-stat-card strong {
          display: block;
          font-size: 20px;
          color: #1d2738;
        }

        /* CARD */

        .customers-card {
          background: white;
          border: 1px solid #e8ebf1;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(20, 30, 50, 0.03);
        }

        .customers-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 20px;
          border-bottom: 1px solid #edf0f4;
        }

        .search-box {
          width: 430px;
          height: 43px;
          border: 1px solid #e0e4eb;
          border-radius: 9px;
          display: flex;
          align-items: center;
          padding: 0 13px;
          gap: 9px;
        }

        .search-box span {
          font-size: 22px;
          color: #8b94a6;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 13px;
        }

        .customer-count {
          color: #8a93a5;
          font-size: 12px;
        }

        /* TABLE */

        .customers-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .customers-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
        }

        .customers-table th {
          text-align: left;
          padding: 14px 17px;
          background: #fafbfc;
          color: #7d8799;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #edf0f4;
        }

        .customers-table td {
          padding: 15px 17px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: middle;
          font-size: 13px;
        }

        .customers-table tbody tr:hover {
          background: #fbfcfe;
        }

        /* CUSTOMER */

        .customer-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .customer-avatar {
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 50%;
          background: #edf3ff;
          color: #3979cf;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 700;
        }

        .customer-main strong {
          display: block;
          color: #30394b;
        }

        .customer-main small {
          display: block;
          color: #9ba3b1;
          margin-top: 3px;
          font-size: 10px;
        }

        /* CONTACT */

        .contact-cell span {
          display: block;
          color: #4c5668;
          font-size: 12px;
        }

        .contact-cell small {
          display: block;
          color: #a0a7b4;
          margin-top: 4px;
          font-size: 11px;
        }

        /* ORDERS */

        .orders-badge {
          background: #eef3fb;
          color: #4e6687;
          padding: 6px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
        }

        .spent-value {
          color: #29344a;
          white-space: nowrap;
        }

        .last-order {
          color: #717b8d;
          font-size: 11px;
          white-space: nowrap;
        }

        /* ACTIVITY */

        .activity-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-cell span {
          font-size: 10px;
          font-weight: 600;
        }

        .activity-delivered {
          color: #22965b;
        }

        .activity-pending {
          color: #d28b13;
        }

        .activity-cancelled {
          color: #d64c4c;
        }

        /* VIEW */

        .view-customer-btn {
          border: 1px solid #dfe4ec;
          background: white;
          color: #4c5970;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
        }

        .view-customer-btn:hover {
          background: #eef4ff;
          border-color: #cbdcf6;
        }

        /* EMPTY */

        .empty-customers {
          text-align: center;
          padding: 65px 20px;
        }

        .empty-icon {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f2f4f7;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: auto;
          font-size: 27px;
        }

        .empty-customers h3 {
          margin: 15px 0 6px;
          color: #374151;
        }

        .empty-customers p {
          margin: 0;
          color: #9aa2af;
          font-size: 13px;
        }

        /* LOADING */

        .customers-loading {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #7c8595;
        }

        .loading-spinner {
          width: 35px;
          height: 35px;
          border: 3px solid #e4e8ef;
          border-top-color: #3478d4;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* MODAL */

        .customer-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
        }

        .customer-modal {
          width: min(720px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 18px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 24px;
          border-bottom: 1px solid #edf0f4;
        }

        .modal-customer-title {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .large-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #edf3ff;
          color: #3979cf;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 18px;
          font-weight: 700;
        }

        .modal-customer-title h2 {
          margin: 0 0 4px;
          font-size: 19px;
          color: #273145;
        }

        .modal-customer-title span {
          color: #8d96a6;
          font-size: 11px;
        }

        .modal-close {
          width: 35px;
          height: 35px;
          border: none;
          background: #f1f3f6;
          border-radius: 9px;
          font-size: 24px;
          cursor: pointer;
          color: #667085;
        }

        /* SUMMARY */

        .customer-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #edf0f4;
          border-bottom: 1px solid #edf0f4;
        }

        .customer-summary > div {
          background: #fafbfc;
          padding: 17px;
          text-align: center;
        }

        .customer-summary span {
          display: block;
          color: #929aaa;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .customer-summary strong {
          color: #303a4d;
          font-size: 17px;
        }

        /* SECTION */

        .modal-section {
          padding: 20px 24px;
          border-bottom: 1px solid #edf0f4;
        }

        .modal-section h3 {
          margin: 0 0 15px;
          font-size: 14px;
          color: #313b4d;
        }

        .customer-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }

        .customer-info-grid div span {
          display: block;
          color: #929aaa;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .customer-info-grid div strong {
          color: #465063;
          font-size: 12px;
          word-break: break-word;
        }

        /* ORDER HISTORY */

        .customer-orders {
          border: 1px solid #edf0f4;
          border-radius: 10px;
          overflow: hidden;
        }

        .customer-order {
          display: grid;
          grid-template-columns: 1fr auto 140px;
          align-items: center;
          gap: 15px;
          padding: 12px 14px;
          border-bottom: 1px solid #edf0f4;
        }

        .customer-order:last-child {
          border-bottom: none;
        }

        .customer-order strong {
          display: block;
          color: #3b4659;
          font-size: 12px;
        }

        .customer-order small {
          display: block;
          color: #999fad;
          font-size: 10px;
          margin-top: 4px;
        }

        .customer-order > div:nth-child(2) {
          text-align: right;
        }

        .order-status {
          justify-self: end;
          padding: 5px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          background: #f1f3f6;
          color: #687386;
        }

        .order-status.delivered {
          background: #e8f8ef;
          color: #23935a;
        }

        .order-status.pending {
          background: #fff3dc;
          color: #c98308;
        }

        .order-status.confirmed {
          background: #eaf2ff;
          color: #3172c7;
        }

        .order-status.preparing {
          background: #f0eaff;
          color: #7952c7;
        }

        .order-status.out-for-delivery {
          background: #e8f7ff;
          color: #1682b5;
        }

        .order-status.cancelled {
          background: #ffebeb;
          color: #cf4242;
        }

        /* FOOTER */

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 18px 24px;
        }

        .close-modal-btn {
          padding: 10px 18px;
          border-radius: 8px;
          border: 1px solid #e0e4ea;
          background: white;
          color: #5d6677;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        /* RESPONSIVE */

        @media (max-width: 1100px) {
          .customer-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .customers-page {
            padding: 18px;
          }

          .customers-header {
            align-items: flex-start;
            gap: 15px;
          }

          .customers-header h1 {
            font-size: 25px;
          }

          .customers-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            width: auto;
          }

          .customer-stats {
            grid-template-columns: 1fr;
          }

          .customer-info-grid {
            grid-template-columns: 1fr;
          }

          .customer-summary {
            grid-template-columns: 1fr;
          }

          .customer-order {
            grid-template-columns: 1fr;
          }

          .customer-order > div:nth-child(2) {
            text-align: left;
          }

          .order-status {
            justify-self: start;
          }
        }

      `}</style>
    </div>
  );
}