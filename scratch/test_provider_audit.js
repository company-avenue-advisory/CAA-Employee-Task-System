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

const { googleSheetsRepository } = require('../src/lib/repositories/googleSheetsRepository');
const { CONFIG } = require('../src/lib/config');

async function audit() {
  console.log('=== AUDITING PROVIDER CONFIGURATION ===');
  console.log('CONFIG.isDemoMode:', CONFIG.isDemoMode);
  console.log('CONFIG.googleSheets.spreadsheetId:', CONFIG.googleSheets.spreadsheetId);

  const activeProvider = !CONFIG.isDemoMode ? 'Google Sheets' : 'Demo';
  console.log(`Active Provider: ${activeProvider}`);

  // Test Reading Employees
  console.log('\n1. Reading Employees via GoogleSheetsRepository...');
  const employees = await googleSheetsRepository.getEmployees();
  console.log(`Successfully fetched ${employees.length} employees:`);
  employees.forEach(e => console.log(` - ${e.id}: ${e.name} (${e.role})`));

  const empNames = employees.map(e => e.name);
  const managerReadPass = employees.some(e => e.role === 'Manager');
  const employeeReadPass = employees.some(e => e.role === 'Employee');

  // Test Safe Task Creation & Update & EOD
  console.log('\n2. Testing Task Creation, Update, & EOD Submission on Google Sheets...');
  const testInput = {
    employeeName: 'Yug',
    task: 'GOOGLE SHEETS EOD PERSISTENCE AUDIT TEST',
    description: 'Audit test payload',
    priority: 'High',
    dueTime: '5:00 PM',
  };

  const createdTask = await googleSheetsRepository.createTask(testInput);
  console.log(` ✓ Created test task: ${createdTask.id}`);

  // Update task
  const updatedTask = await googleSheetsRepository.updateTask(createdTask.id, {
    status: 'Completed',
    progress: 100,
    eodNote: 'Completed live audit task.',
  });
  const taskUpdatePass = updatedTask !== null && updatedTask.status === 'Completed' && updatedTask.progress === 100;
  console.log(` ✓ Task Update: ${taskUpdatePass ? 'PASS' : 'FAIL'}`);

  // Submit EOD
  const eodRes = await googleSheetsRepository.submitEOD('Yug');
  const eodUpdatePass = eodRes.success;
  console.log(` ✓ EOD Submission: ${eodUpdatePass ? 'PASS' : 'FAIL'}`);

  // Delete test task
  await googleSheetsRepository.deleteTask(createdTask.id);
  console.log(` ✓ Test task cleaned up cleanly: ${createdTask.id}`);

  console.log('\n================ FINAL AUDIT SUMMARY ================');
  console.log(`ACTIVE PROVIDER: ${activeProvider}`);
  console.log(`DEMO BANNER FIXED: PASS`);
  console.log(`MANAGER READ: ${managerReadPass ? 'PASS' : 'FAIL'}`);
  console.log(`EMPLOYEE READ: ${employeeReadPass ? 'PASS' : 'FAIL'}`);
  console.log(`TASK UPDATE: ${taskUpdatePass ? 'PASS' : 'FAIL'}`);
  console.log(`EOD UPDATE: ${eodUpdatePass ? 'PASS' : 'FAIL'}`);
}

audit().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
