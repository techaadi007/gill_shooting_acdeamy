require('dotenv').config();
const express=require('express'),cors=require('cors'),rateLimit=require('express-rate-limit'),path=require('path');
const app=express(),port=process.env.PORT||3000;
app.use(cors({origin:process.env.CLIENT_ORIGIN||true}));app.use(express.json({limit:'20kb'}));app.use('/api',rateLimit({windowMs:15*60*1000,max:80,standardHeaders:true,legacyHeaders:false}));app.use(express.static(path.join(__dirname,'..')));
const clean=v=>typeof v==='string'?v.trim().replace(/[<>]/g,''):'';
function validate(body,required){const data={};for(const key of required){data[key]=clean(body[key]);if(!data[key])return [null,`${key} is required`]}if(data.email&&!/^\S+@\S+\.\S+$/.test(data.email))return [null,'Enter a valid email'];return [data,null]}
app.post('/api/admissions',(req,res)=>{const [data,error]=validate(req.body,['name','phone','email']);if(error)return res.status(400).json({error});/* Insert data into PostgreSQL/Supabase here using parameterized queries. */res.status(201).json({message:'Admission enquiry received',data})});
app.post('/api/contact',(req,res)=>{const [data,error]=validate(req.body,['name','phone','email']);if(error)return res.status(400).json({error});res.status(201).json({message:'Message received',data})});
app.get('/api/programs',(_,res)=>res.json([]));app.get('/api/coaches',(_,res)=>res.json([]));app.get('/api/gallery',(_,res)=>res.json([]));app.use((_,res)=>res.sendFile(path.join(__dirname,'..','index.html')));app.listen(port,()=>console.log(`Gill Academy running at http://localhost:${port}`));
