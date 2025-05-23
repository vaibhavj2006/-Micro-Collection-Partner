const express=require("express");
const path=require("path")
const ejs=require("ejs")
const ejsMate=require("ejs-mate")
const app=express();
const mongoose=require('mongoose');
const partner=require('./model/partner.js')
const Orders=require('./model/orders')

mongoose.connect('mongodb://127.0.0.1:27017/analyser');
const db=mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("dtabase connected");
    
})
const seedDB=async () => {
 // await Orders.deleteMany({});
    const data = [
      { name: "Keyboard", amount_user: Number(1500) },
      { name: "DELL ROG LAPTOP", amount_user:Number(50000) },
      { name: "Dryer", amount_user: Number(2000) },
      { name: "CHipz", amount_user:Number(200)}
    ];
  
    try {
      await Orders.insertMany(data);
      console.log("Seeded successfully");
    } catch (err) {
      console.error("Error seeding data", err);
    }
  };
seedDB();

app.listen(8000,()=>{
    console.log("server on");
})

// await browser.close();
    

// for (let data of alldata) {
//     const newGround = new ground({
//         title: data.title,
//         location: data.location,
//         description: data.description,
//         image: data.image,
//         price: data.price
//     });

//     try {
//         await newGround.save();
//         console.log(`Saved: ${data.title}`);
//     } catch (err) {
//         console.error(`Error saving ${data.title}:`, err);
//     }
// }

// mongoose.connection.close();  
// };
