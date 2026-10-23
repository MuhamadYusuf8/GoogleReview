"use client";

import { useState, useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  createMerchantAction,
  updateMerchantAction,
  toggleMerchantStatusAction,
  deleteMerchantAction,
} from "@/app/actions/merchants";
import { buildReviewUrl } from "@/lib/validations";

type Merchant = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_phone: string | null;
  google_place_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  links?: { count: number }[];
};

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "Menyimpan..." : label}
    </button>
  );
}

function MerchantModal({
  merchant,
  onClose,
}: {
  merchant?: Merchant | null;
  onClose: () => void;
}) {
  const isEdit = !!merchant;
  const action = isEdit ? updateMerchantAction : createMerchantAction;
  const [state, formAction] = useActionState(action, { success: false });
  const [placeId, setPlaceId] = useState(merchant?.google_place_id ?? "");

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "Edit Merchant" : "Tambah Merchant Baru"}</h2>
          <button className="modal-close" onClick={onClose} id="merchant-modal-close">×</button>
        </div>

        {state.error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {state.error}</div>
        )}

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isEdit && <input type="hidden" name="id" value={merchant.id} />}
          {isEdit && <input type="hidden" name="is_active" value={String(merchant.is_active)} />}

          <div className="form-group">
            <label className="form-label">Nama Merchant *</label>
            <input id="merchant-name" name="name" className="form-input" required defaultValue={merchant?.name} placeholder="Kopi Senja Tebet" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Nama Kontak</label>
              <input id="merchant-contact-name" name="contact_name" className="form-input" defaultValue={merchant?.contact_name ?? ""} placeholder="Budi Santoso" />
            </div>
            <div className="form-group">
              <label className="form-label">Nomor HP</label>
              <input id="merchant-contact-phone" name="contact_phone" className="form-input" defaultValue={merchant?.contact_phone ?? ""} placeholder="08123456789" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Google Place ID</label>
            <input
              id="merchant-place-id"
              name="google_place_id"
              className="form-input"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
            {placeId && (
              <div style={{ marginTop: 6 }}>
                <a
                  href={buildReviewUrl(placeId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8125rem", color: "var(--color-primary)" }}
                >
                  🔗 Preview URL Review →
                </a>
              </div>
            )}
            <span className="form-hint">Digunakan untuk generate URL ulasan Google Maps secara otomatis.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Internal</label>
            <textarea id="merchant-notes" name="notes" className="form-textarea" defaultValue={merchant?.notes ?? ""} placeholder="Informasi tambahan tentang merchant ini..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <SubmitBtn label={isEdit ? "Simpan Perubahan" : "Tambah Merchant"} />
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MerchantsClient({ initialMerchants }: { initialMerchants: Merchant[] }) {
  const [merchants, setMerchants] = useState(initialMerchants);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [deletingMerchant, setDeletingMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => { setMerchants(initialMerchants); }, [initialMerchants]);

  const filtered = merchants.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.contact_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (merchant: Merchant) => {
    setLoading(merchant.id);
    await toggleMerchantStatusAction(merchant.id, !merchant.is_active);
    setMerchants((prev) =>
      prev.map((m) => m.id === merchant.id ? { ...m, is_active: !m.is_active } : m)
    );
    setLoading(null);
  };

  const handleDelete = async () => {
    if (!deletingMerchant) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const res = await deleteMerchantAction(deletingMerchant.id);
    if (res.success) {
      setMerchants((prev) => prev.filter((m) => m.id !== deletingMerchant.id));
      setDeletingMerchant(null);
    } else {
      setDeleteError(res.error ?? "Gagal menghapus merchant");
    }
    setDeleteLoading(false);
  };

  return (
    <>
      {/* Search + Add */}
      <div className="search-bar mb-6">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="merchant-search"
            className="form-input"
            placeholder="Cari nama merchant atau kontak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          id="add-merchant-btn"
          className="btn btn-primary"
          onClick={() => { setEditingMerchant(null); setShowModal(true); }}
        >
          + Tambah Merchant
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="table-wrapper desktop-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Kontak</th>
              <th>Links</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                  {search ? "Tidak ada merchant yang cocok." : "Belum ada merchant. Klik 'Tambah Merchant' untuk mulai."}
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const linkCount = Array.isArray(m.links) ? (m.links[0] as { count: number })?.count ?? 0 : 0;
                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{m.name}</div>
                      {m.notes && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>{m.notes}</div>
                      )}
                    </td>
                    <td>
                      {m.contact_name && <div>{m.contact_name}</div>}
                      {m.contact_phone && (
                        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{m.contact_phone}</div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{linkCount}</span>
                    </td>
                    <td>
                      <span className={`badge ${m.is_active ? "badge-active" : "badge-archived"}`}>
                        {m.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button
                          id={`edit-merchant-${m.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditingMerchant(m); setShowModal(true); }}
                          title="Edit Merchant"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          id={`toggle-merchant-${m.id}`}
                          className={`btn btn-sm ${m.is_active ? "btn-secondary" : "btn-primary"}`}
                          style={m.is_active ? { color: "var(--color-warning)", borderColor: "rgba(245,158,11,0.3)" } : {}}
                          onClick={() => handleToggle(m)}
                          disabled={loading === m.id}
                          title={m.is_active ? "Nonaktifkan merchant" : "Aktifkan merchant"}
                        >
                          {loading === m.id ? "..." : m.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          id={`delete-merchant-${m.id}`}
                          className="btn btn-danger btn-sm"
                          onClick={() => { setDeleteError(null); setDeletingMerchant(m); }}
                          title="Hapus Merchant"
                        >
                          🗑️ Hapus
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
            {search ? "Tidak ada merchant yang cocok." : "Belum ada merchant. Klik '+ Tambah Merchant' untuk mulai."}
          </div>
        ) : (
          filtered.map((m) => {
            const linkCount = Array.isArray(m.links) ? (m.links[0] as { count: number })?.count ?? 0 : 0;
            return (
              <div key={m.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {m.name}
                    </div>
                    {m.notes && (
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                        {m.notes}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${m.is_active ? "badge-active" : "badge-archived"}`}>
                    {m.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  {(m.contact_name || m.contact_phone) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span>👤</span>
                      <span>
                        {m.contact_name} {m.contact_phone && (
                          <a href={`tel:${m.contact_phone}`} style={{ color: "var(--color-primary)", marginLeft: 4 }}>
                            ({m.contact_phone})
                          </a>
                        )}
                      </span>
                    </div>
                  )}
                  <div style={{ marginLeft: "auto", background: "rgba(59,130,246,0.1)", color: "var(--color-primary)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 600, fontSize: "0.75rem" }}>
                    🔗 {linkCount} link
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button
                    id={`mobile-edit-merchant-${m.id}`}
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditingMerchant(m); setShowModal(true); }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    id={`mobile-toggle-merchant-${m.id}`}
                    className={`btn btn-sm ${m.is_active ? "btn-secondary" : "btn-primary"}`}
                    style={m.is_active ? { color: "var(--color-warning)", borderColor: "rgba(245,158,11,0.3)" } : {}}
                    onClick={() => handleToggle(m)}
                    disabled={loading === m.id}
                  >
                    {loading === m.id ? "..." : m.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    id={`mobile-delete-merchant-${m.id}`}
                    className="btn btn-danger btn-sm"
                    onClick={() => { setDeleteError(null); setDeletingMerchant(m); }}
                  >
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Edit / Tambah */}
      {showModal && (
        <MerchantModal
          merchant={editingMerchant}
          onClose={() => { setShowModal(false); setEditingMerchant(null); }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingMerchant && (
        <div className="modal-overlay" onClick={() => !deleteLoading && setDeletingMerchant(null)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-danger)" }}>
                <span>🗑️</span>
                <span>Hapus Merchant</span>
              </h2>
              <button
                className="modal-close"
                disabled={deleteLoading}
                onClick={() => setDeletingMerchant(null)}
                id="cancel-delete-x-btn"
              >
                ×
              </button>
            </div>

            {deleteError && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {deleteError}</div>
            )}

            <p style={{ color: "var(--color-text-primary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 16 }}>
              Apakah Anda yakin ingin menghapus merchant <strong>{deletingMerchant.name}</strong>?
            </p>

            {((Array.isArray(deletingMerchant.links) ? (deletingMerchant.links[0] as { count: number })?.count ?? 0 : 0) > 0) && (
              <div className="alert alert-warning" style={{ fontSize: "0.8125rem", marginBottom: 16 }}>
                <span>⚠️</span>
                <div>
                  <strong>Perhatian:</strong> Merchant ini memiliki{" "}
                  <strong>
                    {Array.isArray(deletingMerchant.links) ? (deletingMerchant.links[0] as { count: number })?.count ?? 0 : 0} link aktif
                  </strong>.
                  Menghapus merchant ini juga akan <strong>menghapus semua link dan data scan terkait</strong> secara permanen!
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleteLoading}
                onClick={() => setDeletingMerchant(null)}
                id="cancel-delete-btn"
              >
                Batal
              </button>
              <button
                type="button"
                id="confirm-delete-merchant-btn"
                className="btn btn-danger"
                disabled={deleteLoading}
                onClick={handleDelete}
              >
                {deleteLoading ? "Menghapus..." : "🗑️ Ya, Hapus Merchant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
