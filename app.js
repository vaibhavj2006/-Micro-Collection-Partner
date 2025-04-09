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
const User=require('./model/user')


mongoose.connect('mongodb://127.0.0.1:27017/analyser');
const db=mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open",()=>{
    console.log("database connected");
    
})
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


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

  
  const wallet = await Wallet.create({
    ownerId: pat._id,
    ownerModel: 'Partner', 
  });

 
  pat.wallet = wallet._id;
  await pat.save();

 
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
    res.render('main',{pat})
})

app.put('/mcp/show/:id',async(req,res)=>{
    const { id } = req.params;
    const pat=await partner.findByIdAndUpdate(id, { ...req.body.partner});
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

// routes/wallet.js



// Utility: Ensure wallet exists
const getOrCreateWallet = async (ownerId) => {
  let wallet = await Wallet.findOne({ ownerId });
  if (!wallet) wallet = await Wallet.create({ ownerId });
  return wallet;
};

app.get('/funds',(req,res)=>{
  
    res.render('funds')
})

// MCP user wallet
app.post('/funds', async (req, res) => {
  const { amount } = req.body;
  const mcpWallet = await getOrCreateWallet('MCP');
  mcpWallet.balance=  Number(amount)+mcpWallet.balance;
  await mcpWallet.save();

  await Transaction.create({
    from: 'external',
    to: 'MCP',
    amount,
    type: 'credit',
    purpose: 'MCP Wallet Top-Up'
  });

  res.json({ success: true, balance: mcpWallet.balance });
  console.log(await Wallet.find({}))
});

//partner app

// Distribute funds to a Pickup Partner

app.get('/distribute',(req,res)=>{
    res.render('partner_fund')
})

app.post('/distribute', async (req, res) => {
  const { partnerId, amount } = req.body;
  const mcpWallet = await getOrCreateWallet('MCP');
  const partnerWallet = await getOrCreateWallet(partnerId);

  if (mcpWallet.balance < amount) return res.status(400).json({ error: 'Insufficient MCP balance' });

  mcpWallet.balance -=  Number(amount);
  partnerWallet.balance +=  Number(amount);
  await mcpWallet.save();
  await partnerWallet.save();

  await Transaction.create({
    from: 'MCP',
    to: partnerId,
    amount,
    type: 'distribution',
    purpose: 'Fund Distribution to Pickup Partner'
  });

  res.json({ success: true });
  console.log(await partner.find({}))
});



// Credit or debit a Pickup Partner manually
// app.post('/partner/wallet/update', async (req, res) => {
//   const { partnerId, amount, type, purpose } = req.body; // type: 'credit' or 'debit'
//   const wallet = await getOrCreateWallet(partnerId);

//   if (type === 'debit' && wallet.balance < amount) {
//     return res.status(400).json({ error: 'Insufficient balance' });
//   }

//   wallet.balance += type === 'credit' ? amount : -amount;
//   await wallet.save();

//   await Transaction.create({
//     from: type === 'credit' ? 'MCP' : partnerId,
//     to: type === 'credit' ? partnerId : 'MCP',
//     amount,
//     type,
//     purpose
//   });

//   res.json({ success: true, newBalance: wallet.balance });
// });

// Get transaction history (optionally filtered)
app.get('/transactions', async (req, res) => {
  const { ownerId } = req.query;
  const query = ownerId ? { $or: [{ from: ownerId }, { to: ownerId }] } : {};
  const transactions = await Transaction.find(query).sort({ timestamp: -1 });
  res.json(transactions);
});

app.get('/orders',async(req,res)=>{
  const orders=await Orders.find({});
 // console.log(orders)
  res.render('orders',{orders});
})

app.post('/comp/:id',async(req,res)=>{
   const {id}=req.params;
  
   const pat=await partner.findById(id);
   let orderGain=300;
   pat.balance+=Number(orderGain);

   const query = id ? { $or: [{ from:'mcp' }, { to: id }] } : {};
//   const transactions = await Transaction.find(query).sort({ timestamp: -1 });
    await Transaction.insertMany([{
      to:pat.name,
      from:'mcp',
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
  
  partners.balance+=Number(2000);
 
  console.log(await partner.find({}))
  partners.status="intermediate";
  order.partnerId = partners.partnerId;
  order.status = 'assigned';
  await order.save();

  
  await partners.save();

  //res.render('')
//console.log(await order.partnerId,await partners.find({}))
  res.json({ success: true, assignedPartner: partners });
})



app.listen(8000,async()=>{
 
    console.log("server on");
})

