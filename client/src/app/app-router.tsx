import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppShell } from "../core/common/layouts/app-shell";
import { LoginOnlyWhenLoggedOut, ProtectedRoute } from "./auth-guards";
import { protectedRoutes, publicRoutes } from "./routes";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

        {publicRoutes.map((route, index) => {
          const isAuthRoute =
            route.path === "/app/sign-in" || route.path === "/owner/sign-up";

          return (
            <Route
              key={`public-${index}`}
              path={route.path}
              element={
                isAuthRoute ? (
                  <LoginOnlyWhenLoggedOut>{route.element}</LoginOnlyWhenLoggedOut>
                ) : route.path === "*" ? (
                  route.element
                ) : (
                  <ProtectedRoute>{route.element}</ProtectedRoute>
                )
              }
            />
          );
        })}

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          {protectedRoutes.map((route, index) => (
            <Route
              key={`protected-${index}`}
              path={route.path.replace("/app/", "")}
              element={route.element}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
