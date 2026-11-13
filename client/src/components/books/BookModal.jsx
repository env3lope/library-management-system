import { useState } from "react";
import { api } from "../../services/api";
import Modal from "../ui/Modal";

const labelClassName =
  "grid gap-label text-label font-semibold text-text-label";
const inputClassName =
  "min-h-field w-full rounded-control border border-border-control bg-surface px-field-x text-xs text-ink-soft outline-none placeholder:text-placeholder focus:border-input-focus focus:shadow-input-focus";
const buttonClassName =
  "inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent px-4 text-xs font-semibold transition hover:-translate-y-px";

function BookModal({ book, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: book.title || "",
    authors: book.authors || "",
    genres: book.genres || "",
    description: book.description || "",
    publicationYear: book.publicationYear || "",
    publisher: book.publisher || "",
    totalCopies: book.totalCopies || 1,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(book.id ? `/books/${book.id}` : "/books", {
        method: book.id ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          publicationYear: form.publicationYear
            ? Number(form.publicationYear)
            : null,
          totalCopies: Number(form.totalCopies),
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
    <Modal
      title={book.id ? "Редагувати книжку" : "Нова книжка"}
      onClose={onClose}
    >
      <form className="grid gap-form-gap" onSubmit={submit}>
        <label className={labelClassName}>
          Назва книжки
          <input
            className={inputClassName}
            required
            maxLength="180"
            value={form.title}
            onChange={update("title")}
          />
        </label>
        <label className={labelClassName}>
          Автори
          <input
            className={inputClassName}
            maxLength="500"
            value={form.authors}
            onChange={update("authors")}
            placeholder="Ім’я автора, ім’я співавтора"
          />
        </label>
        <label className={labelClassName}>
          Жанри
          <input
            className={inputClassName}
            maxLength="500"
            value={form.genres}
            onChange={update("genres")}
            placeholder="Роман, класика"
          />
        </label>
        <label className={labelClassName}>
          Опис
          <textarea
            className="min-h-19 w-full resize-y rounded-control border border-border-control bg-white px-field-x pt-2 text-xs text-ink-soft"
            rows="3"
            maxLength="5000"
            value={form.description}
            onChange={update("description")}
          />
        </label>
        <div className="grid grid-cols-2 gap-3 compact:grid-cols-1">
          <label className={labelClassName}>
            Рік видання
            <input
              className={inputClassName}
              type="number"
              min="1"
              max="9999"
              value={form.publicationYear}
              onChange={update("publicationYear")}
            />
          </label>
          <label className={labelClassName}>
            Кількість примірників
            <input
              className={inputClassName}
              type="number"
              min="1"
              max="10000"
              required
              value={form.totalCopies}
              onChange={update("totalCopies")}
            />
          </label>
        </div>
        <label className={labelClassName}>
          Видавництво
          <input
            className={inputClassName}
            maxLength="180"
            value={form.publisher}
            onChange={update("publisher")}
          />
        </label>
        {error && (
          <p className="m-0 text-label text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-1 flex justify-end gap-inline">
          <button
            type="button"
            className={`${buttonClassName} border border-border-quiet bg-white text-text-button hover:bg-surface-hover`}
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            className={`${buttonClassName} bg-primary text-white hover:bg-primary-hover`}
            disabled={saving}
          >
            {saving ? "Зберігаємо…" : "Зберегти книжку"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default BookModal;
