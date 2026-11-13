function Message({ children, kind = "success", onClose }) {
  const tone =
    kind === "error"
      ? "border-message-error-border bg-message-error text-message-error-text"
      : "border-message-success-border bg-message-success text-message-success-text";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-table-head-y text-label ${tone}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <span>{children}</span>
      {onClose && (
        <button className="bg-transparent text-lg" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
}

export default Message;
