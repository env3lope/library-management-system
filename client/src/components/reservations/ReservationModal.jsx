import { useState } from "react";
import useResource from "../../hooks/useResource";
import { api } from "../../services/api";
import Message from "../ui/Message";
import Modal from "../ui/Modal";

const labelClassName = "grid gap-label text-label font-semibold text-text-label";
const selectClassName =
  "min-h-field w-full rounded-control border border-border-control bg-white px-field-x text-xs text-ink-soft";
const buttonClassName =
  "inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent px-4 text-xs font-semibold transition hover:-translate-y-px";

function ReservationModal({ isManager, onClose, onSaved }) {
  const { data: booksData, error: booksError } = useResource("/books");
  const { data: usersData, error: usersError } = useResource("/users");
  const books = (booksData?.books || []).filter(
    (book) => Number(book.availableCopies) > 0,
  );
  const users = usersData?.users || [];
  const [bookId, setBookId] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const loading = !booksData || (isManager && !usersData);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/reservations", {
        method: "POST",
        body: JSON.stringify({
          bookId: Number(bookId),
          ...(isManager ? { userId: Number(userId) } : {}),
        }),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Створити резервування" onClose={onClose}>
      {booksError && <Message kind="error">{booksError}</Message>}
      {usersError && <Message kind="error">{usersError}</Message>}
      <form className="grid gap-form-gap" onSubmit={submit}>
        {isManager && (
          <label className={labelClassName}>
            Читач
            <select
              className={selectClassName}
              required
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            >
              <option value="">Оберіть читача</option>
              {users.map((reader) => (
                <option key={reader.id} value={reader.id}>
                  {reader.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={labelClassName}>
          Книжка
          <select
            className={selectClassName}
            required
            value={bookId}
            onChange={(event) => setBookId(event.target.value)}
          >
            <option value="">Оберіть книжку</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — доступно: {book.availableCopies}
              </option>
            ))}
          </select>
        </label>
        {booksData && books.length === 0 && (
          <p className="m-0 text-label text-warning">
            Немає доступних примірників для резервування.
          </p>
        )}
        {error && (
          <p className="m-0 text-label text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-inline">
          <button
            type="button"
            className={`${buttonClassName} border-border-quiet bg-white text-text-button hover:bg-surface-hover`}
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            className={`${buttonClassName} bg-primary text-white hover:bg-primary-hover`}
            disabled={
              saving ||
              loading ||
              books.length === 0 ||
              (isManager && users.length === 0)
            }
          >
            {saving ? "Створюємо…" : "Зарезервувати"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ReservationModal;
