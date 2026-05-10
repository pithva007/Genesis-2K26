const { google } = require('googleapis');
const fs = require('fs');

// Load .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const EMAIL = env.GOOGLE_CLIENT_EMAIL;
const KEY = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_ID = env.GOOGLE_SHEET_ID;

console.log('📧 Service Account:', EMAIL);
console.log('📄 Sheet ID:', SHEET_ID);
console.log('🔑 Key starts with:', KEY?.slice(0, 40));

if (!EMAIL || EMAIL.includes('your-service-account')) {
  console.log('❌ GOOGLE_CLIENT_EMAIL is still a placeholder!');
  process.exit(1);
}
if (!SHEET_ID || SHEET_ID.includes('your_google')) {
  console.log('❌ GOOGLE_SHEET_ID is still a placeholder!');
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: EMAIL,
  key: KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

sheets.spreadsheets.values.append({
  spreadsheetId: SHEET_ID,
  range: 'Sheet1!A1',
  valueInputOption: 'RAW',
  requestBody: { values: [['TEST', 'WORKING', new Date().toISOString()]] },
})
.then(() => console.log('✅ Google Sheets is working! Check your spreadsheet.'))
.catch(e => {
  console.log('❌ Error:', e.message);
  if (e.message.includes('not found')) {
    console.log('👉 Fix: Share the Google Sheet with your service account email as Editor');
  }
  if (e.message.includes('DECODER') || e.message.includes('unsupported')) {
    console.log('👉 Fix: Your GOOGLE_PRIVATE_KEY format is wrong in .env.local');
  }
  if (e.message.includes('invalid_grant') || e.message.includes('unauthorized')) {
    console.log('👉 Fix: Service account credentials are wrong or expired');
  }
});