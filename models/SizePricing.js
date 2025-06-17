// models/SizePricing.js
const mongoose = require('mongoose');

const sizePricingSchema = new mongoose.Schema({
  size: { 
    type: String, 
    required: true 
  },
  stockType: { 
    type: String, 
    required: true 
  },
  mrp: { 
    type: Number, 
    default: 0 
  },
  rate: { 
    type: Number, 
    default: 0 
  },
  history: [
    {
      action: String, // 'created'/'updated'
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedByName: String,
      changes: Object,
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Index for faster querying
sizePricingSchema.index({ size: 1, stockType: 1 }, { unique: true });

module.exports = mongoose.model('SizePricing', sizePricingSchema);
