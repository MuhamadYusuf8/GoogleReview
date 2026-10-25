"use client";

import { useState, useActionState, useEffect, useCallback, useRef } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import {
  createLinkAction,
  updateLinkTargetAction,
  updateLinkStatusAction,
  deleteLinkAction,
  checkSlugAvailabilityAction,
} from "@/app/actions/links";
import { SLUG_PATTERN, normalizeSlug } from "@/lib/validations";

const QRGenerator = dynamic(() => import("./QRGenerator"), { ssr: false });

type LinkRow = {
  id: string;
  slug: string;
  label: string | null;
  target_url: string;
  status: "active" | "paused" | "archived";
  created_at: string;
  updated_at: string;
  scan_count: number;
  merchants: { id: string; name: string } | { id: string; name: string }[] | null;
};

type Merchant = { id: string; name: string };

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

// ── Create Link Modal ──────────────────────────────────────────────────────────
function CreateLinkModal({
  merchants,
  onClose,
}: {
  merchants: Merchant[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(createLinkAction, { success: false });
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (state.success) onClose(); }, [state.success, onClose]);

  // Real-time slug check
  const checkSlug = useCallback(async (value: string) => {
    const normalized = normalizeSlug(value);
    if (!normalized || normalized.length < 3 || !SLUG_PATTERN.test(normalized)) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const { available } = await checkSlugAvailabilityAction(normalized);
    setSlugStatus(available ? "available" : "taken");
  }, []);

  const handleSlugChange = (val: string) => {
    setSlug(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkSlug(val), 400);
  };

  const applyPlaceId = () => {
    if (selectedPlaceId.trim()) {
      setTargetUrl(`https://search.google.com/local/writereview?placeid=${selectedPlaceId.trim()}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2 className="modal-title">Buat Link & QR Baru</h2>
          <button className="modal-close" onClick={onClose} id="create-link-close">×</button>
        </div>

        {state.error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {state.error}</div>
        )}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Merchant *</label>
            <select id="link-merchant" name="merchant_id" className="form-select" required>
              <option value="">Pilih merchant...</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Slug * <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(permanen, tidak bisa diubah setelah dibuat)</span></label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--color-text-muted)", fontSize: "0.9rem", pointerEvents: "none",
              }}>/r/</span>
              <input
                id="link-slug"
                name="slug"
                className="form-input"
                style={{ paddingLeft: 36 }}
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="kopi-senja-tebet"
                pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
              />
            </div>
            {slug.length >= 3 && (
              <div className={`slug-indicator ${slugStatus}`}>
                {slugStatus === "checking" && "⏳ Mengecek..."}
                {slugStatus === "available" && "✅ Slug tersedia!"}
                {slugStatus === "taken" && "❌ Slug sudah dipakai, pilih yang lain."}
              </div>
            )}
            <span className="form-hint">3–40 karakter, huruf kecil, angka, tanda hubung. Contoh: kopi-senja-tebet</span>
          </div>

          <div className="form-group">
            <label className="form-label">Label / Nama Kartu</label>
            <input id="link-label" name="label" className="form-input" placeholder="Kartu Review Meja Area VIP" />
          </div>

          {/* Place ID Helper */}
          <div style={{
            background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", padding: 14,
          }}>
            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
              🗺️ Pembantu Place ID (opsional)
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="place-id-helper"
                className="form-input"
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={applyPlaceId}>
                Terapkan
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target URL * <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(halaman ulasan Google)</span></label>
            <input
              id="link-target-url"
              name="target_url"
              className="form-input"
              required
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
            {targetUrl && (
              <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", color: "var(--color-primary)" }}>
                🔗 Uji tautan →
              </a>
            )}
            <span className="form-hint">Harus HTTPS dan mengarah ke domain Google yang diizinkan.</span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <SubmitBtn label="Buat Link & QR" />
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Link Modal ────────────────────────────────────────────────────────────
function EditLinkModal({ link, onClose }: { link: LinkRow; onClose: () => void }) {
  const [state, formAction] = useActionState(updateLinkTargetAction, { success: false });
  const [targetUrl, setTargetUrl] = useState(link.target_url);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => { if (state.success) onClose(); }, [state.success, onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Target URL</h2>
          <button className="modal-close" onClick={onClose} id="edit-link-close">×</button>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          ⚠️ Mengubah target URL akan langsung memengaruhi seluruh kartu fisik yang memakai slug <strong>/{link.slug}</strong>
        </div>

        {state.error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {state.error}</div>
        )}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="link_id" value={link.id} />

          <div className="form-group">
            <label className="form-label">Label</label>
            <input id="edit-link-label" name="label" className="form-input" defaultValue={link.label ?? ""} placeholder="Nama kartu" />
          </div>

          <div className="form-group">
            <label className="form-label">Target URL Baru *</label>
            <input
              id="edit-link-target-url"
              name="target_url"
              className="form-input"
              required
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
            {targetUrl && (
              <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", color: "var(--color-primary)" }}>
                🔗 Uji tautan →
              </a>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <SubmitBtn label="Simpan Perubahan" />
          </div>
        </form>
      </div>
    </div>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────
function QRModal({ link, onClose }: { link: LinkRow; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">QR Code – /{link.slug}</h2>
            {link.label && <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 4 }}>{link.label}</p>}
          </div>
          <button className="modal-close" onClick={onClose} id="qr-modal-close">×</button>
        </div>
        <QRGenerator slug={link.slug} />
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = { active: "Aktif", paused: "Dijeda", archived: "Diarsipkan" };

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LinksClient({
  initialLinks,
  merchants,
}: {
  initialLinks: LinkRow[];
  merchants: Merchant[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "archived">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkRow | null>(null);
  const [qrLink, setQrLink] = useState<LinkRow | null>(null);
  const [deletingLink, setDeletingLink] = useState<LinkRow | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [deleteLinkLoading, setDeleteLinkLoading] = useState(false);
  const [deleteLinkError, setDeleteLinkError] = useState<string | null>(null);

  useEffect(() => { setLinks(initialLinks); }, [initialLinks]);

  const filtered = links.filter((l) => {
    const merchant = Array.isArray(l.merchants) ? l.merchants[0] : l.merchants;
    const matchSearch =
      l.slug.includes(search.toLowerCase()) ||
      (l.label ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (merchant?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (link: LinkRow, status: "active" | "paused" | "archived") => {
    setStatusLoading(link.id);
    await updateLinkStatusAction(link.id, status);
    setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, status } : l));
    setStatusLoading(null);
  };

  const handleDeleteLink = async () => {
    if (!deletingLink) return;
    setDeleteLinkLoading(true);
    setDeleteLinkError(null);
    const res = await deleteLinkAction(deletingLink.id);
    if (res.success) {
      setLinks((prev) => prev.filter((l) => l.id !== deletingLink.id));
      setDeletingLink(null);
    } else {
      setDeleteLinkError(res.error ?? "Gagal menghapus link");
    }
    setDeleteLinkLoading(false);
  };

  return (
    <>
      {/* Controls */}
      <div className="search-bar mb-6">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="links-search"
            className="form-input"
            placeholder="Cari slug, label, atau merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="links-status-filter"
          className="form-select"
          style={{ width: "auto", minWidth: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="paused">Dijeda</option>
          <option value="archived">Diarsipkan</option>
        </select>
        <button
          id="create-link-btn"
          className="btn btn-primary"
          onClick={() => setShowCreate(true)}
        >
          + Link Baru
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="table-wrapper desktop-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Slug / Label</th>
              <th>Merchant</th>
              <th>Target URL</th>
              <th>Scan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                  {search || statusFilter !== "all" ? "Tidak ada link yang cocok." : "Belum ada link. Klik 'Link Baru' untuk mulai."}
                </td>
              </tr>
            ) : (
              filtered.map((link) => {
                const merchant = Array.isArray(link.merchants) ? link.merchants[0] : link.merchants;
                return (
                  <tr key={link.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--color-primary)", fontFamily: "monospace" }}>
                        /{link.slug}
                      </div>
                      {link.label && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {link.label}
                        </div>
                      )}
                    </td>
                    <td>{merchant?.name ?? "—"}</td>
                    <td>
                      <a
                        href={link.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate"
                        style={{ maxWidth: 240, display: "block", fontSize: "0.8125rem" }}
                        title={link.target_url}
                      >
                        {link.target_url.length > 50
                          ? link.target_url.slice(0, 50) + "..."
                          : link.target_url}
                      </a>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {link.scan_count.toLocaleString("id")}
                      </span>
                    </td>
                    <td>
                      <select
                        id={`link-status-${link.id}`}
                        className="form-select"
                        style={{ padding: "4px 8px", fontSize: "0.8125rem", width: "auto" }}
                        value={link.status}
                        disabled={statusLoading === link.id}
                        onChange={(e) =>
                          handleStatusChange(link, e.target.value as "active" | "paused" | "archived")
                        }
                      >
                        <option value="active">Aktif</option>
                        <option value="paused">Dijeda</option>
                        <option value="archived">Diarsipkan</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <a
                          href={`/review/${link.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          title="Uji Halaman Review Filter (⭐ 1-3 ke WA, 4-5 ke Google)"
                          style={{ textDecoration: "none", color: "var(--color-warning)" }}
                        >
                          ⭐ Tes Review
                        </a>
                        <button
                          id={`qr-btn-${link.id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => setQrLink(link)}
                          title="Lihat & Unduh QR"
                        >
                          📷 QR
                        </button>
                        <button
                          id={`edit-link-${link.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditingLink(link)}
                          title="Edit target URL"
                        >
                          ✏️
                        </button>
                        <button
                          id={`delete-link-${link.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => { setDeleteLinkError(null); setDeletingLink(link); }}
                          title="Hapus Link"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< 769px) */}
      <div className="mobile-card-list">
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--color-text-muted)" }}>
            {search || statusFilter !== "all" ? "Tidak ada link yang cocok." : "Belum ada link. Klik '+ Link Baru' untuk mulai."}
          </div>
        ) : (
          filtered.map((link) => {
            const merchant = Array.isArray(link.merchants) ? link.merchants[0] : link.merchants;
            return (
              <div key={link.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary)", fontFamily: "monospace" }}>
                      /{link.slug}
                    </div>
                    {link.label && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {link.label}
                      </div>
                    )}
                  </div>
                  <select
                    id={`mobile-link-status-${link.id}`}
                    className="form-select"
                    style={{ padding: "4px 8px", fontSize: "0.75rem", width: "auto", minHeight: 34 }}
                    value={link.status}
                    disabled={statusLoading === link.id}
                    onChange={(e) =>
                      handleStatusChange(link, e.target.value as "active" | "paused" | "archived")
                    }
                  >
                    <option value="active">Aktif</option>
                    <option value="paused">Dijeda</option>
                    <option value="archived">Diarsipkan</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem" }}>
                  <div style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🏪</span>
                    <strong style={{ color: "var(--color-text-primary)" }}>{merchant?.name ?? "—"}</strong>
                  </div>
                  <div style={{ background: "rgba(59,130,246,0.1)", color: "var(--color-primary)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700, fontSize: "0.75rem" }}>
                    📊 {link.scan_count.toLocaleString("id")} scan
                  </div>
                </div>

                <div style={{
                  background: "var(--color-bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ marginRight: 6 }}>🎯</span>
                  <a
                    href={link.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {link.target_url}
                  </a>
                </div>

                <div className="mobile-card-actions">
                  <button
                    id={`mobile-qr-btn-${link.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => setQrLink(link)}
                  >
                    📷 QR & NFC
                  </button>
                  <a
                    href={`/review/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ textDecoration: "none", color: "var(--color-warning)" }}
                  >
                    ⭐ Tes Review
                  </a>
                  <button
                    id={`mobile-edit-btn-${link.id}`}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditingLink(link)}
                  >
                    ✏️ Edit Target
                  </button>
                  <button
                    id={`mobile-delete-btn-${link.id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => { setDeleteLinkError(null); setDeletingLink(link); }}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateLinkModal merchants={merchants} onClose={() => setShowCreate(false)} />
      )}
      {editingLink && (
        <EditLinkModal link={editingLink} onClose={() => setEditingLink(null)} />
      )}
      {qrLink && (
        <QRModal link={qrLink} onClose={() => setQrLink(null)} />
      )}

      {/* Modal Konfirmasi Hapus Link */}
      {deletingLink && (
        <div className="modal-overlay" onClick={() => !deleteLinkLoading && setDeletingLink(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-danger)" }}>
                <span>🗑️</span>
                <span>Hapus Link</span>
              </h2>
              <button
                className="modal-close"
                disabled={deleteLinkLoading}
                onClick={() => setDeletingLink(null)}
                id="cancel-delete-link-x-btn"
              >
                ×
              </button>
            </div>

            {deleteLinkError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {deleteLinkError}</div>
            )}

            <p style={{ color: "var(--color-text-primary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 16 }}>
              Apakah Anda yakin ingin menghapus short-link <code style={{ color: "var(--color-primary)", fontWeight: 700, fontFamily: "monospace" }}>/{deletingLink.slug}</code>?
            </p>

            <div className="alert alert-warning" style={{ fontSize: "0.8125rem", marginBottom: 16 }}>
              <span>⚠️</span>
              <div>
                Kartu fisik atau QR Code yang dicetak dengan tautan ini tidak akan dapat mengarahkan pengunjung lagi setelah dihapus. Data riwayat scan juga akan dihapus permanen.
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteLinkLoading}
                onClick={() => setDeletingLink(null)}
                id="cancel-delete-link-btn"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-delete-link-btn"
                className="btn btn-danger"
                disabled={deleteLinkLoading}
                onClick={handleDeleteLink}
              >
                {deleteLinkLoading ? "Menghapus..." : "🗑️ Ya, Hapus Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
