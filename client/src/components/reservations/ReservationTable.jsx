import { formatDate } from "../../utils/formatters";

function ReservationTable({
  reservations,
  loading,
  onAction,
  compact = false,
  isManager = false,
}) {
  if (loading)
    return (
      <div className="px-5 py-7 text-center text-label text-text-loading">
        Завантажуємо резервування…
      </div>
    );
  if (reservations.length === 0)
    return (
      <div className="px-5 py-7 text-center text-label text-text-loading">
        Резервувань поки немає.
      </div>
    );
  return (
    <table>
      <thead>
        <tr>
          <th>Книжка</th>
          {!compact && <th>Читач</th>}
          <th>Створено</th>
          <th>Статус</th>
          {onAction && <th />}
        </tr>
      </thead>
      <tbody>
        {reservations.map((reservation) => (
          <tr key={reservation.id}>
            <td>
              <strong>{reservation.bookTitle}</strong>
            </td>
            {!compact && (
              <td className="text-text-secondary">{reservation.userName}</td>
            )}
            <td className="text-text-secondary">
              {formatDate(reservation.createdAt)}
            </td>
            <td>
              <ReservationStatus status={reservation.status} />
            </td>
            {onAction && (
              <td>
                <div className="flex justify-end gap-1">
                  {reservation.status === "active" && isManager && (
                    <button
                      className="min-h-8 rounded-md border border-border-quiet bg-white px-field-x text-caption font-semibold text-text-button transition hover:-translate-y-px hover:bg-surface-hover"
                      onClick={() => onAction(reservation, "fulfill")}
                    >
                      Виконати
                    </button>
                  )}
                  {reservation.status === "active" && (
                    <button
                      className="min-h-8 rounded-md border border-border-quiet bg-white px-field-x text-caption font-semibold text-text-button transition hover:-translate-y-px hover:bg-surface-hover"
                      onClick={() => onAction(reservation, "cancel")}
                    >
                      Скасувати
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReservationStatus({ status }) {
  const labels = {
    active: "Активне",
    cancelled: "Скасоване",
    fulfilled: "Виконане",
  };
  const classes = {
    active: "bg-success-soft text-success",
    cancelled: "bg-neutral-soft text-neutral-text",
    fulfilled: "bg-success-soft text-success",
  };
  return (
    <span
      className={`inline-block rounded-pill px-2 py-1 text-micro ${classes[status] || "bg-neutral-soft text-neutral-text"}`}
    >
      {labels[status] || status}
    </span>
  );
}

export default ReservationTable;
