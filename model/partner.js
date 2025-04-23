const mongoose=require('mongoose');
const express=require('express');



const partnerSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    status:{
        type:String,
        
    }, orderID:{
        type:String,
        
    },
    
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
      },
      balance: { 
        type: Number, 
        default: 100 }
    
    
})

module.exports=mongoose.model('Partner',partnerSchema);
