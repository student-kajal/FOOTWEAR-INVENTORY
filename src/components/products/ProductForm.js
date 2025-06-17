import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const genderOptions = [
  { value: 'gents', label: 'Gents' },
  { value: 'ladies', label: 'Ladies' },
  { value: 'kids_gents', label: 'Kids Gents' },
  { value: 'kids_ladies', label: 'Kids Ladies' },
];
const stockTypeOptions = [
  { value: 'pu', label: 'PU' },
  { value: 'eva', label: 'EVA' },
  { value: 'new', label: 'New' },
];

const initialForm = {
  article: '',
  image: null,
  stockType: '',
  gender: '',
  mrp: '',
  rate: '',
  pairPerCarton: '',
  series: '',
  size: '',
  color: '',
  createdBy: localStorage.getItem('userName') || '',
  cartons: '',
};

const ProductForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [manualSize, setManualSize] = useState(false);
  const [manualColor, setManualColor] = useState(false);
  const [freeze, setFreeze] = useState({
    stockType: false,
    image: false,
    series: false,
    pairPerCarton: false,
    mrp: false,
    rate: false,
  });
  const [articleSizes, setArticleSizes] = useState([]);
  const [articleColors, setArticleColors] = useState([]);
  const [allSizes, setAllSizes] = useState([]);
  const [allColors, setAllColors] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  // Reliable image preview for both File and backend image path
  useEffect(() => {
  //  useEffect(() => {
  if (form.image instanceof File) {
    setImagePreview(URL.createObjectURL(form.image));
    console.log('Image is a File:', form.image);
  } else if (typeof form.image === 'string') {
    const previewUrl = `${process.env.REACT_APP_API_BASE_URL || ''}${form.image}`;
    setImagePreview(previewUrl);
    console.log('Image path from backend:', form.image);
    console.log('Preview URL:', previewUrl);
  } else {
    setImagePreview(null);
    console.log('No image available');
  }
}, [form.image]);

  // StockType freeze on article select + fetch suggestions
  useEffect(() => {
    if (form.article) {
      api.get(`/products/smart-article-info?article=${form.article}`)
        .then(res => {
          const data = res.data.data || {};
          setForm(f => ({ ...f, stockType: data.stockType || '' }));
          setFreeze(f => ({ ...f, stockType: !!data.stockType }));
        })
        .catch(() => {
          setFreeze(f => ({ ...f, stockType: false }));
          setForm(f => ({ ...f, stockType: '' }));
        });

      api.get(`/products/article-options?article=${form.article}`)
        .then(res => {
          setArticleSizes(res.data.sizes || []);
          setArticleColors(res.data.colors || []);
        });
      api.get(`/products/suggestions?field=size`).then(res => setAllSizes(res.data.data || []));
      api.get(`/products/suggestions?field=color`).then(res => setAllColors(res.data.data || []));
    } else {
      setForm(f => ({ ...f, stockType: '' }));
      setFreeze(f => ({ ...f, stockType: false }));
      setArticleSizes([]);
      setArticleColors([]);
      setAllSizes([]);
      setAllColors([]);
    }
  }, [form.article]);

  // Gender select → Freeze image + series + pairPerCarton
  // useEffect(() => {
  //   if (form.article && form.gender) {
  //     api.get(`/products/article-gender-info?article=${form.article}&gender=${form.gender}`)
  //       .then(res => {
  //         const data = res.data?.data || {};
  //         setForm(f => ({
  //           ...f,
  //           image: data.image || null,
  //           pairPerCarton: data.pairPerCarton || '',
  //           series: data.series || '',
  //         }));
  //         setFreeze(f => ({
  //           ...f,
  //           image: !!data.image,
  //           pairPerCarton: !!data.pairPerCarton,
  //           series: !!data.series,
  //         }));
  //       })
  //       .catch(() => {
  //         setFreeze(f => ({
  //           ...f,
  //           image: false,
  //           pairPerCarton: false,
  //           series: false
  //         }));
  //         setForm(f => ({
  //           ...f,
  //           image: null,
  //           pairPerCarton: '',
  //           series: ''
  //         }));
  //       });
  //   }
  // }, [form.article, form.gender]);
// useEffect(() => {
//   if (form.article && form.gender) {
//     api.get(`/products/article-gender-info?article=${form.article}&gender=${form.gender}`)
//       .then(res => {
//         const data = res.data?.data || {};
//         setForm(f => ({
//           ...f,
//           image: data.image ?? null,  // ✅ Use nullish coalescing
//           pairPerCarton: data.pairPerCarton ?? '', // ✅ 0 को preserve करने के लिए
//           series: data.series ?? '',
//         }));
//         setFreeze(f => ({
//           ...f,
//           image: data.image !== null, // ✅ Check for null
//           pairPerCarton: data.pairPerCarton !== null, // ✅ 0 होने पर भी true
//           series: data.series !== null // ✅ empty string होने पर भी true
//         }));
//       })
//       .catch(() => {
//         setFreeze(f => ({
//           ...f,
//           image: false,
//           pairPerCarton: false,
//           series: false
//         }));
//         setForm(f => ({
//           ...f,
//           image: null,
//           pairPerCarton: '',
//           series: ''
//         }));
//       });
//   }
// }, [form.article, form.gender]);
useEffect(() => {
  if (form.article && form.gender) {
    api.get(`/products/article-gender-info?article=${form.article}&gender=${form.gender}`)
      .then(res => {
        // अगर product नहीं मिला (success:false या data:null), तो fields unfreeze करो
        if (!res.data.success || !res.data.data) {
          setForm(f => ({
            ...f,
            image: null,
            pairPerCarton: '',
            series: '',
          }));
          setFreeze(f => ({
            ...f,
            image: false,
            pairPerCarton: false,
            series: false,
          }));
          return;
        }
        // अगर product मिला, तभी freeze करो
        const data = res.data.data;
        setForm(f => ({
          ...f,
          image: data.image ?? null,
          pairPerCarton: data.pairPerCarton ?? '',
          series: data.series ?? '',
        }));
        setFreeze(f => ({
          ...f,
          image: !!data.image,
          pairPerCarton: !!data.pairPerCarton,
          series: !!data.series,
        }));
      })
      .catch(() => {
        setFreeze(f => ({
          ...f,
          image: false,
          pairPerCarton: false,
          series: false,
        }));
        setForm(f => ({
          ...f,
          image: null,
          pairPerCarton: '',
          series: '',
        }));
      });
  }
}, [form.article, form.gender]);


  // Size select → Freeze MRP and Rate
  useEffect(() => {
    if (form.article && form.gender && form.size) {
      api.get(`/products/article-gender-size-info?article=${form.article}&gender=${form.gender}&size=${form.size}`)
        .then(res => {
          const data = res.data?.data || {};
          setForm(f => ({
            ...f,
            mrp: data.mrp || '',
            rate: data.rate || '',
          }));
          setFreeze(f => ({
            ...f,
            mrp: !!data.mrp,
            rate: !!data.rate,
          }));
        })
        .catch(() => {
          setForm(f => ({
            ...f,
            mrp: '',
            rate: '',
          }));
          setFreeze(f => ({
            ...f,
            mrp: false,
            rate: false,
          }));
        });
    }
  }, [form.article, form.gender, form.size]);

  // Input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm(f => ({ ...f, image: files[0] }));
    } else if (name === 'cartons' || name === 'pairPerCarton') {
      const cleanValue = value.replace(/[^0-9]/g, '');
      setForm(f => ({ ...f, [name]: cleanValue }));
    } else if (name === 'series') {
    // Allow lowercase input but convert to uppercase
    const upperValue = value.toUpperCase();
    if (upperValue === "MANUAL" || upperValue === "M") {
      setForm(f => ({ ...f, [name]: upperValue }));
    } else {
      // Allow lowercase letters in input, then convert to uppercase
     // const cleanSeries = value.replace(/[^a-zA-Z0-9]/g, ''); // Allow a-z, A-Z, 0-9
     const cleanSeries = value.replace(/[^a-zA-Z0-9\s]/g, ''); // Allow a-z, A-Z, 0-9, and spaces
setForm(f => ({ ...f, [name]: cleanSeries.toUpperCase() }));

      setForm(f => ({ ...f, [name]: cleanSeries.toUpperCase() }));
    }}
     else if (name === 'color' || name === 'article' || name === 'createdBy') {
    // Always convert color, article, series, createdBy to uppercase
    setForm(f => ({ ...f, [name]: value.toUpperCase() }));
  }else if (name === 'size' && manualSize) {
    // Only allow numbers and 'x' for size, no negative/decimal
    const cleanSize = value.replace(/[^0-9xX]/g, '');
    setForm(f => ({ ...f, [name]: cleanSize }));
  }
 
  else {
    setForm(f => ({ ...f, [name]: value }));
  }
};

  // Size dropdown change
  const handleSizeChange = (e) => {
    if (e.target.value === '__manual') {
      setManualSize(true);
      setForm(f => ({ ...f, size: '' }));
    } else {
      setManualSize(false);
      setForm(f => ({ ...f, size: e.target.value }));
    }
  };

  // Color dropdown change (convert selected color to uppercase)
  const handleColorChange = (e) => {
    if (e.target.value === '__manual') {
      setManualColor(true);
      setForm(f => ({ ...f, color: '' }));
    } else {
      setManualColor(false);
      setForm(f => ({ ...f, color: e.target.value.toUpperCase() }));
    }
  };

  // Dropdown render (article > manual > rest of DB)
  const renderDropdown = (name, articleOptions, allOptions, handleDropdownChange) => {
    const restOptions = allOptions.filter(opt => !articleOptions.includes(opt));
    return (
      <select
        className="form-select"
        name={name}
        value={form[name]}
        onChange={handleDropdownChange}
        required
      >
        <option value="">Select {name.charAt(0).toUpperCase() + name.slice(1)}</option>
        {articleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        <option value="__manual">Other (Manual Entry)</option>
        {restOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (manualSize && !form.size.trim()) {
      toast.error('Please enter size');
      return;
    }
    if (manualColor && !form.color.trim()) {
      toast.error('Please enter color');
      return;
    }
    if (
      !form.cartons ||
      !form.pairPerCarton ||
      isNaN(form.cartons) ||
      isNaN(form.pairPerCarton) ||
      parseInt(form.cartons, 10) <= 0 ||
      parseInt(form.pairPerCarton, 10) <= 0
    ) {
      toast.error('Cartons and Pair/Carton must be positive integers');
      return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'image' && !v) return;
      fd.append(k, v);
    });
    try {
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Product added!');
      navigate('/products');
    } catch (err) {
      toast.error('Failed to add product');
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Article */}
          <div className="mb-3">
            <label className="form-label">Article Name</label>
            <input
              type="text"
              className="form-control"
              name="article"
              value={form.article}
              onChange={handleChange}
              required
            />
          </div>
          {/* Stock Type */}
          <div className="mb-3">
            <label className="form-label">Stock Type</label>
            <select
              className="form-select"
              name="stockType"
              value={form.stockType}
              onChange={handleChange}
              disabled={freeze.stockType}
              required
            >
              <option value="">Select Stock Type</option>
              {stockTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Gender */}
          <div className="mb-3">
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              {genderOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Image Upload */}
          <div className="mb-3">
            <label className="form-label">Product Image</label>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="img-thumbnail"
                  style={{ maxHeight: '120px' }}
                  onError={e => (e.target.style.display = 'none')}
                />
              </div>
            )}
            <input
              type="file"
              className="form-control mt-2"
              name="image"
              accept="image/*"
              onChange={handleChange}
              disabled={freeze.image}
            />
          </div>
          {/* Pair/Carton */}
          <div className="mb-3">
            <label className="form-label">Pair/Carton</label>
            <input
              type="number"
              className="form-control"
              name="pairPerCarton"
              value={form.pairPerCarton}
              onChange={handleChange}
              disabled={freeze.pairPerCarton}
              required
              min="1"
              step="1"
            />
          </div>
          {/* Series */}
          <div className="mb-3">
            <label className="form-label">Series</label>
            <input
              type="text"
              className="form-control"
              name="series"
              value={form.series}
              onChange={handleChange}
              disabled={freeze.series}
              required
            />
          </div>
          {/* Size */}
          <div className="mb-3">
            <label className="form-label">Size</label>
            {!manualSize
              ? renderDropdown('size', articleSizes, allSizes, handleSizeChange)
              : (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter Size"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  required
                />
              )}
          </div>
          {/* Color */}
          <div className="mb-3">
            <label className="form-label">Color</label>
            {!manualColor
              ? renderDropdown('color', articleColors, allColors, handleColorChange)
              : (
                <input
                  type="text"
                  className="form-control mt-2"
                  placeholder="Enter Color"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  required
                />
              )}
          </div>
          {/* MRP */}
          <div className="mb-3">
            <label className="form-label">MRP</label>
            <input
              type="number"
              className="form-control"
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
              disabled={freeze.mrp}
              required
              min="1"
              step="1"
            />
          </div>
          {/* Rate */}
          <div className="mb-3">
            <label className="form-label">Rate</label>
            <input
              type="number"
              className="form-control"
              name="rate"
              value={form.rate}
              onChange={handleChange}
              disabled={freeze.rate}
              required
              min="1"
              step="1"
            />
          </div>
          {/* Created By */}
          <div className="mb-3">
            <label className="form-label">Created By</label>
            <input
              type="text"
              className="form-control"
              name="createdBy"
              value={form.createdBy}
              onChange={handleChange}
              required
            />
          </div>
          {/* Cartons */}
          <div className="mb-3">
            <label className="form-label">No. of Cartons</label>
            <input
              type="number"
              className="form-control"
              name="cartons"
              value={form.cartons}
              onChange={handleChange}
              required
              min="1"
              step="1"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Save Product
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
