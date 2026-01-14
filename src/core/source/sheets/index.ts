/**
 * Core Source Layer - Google Sheets Implementation
 * This layer interacts directly with the external Google Sheets API.
 */

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  sheets: string[];
}

/**
 * Fetches basic metadata about a spreadsheet, including available sheets.
 */
export async function getSpreadsheetMetadata(accessToken: string, spreadsheetId: string): Promise<SpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    id: spreadsheetId,
    title: data.properties.title,
    sheets: data.sheets.map((s: any) => s.properties.title),
  };
}

/**
 * Fetches the first row (headers) of a specific sheet.
 */
export async function getSheetHeaders(accessToken: string, spreadsheetId: string, sheetName: string): Promise<string[]> {
  const range = `${sheetName}!1:1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  if (!data.values || data.values.length === 0) {
    return [];
  }

  return data.values[0];
}

/**
 * Fetches all rows from a specific sheet.
 */
export async function getSheetRows(accessToken: string, spreadsheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Required columns for any ONCA Master Tracker
 */
export const REQUIRED_TRACKER_COLUMNS = [
  'Date',
  'Ref ID',
  'Entity',
  'Description',
  'Amount',
  'Currency',
  'Type',
  'Category'
];

/**
 * Optional columns that ONCA can handle if present
 */
export const OPTIONAL_TRACKER_COLUMNS = [
  'Doc Link',
  'GST %',
  'TDS %',
  'Status',
  'Context'
];

/**
 * All allowed columns for the ONCA Master Tracker
 */
export const MASTER_TRACKER_COLUMNS = [...REQUIRED_TRACKER_COLUMNS, ...OPTIONAL_TRACKER_COLUMNS];

/**
 * Validates if the headers match the ONCA Master Tracker structure.
 * Returns true if all REQUIRED columns are present.
 */
export function validateTrackerStructure(headers: string[]): boolean {
  if (!headers || headers.length === 0) return false;

  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());

  // Check if all REQUIRED columns are present
  return REQUIRED_TRACKER_COLUMNS.every(col =>
    normalizedHeaders.includes(col.toLowerCase())
  );
}

/**
 * Extracts spreadsheet ID from a URL.
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * OAuth Token Response Interface
 */
export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Spreadsheet List Item Interface
 */
export interface SpreadsheetListItem {
  id: string;
  name: string;
  url: string;
  modifiedTime: string;
}

/**
 * Exchange OAuth authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || response.statusText}`);
  }

  return response.json();
}

/**
 * List all Google Sheets accessible to the user via Google Drive API
 */
export async function listUserSpreadsheets(accessToken: string): Promise<SpreadsheetListItem[]> {
  const query = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink,modifiedTime)&orderBy=modifiedTime desc&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || response.statusText;
    console.error(`[DEBUG] Google Drive API List failed with status ${response.status}:`, message);
    throw new Error(`Google API Error (${response.status}): ${message}`);
  }

  const data = await response.json();

  if (!data.files) {
    return [];
  }

  return data.files.map((file: any) => ({
    id: file.id,
    name: file.name,
    url: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
    modifiedTime: file.modifiedTime || new Date().toISOString(),
  }));
}
