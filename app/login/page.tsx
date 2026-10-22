"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import type { Metadata } from "next";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      id="login-submit-btn"
      type="submit"
      className="btn btn-primary w-full btn-lg"
      disabled={pending}
      style={{ marginTop: 8 }}
    >
      {pending ? (
        <>
          <span className="spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
          Masuk...
        </>
      ) : (
        "Masuk ke Dashboard"
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, { error: null });

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      background: "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 60%), var(--color-bg)",
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
      }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60,
            background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", margin: "0 auto 14px",
            boxShadow: "0 8px 32px rgba(59,130,246,0.4)",
          }}>📍</div>
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 1.75rem)", fontWeight: 800, marginBottom: 8, color: "var(--color-text-primary)" }}>
            ReviewLink
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Dashboard Admin · Masuk untuk mengelola kartu review
          </p>
        </div>

        {/* Form Card */}
        <div className="card-glass" style={{ padding: "clamp(20px, 6vw, 36px)" }}>
          {state?.error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@agensi.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <SubmitButton />
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 24 }}>
          Registrasi publik dinonaktifkan. Hubungi administrator.
        </p>
      </div>
    </div>
  );
}
