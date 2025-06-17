import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const SearchBar = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    className="form-control mb-3"
    placeholder={placeholder || "Search by any property..."}
    value={value}
    onChange={onChange}
    style={{ maxWidth: 350 }}
  />
);

const CheckboxFilter = ({ label, options, selected, onChange, name }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown" style={{ maxWidth: 200 }}>
      <button
        className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? `All ${label}` : `${label} (${selected.length})`}
      </button>
      {isOpen && (
        <div className="dropdown-menu show w-100" style={{ maxHeight: 200, overflowY: 'auto' }}>
          <div className="px-3 py-1">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selected.length === 0}
                onChange={() => onChange(name, [])}
              />
              <span className="form-check-label">All {label}</span>
            </label>
          </div>
          {options.map(option => (
            <div key={option} className="px-3 py-1">
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange(name, [...selected, option]);
                    } else {
                      onChange(name, selected.filter(item => item !== option));
                    }
                  }}
                />
                <span className="form-check-label">{option}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductListTable = ({ products, loading, title, onRefresh }) => {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    size: [], color: [], gender: [],
    article: [], stockType: [], pairPerCarton: [],
    mrp: [], rate: [], series: []
  });
  const [matrixExportType, setMatrixExportType] = useState("withoutImage");
  //const [pdfExportType, setPdfExportType] = useState("withImage");
  const [pdfExportType, setPdfExportType] = useState("withImage");

  const handleFilterChange = (name, value) => {
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const uniqueSizes = [...new Set(products.map(p => p.size).filter(Boolean))];
  const uniqueColors = [...new Set(products.map(p => p.color).filter(Boolean))];
  const uniqueGenders = [...new Set(products.map(p => p.gender).filter(Boolean))];
  const uniqueArticles = [...new Set(products.map(p => p.article).filter(Boolean))];
  const uniqueStockTypes = [...new Set(products.map(p => p.stockType).filter(Boolean))];
  const uniquePairPerCartons = [...new Set(products.map(p => p.pairPerCarton).filter(Boolean))];
  const uniqueMRPs = [...new Set(products.map(p => p.mrp).filter(Boolean))];
  const uniqueRates = [...new Set(products.map(p => p.rate).filter(Boolean))];
  const uniqueSeries = [...new Set(products.map(p => p.series).filter(Boolean))];


  // const groupedProducts = useMemo(() => {
  //   const filtered = products.filter(p => {
  //     const matchesSearch = [
  //       p.article, p.stockType, p.gender, p.color, p.size, p.series,
  //       p.pairPerCarton?.toString(), p.createdBy, p.mrp?.toString(), p.rate?.toString()
  //     ].join(' ').toLowerCase().includes(search.toLowerCase());

  //     const matchesFilters =
  //       (filter.size.length === 0 || filter.size.includes(p.size)) &&
  //       (filter.color.length === 0 || filter.color.includes(p.color)) &&
  //       (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
  //       (filter.article.length === 0 || filter.article.includes(p.article)) &&
  //       (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
  //       (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
  //       (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
  //       (filter.rate.length === 0 || filter.rate.includes(String(p.rate))) &&
  //       (filter.series.length === 0 || filter.series.includes(p.series));
  //     return matchesSearch && matchesFilters;
  //   });

  //   const groups = {};
  //   filtered.forEach(product => {
  //     const key = `${product.article}-${product.gender}`;
  //     if (!groups[key]) groups[key] = [];
  //     groups[key].push(product);
  //   });
  //   return groups;
  // }, [products, search, filter]);
const groupedProducts = useMemo(() => {
  const filtered = products.filter(p => {
    const matchesSearch = [
      p.article, p.stockType, p.gender, p.color, p.size, p.series,
      p.pairPerCarton?.toString(), p.createdBy, p.mrp?.toString(), p.rate?.toString()
    ].join(' ').toLowerCase().includes(search.toLowerCase());

    const matchesFilters =
      (filter.size.length === 0 || filter.size.includes(p.size)) &&
      (filter.color.length === 0 || filter.color.includes(p.color)) &&
      (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
      (filter.article.length === 0 || filter.article.includes(p.article)) &&
      (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
      (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
      (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
      (filter.rate.length === 0 || filter.rate.includes(String(p.rate))) &&
      (filter.series.length === 0 || filter.series.includes(p.series));
    return matchesSearch && matchesFilters;
  });

  const groups = {};
  filtered.forEach(product => {
    const key = `${product.article}-${product.gender}`;
    if (!groups[key]) {
      groups[key] = {
        article: product.article,
        gender: product.gender,
        image: null, // ✅ Group level image property
        variants: []
      };
    }
    
    // ✅ Agar kisi bhi variant mein image hai, to group ki image set karo
    if (!groups[key].image && product.image) {
      groups[key].image = product.image;
    }
    
    groups[key].variants.push(product);
  });
  return groups;
}, [products, search, filter]);

  // const filteredProducts = useMemo(() => {
  //   return Object.values(groupedProducts).flat();
  // }, [groupedProducts]);
const filteredProducts = useMemo(() => {
  return Object.values(groupedProducts).flatMap(group => group.variants);
}, [groupedProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.post('/products/bulk-delete', {
        ids: [id],
        updatedByName: "admin"
      });
      toast.success('Product deleted successfully!');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelected(prev => prev.length === filteredProducts.length ? [] : filteredProducts.map(p => p._id));
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} selected products?`)) return;
    try {
      await api.post('/products/bulk-delete', {
        ids: selected,
        updatedByName: "admin"
      });
      toast.success(`${selected.length} products deleted!`);
      setSelected([]);
      onRefresh?.();
    } catch (err) {
      toast.error('Bulk delete failed');
    }
  };

  

  const getImageBase64 = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const handleExportMatrixExcel = async () => {
    const exportRows = selected.length > 0
      ? filteredProducts.filter(p => selected.includes(p._id))
      : filteredProducts;

    const allSizes = [...new Set(exportRows.map(p => p.size).filter(Boolean))].sort((a, b) => {
      return isNaN(a) || isNaN(b) ? a.localeCompare(b) : Number(a) - Number(b);
    });

    const articles = {};
    exportRows.forEach(p => {
      if (!articles[p.article]) articles[p.article] = [];
      articles[p.article].push(p);
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Stock Matrix");

    let headerRow;
    if (matrixExportType === "withImage") {
      headerRow = ["Article", "Image", ...allSizes];
    } else {
      headerRow = ["Article", ...allSizes];
    }
    ws.addRow(headerRow);
    ws.getRow(1).font = { bold: true };

    let rowNum = 2;

    const articleImages = {};
    if (matrixExportType === "withImage") {
      const imagePromises = Object.entries(articles).map(async ([article, items]) => {
        const imgProduct = items.find(i => !!i.image);
        if (imgProduct && imgProduct.image) {
          let ext = "png";
          if (imgProduct.image.includes(".jpg") || imgProduct.image.includes(".jpeg")) ext = "jpeg";
          if (imgProduct.image.includes(".webp")) ext = "webp";
          if (imgProduct.image.includes(".gif")) ext = "gif";
          const base64 = await getImageBase64(imgProduct.image);
          if (base64) {
            articleImages[article] = { base64, ext };
          }
        }
      });
      await Promise.all(imagePromises);
    }

    Object.entries(articles).forEach(([article, items]) => {
      let imageId = null;
      if (matrixExportType === "withImage" && articleImages[article]) {
        imageId = wb.addImage({
          base64: `data:image/${articleImages[article].ext};base64,${articleImages[article].base64}`,
          extension: articleImages[article].ext,
        });
        ws.addRow([article, "", ...allSizes.map(() => "")]);
        ws.getRow(rowNum).font = { bold: true };
        ws.addImage(imageId, {
          tl: { col: 1, row: rowNum - 1 },
          ext: { width: 40, height: 40 }
        });
        ws.getRow(rowNum).height = 32;
      } else {
        ws.addRow([article, ...allSizes.map(() => "")]);
        ws.getRow(rowNum).font = { bold: true };
      }
      rowNum++;

      const colors = [...new Set(items.map(i => i.color).filter(Boolean))];
      colors.forEach(color => {
        const row = matrixExportType === "withImage" ? [color, ...allSizes.map(() => "")] : [color, ...allSizes.map(() => "")];
        allSizes.forEach((size, idx) => {
          const found = items.find(i => i.color === color && i.size === size);
          row[matrixExportType === "withImage" ? idx + 2 : idx + 1] = found ? (found.cartons || 0) : "";
        });
        ws.addRow(row);
        rowNum++;
      });

      ws.addRow(matrixExportType === "withImage" ? Array(allSizes.length + 2).fill("") : Array(allSizes.length + 1).fill(""));
      rowNum++;
    });

    ws.columns.forEach(col => { col.width = 16; });

    wb.xlsx.writeBuffer().then(buffer => {
      saveAs(new Blob([buffer]), "Stock-Matrix-Export.xlsx");
    });
  };
// State add karein
const [showRate, setShowRate] = useState(false); 
const [showMRP, setShowMRP] = useState(true);  // ✅ MRP default true


// const handleGeneratePDF = async () => {
//   let idsToExport = [];
//   let additionalImageIds = [];

//   if (selected.length > 0) {
//     idsToExport = selected;
//     const selectedGroups = {};
//     const selectedProducts = filteredProducts.filter(p => selected.includes(p._id));
//     selectedProducts.forEach(p => {
//       const groupKey = `${p.article}-${p.gender}`;
//       if (!selectedGroups[groupKey]) {
//         const groupProducts = Object.values(groupedProducts)
//           .flat()
//           .filter(gp => gp.article === p.article && gp.gender === p.gender);
//         const imageProduct = groupProducts.find(gp => gp.image);
//         if (imageProduct && !selected.includes(imageProduct._id)) {
//           additionalImageIds.push(imageProduct._id);
//         }
//         selectedGroups[groupKey] = true;
//       }
//     });
//     idsToExport = [...selected, ...additionalImageIds];
//   } else {
//     idsToExport = filteredProducts.map(p => p._id);
//   }

//   if (idsToExport.length === 0) {
//     alert('कृपया कम से कम 1 प्रोडक्ट चुनें');
//     return;
//   }

//   // Group-level image check for "with image" PDF
//   if (pdfExportType === "withImage" && selected.length > 0) {
//     const missingImageGroups = [];
//     const selectedGroupKeys = [...new Set(
//       filteredProducts.filter(p => selected.includes(p._id))
//         .map(p => `${p.article}-${p.gender}`)
//     )];
//     selectedGroupKeys.forEach(key => {
//       const group = groupedProducts[key];
//       if (!group || !group.image) {
//         missingImageGroups.push(key.split('-')[0]);
//       }
//     });
//     if (missingImageGroups.length > 0) {
//       alert(`Warning: These articles have no images - ${[...new Set(missingImageGroups)].join(', ')}`);
//       return;
//     }
//   }

//   try {
//     const response = await api.post('/pdf/generate-pdf', {
//       productIds: idsToExport,
//       includeImages: pdfExportType === "withImage",
//       showRate: showRate,
//       showMRP: showMRP,
//       filters: {}
//     }, { responseType: 'blob' });
//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', 'selected-products.pdf');
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   } catch (err) {
//     console.error('PDF Error:', err);
//     alert('PDF डाउनलोड नहीं हो पाया');
//   }
// };
const handleGeneratePDF = async () => {
  let idsToExport = [];
  let additionalImageIds = [];

  if (selected.length > 0) {
    idsToExport = selected;
    
    // ✅ Selected products ke groups mein image wale products add karo
    const selectedGroups = {};
    const selectedProducts = filteredProducts.filter(p => selected.includes(p._id));
    
    selectedProducts.forEach(p => {
      const groupKey = `${p.article}-${p.gender}`;
      if (!selectedGroups[groupKey]) {
        // ✅ Group ke kisi bhi variant mein image hai to usko add karo
        const group = groupedProducts[groupKey];
        if (group && group.variants) {
          const imageProduct = group.variants.find(v => v.image);
          if (imageProduct && !selected.includes(imageProduct._id)) {
            additionalImageIds.push(imageProduct._id);
          }
        }
        selectedGroups[groupKey] = true;
      }
    });
    
    idsToExport = [...selected, ...additionalImageIds];
  } else {
    idsToExport = filteredProducts.map(p => p._id);
  }

  if (idsToExport.length === 0) {
    alert('कृपया कम से कम 1 प्रोडक्ट चुनें');
    return;
  }

  // ✅ Image check logic fix
  if (pdfExportType === "withImage" && selected.length > 0) {
    const missingImageGroups = [];
    const selectedGroupKeys = [...new Set(
      filteredProducts.filter(p => selected.includes(p._id))
        .map(p => `${p.article}-${p.gender}`)
    )];
    
    selectedGroupKeys.forEach(key => {
      const group = groupedProducts[key];
      // ✅ Group mein kisi bhi variant mein image nahi hai
      const hasImage = group && group.variants && group.variants.some(v => v.image);
      if (!hasImage) {
        missingImageGroups.push(group?.article || key.split('-')[0]);
      }
    });
    
    if (missingImageGroups.length > 0) {
      alert(`Warning: These articles have no images - ${[...new Set(missingImageGroups)].join(', ')}`);
      return;
    }
  }

  try {
    const response = await api.post('/pdf/generate-pdf', {
      productIds: idsToExport,
      includeImages: pdfExportType === "withImage",
      showRate: showRate,
      showMRP: showMRP,
      filters: {}
    }, { responseType: 'blob' });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected-products.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error('PDF Error:', err);
    alert('PDF डाउनलोड नहीं हो पाया');
  }
};


// const renderTableRows = () => {
//   const rows = [];
//   const groupEntries = Object.entries(groupedProducts); // Group entries निकालो

//   groupEntries.forEach(([groupKey, groupProducts], groupIndex) => {
//     groupProducts.forEach((product, index) => {
//       const isFirstInGroup = index === 0;
//       const groupSize = groupProducts.length;

//       rows.push(
//         <tr key={product._id}>
//           <td>
//             <input
//               type="checkbox"
//               checked={selected.includes(product._id)}
//               onChange={() => handleSelect(product._id)}
//             />
//           </td>
          
//           {isFirstInGroup && (
//             <td rowSpan={groupSize} className="text-center align-middle bg-light border-span">
//               <strong>{product.article}</strong>
//             </td>
//           )}
          
//           {isFirstInGroup && (
//             <td rowSpan={groupSize} className="text-center align-middle border-span">
//               {product.gender}
//             </td>
//           )}
          
//           {isFirstInGroup && (
//             <td rowSpan={groupSize} className="text-center align-middle border-span">
//               {(() => {
//                 const imageProduct = groupProducts.find(p => p.image) || product;
//                 return imageProduct.image ? (
//                   <img 
//                     src={imageProduct.image} 
//                     alt={product.article}
//                     className="product-image"
//                   />
//                 ) : (
//                   <div className="no-image">No Image</div>
//                 );
//               })()}
//             </td>
//           )}
          
//           {isFirstInGroup && (
//             <td rowSpan={groupSize} className="text-center align-middle border-span">
//               {product.series || '-'}
//             </td>
//           )}
          
//           {isFirstInGroup && (
//             <td rowSpan={groupSize} className="text-center align-middle border-span">
//               {product.stockType}
//             </td>
//           )}
          
//           <td className="text-center">₹{product.mrp}</td>
//           <td className="text-center">₹{product.rate}</td>
//           <td>{product.color}</td>
//           <td>{product.size}</td>
//           <td>{product.cartons}</td>
//           <td>{product.pairPerCarton}</td>
//           <td>{product.totalPairs || (product.cartons * product.pairPerCarton)}</td>
//           <td>{product.createdBy || '-'}</td>
          
//           <td>
//             <Link to={`/products/edit/${product._id}`} className="btn btn-sm btn-warning me-2">
//               Edit
//             </Link>
//             <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product._id)}>
//               Delete
//             </button>
//           </td>
//         </tr>
//       );
//     });

//     // 👉 हर group के बाद bold separator row डालो (last group को छोड़कर)
//     if (groupIndex < groupEntries.length - 1) {
//       rows.push(
//         <tr key={`separator-${groupKey}`}>
//           <td colSpan="15" style={{
//             borderBottom: '2px solid #222',
//             background: '#eee',
//            /* height: '0.5rem',*/
//             padding: 0
//           }}></td>
//         </tr>
//       );
//     }
//   });

//   return rows;
// };
const renderTableRows = () => {
  const rows = [];
  const groupEntries = Object.entries(groupedProducts);

  groupEntries.forEach(([groupKey, group], groupIndex) => {
    group.variants.forEach((product, index) => {
      const isFirstInGroup = index === 0;
      const groupSize = group.variants.length;
      const stock = product.totalPairs || (product.cartons * product.pairPerCarton);

      let rowClass = '';
      if (stock === 0) rowClass = 'zero-stock-row';
      else if (stock > 0 && stock <= 5) rowClass = 'low-stock-row';

      rows.push(
        <tr key={product._id} className={rowClass}>
          <td className={rowClass}>
            <input
              type="checkbox"
              checked={selected.includes(product._id)}
              onChange={() => handleSelect(product._id)}
            />
          </td>

          {isFirstInGroup && (
            <td rowSpan={groupSize} className={`text-center align-middle bg-light border-span ${rowClass}`}>
              <strong>{group.article}</strong>
            </td>
          )}

          {isFirstInGroup && (
            <td rowSpan={groupSize} className={`text-center align-middle border-span ${rowClass}`}>
              {group.gender}
            </td>
          )}

          {isFirstInGroup && (
            <td rowSpan={groupSize} className={`text-center align-middle border-span ${rowClass}`}>
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.article}
                  className="product-image"
                />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </td>
          )}

          {isFirstInGroup && (
            <td rowSpan={groupSize} className={`text-center align-middle border-span ${rowClass}`}>
              {product.series || '-'}
            </td>
          )}

          {isFirstInGroup && (
            <td rowSpan={groupSize} className={`text-center align-middle border-span ${rowClass}`}>
              {product.stockType}
            </td>
          )}

          <td className={`text-center ${rowClass}`}>₹{product.mrp}</td>
          <td className={`text-center ${rowClass}`}>₹{product.rate}</td>
          <td className={rowClass}>{product.color}</td>
          <td className={rowClass}>{product.size}</td>
          <td className={rowClass}>{product.cartons}</td>
          <td className={rowClass}>{product.pairPerCarton}</td>
          <td className={rowClass}>{stock}</td>
          <td className={rowClass}>{product.createdBy || '-'}</td>

          <td className={rowClass}>
            <Link to={`/products/edit/${product._id}`} className="btn btn-sm btn-warning me-2">
              Edit
            </Link>
            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product._id)}>
              Delete
            </button>
          </td>
        </tr>
      );
    });

    // Separator row between groups
    if (groupIndex < groupEntries.length - 1) {
      rows.push(
        <tr key={`separator-${groupKey}`}>
          <td colSpan="15" style={{
            borderBottom: '2px solid #222',
            background: '#eee',
            padding: 0
          }}></td>
        </tr>
      );
    }
  });

  return rows;
};


  return (
    <div className="container py-3">
      <style jsx>{`
        .bg-light {
          background-color: #f8f9fa !important;
        }
        .align-middle {
          vertical-align: middle !important;
        }
        .border-span {
          background-color: #e3f2fd !important;
          border-left: 3px solid #2196f3 !important;
          font-weight: 500;
        }
        .product-image {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          border: 2px solid #ddd;
        }
        .no-image {
          color: #6c757d;
          font-style: italic;
          padding: 20px 10px;
        }
        .dropdown-menu.show {
          display: block;
          position: absolute;
          z-index: 1000;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .form-check {
          display: block;
          min-height: 1.5rem;
          padding-left: 1.5em;
          margin-bottom: 0.125rem;
        }
        .form-check-input {
          margin-left: -1.5em;
          margin-top: 0.25em;
        }
        .form-check-label {
          cursor: pointer;
        }
          
      `}</style>

      {title && <h2 className="mb-4">{title}</h2>}

      <SearchBar
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by article, color, size, series, etc."
      />

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <CheckboxFilter
          label="Sizes"
          options={uniqueSizes}
          selected={filter.size}
          onChange={handleFilterChange}
          name="size"
        />
        <CheckboxFilter
          label="Colors"
          options={uniqueColors}
          selected={filter.color}
          onChange={handleFilterChange}
          name="color"
        />
        <CheckboxFilter
          label="Genders"
          options={uniqueGenders}
          selected={filter.gender}
          onChange={handleFilterChange}
          name="gender"
        />
        <CheckboxFilter
          label="Articles"
          options={uniqueArticles}
          selected={filter.article}
          onChange={handleFilterChange}
          name="article"
        />
        <CheckboxFilter
          label="Stock Types"
          options={uniqueStockTypes}
          selected={filter.stockType}
          onChange={handleFilterChange}
          name="stockType"
        />
        <CheckboxFilter
          label="Pair/Carton"
          options={uniquePairPerCartons.map(String)}
          selected={filter.pairPerCarton}
          onChange={handleFilterChange}
          name="pairPerCarton"
        />
        <CheckboxFilter
          label="MRP"
          options={uniqueMRPs.map(String)}
          selected={filter.mrp}
          onChange={handleFilterChange}
          name="mrp"
        />
        <CheckboxFilter
          label="Rates"
          options={uniqueRates.map(String)}
          selected={filter.rate}
          onChange={handleFilterChange}
          name="rate"
        />
        <CheckboxFilter
          label="Series"
          options={uniqueSeries}
          selected={filter.series}
          onChange={handleFilterChange}
          name="series"
        />
      </div>
<div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
  {/* Bulk Actions */}
  <button className="btn btn-danger" onClick={handleBulkDelete} disabled={selected.length === 0}>
    Bulk Delete ({selected.length})
  </button>
  <Link to="/products/deleted" className="btn btn-success">View Deleted</Link>

  {/* Excel Export */}
  <div className="d-flex gap-2">
    <select
      className="form-select"
      style={{ width: '220px' }}
      value={matrixExportType}
      onChange={e => setMatrixExportType(e.target.value)}
    >
      <option value="withoutImage">Excel (No Image)</option>
      <option value="withImage">Excel (With Image)</option>
    </select>
    <button className="btn btn-outline-success" onClick={handleExportMatrixExcel}>
      Export Excel
    </button>
  </div>

  {/* PDF Export */}
  <div className="d-flex gap-2">
    <select
      className="form-select"
      style={{ width: '220px' }}
      value={pdfExportType}
      onChange={e => setPdfExportType(e.target.value)}
    >
      <option value="withImage">PDF (With Image)</option>
      <option value="withoutImage">PDF (No Image)</option>
    </select>
    <button 
      className="btn btn-outline-primary" 
      onClick={handleGeneratePDF}
     // disabled={selected.length === 0}
    >
      Export PDF 
    </button>
  </div>

  {/* Display Options */}
  <div className="d-flex gap-3 ps-2 border-start">
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        id="showRate"
        checked={showRate}
        onChange={e => setShowRate(e.target.checked)}
      />
      <label className="form-check-label small" htmlFor="showRate">
        Show Rate
      </label>
    </div>
    <div className="form-check">
      <input
        type="checkbox"
        className="form-check-input"
        id="showMRP"
        checked={showMRP}
        onChange={e => setShowMRP(e.target.checked)}
      />
      <label className="form-check-label small" htmlFor="showMRP">
        Show MRP
      </label>
    </div>
  </div>
</div>
{/* Zero Stock Items Card
<div className="card mb-3">
  <div className="card-header bg-warning">
    <strong>Zero Stock Items</strong>
  </div>
  <div className="card-body">
    {zeroStockProducts.length === 0 ? (
      <div className="text-center py-2 text-muted">No zero stock items found</div>
    ) : (
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th>Article</th>
              <th>Color</th>
              <th>Size</th>
              <th>Cartons</th>
              <th>Pair/Carton</th>
            </tr>
          </thead>
          <tbody>
            {zeroStockProducts.map(p => (
              <tr key={p._id}>
                <td>{p.article}</td>
                <td>{p.color}</td>
                <td>{p.size}</td>
                <td>{p.cartons}</td>
                <td>{p.pairPerCarton}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div> */}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">Loading...</div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <div className="text-center py-5 text-muted">No products found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selected.length > 0 && selected.length === filteredProducts.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Article</th>
                    <th>Gender</th>
                    <th>Image</th>
                    <th>Series</th>
                    <th>Stock Type</th>
                    <th>MRP</th>
                    <th>Rate</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Cartons</th>
                    <th>Pair/Carton</th>
                    <th>Total Pairs</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListTable;
