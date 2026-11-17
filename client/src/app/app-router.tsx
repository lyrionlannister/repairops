import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppShell } from "../core/common/layouts/app-shell";
import { LoginOnlyWhenLoggedOut, ProtectedRoute } from "./auth-guards";
import { protectedRoutes, publicRoutes } from "./routes";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        {publicRoutes.map((route, index) => {
          const isAuthRoute =
            route.path === "/identity/sign-in" || route.path === "/identity/sign-up";

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
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {protectedRoutes.map((route, index) => (
            <Route key={`protected-${index}`} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
