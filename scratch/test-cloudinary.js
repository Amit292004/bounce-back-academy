
require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testConnection() {
  console.log("Checking Cloudinary connection...");
  try {
    const result = await cloudinary.api.ping();
    console.log("Connection successful:", result);
  } catch (error) {
    console.error("Connection failed:", error.message);
  }
}

testConnection();
