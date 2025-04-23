const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { 
    type:String 
}, 
  amount_user: { 
    type:Number 
}
});

module.exports = mongoose.model('Order', orderSchema);
