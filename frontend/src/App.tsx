import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme, CircularProgress } from "@mui/material";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ToastProvider } from "./hooks/useToast";
import { UserRole } from "./types";

import Layout from "./layout/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Cars from "./pages/Cars";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Warehouse from "./pages/Warehouse";
import Services from "./pages/Services";
import Payments from "./pages/Payments";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const theme = createTheme({
  palette: {
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#8b5cf6",
    },
    background: {
      default: "#f8fafc",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", Arial, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 10 }} />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {}
                <Route path="/login" element={<Login />} />

                {}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerDetails />} />
                  <Route path="cars" element={<Cars />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/:id" element={<OrderDetails />} />
                  <Route path="warehouse" element={<Warehouse />} />
                  
                  {}
                  <Route
                    path="services"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                        <Services />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="payments"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                        <Payments />
                      </ProtectedRoute>
                    }
                  />
                  
                  {}
                  <Route
                    path="users"
                    element={
                      <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <Users />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
