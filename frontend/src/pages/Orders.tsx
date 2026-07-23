import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  MenuItem,
  Chip,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Order, Customer, Car, User, UserRole, OrderStatus, OrderPriority } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const orderSchema = zod.object({
  customer_id: zod.string().min(1, "Клиент обязателен"),
  car_id: zod.string().min(1, "Машина обязательна"),
  engineer_id: zod.string().optional().or(zod.literal("")),
  priority: zod.nativeEnum(OrderPriority),
  problem_description: zod.string().min(1, "Описание проблемы обязательно"),
  price: zod.coerce.number().nonnegative(),
});

type OrderFormData = zod.infer<typeof orderSchema>;

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      priority: OrderPriority.NORMAL,
      price: 0,
    },
  });

  const selectedCustomerId = watch("customer_id");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/orders?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["all-customers"],
    queryFn: async () => {
      const res = await api.get("/v1/customers?limit=200");
      return res.data;
    },
  });

  const { data: cars = [] } = useQuery<Car[]>({
    queryKey: ["all-cars"],
    queryFn: async () => {
      const res = await api.get("/v1/cars?limit=200");
      return res.data;
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await api.get("/v1/users?limit=200");
      return res.data;
    },
    enabled: user?.role === UserRole.ADMIN,
  });

  const filteredCarsForSelect = cars.filter((c) => c.customer_id === selectedCustomerId);

  const createMutation = useMutation({
    mutationFn: (data: OrderFormData) => {
      const payload = {
        ...data,
        engineer_id: data.engineer_id || null,
        status: OrderStatus.CREATED,
      };
      return api.post("/v1/orders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showSuccess("Заказ-наряд успешно оформлен");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при оформлении заказа"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showSuccess("Заказ-наряд успешно удален");
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Нельзя удалить оплаченный заказ-наряд"),
  });

  const handleFormSubmit = (data: OrderFormData) => {
    createMutation.mutate(data);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED: return "default";
      case OrderStatus.WAITING_PARTS: return "warning";
      case OrderStatus.IN_PROGRESS: return "primary";
      case OrderStatus.READY: return "info";
      case OrderStatus.DELIVERED: return "success";
      case OrderStatus.CANCELLED: return "error";
      default: return "default";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED: return "Создан";
      case OrderStatus.WAITING_PARTS: return "Ожидание запчастей";
      case OrderStatus.IN_PROGRESS: return "В работе";
      case OrderStatus.READY: return "Готов";
      case OrderStatus.DELIVERED: return "Выдан";
      case OrderStatus.CANCELLED: return "Отменен";
      default: return status;
    }
  };

  const getPriorityLabel = (priority: OrderPriority) => {
    switch (priority) {
      case OrderPriority.LOW: return "Низкий";
      case OrderPriority.NORMAL: return "Обычный";
      case OrderPriority.HIGH: return "Высокий";
      case OrderPriority.URGENT: return "Срочный";
      default: return priority;
    }
  };

  const filteredOrders = orders.filter(
    (o) => o.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { id: "order_number", label: "Номер заказ-наряда" },
    {
      id: "status",
      label: "Статус",
      render: (row: Order) => (
        <Chip label={getStatusLabel(row.status)} color={getStatusColor(row.status) as any} size="small" />
      ),
    },
    {
      id: "priority",
      label: "Приоритет",
      render: (row: Order) => getPriorityLabel(row.priority),
    },
    {
      id: "price",
      label: "Стоимость",
      render: (row: Order) => `${row.price.toLocaleString("ru-RU")} ₽`,
    },
    {
      id: "actions",
      label: "Действия",
      render: (row: Order) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => navigate(`/orders/${row.id}`)} color="primary" size="small">
            <ViewIcon />
          </IconButton>
          {user?.role === UserRole.ADMIN && (
            <IconButton onClick={() => { setOrderToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Заказ-наряды" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Заказ-наряды</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { reset(); setIsFormOpen(true); }}>
          Оформить заказ
        </Button>
      </Stack>

      <TextField
        placeholder="Поиск по номеру заказа..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredOrders}
        count={filteredOrders.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новый заказ-наряд</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Клиент"
                defaultValue=""
                error={!!errors.customer_id}
                helperText={errors.customer_id?.message}
                {...register("customer_id")}
                fullWidth
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Автомобиль"
                defaultValue=""
                disabled={!selectedCustomerId}
                error={!!errors.car_id}
                helperText={errors.car_id?.message}
                {...register("car_id")}
                fullWidth
              >
                {filteredCarsForSelect.map((car) => (
                  <MenuItem key={car.id} value={car.id}>
                    {car.brand} {car.model} ({car.license_plate})
                  </MenuItem>
                ))}
              </TextField>

              {user?.role === UserRole.ADMIN && (
                <TextField
                  select
                  label="Ответственный инженер"
                  defaultValue=""
                  {...register("engineer_id")}
                  fullWidth
                >
                  {users.filter(u => u.role === UserRole.ENGINEER).map((eng) => (
                    <MenuItem key={eng.id} value={eng.id}>
                      {eng.full_name || eng.username}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                select
                label="Приоритет"
                defaultValue={OrderPriority.NORMAL}
                {...register("priority")}
                fullWidth
              >
                {Object.values(OrderPriority).map((p) => (
                  <MenuItem key={p} value={p}>
                    {getPriorityLabel(p)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Описание проблемы"
                multiline
                rows={3}
                error={!!errors.problem_description}
                helperText={errors.problem_description?.message}
                {...register("problem_description")}
                fullWidth
              />

              <TextField
                label="Ориентировочная стоимость (₽)"
                type="number"
                error={!!errors.price}
                helperText={errors.price?.message}
                {...register("price")}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">Оформить</Button>
          </DialogActions>
        </form>
      </Dialog>

      {}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление заказа"
        message={`Вы действительно хотите удалить заказ № ${orderToDelete?.order_number}?`}
        onConfirm={() => orderToDelete && deleteMutation.mutate(orderToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Orders;
