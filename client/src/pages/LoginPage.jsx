import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

const inputClassName =
  "min-h-field w-full rounded-control border border-border-control bg-surface px-field-x text-xs text-ink-soft outline-none placeholder:text-placeholder focus:border-input-focus focus:shadow-input-focus";

function LoginPage() {
  const { login, register, user, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") {
        await register({ name, email, phone, password });
      } else {
        await login(email, password);
      }
      navigate(location.state?.from?.pathname || "/dashboard", {
        replace: true,
      });
    } catch (authError) {
      setError(authError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setError("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-8">
      <section className="w-full max-w-md rounded-card border border-border bg-surface p-8 shadow-xl max-sm:p-6">
        <div className="mb-8 flex justify-center">
          <Link className="flex items-center gap-3" to="/login">
            <span className="grid size-control shrink-0 place-items-center rounded-brand bg-primary font-display text-2xl font-bold text-white">
              л
            </span>
            <span className="flex flex-col gap-1">
              <strong className="font-display text-brand tracking-tight">
                Лібро
              </strong>
              <small className="text-label text-text-subtle">
                Керування бібліотекою
              </small>
            </span>
          </Link>
        </div>
        <div className="mb-6 text-center">
          <span className="text-micro font-bold tracking-wide text-primary-muted">
            РОБОЧИЙ ПРОСТІР
          </span>
          <h1 className="mt-3 mb-2 font-display text-page-heading font-medium tracking-tight text-ink">
            {mode === "login" ? "З поверненням" : "Створіть обліковий запис"}
          </h1>
          <p className="text-xs text-text-muted">
            {mode === "login"
              ? "Увійдіть, щоб продовжити роботу з бібліотекою."
              : "Зареєструйтеся, щоб користуватися бібліотекою."}
          </p>
        </div>
        <form className="grid gap-form-gap" onSubmit={handleSubmit}>
          {authError && (
            <p className="m-0 text-label text-danger" role="alert">
              {authError}
            </p>
          )}
          {mode === "register" && (
            <label className="grid gap-label text-label font-semibold text-text-label">
              Ім’я та прізвище
              <input
                className={inputClassName}
                autoComplete="name"
                required
                maxLength="120"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ваше ім’я"
              />
            </label>
          )}
          <label className="grid gap-label text-label font-semibold text-text-label">
            Електронна пошта
            <input
              className={inputClassName}
              autoComplete="email"
              type="email"
              required
              maxLength="190"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@library.ua"
            />
          </label>
          {mode === "register" && (
            <label className="grid gap-label text-label font-semibold text-text-label">
              <span>
                Телефон{" "}
                <span className="font-normal text-text-subtle">
                  (необов’язково)
                </span>
              </span>
              <input
                className={inputClassName}
                autoComplete="tel"
                type="tel"
                maxLength="30"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+380"
              />
            </label>
          )}
          <label className="grid gap-label text-label font-semibold text-text-label">
            Пароль
            <input
              className={inputClassName}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              type="password"
              required
              minLength={mode === "register" ? 12 : undefined}
              maxLength="128"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                mode === "register"
                  ? "Щонайменше 12 символів"
                  : "Введіть пароль"
              }
            />
          </label>
          {error && (
            <p className="m-0 text-label text-danger" role="alert">
              {error}
            </p>
          )}
          <button
            className="mt-1 inline-flex min-h-control w-full items-center justify-center gap-inline rounded-lg border border-transparent bg-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-px hover:bg-primary-hover"
            disabled={submitting}
          >
            {submitting
              ? mode === "login"
                ? "Вхід…"
                : "Реєструємо…"
              : mode === "login"
                ? "Увійти до системи"
                : "Зареєструватися"}{" "}
            <span>→</span>
          </button>
        </form>
        <p className="mt-5 text-center text-label text-text-muted">
          {mode === "login"
            ? "Ще не маєте облікового запису?"
            : "Вже маєте обліковий запис?"}{" "}
          <button
            className="bg-transparent font-semibold text-primary hover:text-primary-hover"
            type="button"
            onClick={toggleMode}
          >
            {mode === "login" ? "Зареєструватися" : "Увійти"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
