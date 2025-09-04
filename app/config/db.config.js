module.exports = {
  HOST: "ep-steep-mode-ae44kd5p-pooler.c-2.us-east-2.aws.neon.tech",
  USER: "neondb_owner",
  PASSWORD: "npg_Q8XxnN4UeBOm",
  DB: "neondb",
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
//psql 'postgresql://neondb_owner:npg_Q8XxnN4UeBOm@ep-steep-mode-ae44kd5p-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
