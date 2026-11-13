import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import useResource from "../hooks/useResource";
import { api } from "../services/api";
import ReservationModal from "../components/reservations/ReservationModal";
import ReservationTable from "../components/reservations/ReservationTable";
import Message from "../components/ui/Message";

function ReservationsPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const { data, error, loading } = useResource(
    `/reservations?status=${status}&q=${encodeURIComponent(search)}`,
    refresh,
  );
  const reservations = data?.reservations || [];

  async function changeStatus(reservation, action) {
    try {
      await api(`/reservations/${reservation.id}/${action}`, {
        method: "PATCH",
      });
      setNotice(
        action === "cancel"
          ? "Резервування скасовано."
          : "Резервування виконано.",
      );
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <div className="grid gap-page-gap">
      <div className="flex items-center justify-between gap-4 max-md:items-start">
        <p className="text-xs text-text-muted max-md:max-w-1/2 max-md:leading-normal">
          {user.role === "reader"
            ? "Переглядайте свої резервування та скасовуйте активні."
            : "Керуйте резервуваннями книжок читачами."}
        </p>
        <button
          className="inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent bg-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-px hover:bg-primary-hover max-md:min-h-9 max-md:whitespace-nowrap max-md:px-3 max-md:text-caption"
          onClick={() => setCreating(true)}
        >
          <span>＋</span> Створити резервування
        </button>
      </div>
      {notice && <Message onClose={() => setNotice("")}>{notice}</Message>}
      {error && <Message kind="error">{error}</Message>}
      <section className="overflow-hidden rounded-card border border-border bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border-light px-5 py-table-head-y max-md:flex-col max-md:items-stretch">
          <div
            className="flex items-center gap-1 overflow-x-auto"
            role="tablist"
          >
            {[
              ["active", "Активні"],
              ["fulfilled", "Виконані"],
              ["cancelled", "Скасовані"],
              ["all", "Усі"],
            ].map(([value, label]) => (
              <button
                key={value}
                role="tab"
                className={`flex-none rounded-md px-10px py-2 text-caption transition-colors ${
                  status === value
                    ? "bg-primary-soft font-semibold text-primary-hover"
                    : "text-filter-idle hover:text-primary"
                }`}
                onClick={() => setStatus(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="flex h-9 w-full max-w-96 items-center gap-inline rounded-control border border-search-border px-field-x text-text-icon focus-within:border-primary-border focus-within:shadow-focus-soft max-md:w-full">
            <span>⌕</span>
            <input
              className="min-w-0 w-full border-0 bg-transparent text-label text-ink outline-none placeholder:text-placeholder"
              placeholder="Книжка або читач"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="w-full overflow-x-auto">
          <ReservationTable
            reservations={reservations}
            loading={loading}
            onAction={changeStatus}
            isManager={user.role !== "reader"}
          />
        </div>
      </section>
      {creating && (
        <ReservationModal
          isManager={user.role !== "reader"}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setRefresh((value) => value + 1);
            setNotice("Резервування створено.");
          }}
        />
      )}
    </div>
  );
}

export default ReservationsPage;
