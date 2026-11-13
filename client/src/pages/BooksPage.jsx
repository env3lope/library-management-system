import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import useResource from "../hooks/useResource";
import { api } from "../services/api";
import BookModal from "../components/books/BookModal";
import Availability from "../components/books/Availability";
import Message from "../components/ui/Message";
import TableMessage from "../components/ui/TableMessage";
import { plural } from "../utils/formatters";

function BooksPage() {
  const { user } = useAuth();
  const canManage = user.role !== "reader";
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState("");
  const { data, error, loading } = useResource(
    `/books?q=${encodeURIComponent(search)}`,
    refresh,
  );
  const books = data?.books || [];

  async function removeBook(book) {
    if (!window.confirm(`Видалити книжку «${book.title}»?`)) return;
    try {
      await api(`/books/${book.id}`, { method: "DELETE" });
      setNotice("Книжку видалено.");
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  async function reserveBook(book) {
    try {
      await api("/reservations", {
        method: "POST",
        body: JSON.stringify({ bookId: book.id }),
      });
      setNotice(`Книжку «${book.title}» зарезервовано.`);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setNotice(requestError.message);
    }
  }

  return (
    <div className="grid gap-page-gap">
      <div className="flex items-center justify-between gap-4 max-md:items-start">
        <p className="text-xs text-text-muted max-md:max-w-1/2 max-md:leading-normal">
          Книжки, автори, жанри та наявність примірників.
        </p>
        {canManage && (
          <button
            className="inline-flex min-h-control items-center justify-center gap-inline rounded-lg border border-transparent bg-primary px-4 text-xs font-semibold text-white transition hover:-translate-y-px hover:bg-primary-hover max-md:min-h-9 max-md:whitespace-nowrap max-md:px-3 max-md:text-caption"
            onClick={() => setSelected({})}
          >
            <span>＋</span> Додати книжку
          </button>
        )}
      </div>
      {notice && <Message onClose={() => setNotice("")}>{notice}</Message>}
      {error && <Message kind="error">{error}</Message>}
      <section className="overflow-hidden rounded-card border border-border bg-white">
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border-light px-5 py-table-head-y max-md:flex-col max-md:items-stretch">
          <label className="flex h-9 w-full max-w-96 items-center gap-inline rounded-control border border-search-border px-field-x text-text-icon focus-within:border-primary-border focus-within:shadow-focus-soft max-md:w-full">
            <span>⌕</span>
            <input
              className="min-w-0 w-full border-0 bg-transparent text-label text-ink outline-none placeholder:text-placeholder"
              placeholder="Назва, автор, жанр або видавництво"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <span className="whitespace-nowrap text-caption text-text-faint max-md:self-end">
            {books.length} {plural(books.length, "книжка", "книжки", "книжок")}
          </span>
        </div>
        <div className="w-full overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Назва / автор</th>
                <th>Видавництво</th>
                <th>Жанр</th>
                <th>Доступно</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableMessage>Завантажуємо каталог…</TableMessage>
              ) : books.length === 0 ? (
                <TableMessage>У каталозі поки немає книжок.</TableMessage>
              ) : (
                books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-9 shrink-0 place-items-center rounded-md bg-book-cover font-display text-lg text-book-accent">
                          {book.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="grid gap-1">
                          <strong>{book.title}</strong>
                          <small className="text-caption text-text-faint">
                            {book.authors || "Автор не вказаний"}
                            {book.publicationYear
                              ? ` · ${book.publicationYear}`
                              : ""}
                          </small>
                        </span>
                      </div>
                    </td>
                    <td className="text-text-secondary">
                      {book.publisher || "—"}
                    </td>
                    <td>
                      <span className="rounded-pill bg-genre-surface px-2 py-1 text-micro text-genre-text">
                        {book.genres || "Без жанру"}
                      </span>
                    </td>
                    <td>
                      <Availability
                        available={book.availableCopies}
                        total={book.totalCopies}
                      />
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {canManage && (
                          <>
                            <button
                              className="grid size-icon-button place-items-center rounded-md bg-transparent text-action text-text-quiet hover:bg-action-hover hover:text-primary-hover"
                              title="Редагувати"
                              onClick={() => setSelected(book)}
                            >
                              ✎
                            </button>
                            <button
                              className="grid size-icon-button place-items-center rounded-md bg-transparent text-action text-text-quiet hover:bg-action-hover hover:text-primary-hover"
                              title="Видалити"
                              onClick={() => removeBook(book)}
                            >
                              ⌫
                            </button>
                          </>
                        )}
                        {!canManage && Number(book.availableCopies) > 0 && (
                          <button
                            className="grid size-icon-button place-items-center rounded-md bg-transparent text-action text-text-quiet hover:bg-action-hover hover:text-primary-hover"
                            title="Зарезервувати"
                            onClick={() => reserveBook(book)}
                          >
                            ＋
                          </button>
                        )}
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
        <BookModal
          book={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            setRefresh((value) => value + 1);
            setNotice("Дані книжки збережено.");
          }}
        />
      )}
    </div>
  );
}

export default BooksPage;
