import React, { useEffect, useMemo, useState } from 'react';

const API_URL = 'http://localhost:5000/api/orders';

const STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const getToken = () => localStorage.getItem('adminToken');

const formatCurrency = (value) => {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return '-';

  return new Date(date).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case 'Pending':
      return 'status pending';

    case 'Confirmed':
      return 'status confirmed';

    case 'Preparing':
      return 'status preparing';

    case 'Out for Delivery':
      return 'status delivery';

    case 'Delivered':
      return 'status delivered';

    case 'Cancelled':
      return 'status cancelled';

    default:
      return 'status';
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');

  // =========================
  // FETCH ORDERS
  // =========================
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      if (!token) {
        setError('Admin token not found. Please login again.');
        setLoading(false);
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
        throw new Error(data.message || 'Failed to fetch orders');
      }

      setOrders(data.orders || data.data || []);
    } catch (err) {
      console.error('Fetch Orders Error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // =========================
  // UPDATE ORDER STATUS
  // =========================
  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);

      const token = getToken();

      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          status: newStatus,
        }));
      }
    } catch (err) {
      console.error('Update Status Error:', err);
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // =========================
  // DELETE ORDER
  // =========================
  const deleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this order?'
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(orderId);

      const token = getToken();

      const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete order');
      }

      setOrders((prevOrders) =>
        prevOrders.filter((order) => order._id !== orderId)
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Delete Order Error:', err);
      alert(err.message || 'Failed to delete order');
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // FILTER + SEARCH
  // =========================
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = order.customer?.name || '';
      const customerEmail = order.customer?.email || '';
      const orderNumber = order.orderNumber || '';

      const searchText = search.toLowerCase();

      const matchesSearch =
        orderNumber.toLowerCase().includes(searchText) ||
        customerName.toLowerCase().includes(searchText) ||
        customerEmail.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === 'All' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  // =========================
  // STATS
  // =========================
  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === 'Pending'
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === 'Delivered'
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === 'Cancelled'
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* ================= HEADER ================= */}
      <div className="orders-header">
        <div>
          <h1>Orders</h1>
          <p>Manage and track all customer orders</p>
        </div>

        <button className="refresh-btn" onClick={fetchOrders}>
          ↻ Refresh
        </button>
      </div>

      {/* ================= ERROR ================= */}
      {error && (
        <div className="orders-error">
          <span>⚠</span>
          <div>
            <strong>Unable to load orders</strong>
            <p>{error}</p>
          </div>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      )}

      {/* ================= STATS ================= */}
      <div className="order-stats">
        <div className="order-stat-card">
          <div className="stat-icon blue">📦</div>

          <div>
            <span>Total Orders</span>
            <strong>{totalOrders}</strong>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="stat-icon orange">⏳</div>

          <div>
            <span>Pending</span>
            <strong>{pendingOrders}</strong>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <span>Delivered</span>
            <strong>{deliveredOrders}</strong>
          </div>
        </div>

        <div className="order-stat-card">
          <div className="stat-icon red">✕</div>

          <div>
            <span>Cancelled</span>
            <strong>{cancelledOrders}</strong>
          </div>
        </div>

        <div className="order-stat-card revenue-card">
          <div className="stat-icon purple">₨</div>

          <div>
            <span>Total Revenue</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </div>
      </div>

      {/* ================= MAIN CARD ================= */}
      <div className="orders-card">
        {/* TOOLBAR */}
        <div className="orders-toolbar">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search order, customer or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-box">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULT COUNT */}
        <div className="orders-result">
          Showing <strong>{filteredOrders.length}</strong> of{' '}
          <strong>{orders.length}</strong> orders
        </div>

        {/* ================= TABLE ================= */}
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-orders">
                      <div className="empty-icon">📦</div>

                      <h3>No orders found</h3>

                      <p>
                        {search || statusFilter !== 'All'
                          ? 'Try changing your search or filter.'
                          : 'There are no orders yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    {/* ORDER */}
                    <td>
                      <div className="order-number">
                        #{order.orderNumber}
                      </div>

                      <small>
                        {order._id?.slice(-6).toUpperCase()}
                      </small>
                    </td>

                    {/* CUSTOMER */}
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {(order.customer?.name || 'C')
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {order.customer?.name || 'Unknown'}
                          </strong>

                          <small>
                            {order.customer?.email || '-'}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* ITEMS */}
                    <td>
                      <span className="items-count">
                        {order.items?.length || 0} item
                        {order.items?.length === 1 ? '' : 's'}
                      </span>
                    </td>

                    {/* TOTAL */}
                    <td>
                      <strong className="order-total">
                        {formatCurrency(order.total)}
                      </strong>
                    </td>

                    {/* PAYMENT */}
                    <td>
                      <div className="payment-cell">
                        <span>{order.paymentMethod || 'COD'}</span>

                        <small
                          className={
                            order.paymentStatus === 'Paid'
                              ? 'paid'
                              : order.paymentStatus === 'Failed'
                              ? 'failed'
                              : 'payment-pending'
                          }
                        >
                          {order.paymentStatus || 'Pending'}
                        </small>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td>
                      <select
                        className={getStatusClass(order.status)}
                        value={order.status || 'Pending'}
                        disabled={updatingId === order._id}
                        onChange={(e) =>
                          updateStatus(order._id, e.target.value)
                        }
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* DATE */}
                    <td>
                      <div className="date-cell">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>

                    {/* ACTION */}
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          title="View Order"
                          onClick={() => setSelectedOrder(order)}
                        >
                          👁
                        </button>

                        <button
                          className="delete-btn"
                          title="Delete Order"
                          disabled={deletingId === order._id}
                          onClick={() => deleteOrder(order._id)}
                        >
                          {deletingId === order._id ? '...' : '🗑'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrder && (
        <div
          className="order-modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="modal-header">
              <div>
                <span>Order Details</span>

                <h2>#{selectedOrder.orderNumber}</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                ×
              </button>
            </div>

            {/* STATUS */}
            <div className="modal-status-row">
              <div>
                <span className="modal-label">Order Status</span>

                <select
                  className={getStatusClass(selectedOrder.status)}
                  value={selectedOrder.status || 'Pending'}
                  disabled={updatingId === selectedOrder._id}
                  onChange={(e) =>
                    updateStatus(selectedOrder._id, e.target.value)
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-date">
                <span>Placed on</span>
                <strong>
                  {formatDate(selectedOrder.createdAt)}
                </strong>
              </div>
            </div>

            {/* CUSTOMER */}
            <div className="modal-section">
              <h3>Customer Information</h3>

              <div className="customer-info-grid">
                <div>
                  <span>Name</span>
                  <strong>
                    {selectedOrder.customer?.name || '-'}
                  </strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>
                    {selectedOrder.customer?.email || '-'}
                  </strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {selectedOrder.customer?.phone || '-'}
                  </strong>
                </div>
              </div>
            </div>

            {/* ADDRESS */}
            <div className="modal-section">
              <h3>Delivery Address</h3>

              <div className="address-box">
                📍 {selectedOrder.deliveryAddress || '-'}
              </div>
            </div>

            {/* ITEMS */}
            <div className="modal-section">
              <h3>
                Order Items ({selectedOrder.items?.length || 0})
              </h3>

              <div className="modal-items">
                {selectedOrder.items?.map((item, index) => (
                  <div className="modal-item" key={index}>
                    <div className="item-image">
                      {item.image ? (
                        <img
                          src={
                            item.image.startsWith('http')
                              ? item.image
                              : `http://localhost:5000/${item.image.replace(
                                  /^\/+/,
                                  ''
                                )}`
                          }
                          alt={item.name}
                        />
                      ) : (
                        <span>🛒</span>
                      )}
                    </div>

                    <div className="item-details">
                      <strong>{item.name}</strong>

                      <span>
                        {item.quantity} × {formatCurrency(item.price)}
                      </span>
                    </div>

                    <strong className="item-total">
                      {formatCurrency(
                        Number(item.price || 0) *
                          Number(item.quantity || 0)
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* SUMMARY */}
            <div className="order-summary">
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatCurrency(selectedOrder.subtotal)}
                </strong>
              </div>

              <div>
                <span>Delivery Fee</span>
                <strong>
                  {formatCurrency(selectedOrder.deliveryFee)}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>
                  {formatCurrency(selectedOrder.total)}
                </strong>
              </div>
            </div>

            {/* PAYMENT */}
            <div className="payment-summary">
              <div>
                <span>Payment Method</span>
                <strong>
                  {selectedOrder.paymentMethod || 'Cash on Delivery'}
                </strong>
              </div>

              <div>
                <span>Payment Status</span>
                <strong
                  className={
                    selectedOrder.paymentStatus === 'Paid'
                      ? 'paid'
                      : selectedOrder.paymentStatus === 'Failed'
                      ? 'failed'
                      : 'payment-pending'
                  }
                >
                  {selectedOrder.paymentStatus || 'Pending'}
                </strong>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer">
              <button
                className="close-modal-btn"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>

              <button
                className="modal-delete-btn"
                onClick={() => deleteOrder(selectedOrder._id)}
              >
                🗑 Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CSS ================= */}
      <style>{`
        .orders-page {
          padding: 28px;
          min-height: 100%;
          background: #f6f7fb;
          color: #172033;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .orders-header h1 {
          margin: 0 0 6px;
          font-size: 30px;
          font-weight: 750;
          letter-spacing: -0.5px;
        }

        .orders-header p {
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
          transition: 0.2s;
        }

        .refresh-btn:hover {
          background: #f0f3f8;
        }

        .orders-error {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff3f3;
          border: 1px solid #ffd5d5;
          padding: 15px 18px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .orders-error > span {
          font-size: 24px;
        }

        .orders-error strong {
          display: block;
          color: #c53030;
        }

        .orders-error p {
          margin: 3px 0 0;
          color: #777;
          font-size: 13px;
        }

        .orders-error button {
          margin-left: auto;
          border: none;
          background: #c53030;
          color: white;
          padding: 8px 15px;
          border-radius: 7px;
          cursor: pointer;
        }

        .order-stats {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .order-stat-card {
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
          font-size: 20px;
          font-weight: 700;
        }

        .stat-icon.blue {
          background: #eaf2ff;
          color: #2877d4;
        }

        .stat-icon.orange {
          background: #fff3df;
          color: #e89b21;
        }

        .stat-icon.green {
          background: #e9f9f0;
          color: #24a564;
        }

        .stat-icon.red {
          background: #ffeded;
          color: #dc4d4d;
        }

        .stat-icon.purple {
          background: #f1eaff;
          color: #8656d8;
        }

        .order-stat-card span {
          display: block;
          color: #8a93a5;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .order-stat-card strong {
          display: block;
          font-size: 21px;
          color: #1d2738;
        }

        .revenue-card strong {
          font-size: 17px;
        }

        .orders-card {
          background: white;
          border: 1px solid #e8ebf1;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(20, 30, 50, 0.03);
        }

        .orders-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #edf0f4;
          gap: 15px;
        }

        .search-box {
          width: 420px;
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
          color: #333;
        }

        .search-box input::placeholder {
          color: #a2a9b6;
        }

        .filter-box select {
          height: 43px;
          min-width: 160px;
          border: 1px solid #e0e4eb;
          border-radius: 9px;
          padding: 0 13px;
          background: white;
          color: #374151;
          outline: none;
          cursor: pointer;
        }

        .orders-result {
          padding: 12px 20px;
          font-size: 12px;
          color: #8a93a5;
          background: #fafbfc;
          border-bottom: 1px solid #edf0f4;
        }

        .orders-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .orders-table th {
          text-align: left;
          padding: 14px 16px;
          background: #fafbfc;
          color: #7d8799;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #edf0f4;
        }

        .orders-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #f0f2f5;
          vertical-align: middle;
          font-size: 13px;
        }

        .orders-table tbody tr:hover {
          background: #fbfcfe;
        }

        .order-number {
          font-weight: 700;
          color: #29344a;
        }

        .orders-table td small {
          display: block;
          color: #a0a7b4;
          margin-top: 4px;
          font-size: 10px;
        }

        .customer-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
        }

        .customer-avatar {
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: #edf3ff;
          color: #3979cf;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 700;
        }

        .customer-cell strong {
          display: block;
          color: #30394b;
          font-size: 13px;
        }

        .customer-cell small {
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .items-count {
          background: #f1f3f7;
          color: #626c7e;
          padding: 5px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .order-total {
          color: #263044;
          white-space: nowrap;
        }

        .payment-cell span {
          display: block;
          color: #4c5668;
          font-size: 12px;
        }

        .payment-cell small {
          font-weight: 600;
        }

        .paid {
          color: #1d9b5d !important;
        }

        .failed {
          color: #d64343 !important;
        }

        .payment-pending {
          color: #d99018 !important;
        }

        .status {
          border: none;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 11px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
          max-width: 145px;
        }

        .status.pending {
          background: #fff3dc;
          color: #c98308;
        }

        .status.confirmed {
          background: #eaf2ff;
          color: #3172c7;
        }

        .status.preparing {
          background: #f0eaff;
          color: #7952c7;
        }

        .status.delivery {
          background: #e8f7ff;
          color: #1682b5;
        }

        .status.delivered {
          background: #e7f8ee;
          color: #23915a;
        }

        .status.cancelled {
          background: #ffebeb;
          color: #cf4242;
        }

        .date-cell {
          color: #707a8d;
          font-size: 11px;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 7px;
        }

        .view-btn,
        .delete-btn {
          width: 33px;
          height: 33px;
          border-radius: 8px;
          border: 1px solid #e3e7ed;
          background: white;
          cursor: pointer;
          transition: 0.2s;
        }

        .view-btn:hover {
          background: #edf4ff;
          border-color: #c9dcfa;
        }

        .delete-btn:hover {
          background: #fff0f0;
          border-color: #f6caca;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-orders {
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

        .empty-orders h3 {
          margin: 15px 0 6px;
          color: #374151;
        }

        .empty-orders p {
          margin: 0;
          color: #9aa2af;
          font-size: 13px;
        }

        .orders-loading {
          min-height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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

        /* ================= MODAL ================= */

        .order-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.52);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
        }

        .order-modal {
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
          align-items: flex-start;
          padding: 22px 24px;
          border-bottom: 1px solid #edf0f4;
        }

        .modal-header span {
          color: #8a93a5;
          font-size: 12px;
        }

        .modal-header h2 {
          margin: 5px 0 0;
          font-size: 22px;
          color: #202a3c;
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

        .modal-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          background: #fafbfc;
          border-bottom: 1px solid #edf0f4;
        }

        .modal-label,
        .modal-date span {
          display: block;
          color: #8b94a4;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .modal-date {
          text-align: right;
        }

        .modal-date strong {
          color: #455064;
          font-size: 12px;
        }

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
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .customer-info-grid div span {
          display: block;
          color: #929aaa;
          font-size: 11px;
          margin-bottom: 5px;
        }

        .customer-info-grid div strong {
          color: #465063;
          font-size: 12px;
          word-break: break-word;
        }

        .address-box {
          background: #f8f9fb;
          border: 1px solid #edf0f3;
          padding: 13px;
          border-radius: 9px;
          color: #566074;
          font-size: 12px;
          line-height: 1.6;
        }

        .modal-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #f0f2f5;
        }

        .modal-item:last-child {
          border-bottom: none;
        }

        .item-image {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: #f3f5f8;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
        }

        .item-details strong {
          display: block;
          font-size: 13px;
          color: #354054;
          margin-bottom: 4px;
        }

        .item-details span {
          color: #929aaa;
          font-size: 11px;
        }

        .item-total {
          color: #344054;
          font-size: 12px;
        }

        .order-summary {
          padding: 18px 24px;
          background: #fafbfc;
        }

        .order-summary > div {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          color: #737d8f;
          font-size: 12px;
        }

        .order-summary strong {
          color: #465063;
        }

        .order-summary .summary-total {
          border-top: 1px solid #e7eaf0;
          margin-top: 7px;
          padding-top: 13px;
          color: #273247;
          font-weight: 700;
          font-size: 14px;
        }

        .order-summary .summary-total strong {
          font-size: 17px;
          color: #222c3f;
        }

        .payment-summary {
          padding: 17px 24px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .payment-summary span {
          display: block;
          color: #9199a8;
          font-size: 10px;
          margin-bottom: 5px;
        }

        .payment-summary strong {
          font-size: 12px;
          color: #4c5668;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding: 18px 24px;
          border-top: 1px solid #edf0f4;
        }

        .close-modal-btn,
        .modal-delete-btn {
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }

        .close-modal-btn {
          border: 1px solid #e0e4ea;
          background: white;
          color: #5d6677;
        }

        .modal-delete-btn {
          border: 1px solid #ffd0d0;
          background: #fff1f1;
          color: #d04444;
        }

        @media (max-width: 1200px) {
          .order-stats {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 800px) {
          .orders-page {
            padding: 18px;
          }

          .orders-header {
            align-items: flex-start;
            gap: 15px;
          }

          .orders-header h1 {
            font-size: 25px;
          }

          .order-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .orders-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            width: auto;
          }

          .filter-box select {
            width: 100%;
          }

          .customer-info-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 500px) {
          .order-stats {
            grid-template-columns: 1fr;
          }

          .modal-status-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 15px;
          }

          .modal-date {
            text-align: left;
          }

          .payment-summary {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}