import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import LoginPage from "../../src/pages/LoginPage";
import { useAuth } from "../../src/hooks/useAuth";

const mockNavigate = jest.fn();

jest.mock("../../src/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router", () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  Navigate: () => <div data-testid="redirect" />,
  useLocation: () => ({ state: null }),
  useNavigate: () => mockNavigate,
}));

function renderLoginPage() {
  return render(<LoginPage />);
}

describe("LoginPage", () => {
  const login = jest.fn();
  const register = jest.fn();

  beforeEach(() => {
    useAuth.mockReturnValue({
      login,
      register,
      user: null,
      authError: "",
    });
  });

  test("submits login credentials and navigates to dashboard", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("Електронна пошта"), "reader@example.com");
    await user.type(screen.getByLabelText("Пароль"), "secret-password");
    await user.click(screen.getByRole("button", { name: /увійти до системи/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("reader@example.com", "secret-password");
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  test("switches to registration and submits reader details", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole("button", { name: "Зареєструватися" }));
    expect(screen.getByRole("heading", { name: "Створіть обліковий запис" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Ім’я та прізвище"), "Олена Коваль");
    await user.type(screen.getByLabelText("Електронна пошта"), "olena@example.com");
    await user.type(screen.getByLabelText(/Телефон/), "+380501234567");
    await user.type(screen.getByLabelText("Пароль"), "secure-password");
    await user.click(screen.getByRole("button", { name: /зареєструватися/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Олена Коваль",
        email: "olena@example.com",
        phone: "+380501234567",
        password: "secure-password",
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });

  test("shows the authentication error when login fails", async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce(new Error("Невірний email або пароль."));
    renderLoginPage();

    await user.type(screen.getByLabelText("Електронна пошта"), "reader@example.com");
    await user.type(screen.getByLabelText("Пароль"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /увійти до системи/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Невірний email або пароль.",
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows an existing authentication error", () => {
    useAuth.mockReturnValue({
      login,
      register,
      user: null,
      authError: "Сесію завершено.",
    });
    renderLoginPage();

    expect(screen.getByRole("alert")).toHaveTextContent("Сесію завершено.");
  });
});
