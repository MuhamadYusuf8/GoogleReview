export default function RootLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg, #0a0f1e)",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid rgba(99, 102, 241, 0.15)",
          borderTopColor: "var(--color-primary, #3b82f6)",
          borderRightColor: "var(--color-info, #6366f1)",
          animation: "spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
        }}
      />
      <div
        style={{
          fontSize: "0.85rem",
          fontWeight: 500,
          color: "var(--color-text-muted, #64748b)",
          letterSpacing: "0.05em",
        }}
      >
        Memuat...
      </div>
    </div>
  );
}
