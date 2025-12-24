import { AuthResponse } from "../types";

const API_BASE_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

export const registerUser = async (data: any): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    // Handle backend specific error arrays or messages
    const msg = result.message || (result.errors && result.errors[0]?.msg) || 'Registration failed';
    throw new Error(msg);
  }
  return result;
};

export const loginUser = async (data: any): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Login failed');
  }
  return result;
};

export const logoutUser = async (token: string): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}/users/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
    });
  } catch (error) {
    console.error("Logout error", error);
  }
};
