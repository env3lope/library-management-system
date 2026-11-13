import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import useResource from "../hooks/useResource";
import Message from "../components/ui/Message";
import ReservationTable from "../components/reservations/ReservationTable";

function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = useResource("/dashboard");
  const stats = data?.stats || {};
  const cards = [
    {
      label: "Назви у каталозі",
      value: stats.titles ?? "—",
      tone: "bg-primary-soft text-book-accent",
      detail: "різних книжок",
    },
    {
      label: "Читачі",
      value: stats.readers ?? "—",
      tone: "bg-stat-readers text-stat-readers-text",
      detail: "зареєстровано",
    },
    {
      label: "Активні резервування",
      value: stats.activeReservations ?? "—",
      tone: "bg-stat-reservations text-stat-reservations-text",
      detail: "очікують на виконання",
    },
    {
      label: "Доступні примірники",
      value: stats.availableCopies ?? "—",
      tone: "bg-stat-available text-stat-available-text",
      detail: `з ${stats.copies ?? "—"} усього`,
    },
  ];

  return (
    <div className="grid gap-page-gap">
      {error && <Message kind="error">{error}</Message>}
      <section className="grid grid-cols-4 gap-form-gap max-lg:grid-cols-2 max-md:gap-inline">
        {cards.map((card) => (
          <article
            className="grid min-h-38 grid-cols-(--stats-columns) content-start gap-x-3 rounded-card border border-border bg-white p-5 max-md:min-h-33 max-md:grid-cols-(--stats-columns-small) max-md:gap-x-2 max-md:p-3 compact:grid-cols-1"
            key={card.label}
          >
            <span className="self-center text-label text-stat-label max-md:text-caption compact:col-span-1">
              {card.label}
            </span>
            <strong className="col-start-2 mt-3 font-display text-2xl font-medium leading-none text-ink max-md:text-2xl compact:col-start-1 compact:mt-3">
              {loading ? "…" : card.value}
            </strong>
            <span className="col-start-2 mt-2 text-caption text-stat-detail compact:col-start-1">
              {card.detail}
            </span>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-card border border-border bg-white">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 compact:px-table-x">
          <div>
            <span className="text-micro font-bold tracking-wide text-primary-muted">
              ОСТАННЯ АКТИВНІСТЬ
            </span>
            <h2 className="mt-1 font-display text-xl font-medium">
              Останні резервування
            </h2>
          </div>
          <Link
            className="text-label font-semibold text-primary hover:text-primary-hover"
            to="/reservations"
          >
            Усі резервування <span>→</span>
          </Link>
        </div>
        <ReservationTable
          reservations={data?.recentReservations || []}
          loading={loading}
          compact={user.role === "reader"}
        />
      </section>
    </div>
  );
}

export default DashboardPage;
