import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppShell } from "../core/common/layouts/app-shell";
import { LoginOnlyWhenLoggedOut, ProtectedRoute } from "./auth-guards";
import { protectedRoutes, publicRoutes } from "./routes";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Navigate to="/identity/sign-in" replace />} />
        <Route path="/register" element={<Navigate to="/identity/sign-up" replace />} />

        {publicRoutes.map((route, index) => {
          const isAuthRoute =
            route.path === "/identity/sign-in" ||
            route.path === "/identity/sign-up" ||
            route.path === "/identity/forgot-password";
          // Se confirma con el código del correo, nunca con una sesión del
          // navegador -- por diseño puede no haber ninguna (otro dispositivo
          // sin login, ver AuthService.verifyEmail). Nunca detrás de
          // ProtectedRoute/LoginOnlyWhenLoggedOut.
          const isOpenRoute =
            route.path === "/identity/verify-email" || route.path === "/identity/reset-password";

          return (
            <Route
              key={`public-${index}`}
              path={route.path}
              element={
                isAuthRoute ? (
                  <LoginOnlyWhenLoggedOut>{route.element}</LoginOnlyWhenLoggedOut>
                ) : isOpenRoute || route.path === "*" ? (
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
