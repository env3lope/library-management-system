import { useState } from "react";
import { api } from "../../services/api";
import Modal from "../ui/Modal";

const labelClassName = "grid gap-label text-label font-semibold text-text-label";
const inputClassName =
  "min-h-field w-full rounded-control border border-border-control bg-surface px-field-x text-xs text-ink-soft outline-none placeholder:text-placeholder focus:border-input-focus focus:shadow-input-focus";
const buttonClassName =
  "inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent px-4 text-xs font-semibold transition hover:-translate-y-px";

function ReaderModal({ reader, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: reader.name || "",
    email: reader.email || "",
    phone: reader.phone || "",
    password: "",
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
      const details = { ...form };
      delete details.password;
      await api(reader.id ? `/users/${reader.id}` : "/users", {
        method: reader.id ? "PUT" : "POST",
        body: JSON.stringify(reader.id ? details : form),
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={reader.id ? "Дані читача" : "Новий читач"} onClose={onClose}>
      <form className="grid gap-form-gap" onSubmit={submit}>
        <label className={labelClassName}>
          Ім’я та прізвище
          <input
            className={inputClassName}
            required
            maxLength="120"
            value={form.name}
            onChange={update("name")}
          />
        </label>
        <label className={labelClassName}>
          Електронна пошта
          <input
            className={inputClassName}
            type="email"
            required
            maxLength="190"
            value={form.email}
            onChange={update("email")}
          />
        </label>
        <label className={labelClassName}>
          Телефон
          <input
            className={inputClassName}
            type="tel"
            maxLength="30"
            value={form.phone}
            onChange={update("phone")}
          />
        </label>
        {!reader.id && (
          <label className={labelClassName}>
            Початковий пароль
            <input
              className={inputClassName}
              type="password"
              minLength="12"
              maxLength="128"
              required
              value={form.password}
              onChange={update("password")}
            />
            <small className="m-0 text-label text-warning">
              Щонайменше 12 символів. Передайте пароль читачеві безпечним
              способом.
            </small>
          </label>
        )}
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
          <button className={`${buttonClassName} bg-primary text-white hover:bg-primary-hover`} disabled={saving}>
            {saving ? "Зберігаємо…" : "Зберегти читача"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ReaderModal;
