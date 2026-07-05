import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Build as OrderIcon,
  Warehouse as WarehouseIcon,
  SettingsSuggest as ServiceIcon,
  Payment as PaymentIcon,
  ManageAccounts as UserIcon,
  AccountCircle as ProfileIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";

const drawerWidth = 260;

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { text: "Дашборд", icon: <DashboardIcon />, path: "/", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Клиенты", icon: <PeopleIcon />, path: "/customers", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Автомобили", icon: <CarIcon />, path: "/cars", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Заказ-наряды", icon: <OrderIcon />, path: "/orders", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Склад", icon: <WarehouseIcon />, path: "/warehouse", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Услуги", icon: <ServiceIcon />, path: "/services", roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { text: "Платежи", icon: <PaymentIcon />, path: "/payments", roles: [UserRole.ADMIN, UserRole.MANAGER] },
    { text: "Сотрудники", icon: <UserIcon />, path: "/users", roles: [UserRole.ADMIN] },
    { text: "Профиль", icon: <ProfileIcon />, path: "/profile", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
    { text: "Настройки", icon: <SettingsIcon />, path: "/settings", roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER] },
  ];

  const filteredItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#1e293b",
          color: "#f8fafc",
        },
      }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h6" sx={{ letterSpacing: 1, color: "#38bdf8", fontWeight: "bold" }}>
          ERP Lite
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8", mt: 0.5 }}>
          Сервисный Центр
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "#334155" }} />
      <Box sx={{ overflow: "auto", mt: 2 }}>
        <List>
          {filteredItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1.5,
                    my: 0.25,
                    borderRadius: 1.5,
                    backgroundColor: isSelected ? "#38bdf8" : "transparent",
                    color: isSelected ? "#0f172a" : "#cbd5e1",
                    "&:hover": {
                      backgroundColor: isSelected ? "#38bdf8" : "#334155",
                      color: isSelected ? "#0f172a" : "#f8fafc",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: "0.95rem", fontWeight: isSelected ? 600 : 400 }}>{item.text}</Typography>} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Drawer>
  );
};
export default Sidebar;
