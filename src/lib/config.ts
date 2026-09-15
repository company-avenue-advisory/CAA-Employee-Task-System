const getPrivateKey = () => {
  let key = (process.env.GOOGLE_PRIVATE_KEY || '').trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
};

const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').trim();
const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL || '').trim();
const privateKey = getPrivateKey();

const hasValidGoogleCredentials = Boolean(spreadsheetId && clientEmail && privateKey);

export const CONFIG = {
  // Demo Mode is active ONLY if explicitly set (DEMO_MODE === 'true') OR if Google credentials are missing.
  // When valid Google credentials exist and DEMO_MODE is not 'true', Google Sheets mode is active (isDemoMode = false).
  isDemoMode: process.env.DEMO_MODE === 'true' ? true : !hasValidGoogleCredentials,
  googleSheets: {
    spreadsheetId,
    clientEmail,
    privateKey,
  },
};
