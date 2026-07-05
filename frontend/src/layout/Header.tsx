import React from "react";
import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import { Logout as LogoutIcon, Person as PersonIcon } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "Администратор";
      case UserRole.MANAGER:
        return "Менеджер";
      case UserRole.ENGINEER:
        return "Инженер";
      default:
        return "Сотрудник";
    }
  };

  const getRoleColor = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "error";
      case UserRole.MANAGER:
        return "primary";
      case UserRole.ENGINEER:
        return "success";
      default:
        return "default";
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - 260px)`,
        ml: `260px`,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        color: "#1e293b",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: "bold" }}>
          ERP Lite Панель Управления
        </Typography>
        
        {user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user.full_name || user.username}
                </Typography>
                <Chip
                  label={getRoleLabel(user.role)}
                  color={getRoleColor(user.role) as any}
                  size="small"
                  sx={{ height: 20, fontSize: "0.75rem", fontWeight: 600, mt: 0.25 }}
                />
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={logout}
              sx={{
                borderColor: "#cbd5e1",
                "&:hover": { borderColor: "#94a3b8", backgroundColor: "#f8fafc" },
              }}
            >
              Выйти
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};
export default Header;
