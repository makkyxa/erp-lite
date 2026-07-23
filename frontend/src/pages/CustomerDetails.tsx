import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Add as AddIcon, DirectionsCar as CarIcon, Build as OrderIcon } from "@mui/icons-material";
import { api } from "../services/api";
import { Customer, Car, Order, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import Breadcrumbs from "../components/Breadcrumbs";

const carSchema = zod.object({
  brand: zod.string().min(1, "Марка обязательна"),
  model: zod.string().min(1, "Модель обязательна"),
  year: zod.coerce.number().min(1900, "Некорректный год").max(new Date().getFullYear() + 1, "Год не может быть в будущем"),
  vin: zod.string().min(17, "VIN должен состоять из 17 символов").max(17, "VIN должен состоять из 17 символов"),
  license_plate: zod.string().min(1, "Госномер обязателен"),
  mileage: zod.coerce.number().nonnegative("Пробег не может быть отрицательным"),
});

type CarFormData = zod.infer<typeof carSchema>;

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  const isWriteAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  const { data: customer, isLoading: isLoadingCustomer } = useQuery<Customer>({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await api.get(`/v1/customers/${id}`);
      return res.data;
    },
  });

  const { data: cars = [] } = useQuery<Car[]>({
    queryKey: ["customer-cars", id],
    queryFn: async () => {
      const res = await api.get(`/v1/cars`);
      return res.data.filter((car: Car) => car.customer_id === id);
    },
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      const res = await api.get(`/v1/orders`);
      return res.data.filter((order: Order) => order.customer_id === id);
    },
  });

  const createCarMutation = useMutation({
    mutationFn: (data: CarFormData) => api.post("/v1/cars", { ...data, customer_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-cars", id] });
      showSuccess("Автомобиль успешно зарегистрирован");
      setIsCarModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      showError(err.response?.data?.detail || "Ошибка при регистрации машины");
    },
  });

  const handleCarSubmit = (data: CarFormData) => {
    createCarMutation.mutate(data);
  };

  if (isLoadingCustomer) return <CircularProgress />;

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Клиенты", path: "/customers" }, { label: customer?.full_name || "Детали" }]} />

      <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
          {customer?.full_name}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Телефон</Typography>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>{customer?.phone}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Email</Typography>
            <Typography variant="body1">{customer?.email || "Отсутствует"}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Примечание</Typography>
            <Typography variant="body1">{customer?.comment || "Нет комментариев"}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>Автомобили клиента</Typography>
              {isWriteAllowed && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => setIsCarModalOpen(true)}>
                  Добавить авто
                </Button>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {cars.length === 0 ? (
              <Typography color="textSecondary">У клиента нет зарегистрированных машин.</Typography>
            ) : (
              <List>
                {cars.map((car) => (
                  <ListItem key={car.id} onClick={() => navigate(`/cars`)} sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <CarIcon sx={{ mr: 2, color: "#8b5cf6" }} />
                    <ListItemText
                      primary={`${car.brand} ${car.model} (${car.year})`}
                      secondary={`Госномер: ${car.license_plate} | VIN: ${car.vin}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>История заказ-нарядов</Typography>
            <Divider sx={{ mb: 2 }} />
            {orders.length === 0 ? (
              <Typography color="textSecondary">Нет оформленных заказ-нарядов.</Typography>
            ) : (
              <List>
                {orders.map((order) => (
                  <ListItem key={order.id} onClick={() => navigate(`/orders/${order.id}`)} sx={{ borderBottom: "1px solid #f1f5f9" }}>
                    <OrderIcon sx={{ mr: 2, color: "#f59e0b" }} />
                    <ListItemText
                      primary={`Заказ № ${order.order_number}`}
                      secondary={`Статус: ${order.status} | Сумма: ${order.price} ₽`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {}
      <Dialog open={isCarModalOpen} onClose={() => setIsCarModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Зарегистрировать автомобиль</DialogTitle>
        <form onSubmit={handleSubmit(handleCarSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Марка (например, Toyota)" error={!!errors.brand} helperText={errors.brand?.message} {...register("brand")} fullWidth />
              <TextField label="Модель (например, Camry)" error={!!errors.model} helperText={errors.model?.message} {...register("model")} fullWidth />
              <TextField label="Год выпуска" error={!!errors.year} helperText={errors.year?.message} {...register("year")} fullWidth />
              <TextField label="VIN-код" error={!!errors.vin} helperText={errors.vin?.message} {...register("vin")} fullWidth />
              <TextField label="Государственный номер" error={!!errors.license_plate} helperText={errors.license_plate?.message} {...register("license_plate")} fullWidth />
              <TextField label="Текущий пробег (км)" error={!!errors.mileage} helperText={errors.mileage?.message} {...register("mileage")} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsCarModalOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">Зарегистрировать</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
export default CustomerDetails;
