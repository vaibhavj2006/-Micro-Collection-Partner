const mongoose=require('mongoose');
const express=require('express');


const userSchema=new mongoose.Schema({
    name:{
        type:String
    },
    balance: { 
        type: Number, 
        default: 100 
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
      }
    })

module.exports=mongoose.model('Users',userSchema);


//     review: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Review'

