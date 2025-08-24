require("dotenv").config();

module.exports = {
  keywords: ["远程", "remote", "中国人", "Chinese", "Asia", "Mandarin"],
  supabase: {
    url: process.env.SUPABASE_URL,
    roleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};
