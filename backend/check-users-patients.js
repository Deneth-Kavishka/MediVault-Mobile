const {Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({host:'localhost',port:5432,user:'medivault',password:'12345',database:'medivault'});
(async()=>{
  try{
    const u=await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
    console.log('Users columns:',u.rows.map(r=>r.column_name).join(', '));
    const p=await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='patients' ORDER BY ordinal_position");
    console.log('Patients columns:',p.rows.map(r=>r.column_name).join(', '));
  }catch(e){
    console.error(e.message);
  }finally{
    await pool.end();
  }
})();
