const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { 
    type:String 
}, 
  amount_user: { 
    type:Number 
},   
  amount_partner:{
    type:Number
  }
});

module.exports = mongoose.model('Order', orderSchema);
