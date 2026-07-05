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
  Stack,
  MenuItem,
  Chip,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { api } from "../services/api";
import { Payment, Order, PaymentMethod, PaymentStatus } from "../types";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import Breadcrumbs from "../components/Breadcrumbs";
import ConfirmDialog from "../components/ConfirmDialog";

const paymentSchema = zod.object({
  order_id: zod.string().min(1, "Заказ обязателен"),
  amount: zod.coerce.number().positive("Сумма платежа должна быть больше 0"),
  payment_method: zod.nativeEnum(PaymentMethod),
  transaction_id: zod.string().optional(),
});

type PaymentFormData = zod.infer<typeof paymentSchema>;

export const Payments: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_method: PaymentMethod.CASH,
    },
  });

  // Query payments registry
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["payments", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/payments?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  // Query active orders list
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["all-orders-payments"],
    queryFn: async () => {
      const res = await api.get("/v1/orders?limit=200");
      return res.data;
    },
  });

  // Mutation: Log payment
  const createMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      const payload = {
        ...data,
        payment_status: PaymentStatus.COMPLETED,
      };
      return api.post("/v1/payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      showSuccess("Платеж успешно проведен");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при регистрации платежа"),
  });

  // Mutation: Update payment
  const updateMutation = useMutation({
    mutationFn: (data: PaymentFormData & { id: string }) =>
      api.put(`/v1/payments/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      showSuccess("Данные платежа успешно обновлены");
      setIsFormOpen(false);
      setEditingPayment(null);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при обновлении платежа"),
  });

  // Mutation: Delete payment
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      showSuccess("Платеж успешно удален");
      setDeleteConfirmOpen(false);
      setPaymentToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при удалении платежа"),
  });

  const handleOpenCreate = () => {
    setEditingPayment(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setValue("order_id", payment.order_id);
    setValue("amount", payment.amount);
    setValue("payment_method", payment.payment_method);
    setValue("transaction_id", payment.transaction_id || "");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: PaymentFormData) => {
    if (editingPayment) {
      updateMutation.mutate({ ...data, id: editingPayment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: return "Наличные";
      case PaymentMethod.CARD: return "Карта";
      case PaymentMethod.BANK_TRANSFER: return "Банковский перевод";
      default: return method;
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING: return "warning";
      case PaymentStatus.COMPLETED: return "success";
      case PaymentStatus.REFUNDED: return "error";
      default: return "default";
    }
  };

  const getPaymentStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING: return "Ожидает";
      case PaymentStatus.COMPLETED: return "Проведен";
      case PaymentStatus.REFUNDED: return "Возврат";
      default: return status;
    }
  };

  const columns = [
    {
      id: "amount",
      label: "Сумма",
      render: (row: Payment) => `${row.amount.toLocaleString("ru-RU")} ₽`,
    },
    {
      id: "payment_method",
      label: "Способ оплаты",
      render: (row: Payment) => getMethodLabel(row.payment_method),
    },
    {
      id: "payment_status",
      label: "Статус",
      render: (row: Payment) => (
        <Chip label={getPaymentStatusLabel(row.payment_status)} color={getStatusColor(row.payment_status) as any} size="small" />
      ),
    },
    { id: "transaction_id", label: "ID Транзакции" },
    {
      id: "created_at",
      label: "Дата проведения",
      render: (row: Payment) => new Date(row.created_at).toLocaleString("ru-RU"),
    },
    {
      id: "actions",
      label: "Действия",
      render: (row: Payment) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => { setPaymentToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Платежи" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Учет кассы и оплат</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Принять оплату
        </Button>
      </Stack>

      <DataTable
        columns={columns}
        rows={payments}
        count={payments.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {/* Payment Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingPayment ? "Редактировать платеж" : "Зарегистрировать платеж"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Заказ-наряд"
                defaultValue=""
                disabled={!!editingPayment}
                error={!!errors.order_id}
                helperText={errors.order_id?.message}
                {...register("order_id")}
                fullWidth
              >
                {orders.map((o) => (
                  <MenuItem key={o.id} value={o.id}>
                    Заказ № {o.order_number} ({o.price} ₽)
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Сумма платежа (₽)"
                type="number"
                error={!!errors.amount}
                helperText={errors.amount?.message}
                {...register("amount")}
                fullWidth
              />

              <TextField
                select
                label="Способ оплаты"
                defaultValue={PaymentMethod.CASH}
                {...register("payment_method")}
                fullWidth
              >
                {Object.values(PaymentMethod).map((method) => (
                  <MenuItem key={method} value={method}>
                    {getMethodLabel(method)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField label="Идентификатор транзакции / чека" {...register("transaction_id")} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">{editingPayment ? "Сохранить" : "Провести оплату"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление платежа"
        message={`Вы уверены, что хотите удалить этот платеж на сумму ${paymentToDelete?.amount} ₽?`}
        onConfirm={() => paymentToDelete && deleteMutation.mutate(paymentToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Payments;
