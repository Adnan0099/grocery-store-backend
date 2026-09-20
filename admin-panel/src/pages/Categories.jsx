import { useEffect, useState } from 'react';

const API_URL =
  'http://localhost:5000/api/categories';

const SERVER_URL =
  'http://localhost:5000';

const emptyForm = {
  name: '',
  description: '',
  image: null,
  isActive: true,
};

function Categories() {

  const [categories, setCategories] =
    useState([]);

  const [showModal, setShowModal] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [formData, setFormData] =
    useState(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');


  // ========================================
  // FETCH
  // ========================================

  const fetchCategories = async () => {

    try {

      setLoading(true);
      setError('');

      const response =
        await fetch(API_URL);

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Failed to fetch categories'
        );
      }

      setCategories(
        data.categories || []
      );

    } catch (error) {

      console.error(error);

      setError(
        error.message
      );

    } finally {

      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCategories();
  }, []);


  // ========================================
  // INPUT CHANGE
  // ========================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  // ========================================
  // IMAGE
  // ========================================

  const handleImageChange = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) return;


    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        'Only JPG, JPEG and PNG images are allowed.'
      );
      return;
    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Image must be less than 5MB.'
      );
      return;
    }


    setError('');

    setFormData(
      (previous) => ({
        ...previous,
        image: file,
      })
    );
  };


  // ========================================
  // ADD MODAL
  // ========================================

  const openAddModal = () => {

    setEditingCategory(null);

    setFormData({
      name: '',
      description: '',
      image: null,
      isActive: true,
    });

    setError('');

    setShowModal(true);
  };


  // ========================================
  // EDIT MODAL
  // ========================================

  const openEditModal = (
    category
  ) => {

    setEditingCategory(
      category
    );

    setFormData({
      name:
        category.name || '',

      description:
        category.description || '',

      image:
        category.image || null,

      isActive:
        category.isActive !== false,
    });

    setError('');

    setShowModal(true);
  };


  // ========================================
  // CLOSE
  // ========================================

  const closeModal = () => {

    if (saving) return;

    setShowModal(false);

    setEditingCategory(null);

    setFormData({
      ...emptyForm,
    });

    setError('');
  };


  // ========================================
  // SUBMIT
  // ========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');


    if (!formData.name.trim()) {

      setError(
        'Category name is required.'
      );

      return;
    }


    if (
      !editingCategory &&
      !formData.image
    ) {

      setError(
        'Category image is required.'
      );

      return;
    }


    try {

      setSaving(true);


      const token =
        localStorage.getItem(
          'adminToken'
        );


      if (!token) {
        throw new Error(
          'Admin login required.'
        );
      }


      const uploadData =
        new FormData();


      uploadData.append(
        'name',
        formData.name.trim()
      );


      uploadData.append(
        'description',
        formData.description.trim()
      );


      uploadData.append(
        'isActive',
        String(formData.isActive)
      );


      if (
        formData.image instanceof File
      ) {

        uploadData.append(
          'image',
          formData.image
        );
      }


      const url =
        editingCategory
          ? `${API_URL}/${editingCategory._id}`
          : API_URL;


      const method =
        editingCategory
          ? 'PUT'
          : 'POST';


      const response =
        await fetch(url, {

          method,

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: uploadData,
        });


      const result =
        await response.json();


      if (!response.ok) {
        throw new Error(
          result.message ||
          'Failed to save category'
        );
      }


      alert(
        editingCategory
          ? 'Category updated successfully!'
          : 'Category added successfully!'
      );


      closeModal();

      await fetchCategories();


    } catch (error) {

      console.error(
        'Category Error:',
        error
      );

      setError(
        error.message
      );

    } finally {

      setSaving(false);
    }
  };


  // ========================================
  // DELETE
  // ========================================

  const deleteCategory = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        'Are you sure you want to delete this category?'
      );


    if (!confirmed) return;


    try {

      setError('');


      const token =
        localStorage.getItem(
          'adminToken'
        );


      const response =
        await fetch(
          `${API_URL}/${id}`,
          {
            method: 'DELETE',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      const result =
        await response.json();


      if (!response.ok) {
        throw new Error(
          result.message ||
          'Failed to delete category'
        );
      }


      await fetchCategories();


    } catch (error) {

      console.error(error);

      setError(
        error.message
      );
    }
  };


  // ========================================
  // IMAGE URL
  // ========================================

  const getImageUrl = (
    image
  ) => {

    if (!image) return '';

    if (
      image.startsWith('http')
    ) {
      return image;
    }

    return `${SERVER_URL}${image}`;
  };


  // ========================================
  // RENDER
  // ========================================

  return (

    <div className="products-page">

      {/* HEADER */}

      <div className="page-heading">

        <div>

          <h2>
            Categories
          </h2>

          <p>
            Manage grocery categories.
          </p>

        </div>


        <button
          className="primary-button"
          onClick={openAddModal}
        >
          + Add Category
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="products-error">
          ⚠️ {error}
        </div>
      )}


      {/* STATS */}

      <div className="product-mini-stats">

        <div>

          <span>
            Total Categories
          </span>

          <strong>
            {categories.length}
          </strong>

        </div>


        <div>

          <span>
            Active
          </span>

          <strong>
            {
              categories.filter(
                (item) =>
                  item.isActive !== false
              ).length
            }
          </strong>

        </div>


        <div>

          <span>
            Inactive
          </span>

          <strong>
            {
              categories.filter(
                (item) =>
                  item.isActive === false
              ).length
            }
          </strong>

        </div>

      </div>


      {/* TABLE */}

      <div className="products-card">

        {loading ? (

          <div className="products-loading">
            Loading categories...
          </div>

        ) : categories.length === 0 ? (

          <div className="products-empty">

            <div>
              📁
            </div>

            <h3>
              No Categories Yet
            </h3>

            <p>
              Add your first grocery category.
            </p>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              + Add Category
            </button>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>
                    CATEGORY
                  </th>

                  <th>
                    DESCRIPTION
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>


              <tbody>

                {categories.map(
                  (category) => (

                    <tr
                      key={
                        category._id
                      }
                    >

                      <td>

                        <div className="product-table-info">

                          <div className="product-image">

                            {category.image ? (

                              <img
                                src={getImageUrl(
                                  category.image
                                )}
                                alt={
                                  category.name
                                }
                              />

                            ) : (
                              <span>
                                📁
                              </span>
                            )}

                          </div>


                          <div>

                            <strong>
                              {category.name}
                            </strong>

                          </div>

                        </div>

                      </td>


                      <td>

                        {category.description ||
                          'No description'}

                      </td>


                      <td>

                        <span
                          className={
                            category.isActive !== false
                              ? 'stock-badge in-stock'
                              : 'stock-badge out-stock'
                          }
                        >

                          {category.isActive !== false
                            ? 'Active'
                            : 'Inactive'}

                        </span>

                      </td>


                      <td>

                        <div className="product-actions">

                          <button
                            type="button"
                            className="edit-button"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                          >
                            ✏️
                          </button>


                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              deleteCategory(
                                category._id
                              )
                            }
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


      {/* MODAL */}

      {showModal && (

        <div className="modal-overlay">

          <div className="product-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingCategory
                    ? 'Edit Category'
                    : 'Add Category'}
                </h2>

                <p>
                  Enter category information below.
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


            <form
              onSubmit={handleSubmit}
            >

              <div className="form-grid">

                {/* NAME */}

                <div className="product-form-group full-width">

                  <label>
                    Category Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. Fruits"
                  />

                </div>


                {/* IMAGE */}

                <div className="product-form-group full-width">

                  <label>
                    Category Image
                    {!editingCategory &&
                      ' *'}
                  </label>

                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={
                      handleImageChange
                    }
                  />


                  {formData.image && (

                    <div className="image-preview">

                      <img
                        src={
                          formData.image instanceof File
                            ? URL.createObjectURL(
                                formData.image
                              )
                            : getImageUrl(
                                formData.image
                              )
                        }
                        alt="Category Preview"
                      />

                      <p>

                        {formData.image instanceof File
                          ? formData.image.name
                          : 'Current category image'}

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
                    placeholder="Category description..."
                    rows="4"
                  />

                </div>

              </div>


              {/* ERROR */}

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
                    : editingCategory
                    ? 'Update Category'
                    : 'Add Category'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Categories;