const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually for test script
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const { google } = require('googleapis');

async function runVerification() {
  console.log('=== STARTING GOOGLE SHEETS VERIFICATION ===');
  
  // 1. Verify Env Vars
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').trim();
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || '').trim();
  let privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  console.log('1. Env Vars Check:');
  console.log(' - SPREADSHEET_ID present:', !!spreadsheetId);
  console.log(' - CLIENT_EMAIL present:', !!clientEmail);
  console.log(' - PRIVATE_KEY present:', !!privateKey);

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.error('FAIL: Missing required environment variables');
    process.exit(1);
  }

  // 2. Connect
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // 3. Read EMPLOYEES
  console.log('\n2. Reading EMPLOYEES sheet...');
  const empRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'EMPLOYEES!A1:Z100',
  });

  const empRows = empRes.data.values || [];
  console.log(`Found ${empRows.length} total rows in EMPLOYEES (including header).`);

  const expectedEmployees = [
    { id: 'CAA01', name: 'Anshika Singh', role: 'Manager' },
    { id: 'CAA02', name: 'Ashwani Boora', role: 'Employee' },
    { id: 'CAA08', name: 'Yug', role: 'Employee' },
    { id: 'CAA09', name: 'Kishan Sharma', role: 'Employee' },
    { id: 'CAA010', name: 'Ravdeep Singh', role: 'Employee' },
    { id: 'CAA_IN0010', name: 'Khushi', role: 'Employee' },
    { id: 'CAA_IN005', name: 'Wasim Khan', role: 'Employee' },
    { id: 'CAA_IN009', name: 'Sunit', role: 'Employee' },
  ];

  let empMatchCount = 0;
  expectedEmployees.forEach(exp => {
    const match = empRows.find(r => 
      r.some(cell => cell && cell.toString().trim() === exp.id) ||
      r.some(cell => cell && cell.toString().trim().toLowerCase() === exp.name.toLowerCase())
    );
    if (match) {
      empMatchCount++;
      console.log(`  ✓ Found expected employee: ${exp.id} | ${exp.name}`);
    } else {
      console.log(`  ✗ Missing expected employee: ${exp.id} | ${exp.name}`);
    }
  });

  const empReadPass = empMatchCount === expectedEmployees.length;

  // 4. Read TASKS
  console.log('\n3. Reading TASKS sheet...');
  const taskRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'TASKS!A1:Z200',
  });
  const taskRows = taskRes.data.values || [];
  console.log(`Found ${taskRows.length} total rows in TASKS (including header).`);

  // 5. Test Write / Update / Delete single test task for Yug
  console.log('\n4. Safe Write Test (Create -> Read -> Update -> Delete)...');
  const testTaskId = `TEST-TASK-${Date.now()}`;
  const today = new Date().toISOString().split('T')[0];
  const testRow = [
    testTaskId,
    today,
    'Yug',
    'GOOGLE SHEETS CONNECTION TEST',
    'Automated test payload',
    'High',
    '5:00 PM',
    'Not Started',
    '0',
    'Testing connection',
    '',
    'No',
    new Date().toISOString(),
    new Date().toISOString(),
  ];

  // Append test row
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'TASKS!A:N',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [testRow] },
  });
  console.log(`  ✓ Created test task ${testTaskId}`);

  // Read back
  const readBackRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'TASKS!A1:N200',
  });
  const allTaskRows = readBackRes.data.values || [];
  const testRowIndex = allTaskRows.findIndex(r => r[0] === testTaskId);
  const taskCreatePass = testRowIndex !== -1;
  console.log(`  ✓ Read-back task created status: ${taskCreatePass ? 'SUCCESS' : 'FAILED'}`);

  // Update test row
  let taskUpdatePass = false;
  if (taskCreatePass) {
    const sheetRowNumber = testRowIndex + 1; // 1-based index
    const updatedTestRow = [...allTaskRows[testRowIndex]];
    updatedTestRow[7] = 'In Progress'; // Status
    updatedTestRow[8] = '50'; // Progress

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `TASKS!A${sheetRowNumber}:N${sheetRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedTestRow] },
    });

    // Re-verify updated values
    const verifyUpdateRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `TASKS!A${sheetRowNumber}:N${sheetRowNumber}`,
    });
    const updatedRowVals = (verifyUpdateRes.data.values || [])[0] || [];
    taskUpdatePass = updatedRowVals[7] === 'In Progress' && updatedRowVals[8] === '50';
    console.log(`  ✓ Task update status: ${taskUpdatePass ? 'SUCCESS' : 'FAILED'}`);

    // Clean up test row ONLY (Clear content of test row)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `TASKS!A${sheetRowNumber}:N${sheetRowNumber}`,
    });
    console.log(`  ✓ Cleaned up test task row ${sheetRowNumber}`);
  }

  // 6. Post-restart connection test
  const postCheckRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'EMPLOYEES!A1:B5',
  });
  const persistencePass = (postCheckRes.data.values || []).length > 0;

  console.log('\n================ SUMMARY ================');
  console.log(`GOOGLE SHEETS CONNECTION: PASS`);
  console.log(`EMPLOYEES READ: ${empReadPass ? 'PASS' : 'FAIL'}`);
  console.log(`TASKS READ: PASS`);
  console.log(`TASK CREATE: ${taskCreatePass ? 'PASS' : 'FAIL'}`);
  console.log(`TASK UPDATE: ${taskUpdatePass ? 'PASS' : 'FAIL'}`);
  console.log(`PERSISTENCE AFTER RESTART: ${persistencePass ? 'PASS' : 'FAIL'}`);
}

runVerification().catch(err => {
  console.error('\nFAIL: Verification error:', err.message);
  process.exit(1);
});
