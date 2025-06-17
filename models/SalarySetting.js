const mongoose = require('mongoose');

const SalarySettingSchema = new mongoose.Schema({
  calculationType: {
    type: String,
    enum: ['per_product', 'per_pair', 'per_carton'],
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SalarySetting', SalarySettingSchema);
