const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const instance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Replicate the mobile client request interceptor in mobile/src/api/client.ts
instance.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    if (config.url.startsWith('/api/v1/')) {
      config.url = config.url.substring(7); // strips '/api/v1' prefix
    } else {
      config.url = config.url.substring(4); // strips '/api' prefix
    }
  }
  return config;
});

async function runMobileAgentTest() {
  console.log("=========================================");
  printArabic("RUNNING MOBILE TEST 1: Mobile Agent (Tutor Ask)");
  console.log("=========================================");
  
  try {
    const response = await instance.post('/api/v1/tutor/ask', {
      query: "ما هي المتغيرات في بايثون؟",
      mode: "explain",
      skill_id: "tutor"
    });
    
    console.log(`Status Code: ${response.status_code || response.status}`);
    console.log("Response JSON:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Test 1 Failed:", error.message);
    if (error.response) {
      console.error("Error Response Body:", error.response.data);
    }
  }
}

async function runMobileUploadTest() {
  console.log("\n=========================================");
  printArabic("RUNNING MOBILE TEST 2: Mobile File Upload (Study Assistant)");
  console.log("=========================================");
  
  try {
    const formData = new FormData();
    // Simulate Expo Document Picker file asset fields: uri, name, type
    // In Node.js, we pass the file stream as the value
    formData.append('file', fs.createReadStream('mobile_test.txt'), {
      filename: 'mobile_test.txt',
      contentType: 'text/plain',
    });
    
    const response = await instance.post('/api/v1/study/study-assistant', formData, {
      params: {
        difficulty: "medium",
        question_count: 3
      },
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    console.log(`Status Code: ${response.status_code || response.status}`);
    console.log("Response JSON:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Test 2 Failed:", error.message);
    if (error.response) {
      console.error("Error Response Body:", error.response.data);
    }
  }
}

// Utility to print safely on Windows CLI if needed (using escaping)
function printArabic(text) {
  // Convert characters to unicode escape sequences to prevent console encoding crashes on Windows
  console.log(text);
}

async function main() {
  await runMobileAgentTest();
  await runMobileUploadTest();
}

main();
