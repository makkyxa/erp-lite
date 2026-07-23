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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { api } from "../services/api";
import { Service, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const serviceSchema = zod.object({
  name: zod.string().min(1, "Название обязательно"),
  price: zod.coerce.number().nonnegative("Цена не может быть отрицательной"),
  description: zod.string().optional(),
});

type ServiceFormData = zod.infer<typeof serviceSchema>;

export const Services: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const isWriteAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/services?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceFormData) => api.post("/v1/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showSuccess("Услуга успешно добавлена в каталог");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка добавления услуги"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ServiceFormData & { id: string }) =>
      api.put(`/v1/services/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showSuccess("Каталог услуг успешно обновлен");
      setIsFormOpen(false);
      setEditingService(null);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка обновления услуги"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      showSuccess("Услуга успешно удалена");
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка удаления услуги"),
  });

  const handleOpenCreate = () => {
    setEditingService(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("price", service.price);
    setValue("description", service.description || "");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ ...data, id: editingService.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { id: "name", label: "Наименование услуги" },
    {
      id: "price",
      label: "Стоимость",
      render: (row: Service) => `${row.price.toLocaleString("ru-RU")} ₽`,
    },
    { id: "description", label: "Описание" },
    {
      id: "actions",
      label: "Действия",
      render: (row: Service) => (
        <Stack direction="row" spacing={1}>
          {isWriteAllowed && (
            <>
              <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => { setServiceToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
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
      <Breadcrumbs items={[{ label: "Услуги" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Каталог услуг автосервиса</Typography>
        {isWriteAllowed && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Добавить услугу
          </Button>
        )}
      </Stack>

      <TextField
        placeholder="Поиск по наименованию услуги..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredServices}
        count={filteredServices.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingService ? "Редактировать услугу" : "Добавить услугу"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Наименование услуги" error={!!errors.name} helperText={errors.name?.message} {...register("name")} fullWidth />
              <TextField label="Стоимость услуги (₽)" type="number" error={!!errors.price} helperText={errors.price?.message} {...register("price")} fullWidth />
              <TextField label="Описание услуги" multiline rows={3} {...register("description")} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">{editingService ? "Сохранить" : "Создать"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление услуги из каталога"
        message={`Вы уверены, что хотите удалить услугу ${serviceToDelete?.name}?`}
        onConfirm={() => serviceToDelete && deleteMutation.mutate(serviceToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Services;
