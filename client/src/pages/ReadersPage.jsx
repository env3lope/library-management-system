import { useState } from "react";
import useResource from "../hooks/useResource";
import { api } from "../services/api";
import ReaderModal from "../components/readers/ReaderModal";
import Message from "../components/ui/Message";
import TableMessage from "../components/ui/TableMessage";
import { plural } from "../utils/formatters";

function ReadersPage() {
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const { data, error, loading } = useResource(
    `/users?q=${encodeURIComponent(search)}`,
    refresh,
  );
  const users = data?.users || [];

  async function removeReader(reader) {
    if (!window.confirm(`Видалити обліковий запис читача «${reader.name}»?`))
      return;
    try {
      await api(`/users/${reader.id}`, { method: "DELETE" });
      setNotice("Обліковий запис читача видалено.");
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <div className="grid gap-page-gap">
      <div className="flex items-center justify-between gap-4 max-md:items-start">
        <p className="text-xs text-text-muted max-md:max-w-1/2 max-md:leading-normal">
          Облікові записи читачів та їхні активні резервування.
        </p>
        <button
          className="inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent bg-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-px hover:bg-primary-hover max-md:min-h-9 max-md:whitespace-nowrap max-md:px-3 max-md:text-caption"
          onClick={() => setSelected({})}
        >
          <span>＋</span> Додати читача
        </button>
      </div>
      {notice && <Message onClose={() => setNotice("")}>{notice}</Message>}
      {error && <Message kind="error">{error}</Message>}
      <section className="overflow-hidden rounded-card border border-border bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border-light px-5 py-table-head-y max-md:flex-col max-md:items-stretch">
          <label className="flex h-9 w-full max-w-96 items-center gap-inline rounded-control border border-search-border px-field-x text-text-icon focus-within:border-primary-border focus-within:shadow-focus-soft max-md:w-full">
            <span>⌕</span>
            <input
              className="min-w-0 w-full border-0 bg-transparent text-label text-ink outline-none placeholder:text-placeholder"
              placeholder="Ім’я, пошта або телефон"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span className="whitespace-nowrap text-caption text-text-faint max-md:self-end">
            {users.length} {plural(users.length, "читач", "читачі", "читачів")}
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Читач</th>
                <th>Електронна пошта</th>
                <th>Телефон</th>
                <th>Резервування</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableMessage>Завантажуємо читачів…</TableMessage>
              ) : users.length === 0 ? (
                <TableMessage>
                  Читачів поки немає. Додайте перший обліковий запис.
                </TableMessage>
              ) : (
                users.map((reader) => (
                  <tr key={reader.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-reader-avatar text-label font-bold text-reader-avatar-text">
                          {reader.name.slice(0, 1).toUpperCase()}
                        </span>
                        <strong>{reader.name}</strong>
                      </div>
                    </td>
                    <td className="text-text-secondary">{reader.email}</td>
                    <td className="text-text-secondary">
                      {reader.phone || "—"}
                    </td>
                    <td>
                      <span className="inline-grid h-6 min-w-6 place-items-center rounded-lg bg-reservation-count text-caption font-semibold text-reservation-count-text">
                        {reader.activeReservations}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="grid size-icon-button place-items-center rounded-md bg-transparent text-action text-text-quiet hover:bg-action-hover hover:text-primary-hover"
                          title="Редагувати"
                          onClick={() => setSelected(reader)}
                        >
                          ✎
                        </button>
                        <button
                          className="grid size-icon-button place-items-center rounded-md bg-transparent text-action text-text-quiet hover:bg-action-hover hover:text-primary-hover"
                          title="Видалити"
                          onClick={() => removeReader(reader)}
                        >
                          ⌫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {selected && (
        <ReaderModal
          reader={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setRefresh((value) => value + 1);
            setNotice("Дані читача збережено.");
          }}
        />
      )}
    </div>
  );
}

export default ReadersPage;
