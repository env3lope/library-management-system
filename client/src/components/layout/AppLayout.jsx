import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

const navigation = [
  { to: "/dashboard", label: "Огляд", icon: "◫" },
  { to: "/books", label: "Каталог книг", icon: "▤" },
  { to: "/reservations", label: "Резервування", icon: "↔" },
  { to: "/readers", label: "Читачі", icon: "♙", managersOnly: true },
];

const pageTitles = {
  "/dashboard": "Огляд",
  "/books": "Каталог книг",
  "/reservations": "Резервування",
  "/readers": "Читачі",
};

const roleLabels = {
  admin: "Адміністратор",
  reader: "Читач",
};

function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Бібліотека";

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <aside className="fixed inset-y-0 left-0 z-3 flex w-63 flex-col border-r border-border-soft bg-white px-5 pt-7 pb-5 max-md:sticky max-md:top-0 max-md:h-screen max-md:w-17 max-md:px-2 max-md:py-4">
        <Link
          className="flex items-center gap-3 px-2 max-md:justify-center max-md:px-0"
          to="/dashboard"
        >
          <span className="grid size-control shrink-0 place-items-center rounded-brand bg-primary font-display text-2xl font-bold text-white max-md:size-field">
            л
          </span>
          <span className="flex min-w-0 flex-col gap-1 max-md:hidden">
            <strong className="font-display text-brand tracking-tight">
              Лібра
            </strong>
            <small className="text-label text-text-subtle">
              Керування бібліотекою
            </small>
          </span>
        </Link>
        <div className="mt-12 mb-3 mx-3 text-caption font-bold tracking-wide text-menu-text max-md:hidden">
          МЕНЮ
        </div>
        <nav className="grid gap-1 max-md:mt-9 max-md:gap-2">
          {navigation
            .filter((item) => !item.managersOnly || user.role !== "reader")
            .map((item) => (
              <NavLink
                key={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 text-ui text-nav-text transition-colors hover:bg-surface-hover hover:text-primary-hover max-md:justify-center max-md:gap-0 max-md:px-0 ${
                    isActive
                      ? "bg-primary-soft font-semibold text-primary-hover"
                      : ""
                  }`
                }
                to={item.to}
                title={item.label}
              >
                <span aria-hidden="true" className="grid w-5 shrink-0 place-items-center text-lg">
                  {item.icon}
                </span>
                <span className="max-md:hidden">{item.label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="mt-auto">
          <button
            className="flex w-full items-center gap-3 border-0 border-t border-border-soft bg-transparent px-2 pt-3 pb-1 text-left max-md:justify-center max-md:px-0"
            onClick={logout}
            title="Вийти із системи"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-avatar-surface-warm text-ui font-bold text-avatar-text max-md:h-9 max-md:w-9">
              {user.name?.slice(0, 1).toUpperCase() || "Б"}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden max-md:hidden">
              <strong className="overflow-hidden text-ellipsis text-xs whitespace-nowrap text-ink">
                {user.name}
              </strong>
              <small className="text-label text-text-subtle">
                {roleLabels[user.role]}
              </small>
            </span>
          </button>
        </div>
      </aside>
      <main className="ml-63 min-h-screen flex-1 max-md:ml-0 max-md:flex-1">
        <header className="sticky top-0 z-2 flex min-h-23 items-center justify-between border-b border-border-soft bg-white/95 px-11 py-4 backdrop-blur-xl max-md:min-h-19 max-md:px-4 max-md:py-3">
          <div>
            <div className="mb-1 text-label text-breadcrumb-text">
              Бібліотека{" "}
              <span className="mx-1 text-breadcrumb-separator">/</span> {title}
            </div>
            <h1>{title}</h1>
          </div>
          <div className="flex items-center gap-5">
            <span className="text-xs text-date-text max-md:hidden">
              {new Intl.DateTimeFormat("uk-UA", { dateStyle: "long" }).format(
                new Date(),
              )}
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-avatar-surface text-ui font-bold text-primary-hover">
              {user.name?.slice(0, 1).toUpperCase() || "Б"}
            </span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-screen-2xl px-11 pt-8 pb-13 max-lg:px-7 max-md:px-table-x max-md:pt-5 max-md:pb-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
