import { create } from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!baseURL) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');
}

const apiClient = create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
