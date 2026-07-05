import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  People as CustomersIcon,
  DirectionsCar as CarsIcon,
  Build as ActiveOrdersIcon,
  CheckCircle as CompletedIcon,
  MonetizationOn as RevenueIcon,
} from "@mui/icons-material";
import { api } from "../services/api";
import Breadcrumbs from "../components/Breadcrumbs";

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await api.get("/v1/dashboard");
      return response.data;
    },
  });

  if (isLoading) return <LinearProgress />;

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">Ошибка загрузки аналитики дашборда.</Typography>
      </Box>
    );
  }

  const kpis = [
    { title: "Клиенты", value: stats?.customers ?? 0, icon: <CustomersIcon fontSize="large" />, color: "#3b82f6" },
    { title: "Автомобили", value: stats?.cars ?? 0, icon: <CarsIcon fontSize="large" />, color: "#8b5cf6" },
    { title: "Активные заказы", value: stats?.active_orders ?? 0, icon: <ActiveOrdersIcon fontSize="large" />, color: "#f59e0b" },
    { title: "Завершено", value: stats?.completed_orders ?? 0, icon: <CompletedIcon fontSize="large" />, color: "#10b981" },
    {
      title: "Выручка",
      value: `${(stats?.revenue ?? 0).toLocaleString("ru-RU")} ₽`,
      icon: <RevenueIcon fontSize="large" />,
      color: "#ec4899",
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={[]} />
      
      <Typography variant="h4" sx={{ mb: 4, color: "#1e293b", fontWeight: "bold" }}>
        Добро пожаловать в ERP Lite
      </Typography>

      <Grid container spacing={3}>
        {kpis.map((kpi, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={index}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
              <CardContent sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: `${kpi.color}15`,
                    color: kpi.color,
                    mr: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: "medium" }}>
                    {kpi.title}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5, fontWeight: "bold" }}>
                    {kpi.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Общая сводка
          </Typography>
          <Typography variant="body1" color="text.secondary">
            ERP Lite для автосервиса находится в активном режиме. Все модули backend
            (клиенты, автомобили, заказ-наряды, платежи, склад, сотрудники и аудит-логи)
            синхронизированы и полностью работоспособны.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};
export default Dashboard;
