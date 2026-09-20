import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/products';
const SERVER_URL = 'http://localhost:5000';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  image: null,
  unit: 'piece',
};

function Products() {
  const [products, setProducts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);

  // ONLY ONE FORM STATE
  const [formData, setFormData] = useState(emptyForm);

  // ========================================
  // GET PRODUCTS
  // ========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load products'
        );
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch Products Error:', error);

      setError(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ========================================
  // Get Categories
  // ========================================
  const fetchCategories = async () => {
  try {
    const response = await fetch(
      'http://localhost:5000/api/categories'
    );

    const data = await response.json();

    if (response.ok) {
      setCategories(
        data.categories || []
      );
    }

  } catch (error) {
    console.error(
      'Categories Error:',
      error
    );
  }
};

  // ========================================
  // IMAGE CHANGE
  // ========================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, JPEG and PNG images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    setError('');

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));
  };

  // ========================================
  // OPEN ADD MODAL
  // ========================================

  const openAddModal = () => {
    setEditingProduct(null);

    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: null,
      unit: 'piece',
    });

    setError('');
    setShowModal(true);
  };

  // ========================================
  // OPEN EDIT MODAL
  // ========================================

  const openEditModal = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price ?? '',
      category: product.category || '',
      stock: product.stock ?? '',
      image: product.image || null,
      unit: product.unit || 'piece',
    });

    setError('');
    setShowModal(true);
  };

  // ========================================
  // CLOSE MODAL
  // ========================================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);

    setFormData({
      ...emptyForm,
    });

    setError('');
  };

  // ========================================
  // SAVE PRODUCT
  // ========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    // Frontend validation
    if (!formData.name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (
      formData.price === '' ||
      Number(formData.price) < 0
    ) {
      setError('Valid product price is required.');
      return;
    }

    if (!formData.category.trim()) {
      setError('Product category is required.');
      return;
    }

    // Image required only when adding
    if (!editingProduct && !formData.image) {
      setError('Product image is required.');
      return;
    }

    try {
      setSaving(true);

      const token =
        localStorage.getItem('adminToken');

      if (!token) {
        throw new Error(
          'Admin login required. Please login again.'
        );
      }

      // ========================================
      // FORM DATA
      // ========================================

      const uploadData = new FormData();

      uploadData.append(
        'name',
        formData.name.trim()
      );

      uploadData.append(
        'description',
        formData.description.trim()
      );

      uploadData.append(
        'price',
        String(formData.price)
      );

      uploadData.append(
        'category',
        formData.category.trim()
      );

      uploadData.append(
        'stock',
        String(formData.stock || 0)
      );

      uploadData.append(
        'unit',
        formData.unit || 'piece'
      );

      // Only append image if a NEW file is selected
      if (formData.image instanceof File) {
        uploadData.append(
          'image',
          formData.image
        );
      }

      // ========================================
      // DEBUG
      // ========================================

      console.log(
        '========== PRODUCT SUBMIT =========='
      );

      for (const [key, value] of uploadData.entries()) {
        console.log(
          key,
          value instanceof File
            ? value.name
            : value
        );
      }

      console.log(
        '===================================='
      );

      // ========================================
      // ADD / EDIT URL
      // ========================================

      const url = editingProduct
        ? `${API_URL}/${editingProduct._id}`
        : API_URL;

      const method = editingProduct
        ? 'PUT'
        : 'POST';

      // ========================================
      // API REQUEST
      // ========================================

      const response = await fetch(url, {
        method,

        headers: {
          Authorization: `Bearer ${token}`,
        },

        // IMPORTANT:
        // Do NOT add Content-Type manually
        body: uploadData,
      });

      const result = await response.json();

      console.log(
        'SERVER RESPONSE:',
        result
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
            (
              editingProduct
                ? 'Failed to update product'
                : 'Failed to add product'
            )
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      alert(
        editingProduct
          ? 'Product updated successfully!'
          : 'Product added successfully!'
      );

      setShowModal(false);
      setEditingProduct(null);

      setFormData({
        ...emptyForm,
      });

      await fetchProducts();

    } catch (error) {
      console.error(
        'Save Product Error:',
        error
      );

      setError(
        error.message ||
          'Something went wrong'
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // DELETE PRODUCT
  // ========================================

  const deleteProduct = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmed) return;

    try {
      setError('');

      const token =
        localStorage.getItem('adminToken');

      if (!token) {
        throw new Error(
          'Admin login required.'
        );
      }

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to delete product'
        );
      }

      await fetchProducts();

    } catch (error) {
      console.error(
        'Delete Product Error:',
        error
      );

      setError(
        error.message ||
          'Failed to delete product'
      );
    }
  };

  // ========================================
  // IMAGE PREVIEW
  // ========================================

  const getImagePreview = () => {
    if (!formData.image) {
      return null;
    }

    // New uploaded file
    if (formData.image instanceof File) {
      return URL.createObjectURL(
        formData.image
      );
    }

    // Existing server image
    if (
      typeof formData.image === 'string'
    ) {
      if (
        formData.image.startsWith('http')
      ) {
        return formData.image;
      }

      return `${SERVER_URL}${formData.image}`;
    }

    return null;
  };

  const imagePreview =
    getImagePreview();

  // ========================================
  // RETURN
  // ========================================

  return (
    <div className="products-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="page-heading">

        <div>
          <h2>Products</h2>

          <p>
            Manage your grocery products and inventory.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Product
        </button>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="products-error">
          ⚠️ {error}
        </div>
      )}

      {/* =====================================
          STATS
      ===================================== */}

      <div className="product-mini-stats">

        <div>
          <span>Total Products</span>

          <strong>
            {products.length}
          </strong>
        </div>

        <div>
          <span>In Stock</span>

          <strong>
            {
              products.filter(
                (product) =>
                  Number(product.stock) > 0
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Out of Stock</span>

          <strong>
            {
              products.filter(
                (product) =>
                  Number(product.stock) === 0
              ).length
            }
          </strong>
        </div>

      </div>

      {/* =====================================
          PRODUCTS TABLE
      ===================================== */}

      <div className="products-card">

        {loading ? (

          <div className="products-loading">
            Loading products...
          </div>

        ) : products.length === 0 ? (

          <div className="products-empty">

            <div>🛍️</div>

            <h3>No Products Yet</h3>

            <p>
              Add your first grocery product.
            </p>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              + Add Product
            </button>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CATEGORY</th>
                  <th>PRICE</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {products.map(
                  (product) => (

                    <tr
                      key={product._id}
                    >

                      {/* PRODUCT */}

                      <td>

                        <div className="product-table-info">

                          <div className="product-image">

                            {product.image ? (

                              <img
                                src={
                                  product.image.startsWith(
                                    'http'
                                  )
                                    ? product.image
                                    : `${SERVER_URL}${product.image}`
                                }
                                alt={
                                  product.name
                                }
                              />

                            ) : (

                              <span>
                                🛒
                              </span>

                            )}

                          </div>

                          <div>

                            <strong>
                              {product.name}
                            </strong>

                            <small>
                              {product.unit}
                            </small>

                          </div>

                        </div>

                      </td>

                      {/* CATEGORY */}

                      <td>
                        {product.category}
                      </td>

                      {/* PRICE */}

                      <td>

                        <strong>
                          Rs.{' '}
                          {product.price}
                        </strong>

                      </td>

                      {/* STOCK */}

                      <td>
                        {product.stock}
                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={
                            Number(
                              product.stock
                            ) > 0
                              ? 'stock-badge in-stock'
                              : 'stock-badge out-stock'
                          }
                        >

                          {Number(
                            product.stock
                          ) > 0
                            ? 'In Stock'
                            : 'Out of Stock'}

                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <div className="product-actions">

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              openEditModal(
                                product
                              )
                            }
                            title="Edit Product"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              deleteProduct(
                                product._id
                              )
                            }
                            title="Delete Product"
                          >
                            🗑️
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================
          MODAL
      ===================================== */}

      {showModal && (

        <div className="modal-overlay">

          <div className="product-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <h2>
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add Product'}
                </h2>

                <p>
                  Enter product information below.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                {/* NAME */}

                <div className="product-form-group full-width">

                  <label>
                    Product Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    autoComplete="off"
                  />

                </div>

                {/* PRICE */}

                <div className="product-form-group">

                  <label>
                    Price *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Enter price"
                    min="0"
                  />

                </div>

                {/* STOCK */}

                <div className="product-form-group">

                  <label>
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="Enter stock"
                    min="0"
                  />

                </div>

                {/* CATEGORY */}

                <div className="product-form-group">

                  <label>
                    Category *
                  </label>

                  <select
  name="category"
  value={formData.category}
  onChange={handleChange}
>
  <option value="">
    Select Category
  </option>

  {categories
    .filter(
      (category) =>
        category.isActive !== false
    )
    .map((category) => (
      <option
        key={category._id}
        value={category.name}
      >
        {category.name}
      </option>
    ))}
</select>

                </div>

                {/* UNIT */}

                <div className="product-form-group">

                  <label>
                    Unit
                  </label>

                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                  >

                    <option value="piece">
                      Piece
                    </option>

                    <option value="Kg">
                      Kg
                    </option>

                    <option value="gram">
                      Gram
                    </option>

                    <option value="liter">
                      Liter
                    </option>

                    <option value="pack">
                      Pack
                    </option>

                    <option value="dozen">
                      Dozen
                    </option>

                  </select>

                </div>

                {/* IMAGE */}

                <div className="product-form-group full-width">

                  <label>
                    Product Image
                    {!editingProduct && ' *'}
                  </label>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={
                      handleImageChange
                    }
                  />

                  {/* IMAGE PREVIEW */}

                  {imagePreview && (

                    <div className="image-preview">

                      <img
                        src={imagePreview}
                        alt="Product Preview"
                      />

                      <p>
                        {formData.image instanceof
                        File
                          ? formData.image.name
                          : 'Current product image'}
                      </p>

                    </div>

                  )}

                </div>

                {/* DESCRIPTION */}

                <div className="product-form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Product description..."
                    rows="4"
                  />

                </div>

              </div>

              {/* MODAL ERROR */}

              {error && (

                <div className="modal-error">
                  ⚠️ {error}
                </div>

              )}

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >

                  {saving
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Add Product'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Products;