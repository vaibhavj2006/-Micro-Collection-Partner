
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
 ownerId: { 
    type: String,
    //required: true,
    unique: true 
}, 
 balance: { 
    type: Number, 
    default: 100 }
});

module.exports = mongoose.model('Wallet', walletSchema);
