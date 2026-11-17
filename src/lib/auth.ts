"use client";

import { users, type UserRole } from "./mock-data";

const PASSWORDS: Record<UserRole, string> = {
  admin: "admin123",
  musyrif: "musyrif123",
  anggota: "anggota123",
};

const CURRENT_ROLE_KEY = "currentRole";
const CURRENT_EMAIL_KEY = "currentEmail";

export function loginUser(role: UserRole, email: string, password: string) {
  if (typeof window === "undefined") return false;
  const user = users.find((u) => u.role === role && u.email === email);
  if (!user) return false;
  if (password !== PASSWORDS[role]) return false;
  localStorage.setItem(CURRENT_ROLE_KEY, role);
  localStorage.setItem(CURRENT_EMAIL_KEY, email);
  return true;
}

export function loginAdmin(email: string, password: string) {
  return loginUser("admin", email, password);
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_ROLE_KEY);
  localStorage.removeItem(CURRENT_EMAIL_KEY);
}

export function logoutAdmin() {
  if (typeof window === "undefined") return;

  logoutUser();
  void fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  }).finally(() => {
    window.location.href = "/";
  });
}

export function getCurrentRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CURRENT_ROLE_KEY);
  if (value === "admin" || value === "musyrif" || value === "anggota") {
    return value;
  }
  return null;
}

export function isAdmin() {
  return getCurrentRole() === "admin";
}

export function getCurrentEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_EMAIL_KEY);
}
