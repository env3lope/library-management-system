import { Navigate, Route, Routes } from "react-router";
import AppLayout from "./components/layout/AppLayout";
import { AuthGate, ManagerGate } from "./components/auth/RouteGuards";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BooksPage from "./pages/BooksPage";
import ReadersPage from "./pages/ReadersPage";
import ReservationsPage from "./pages/ReservationsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGate />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="books" element={<BooksPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route element={<ManagerGate />}>
            <Route path="readers" element={<ReadersPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
