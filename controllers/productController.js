const Product = require('../models/Product');
const { exportToExcel, importFromExcel } = require('../utils/excel');
const multer = require('multer');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

// ========================
// Core CRUD Operations
// ========================

// 1. Get Single Product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Update Product by ID
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {
      ...req.body,
      cartons: Number(req.body.cartons),
      pairPerCarton: Number(req.body.pairPerCarton),
      mrp: Number(req.body.mrp),
      rate: Number(req.body.rate),
      series: (req.body.series || '').toUpperCase(),         // ✅
      createdBy: (req.body.createdBy || '').toUpperCase(),   // ✅
    };

    const product = await Product.findByIdAndUpdate(
      id,
      {
        $set: updatedData,
        $push: {
          history: {
            action: 'updated',
            updatedBy: req.user?.id,
            updatedByName: updatedData.createdBy,
            changes: updatedData,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// 3. Create or Update Product with optional image
// exports.createProduct = async (req, res) => {
//   try {
//     // Add 'series' and 'createdBy' to required fields
//     const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate', 'series'];
//     const missing = requiredFields.filter(field => !req.body[field]);
//     if (missing.length) {
//       return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
//     }

//     const productData = {
//       article: req.body.article,
//       stockType: req.body.stockType.toLowerCase(),
//       gender: req.body.gender.toLowerCase(),
//       color: req.body.color || '',
//       size: req.body.size || '',
//       cartons: Number(req.body.cartons) || 0,
//       pairPerCarton: Number(req.body.pairPerCarton) || 0,
//       mrp: Number(req.body.mrp),
//       rate: Number(req.body.rate),
//       series: req.body.series || '',         // ✅
//       createdBy: req.body.createdBy || '',   // ✅
//     };

//     // if (req.file) {
//     //   productData.imageUrl = `/uploads/${req.file.filename}`;
//     // }
//     if (req.file) {
//   productData.image = `/uploads/${req.file.filename}`; // ✅ imageUrl ki jagah image
// }


//     const matchQuery = {
//       article: productData.article,
//       stockType: productData.stockType,
//       gender: productData.gender,
//       color: productData.color,
//       size: productData.size
//     };

//     const updatedProduct = await Product.findOneAndUpdate(
//       matchQuery,
//       {
//         $set: productData,
//         $push: {
//           history: {
//             action: 'created_or_updated',
//             updatedBy: req.user?.id,
//             updatedByName: productData.createdBy,
//             changes: productData,
//             timestamp: new Date()
//           }
//         }
//       },
//       { upsert: true, new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Product added/updated successfully!',
//       data: updatedProduct
//     });
//   } catch (err) {
//     res.status(400).json({ success: false, error: err.message });
//   }
// };
exports.createProduct = async (req, res) => {
  try {
    const requiredFields = ['article', 'stockType', 'gender', 'createdBy', 'mrp', 'rate', 'series'];
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing fields: ${missing.join(', ')}` });
    }

    const productData = {
      //article: req.body.article,
      article: (req.body.article || '').toUpperCase(),
      stockType: req.body.stockType.toLowerCase(),
      gender: req.body.gender.toLowerCase(),
     // color: req.body.color || '',
     color: (req.body.color || '').toUpperCase(), // ✅ Convert to uppercase
      size: req.body.size || '',
      cartons: Number(req.body.cartons) || 0,
      pairPerCarton: Number(req.body.pairPerCarton) || 0,
      mrp: Number(req.body.mrp),
      rate: Number(req.body.rate),
      series: (req.body.series || '').toUpperCase(),
      createdBy: (req.body.createdBy || '').toUpperCase(),
    };

    if (req.file) {
      productData.image = `/uploads/${req.file.filename}`;
    }

    const matchQuery = {
      article: productData.article,
      stockType: productData.stockType,
      gender: productData.gender,
      color: productData.color,
      size: productData.size
    };

    // Check if product exists
    let existing = await Product.findOne(matchQuery);

    if (existing) {
      // Add cartons if exists
      const newCartons = existing.cartons + productData.cartons;
      const updatedProduct = await Product.findOneAndUpdate(
        matchQuery,
        {
          $set: {
            ...productData,
            cartons: newCartons
          },
          $push: {
            history: {
              action: 'created_or_updated',
              updatedBy: req.user?.id,
              updatedByName: productData.createdBy,
              changes: { ...productData, cartons: newCartons },
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: 'Product quantity updated!',
        data: updatedProduct
      });
    } else {
      // Create new product if not exists
      const newProduct = new Product(productData);
      await newProduct.save();
      return res.status(200).json({
        success: true,
        message: 'New product added!',
        data: newProduct
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


// ========================
// Advanced Features (unchanged except createdBy/series)
// ========================

// 4. Get Stock History
exports.getStockHistory = async (req, res) => {
  try {
    const history = await Product.aggregate([
      { $match: { history: { $exists: true, $ne: [] } } },
      { $unwind: "$history" },
      {
        $project: {
          _id: 0,
          product: "$article",
          action: "$history.action",
          user: "$history.updatedByName",
          changes: "$history.changes",
          timestamp: "$history.timestamp"
        }
      },
      { $sort: { timestamp: -1 } }
    ]);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Get Salary Report
exports.getSalaryReport = async (req, res) => {
  try {
    const { ratePerProduct = 100 } = req.query;

    const report = await Product.aggregate([
      { $match: { createdBy: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$createdBy",
          totalProducts: { $sum: 1 },
          totalPairs: {
            $sum: {
              $multiply: [
                { $ifNull: ["$cartons", 0] },
                { $ifNull: ["$pairPerCarton", 0] }
              ]
            }
          }
        }
      },
      { $sort: { totalProducts: -1 } }
    ]);

    res.json({
      success: true,
      data: report.map(item => ({
        creator: item._id,
        totalProducts: item.totalProducts,
        totalPairs: item.totalPairs,
        salary: item.totalProducts * ratePerProduct
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Get Products (with filters)
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      stockType,
      gender,
      color,
      size,
      minCartons,
      maxCartons,
      sortBy = 'article',
      sortOrder = 'asc'
    } = req.query;

    const filter = { isDeleted: false };
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    if (search) filter.article = { $regex: search, $options: 'i' };
    if (stockType) filter.stockType = stockType;
    if (gender) filter.gender = gender;
   // if (color) filter.color = color;
   if (color) filter.color = { $regex: `^${color}$`, $options: 'i' };

    if (size) filter.size = size;
    if (minCartons) filter.cartons = { $gte: Number(minCartons) };
    if (maxCartons) filter.cartons = { ...filter.cartons, $lte: Number(maxCartons) };

    const products = await Product.find(filter)
      .sort(sortOptions);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 7. Bulk Delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids, updatedByName } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product IDs format'
      });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      {
        isDeleted: true,
        $push: {
          history: {
            action: 'bulk_deleted',
            updatedBy: req.user?.id,
            updatedByName,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      deletedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 8. Bulk Restore
exports.bulkRestore = async (req, res) => {
  try {
    const { ids, updatedByName } = req.body;

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      {
        isDeleted: false,
        $push: {
          history: {
            action: 'bulk_restored',
            updatedBy: req.user?.id,
            updatedByName,
            timestamp: new Date()
          }
        }
      }
    );

    res.json({
      success: true,
      restoredCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// 9. Excel Import (series & createdBy)
exports.importExcel = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const productsData = importFromExcel(req.file.path);
      const genderOptions = ['gents', 'ladies', 'kids_male', 'kids_female'];
      const results = await Promise.allSettled(
        productsData.map(async (row) => {
          try {
            const requiredFields = ['Article', 'Stock Type', 'Gender', 'CreatedBy', 'MRP', 'Rate', 'series'];
            requiredFields.forEach(field => {
              if (!row[field]) throw new Error(`Missing ${field}`);
            });

            const gender = row.Gender.toLowerCase();
            if (!genderOptions.includes(gender)) {
              throw new Error(`Invalid gender: ${row.Gender}`);
            }

            const productData = {
              article: row.Article,
              stockType: row['Stock Type'].toLowerCase(),
              gender,
              color: row.Color || '',
              size: row.Size || '',
              cartons: Number(row.Cartons) || 0,
              pairPerCarton: Number(row['Pair/Carton']) || 0,
              mrp: Number(row.MRP),
              rate: Number(row.Rate),
              series: row.Series || '',          // ✅
              createdBy: row['Created By'] || '',// ✅
            };

            return await Product.findOneAndUpdate(
              {
                article: productData.article,
                stockType: productData.stockType,
                gender: productData.gender,
                color: productData.color,
                size: productData.size
              },
              {
                $set: productData,
                $push: {
                  history: {
                    action: 'imported',
                    updatedBy: req.user?.id,
                    updatedByName: productData.createdBy,
                    changes: productData,
                    timestamp: new Date()
                  }
                }
              },
              { upsert: true, new: true }
            );
          } catch (error) {
            throw error;
          }
        })
      );

      fs.unlinkSync(req.file.path);

      const successfulImports = results.filter(r => r.status === 'fulfilled').length;
      const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message);

      res.json({
        success: true,
        importedCount: successfulImports,
        errors
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
];

// 10. Get Products by Category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { stockType, gender } = req.params;

    const products = await Product.find({
      stockType: stockType.toLowerCase(),
      gender: gender.toLowerCase(),
      isDeleted: false
    });

    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 11. Get Deleted Products
exports.getDeletedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: true }).sort({ article: 1 });
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 12. Permanent Delete
exports.permanentDelete = async (req, res) => {
  const { selectedIds } = req.body;

  try {
    await Product.deleteMany({ _id: { $in: selectedIds } });
    res.status(200).json({ message: "Products permanently deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting products", error: err });
  }
};

// 13. Get Sizes & Colors by Article
exports.getArticleOptions = async (req, res) => {
  try {
    const { article } = req.query;
    if (!article) return res.status(400).json({ success: false, error: "Article is required" });

    const products = await Product.find({ article, isDeleted: false });

    const sizes = [...new Set(products.map(p => p.size).filter(Boolean))];
    const colors = [...new Set(products.map(p => p.color).filter(Boolean))];

    res.json({
      success: true,
      sizes,
      colors
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// 14. Get Smart Details for an Article + Gender
exports.getArticleDetails = async (req, res) => {
  try {
    const { article, gender } = req.query;
    if (!article) {
      return res.status(400).json({ success: false, error: "Article is required" });
    }

    let product = null;

    if (gender) {
      // Agar gender diya hai, toh sirf usi gender ka product do
      product = await Product.findOne({
        article: article,
        gender: gender.toLowerCase(),
        isDeleted: false
      }).sort({ updatedAt: -1 });

      // Agar gender diya hai, lekin product nahi mila, toh empty object bhejo
      if (!product) {
        return res.json({ success: true, data: {} });
      }
    } else {
      // Gender nahi diya: sirf article ka latest product do (stockType/image freeze ke liye)
      product = await Product.findOne({
        article: article,
        isDeleted: false
      }).sort({ updatedAt: -1 });
      if (!product) {
        return res.json({ success: true, data: {} });
      }
    }

    res.json({
      success: true,
      data: {
        stockType: product.stockType,
        mrp: product.mrp,
        rate: product.rate,
        series: product.series || "",
        pairPerCarton: product.pairPerCarton,
        image: product.image || ""
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getArticleGenderInfo = async (req, res) => {
  try {
    const { article, gender } = req.query;
    const searchCriteria = {
      article: article.toUpperCase(),
      gender: gender.toLowerCase(),
      isDeleted: false
    };

    // First check for records WITH image
    let product = await Product.findOne({
      ...searchCriteria,
      image: { $exists: true, $ne: null, $ne: "" }
    }).sort({ imageUpdatedAt: -1 }); // Add timestamp for image updates

    // If no image found, get latest record WITHOUT image
    if (!product) {
      product = await Product.findOne({
        ...searchCriteria,
        $or: [
          { image: { $exists: false } },
          { image: { $in: [null, ""] } }
        ]
      }).sort({ updatedAt: -1 });
    }

    const response = {
      success: true,
      data: {
        image: product?.image || null,
        pairPerCarton: product?.pairPerCarton ?? null,
        series: product?.series ?? null,
        // Add freeze status flags
        fieldsLocked: {
          image: !!product?.image,
          pairPerCarton: !product?.image,
          series: !product?.image
        }
      }
    };

    return res.json(response);
    
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}



// 16. Get Info for Article + Gender + Size (mrp, rate)
exports.getArticleGenderSizeInfo = async (req, res) => {
  try {
    const { article, gender, size } = req.query;
    if (!article || !gender || !size) {
      return res.status(400).json({ success: false, error: "Article, Gender, Size required" });
    }

    const product = await Product.findOne({
      article: article,
      gender: gender.toLowerCase(),
      size: size,
      isDeleted: false
    }).sort({ updatedAt: -1 });

    if (product) {
      return res.json({
        success: true,
        data: {
          mrp: product.mrp || 0,
          rate: product.rate || 0,
        }
      });
    } else {
      return res.json({ success: false, data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

