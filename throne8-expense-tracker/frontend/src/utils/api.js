import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

/**
 * Upload a PDF bank statement for parsing
 * @param {File} file - PDF file
 * @param {Object} budgets - Optional custom budget limits per category
 * @param {Function} onProgress - Upload progress callback (0-100)
 */
export async function uploadStatement(file, budgets = {}, onProgress) {
  const formData = new FormData();
  formData.append('statement', file);
  if (Object.keys(budgets).length > 0) {
    formData.append('budgets', JSON.stringify(budgets));
  }

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return response.data;
}

/**
 * Load demo data (no PDF needed)
 */
export async function loadDemoData() {
  const response = await api.get('/upload/demo');
  return response.data;
}

/**
 * Get all supported categories
 */
export async function getCategories() {
  const response = await api.get('/transactions/categories');
  return response.data;
}
