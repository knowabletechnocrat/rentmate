import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors({origin:process.env.CLIENT_ORIGIN || 'http://localhost:5173'}));
app.use(express.json({limit:'1mb'}));
const pool=mysql.createPool({host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||3307),user:process.env.DB_USER||'rentmate',password:process.env.DB_PASSWORD,database:process.env.DB_NAME||'rentmate',waitForConnections:true,connectionLimit:10});
const secret=process.env.JWT_SECRET;
if(!secret || secret.startsWith('replace_')) { console.error('Set a secure JWT_SECRET in backend/.env'); process.exit(1); }
const auth=(req,res,next)=>{try{const token=req.headers.authorization?.replace(/^Bearer /,''); if(!token) return res.status(401).json({message:'Login required'});req.user=jwt.verify(token,secret);next();}catch{return res.status(401).json({message:'Invalid token'});}};
app.get('/api/health',async(req,res)=>{try{await pool.query('SELECT 1');res.json({status:'ok',database:'connected'});}catch{res.status(503).json({status:'error',database:'disconnected'});}});
app.post('/api/auth/register',async(req,res)=>{try{const {name,email,password,role}=req.body;if(typeof name!=='string'||name.trim().length<2||typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<8||!['landlord','tenant'].includes(role))return res.status(400).json({message:'Valid name, email, password (8+ chars) and role required'});const hash=await bcrypt.hash(password,12);const [result]=await pool.execute('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',[name.trim(),email.toLowerCase().trim(),hash,role]);res.status(201).json({id:result.insertId,message:'Registered successfully'});}catch(e){res.status(e.code==='ER_DUP_ENTRY'?409:500).json({message:e.code==='ER_DUP_ENTRY'?'Email already registered':'Server error'});}});
app.post('/api/auth/login',async(req,res)=>{try{const {email,password}=req.body;if(typeof email!=='string'||typeof password!=='string')return res.status(400).json({message:'Email and password required'});const [rows]=await pool.execute('SELECT * FROM users WHERE email=?',[email.toLowerCase().trim()]);const user=rows[0];if(!user||!(await bcrypt.compare(password,user.password_hash)))return res.status(401).json({message:'Invalid credentials'});const token=jwt.sign({id:user.id,role:user.role,name:user.name},secret,{expiresIn:'8h'});res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});}catch{res.status(500).json({message:'Server error'});}});
app.get('/api/properties',async(req,res)=>{try{const [rows]=await pool.query('SELECT p.*,u.name AS landlord_name FROM properties p JOIN users u ON u.id=p.landlord_id ORDER BY p.created_at DESC');res.json(rows);}catch{res.status(500).json({message:'Server error'});}});
app.post('/api/properties',auth,async(req,res)=>{if(req.user.role!=='landlord')return res.status(403).json({message:'Landlord only'});const {title,city,address,rent,description}=req.body;if(typeof title!=='string'||!title.trim()||typeof city!=='string'||!city.trim()||typeof address!=='string'||!address.trim()||!Number.isFinite(Number(rent))||Number(rent)<=0)return res.status(400).json({message:'Valid title, city, address and rent required'});try{const [result]=await pool.execute('INSERT INTO properties (landlord_id,title,city,address,rent,description) VALUES (?,?,?,?,?,?)',[req.user.id,title.trim(),city.trim(),address.trim(),Number(rent),typeof description==='string'?description:'']);res.status(201).json({id:result.insertId,message:'Property created'});}catch{res.status(500).json({message:'Server error'});}});
app.listen(Number(process.env.PORT||5000),()=>console.log('RentMate API running on http://localhost:'+(process.env.PORT||5000)));
