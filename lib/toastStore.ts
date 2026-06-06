"use client";
import { create } from "zustand";

type Toast = { id: number; message: string };
type ToastState = {
  toasts: Toast[];
  show: (message: string) => void;
  dismiss: (id: number) => void;
};

let counter = 0;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismiss(id), 2200);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
