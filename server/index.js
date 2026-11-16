import express from "express";
import cors from "cors";
import cron from "node-cron";
import Database from "better-sqlite3";

const app=express(); app.use(cors()); app.use(express.json());
const db=new Database("prices.db");
db.exec(`CREATE TABLE IF NOT EXISTS observations(id INTEGER PRIMARY KEY, product TEXT, store TEXT, seller TEXT, price INTEGER, shipping INTEGER, url TEXT, offer_type TEXT, observed_at TEXT DEFAULT CURRENT_TIMESTAMP, verified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY, observation_id INTEGER, threshold INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
app.get("/api/health",(_,res)=>res.json({ok:true,service:"switch2-price-tracker",interval:"5 minutes target"}));
app.get("/api/offers",(_,res)=>res.json(db.prepare("SELECT * FROM observations ORDER BY price ASC, observed_at DESC LIMIT 250").all()));
app.get("/api/history",(req,res)=>{const p=String(req.query.product||"");res.json(db.prepare("SELECT price,shipping,observed_at,store FROM observations WHERE product=? ORDER BY observed_at ASC").all(p))});
app.post("/api/observations",(req,res)=>{const {product,store,seller,price,shipping=0,url,offer_type="regular",verified=0}=req.body||{};if(!product||!store||!Number.isInteger(price)||price<=0||!url)return res.status(400).json({error:"product, store, positive integer price and url are required"});const info=db.prepare("INSERT INTO observations(product,store,seller,price,shipping,url,offer_type,verified) VALUES(?,?,?,?,?,?,?,?)").run(product,store,seller||"No informado",price,shipping,url,offer_type,verified?1:0);res.status(201).json({id:info.lastInsertRowid})});

// Implement one compliant adapter per retailer. Respect each site's terms, robots.txt,
// rate limits and available public APIs/feeds. Do not bypass CAPTCHAs, logins or anti-bot controls.
const adapters=[];
async function poll(){for(const adapter of adapters){try{const items=await adapter.fetchOffers();for(const x of items){db.prepare("INSERT INTO observations(product,store,seller,price,shipping,url,offer_type,verified) VALUES(?,?,?,?,?,?,?,?)").run(x.product,x.store,x.seller,x.price,x.shipping||0,x.url,x.offer_type||"regular",x.verified?1:0)}}catch(err){console.error("Adapter error:",adapter.name,err.message)}}}
cron.schedule("*/5 * * * *",poll);
const port=process.env.PORT||3000;app.listen(port,()=>console.log(`Price tracker API listening on ${port}`));
