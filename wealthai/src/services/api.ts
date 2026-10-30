import { API_BASE_URL, getToken, removeToken } from '../config/api';
import { Transaction, Budget } from '../types';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Emits an event that App.tsx can listen to for global 401 handling
function triggerSessionExpired() {
  removeToken();
  if (typeof window !== "undefined") {
    const event = new CustomEvent("session-expired");
    window.dispatchEvent(event);
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    triggerSessionExpired();
    throw new AuthError("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `API request failed with status ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// -- Auth endpoints --
export async function loginUser(email: string, password: string) {
  // Using form-data if backend uses OAuth2PasswordRequestForm, but backend currently expects JSON
  // Let's assume standard JSON as we used in Python test scripts for POST /auth/login
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return fetchWithAuth('/auth/me');
}

// -- Dashboard endpoints --
export async function getDashboardData() {
  return fetchWithAuth('/dashboard/');
}

// -- Transactions endpoints --
export async function getTransactions(): Promise<any[]> {
  return fetchWithAuth('/transactions/');
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'date' | 'type'> & { transaction_date: string, transaction_type: string }) {
  return fetchWithAuth('/transactions/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// -- Budgets endpoints --
export async function getBudgets(): Promise<any[]> {
  return fetchWithAuth('/budgets/');
}

export async function createBudget(data: { category: string, limit_amount: number }) {
  return fetchWithAuth('/budgets/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// -- Insights endpoints --
export async function getInsights() {
  return fetchWithAuth('/insights/');
}

// -- AI endpoints --
export async function getAiAdvice() {
  return fetchWithAuth('/ai/advice', {
    method: 'POST'
  });
}

export async function sendChatMessage(message: string) {
  return fetchWithAuth('/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

// ── Report / Export endpoints ─────────────────────────────────────

/**
 * Fetches a binary (blob) response with JWT auth attached.
 * Kept separate from fetchWithAuth which always calls .json().
 */
async function fetchBlobWithAuth(endpoint: string): Promise<Blob> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

  if (response.status === 401) {
    triggerSessionExpired();
    throw new AuthError('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Report request failed with status ${response.status}`);
  }

  return response.blob();
}

/**
 * Triggers a browser download from a Blob with the given filename.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Download the full financial report as a PDF file. */
export async function downloadPdfReport(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const blob = await fetchBlobWithAuth('/report/pdf');
  triggerDownload(blob, `wealthai_report_${today}.pdf`);
}

/** Download all transactions as a CSV file. */
export async function downloadCsvReport(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const blob = await fetchBlobWithAuth('/report/csv');
  triggerDownload(blob, `wealthai_transactions_${today}.csv`);
}

