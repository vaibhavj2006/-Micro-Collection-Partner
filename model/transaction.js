
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: {
     type: String 
  }, 
  to: {
     type: String
  },
  partnerID: {
    type: String
 },   
  amount: {
    type: Number,
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  purpose: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now() 
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
