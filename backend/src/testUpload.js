import "dotenv/config";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import crypto from "crypto";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("================================");
console.log("CLOUDINARY RAW UPLOAD TEST");
console.log("================================");

console.log("Cloud name:", cloudName);
console.log("API key:", apiKey);
console.log("API secret exists:", !!apiSecret);

const filePath = "./test.jpeg";

const timestamp = Math.floor(Date.now() / 1000);

const signature = crypto
  .createHash("sha1")
  .update(`timestamp=${timestamp}${apiSecret}`)
  .digest("hex");

const form = new FormData();

form.append("file", fs.createReadStream(filePath));
form.append("api_key", apiKey);
form.append("timestamp", timestamp);
form.append("signature", signature);

try {
  console.log("\nStarting raw upload...\n");

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    form,
    {
      headers: form.getHeaders(),
      validateStatus: () => true,
    }
  );

  console.log("================================");
  console.log("STATUS:", response.status);
  console.log("================================");

  console.log("\nHEADERS:");
  console.dir(response.headers, { depth: null });

  console.log("\nBODY:");
  console.dir(response.data, { depth: null });

  console.log("\nX-CLD-ERROR:");
  console.log(response.headers["x-cld-error"]);

  console.log("================================");
} catch (error) {
  console.error("REQUEST ERROR:");
  console.dir(error, { depth: null });
}