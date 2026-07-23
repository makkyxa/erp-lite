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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Customer, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const customerSchema = zod.object({
  full_name: zod.string().min(1, "ФИО обязательно"),
  phone: zod.string().min(5, "Телефон обязателен"),
  email: zod.string().email("Некорректный email").optional().or(zod.literal("")),
  comment: zod.string().optional(),
});

type CustomerFormData = zod.infer<typeof customerSchema>;

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const isWriteAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["customers", page, rowsPerPage],
    queryFn: async () => {
      const response = await api.get(`/v1/customers?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => api.post("/v1/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showSuccess("Клиент успешно создан");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => {
      showError(err.response?.data?.detail || "Ошибка при создании клиента");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData & { id: string }) =>
      api.put(`/v1/customers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showSuccess("Данные клиента успешно изменены");
      setIsFormOpen(false);
      setEditingCustomer(null);
      reset();
    },
    onError: (err: any) => {
      showError(err.response?.data?.detail || "Ошибка при обновлении клиента");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showSuccess("Клиент успешно удален");
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.detail || "Нельзя удалить клиента с активными автомобилями или заказ-нарядами");
      setDeleteConfirmOpen(false);
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setValue("full_name", customer.full_name);
    setValue("phone", customer.phone);
    setValue("email", customer.email || "");
    setValue("comment", customer.comment || "");
    setIsFormOpen(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const columns = [
    { id: "full_name", label: "ФИО Клиента" },
    { id: "phone", label: "Телефон" },
    { id: "email", label: "Email" },
    {
      id: "actions",
      label: "Действия",
      render: (row: Customer) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => navigate(`/customers/${row.id}`)} color="primary" size="small">
            <ViewIcon />
          </IconButton>
          {isWriteAllowed && (
            <>
              <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleOpenDelete(row)} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Клиенты" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          База клиентов
        </Typography>
        {isWriteAllowed && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Добавить клиента
          </Button>
        )}
      </Stack>

      <TextField
        placeholder="Поиск по ФИО или телефону..."
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredCustomers}
        count={filteredCustomers.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCustomer ? "Редактировать клиента" : "Добавить клиента"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="ФИО клиента"
                error={!!errors.full_name}
                helperText={errors.full_name?.message}
                {...register("full_name")}
                fullWidth
              />
              <TextField
                label="Номер телефона"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                {...register("phone")}
                fullWidth
              />
              <TextField
                label="Email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register("email")}
                fullWidth
              />
              <TextField
                label="Примечание"
                multiline
                rows={3}
                {...register("comment")}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">
              Отмена
            </Button>
            <Button type="submit" variant="contained">
              {editingCustomer ? "Сохранить" : "Создать"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление клиента"
        message={`Вы уверены, что хотите удалить клиента ${customerToDelete?.full_name}? Это действие необратимо.`}
        onConfirm={() => customerToDelete && deleteMutation.mutate(customerToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Customers;
