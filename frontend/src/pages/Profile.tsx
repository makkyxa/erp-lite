import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Avatar,
  Stack,
  Chip,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { UserRole } from "../types";
import Breadcrumbs from "../components/Breadcrumbs";

export const Profile: React.FC = () => {
  const { user } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Администратор";
      case UserRole.MANAGER: return "Менеджер";
      case UserRole.ENGINEER: return "Инженер";
      default: return "";
    }
  };

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Профиль" }]} />
      
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>Мой Профиль</Typography>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Grid container spacing={4} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 3 }} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: "primary.main", fontSize: "2.5rem" }}>
              {user?.full_name ? user.full_name[0] : user?.username[0].toUpperCase()}
            </Avatar>
            <Chip label={getRoleLabel(user?.role)} color="primary" variant="outlined" />
          </Grid>
          
          <Grid size={{ xs: 12, sm: 9 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="textSecondary">Логин (Имя пользователя)</Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>{user?.username}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">ФИО сотрудника</Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>{user?.full_name || "Не заполнено"}</Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary">Электронная почта</Typography>
                <Typography variant="body1">{user?.email}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
export default Profile;
