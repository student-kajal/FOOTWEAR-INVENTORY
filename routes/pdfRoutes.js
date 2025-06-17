const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

router.post('/generate-pdf', async (req, res) => {
  try {
    const { includeImages, filters, showRate, showMRP, productIds } = req.body;
    
  //  console.log('PDF Parameters:', { includeImages, showRate, showMRP, productIds: productIds?.length });

    let query = { isDeleted: { $ne: true } };
    
    if (productIds && productIds.length > 0) {
      query._id = { $in: productIds };
    } else {
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value && value !== '' && key !== 'isDeleted') {
          query[key] = new RegExp(value, 'i');
        }
      });
    }

    const products = await Product.find(query).lean();
    const doc = new PDFDocument({
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=products-report.pdf');
    doc.pipe(res);

   const groupedProducts = products.reduce((acc, product) => {
  const key = `${product.article}-${product.gender}`.toUpperCase();
  if (!acc[key]) {
    acc[key] = {
      article: product.article,
      gender: product.gender,
      image: null,
      mrp: product.mrp,
      rate: product.rate,
      pairPerCarton: product.pairPerCarton,
      series: product.series,
      variants: []
    };
  }
  if (!acc[key].image && product.image) {
    acc[key].image = product.image;
  }
  acc[key].variants.push(product);
  return acc;
}, {});

const filteredGroups = includeImages
  ? Object.entries(groupedProducts).filter(([_, group]) => group.image)
  : Object.entries(groupedProducts);

const allSizes = Array.from(new Set(
  Object.values(groupedProducts).flatMap(g => 
    (includeImages ? 
      g.variants.filter(v => (v.cartons || 0) > 0) :
      g.variants
    ).map(v => v.size?.trim().toUpperCase())
  ).filter(Boolean)
)).sort((a, b) => parseInt(a) - parseInt(b));


const createConsolidatedTable = () => {
  // Function to get sizes with actual stock data
  const getSizesWithData = (products) => {
    const sizesWithData = new Set();
    Object.values(products).forEach(group => {
      group.variants.forEach(variant => {
        const size = variant.size?.trim().toUpperCase();
        if (size && variant.cartons > 0) {
          sizesWithData.add(size);
        }
      });
    });
    return Array.from(sizesWithData).sort((a, b) => {
      const parseSize = (size) => {
        const match = size.match(/(\d+)X?(\d+)?/);
        if (match) {
          return parseInt(match[1]) * 100 + (parseInt(match[2]) || 0);
        }
        return parseInt(size) || 0;
      };
      return parseSize(a) - parseSize(b);
    });
  };

  // Clean article names
  const cleanArticleName = (article) => {
    return article
      .replace(/[-_](GENTS|LADIES|KIDS_GENTS|KIDS_LADIES)$/i, '')
      .replace(/[-_](MENS|WOMENS|BOYS|GIRLS)$/i, '')
      .trim();
  };

  // Consolidate products
  const consolidatedProducts = {};
  Object.entries(groupedProducts).forEach(([article, group]) => {
    const cleanedArticle = cleanArticleName(article);
    if (!consolidatedProducts[cleanedArticle]) {
      consolidatedProducts[cleanedArticle] = { variants: [] };
    }
    consolidatedProducts[cleanedArticle].variants.push(...group.variants);
  });

  const productEntries = Object.entries(consolidatedProducts);
  
  // PDF configuration
  const pageMargin = 15;
  const pageWidth = 595;
  const pageHeight = 842;
  const headerHeight = 80;
  const footerHeight = 20;
  const availableHeight = pageHeight - headerHeight - footerHeight - (2 * pageMargin);
  const rowHeight = 12;
  const maxRowsPerTable = Math.floor(availableHeight / rowHeight) - 2;

  // Split products between tables
  let table1Products = {};
  let table2Products = {};
  let table1RowCount = 0;
  
  productEntries.forEach(([article, group]) => {
    const colorCount = new Set(group.variants.map(v => v.color?.trim() || 'DEFAULT')).size;
    const productRowCount = 1 + colorCount;
    
    if (table1RowCount + productRowCount <= maxRowsPerTable) {
      table1Products[article] = group;
      table1RowCount += productRowCount;
    } else {
      table2Products[article] = group;
    }
  });

  // Get sizes for each table
  const table1Sizes = getSizesWithData(table1Products);
  const table2Sizes = getSizesWithData(table2Products);
  
  // Calculate table dimensions
  const calculateTableDimensions = (sizes) => {
    const availableWidth = pageWidth - (2 * pageMargin);
    const minArticleWidth = 100;
    const minSizeWidth = 18;
    const maxSizeWidth = 35;
    
    if (sizes.length === 0) return null;
    
    let sizeWidth = Math.floor((availableWidth - minArticleWidth) / sizes.length);
    sizeWidth = Math.max(minSizeWidth, Math.min(maxSizeWidth, sizeWidth));
    
    return {
      tableWidth: Math.min(minArticleWidth + (sizeWidth * sizes.length), availableWidth),
      articleWidth: minArticleWidth,
      sizeWidth: sizeWidth,
      sizes: sizes
    };
  };

  const table1Dims = calculateTableDimensions(table1Sizes);
  const table2Dims = calculateTableDimensions(table2Sizes);

  // Layout determination
  const canFitBothTables = table1Dims && table2Dims && 
    (table1Dims.tableWidth + table2Dims.tableWidth + 20) <= (pageWidth - 2 * pageMargin);

  let table1StartX = pageMargin;
  let table2StartX = canFitBothTables ? 
    pageMargin + table1Dims.tableWidth + 20 : 
    pageMargin;

  // Drawing functions
  const drawCompanyHeader = () => {
    doc.fontSize(12).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).text('Stock Statement', { align: 'center' });
    doc.moveDown(0.5);

    const now = new Date().toLocaleString();
    doc.fontSize(8).font('Helvetica')
      .text(`Date-Time: ${now}`, pageMargin, doc.y)
      .moveDown(0.8);
    
    return doc.y;
  };

  const drawTableHeader = (startX, yPosition, dimensions) => {
    if (!dimensions) return yPosition;
    
    let currentY = yPosition;
    const { tableWidth, articleWidth, sizeWidth, sizes } = dimensions;

    doc.rect(startX, currentY, tableWidth, rowHeight).fillAndStroke('#e8e8e8', '#333');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('black');
    doc.text('ART', startX + 3, currentY + 4, { width: articleWidth - 6, align: 'left' });
    
    sizes.forEach((size, i) => {
      const xPos = startX + articleWidth + (i * sizeWidth);
      let displaySize = size.replace('X', 'x');
      const fontSize = displaySize.length > 4 ? 6 : 7;
      
      doc.fontSize(fontSize)
        .text(displaySize, xPos + 1, currentY + 4, { 
          width: sizeWidth - 2, 
          align: 'center',
          ellipsis: true
        });
    });

    return currentY + rowHeight;
  };

  const drawProductRow = (startX, yPos, article, colorData, isArticleRow, dimensions) => {
    if (!dimensions) return yPos;
    
    const { tableWidth, articleWidth, sizeWidth, sizes } = dimensions;
    const bgColor = isArticleRow ? '#f5f5f5' : '#ffffff';
    
    doc.rect(startX, yPos, tableWidth, rowHeight).fillAndStroke(bgColor, '#333');
    const fontSize = isArticleRow ? 8 : 7;
    const fontType = isArticleRow ? 'Helvetica-Bold' : 'Helvetica';
    
    doc.font(fontType).fontSize(fontSize).fillColor('black');
    const displayText = article.length > 25 ? 
      article.substring(0, 22) + '...' : article;
    
    doc.text(displayText, startX + 3, yPos + 3, { 
      width: articleWidth - 6, 
      align: 'left',
      ellipsis: true
    });
    
    if (colorData) {
      sizes.forEach((size, idx) => {
        const value = colorData[size] || '-';
        const x = startX + articleWidth + (idx * sizeWidth);
        const valueFontSize = value.toString().length > 3 ? 6 : 7;
        
        doc.fontSize(valueFontSize)
          .text(value, x + 1, yPos + 3, { 
            width: sizeWidth - 2, 
            align: 'center',
            ellipsis: true
          });
      });
    }

    return yPos + rowHeight;
  };

  const drawTableBorder = (startX, startY, endY, dimensions) => {
    if (!dimensions) return;
    
    const { tableWidth, articleWidth, sizes } = dimensions;
    doc.strokeColor('#333').lineWidth(0.5)
      .rect(startX, startY, tableWidth, endY - startY).stroke();
    
    doc.moveTo(startX + articleWidth, startY)
      .lineTo(startX + articleWidth, endY).stroke();
    
    for (let i = 1; i < sizes.length; i++) {
      const x = startX + articleWidth + (i * dimensions.sizeWidth);
      doc.moveTo(x, startY).lineTo(x, endY).stroke();
    }
  };

  // Main rendering logic
  const renderTables = () => {
    let currentPageY = drawCompanyHeader();
    let tablesDrawn = 0;

    const renderTableSet = (products, dimensions, isTable2 = false) => {
      if (!dimensions || Object.keys(products).length === 0) return currentPageY;

      // Vertical space check
      const requiredHeight = (Object.keys(products).length * 2 + 1) * rowHeight;
      const remainingSpace = pageHeight - currentPageY - footerHeight;

      if (remainingSpace < requiredHeight && tablesDrawn > 0) {
        doc.addPage();
        currentPageY = drawCompanyHeader();
      }

      // Position calculation
      const startX = isTable2 && canFitBothTables ? table2StartX : table1StartX;
      let currentY = drawTableHeader(startX, currentPageY, dimensions);

      // Draw rows
      Object.entries(products).forEach(([article, group]) => {
        const colorMap = group.variants.reduce((acc, variant) => {
          const color = variant.color?.trim() || 'DEFAULT';
          acc[color] = acc[color] || {};
          const size = variant.size?.trim().toUpperCase();
          if (size && dimensions.sizes.includes(size)) {
            acc[color][size] = (acc[color][size] || 0) + (variant.cartons || 0);
          }
          return acc;
        }, {});

        currentY = drawProductRow(startX, currentY, article, null, true, dimensions);
        Object.entries(colorMap).forEach(([color, sizes]) => {
          currentY = drawProductRow(startX, currentY, color, sizes, false, dimensions);
        });
      });

      drawTableBorder(startX, currentPageY, currentY, dimensions);
      tablesDrawn++;
      return currentY;
    };

    // Render Table 1
    const table1EndY = renderTableSet(table1Products, table1Dims);
    
    // Update position for Table 2
    currentPageY = canFitBothTables ? 
      Math.min(table1EndY, currentPageY) : 
      table1EndY;

    // Render Table 2
    if (Object.keys(table2Products).length > 0) {
      if (canFitBothTables) {
        renderTableSet(table2Products, table2Dims, true);
      } else {
        if (currentPageY + 100 > pageHeight - footerHeight) {
          doc.addPage();
          currentPageY = drawCompanyHeader();
        }
        renderTableSet(table2Products, table2Dims);
      }
    }
  };

  renderTables();
};

   
  
  if (includeImages) {
  filteredGroups.forEach(([article, group], index) => {
    if (index > 0) doc.addPage();

    // Header Section
    doc.fontSize(16).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('Stock Statement', { align: 'center' });
    doc.moveDown(1);

    // Date Information
    const now = new Date().toLocaleString();
    const dateOnly = new Date().toLocaleDateString();
    doc.fontSize(10).font('Helvetica')
      .text(`Date-Time: ${now}`, 40, doc.y)
      .text(`As On Date: ${dateOnly}`, { align: 'right' });

    // Product Information
    const firstVariant = group.variants[0];
    doc.text(`Stock Type: ${firstVariant.stockType || ''}`, 40, doc.y + 15)
      .text(`Series: ${group.series || firstVariant.series || '-'}`, { align: 'right' })
      .moveDown(1.5);

    // Pricing Information
    doc.fontSize(12).font('Helvetica-Bold').text(`ART.: ${article}`);
    
    if (showRate) doc.text(`Rate: ${group.rate || '-'} /-`);
    if (showMRP) doc.text(`MRP: ${group.mrp || '-'} /-`);
    
    doc.moveDown(0.5)
      .fontSize(10).font('Helvetica')
      .text(`Pair/Crtn: ${group.pairPerCarton || '-'}`)
      .moveDown(1);

    // Enhanced Image Handling
    let hasImage = false;
    let imagePath = null;
    
    if (group.image) {
      const possiblePaths = [
        path.join(__dirname, '..', group.image),
        path.join(__dirname, '..', 'uploads', group.image),
        path.join(__dirname, '..', 'uploads', 'products', group.image),
      ];
      for (let i = 0; i < possiblePaths.length; i++) {
        if (fs.existsSync(possiblePaths[i])) {
          imagePath = possiblePaths[i];
          hasImage = true;
          break;
        }
      }
    }

    // Blue Block Container
    const blockTop = doc.y;
    const blockHeight = hasImage ? 370 : 140;
    doc.rect(20, blockTop, 555, blockHeight)
      .fillColor('#D7F6F8').fill()
      .fillColor('black');

    // Add Image if available (CENTERED)
    if (hasImage && imagePath) {
      try {
        // Center the image horizontally in the blue block
        const imageWidth = 200;
        const imageHeight = 180;
        const centerX = 20 + (555 - imageWidth) / 2; // Center in blue block
        const imageY = blockTop + 20;
        
        doc.image(imagePath, centerX, imageY, { 
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center'
        });
      } catch (err) {
        console.error("Image render error:", err);
      }
    }

    // Stock Table Configuration
    const tableTop = hasImage ? blockTop + 220 : blockTop + 20;
    let y = tableTop;
    const rowHeight = 25;
    const colorColumnWidth = 120;
    const sizeColumnWidth = 80;

    // Filter in-stock variants
    const variants = group.variants.filter(v => (v.cartons || 0) > 0);

    // Collect sizes and colors (sorted)
    const sizes = Array.from(new Set(variants.map(v => v.size?.trim().toUpperCase())))
      .filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
    const colors = Array.from(new Set(variants.map(v => v.color?.trim() || '-')));

    // Table dimensions
    const tableStartX = 40;
    const tableWidth = colorColumnWidth + (sizes.length * sizeColumnWidth);
    
    // Draw Table Header with complete grid
    doc.strokeColor('#000').lineWidth(1);
    doc.font('Helvetica-Bold').fontSize(10);
    
    // Header background
    doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f0f0f0').fill().fillColor('black');
    
    // Header text
    doc.text('Color', tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
    
    let headerX = tableStartX + colorColumnWidth;
    sizes.forEach(size => {
      doc.text(size, headerX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
      headerX += sizeColumnWidth;
    });

    // Draw header grid lines
    // Horizontal lines
    doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
    doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
    
    // Vertical lines
    doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
    doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
    
    for (let i = 1; i <= sizes.length; i++) {
      const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
      doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
    }

    y += rowHeight;

    // Draw Data Rows with complete grid
    doc.font('Helvetica').fontSize(9);
    colors.forEach((color, colorIndex) => {
      // Alternate row background
      if (colorIndex % 2 === 0) {
        doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f9f9f9').fill().fillColor('black');
      }

      // Color text
      doc.text(color, tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
      
      // Size values
      let cellX = tableStartX + colorColumnWidth;
      sizes.forEach(size => {
        const variant = variants.find(v => 
          v.color?.trim() === color && 
          v.size?.trim().toUpperCase() === size
        );
        const value = variant?.cartons?.toString() || '-';
        doc.text(value, cellX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
        cellX += sizeColumnWidth;
      });

      // Draw row grid lines
      // Horizontal lines
      doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
      doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
      
      // Vertical lines
      doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
      doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
      
      for (let i = 1; i <= sizes.length; i++) {
        const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
        doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
      }
      
      y += rowHeight;
    });

    // Draw final bottom border
    doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
  });
}

   else {
      //  WITHOUT IMAGE - CONSOLIDATED TABLE
      createConsolidatedTable();
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;