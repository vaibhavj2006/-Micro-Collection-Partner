const express=require("express");
const path=require("path")
const ejs=require("ejs")
const ejsMate=require("ejs-mate")
const app=express();
const mongoose=require('mongoose');
const methodOverride = require('method-override');
const partner = require("./model/partner");
const Wallet = require('./model/wallet');
const Transaction = require('./model/transaction');
const Orders=require('./model/orders');
const User=require('./model/user');
const orders = require("./model/orders");
const transaction = require("./model/transaction");



mongoose.connect('mongodb://127.0.0.1:27017/analyser');
const db=mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("database connected");
    
})
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));



app.set('view engine', 'ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('ejs',ejsMate)

app.get('/mcp',(req,res)=>{
    res.render('new')
})

app.post('/mcp',async(req,res)=>{
  const {username,status}=req.body.partner;
  const pat = await partner.create({
    username: username,
    status: status,
  });

    await pat.save();
    console.log( await partner.find({}).populate('wallet'));
    res.redirect('/mcp/show')
})

app.get('/mcp/show',async(req,res)=>{
    const patrender=await partner.find({})
    
    res.render('show',{patrender})
})

app.get('/mcp/show/:id',async(req,res)=>{
    
  const pat=await partner.findById(req.params.id)
  const trasac = await transaction.find({ partnerID: req.params.id }).sort({ timestamp: -1 });
  if(pat.orderID!="NULL"){
  const ord=await orders.findById(pat.orderID);

  res.render('main',{pat,ord,trasac})  
}else{
    res.render('main',{pat,trasac})
}
})

app.put('/mcp/show/:id',async(req,res)=>{
    const { id } = req.params;
    await partner.findByIdAndUpdate(id, { ...req.body.partner});
    res.redirect('/mcp/show');

})

app.delete('/mcp/show/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await partner.findByIdAndDelete(id);
        res.redirect('/mcp/show');
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting partner");
    }
});


// Utility: Ensure wallet exists
const getOrCreateWallet = async (ownerId) => {
  let wallet = await Wallet.findOne({ ownerId });
  if (!wallet) wallet = await Wallet.create({ ownerId });
  return wallet;
};

app.get('/funds',(req,res)=>{
  
    res.render('funds')
})


//partner app



// Get transaction history (optionally filtered)


app.get('/orders',async(req,res)=>{
  const orders=await Orders.find({});
  const userr=await User.findOne({name:"shroud"});

  res.render('orders',{orders,userr});
})

app.post('/comp/:id',async(req,res)=>{
   const {id}=req.params;
  
   const pat=await partner.findById(id);
   const order=await Orders.findById(pat.orderID)
   let orderGain=Number(order.amount_user)*Number(0.2);
   pat.status='active'
   pat.orderID="NULL";
   console.log( orderGain)
   console.log(pat)


   pat.balance+=Number(orderGain);


   
    await Transaction.insertMany([{
      to:pat.name,
      from:'mcp',
      partnerID:id,
      amount:orderGain,
      type:'credit',
      timestamp:Date.now()
  }])   
 

   pat.save()
  res.redirect(`/mcp/show/${id}`)
})
 
app.post('/asign/:id',async(req,res)=>{
  const { id } = req.params;


  const order = await Orders.findById(id);

  
  const partners = await partner.findOne({ status: "active" });

  if (!partners) {
    return res.status(503).send('No pickup partners available at the moment');
  }
 
  const userr = await User.findOne({ name: "shroud" });
 
 userr.balance-=order.amount_user

  partners.balance+=Number(2000);
 
 // console.log(await partner.find({}))
  partners.status="intermediate";
  partners.orderID=id;
  
  order.status = 'assigned';
  await order.save();
  await userr.save();
  await partners.save();

  res.json({ success: true, assignedPartner: partners });
})

app.get('/transactions', async (req, res) => {
  const { ownerId } = req.query;
  const query = ownerId ? { $or: [{ from: ownerId }, { to: ownerId }] } : {};
  const transactions = await Transaction.find(query).sort({ timestamp: -1 });
  res.json(transactions);
});


app.listen(8000,async()=>{
 
    console.log("server on");
})

