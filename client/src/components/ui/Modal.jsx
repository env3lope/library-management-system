import { useEffect } from "react";

function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center overflow-y-auto bg-overlay p-5 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="w-full max-w-119 rounded-xl border border-search-border bg-white p-6 shadow-modal"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            className="m-0 font-display text-brand font-medium text-ink"
            id="modal-title"
          >
            {title}
          </h2>
          <button
            className="grid size-icon-button place-items-center rounded-md bg-transparent text-2xl text-text-quiet hover:bg-action-hover hover:text-primary-hover"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default Modal;
