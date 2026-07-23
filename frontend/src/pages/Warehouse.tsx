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
import { WarehouseItem, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const warehouseSchema = zod.object({
  name: zod.string().min(1, "Название обязательно"),
  sku: zod.string().min(1, "Артикул обязателен"),
  quantity: zod.coerce.number().nonnegative("Количество не может быть отрицательным"),
  price: zod.coerce.number().nonnegative("Цена не может быть отрицательной"),
  min_stock: zod.coerce.number().nonnegative("Минимальный остаток не может быть отрицательным"),
  supplier: zod.string().optional(),
});

type WarehouseFormData = zod.infer<typeof warehouseSchema>;

export const Warehouse: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WarehouseItem | null>(null);

  const isWriteAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  const { data: items = [], isLoading } = useQuery<WarehouseItem[]>({
    queryKey: ["warehouse", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/warehouse?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => api.post("/v1/warehouse", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      showSuccess("Деталь успешно добавлена на склад");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка добавления детали"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: WarehouseFormData & { id: string }) =>
      api.put(`/v1/warehouse/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      showSuccess("Запись склада успешно обновлена");
      setIsFormOpen(false);
      setEditingItem(null);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка обновления записи"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/warehouse/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse"] });
      showSuccess("Запись склада успешно удалена");
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка удаления записи"),
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: WarehouseItem) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("sku", item.sku);
    setValue("quantity", item.quantity);
    setValue("price", item.price);
    setValue("min_stock", item.min_stock);
    setValue("supplier", item.supplier || "");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: WarehouseFormData) => {
    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { id: "sku", label: "Артикул / SKU" },
    { id: "name", label: "Наименование" },
    {
      id: "quantity",
      label: "Остаток",
      render: (row: WarehouseItem) => {
        const isLow = row.quantity <= row.min_stock;
        return (
          <Typography color={isLow ? "error" : "textPrimary"} sx={{ fontWeight: isLow ? "bold" : "normal" }}>
            {row.quantity} шт. {isLow && "(Критический остаток!)"}
          </Typography>
        );
      },
    },
    {
      id: "price",
      label: "Цена",
      render: (row: WarehouseItem) => `${row.price.toLocaleString("ru-RU")} ₽`,
    },
    { id: "supplier", label: "Поставщик" },
    {
      id: "actions",
      label: "Действия",
      render: (row: WarehouseItem) => (
        <Stack direction="row" spacing={1}>
          {isWriteAllowed && (
            <>
              <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => { setItemToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
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
      <Breadcrumbs items={[{ label: "Склад" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Складской учет</Typography>
        {isWriteAllowed && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Оприходовать запчасть
          </Button>
        )}
      </Stack>

      <TextField
        placeholder="Поиск по артикулу или наименованию..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredItems}
        count={filteredItems.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingItem ? "Редактировать позицию" : "Оприходовать запчасть"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Наименование детали" error={!!errors.name} helperText={errors.name?.message} {...register("name")} fullWidth />
              <TextField label="Артикул / SKU" error={!!errors.sku} helperText={errors.sku?.message} {...register("sku")} fullWidth />
              <TextField label="Количество (шт)" type="number" error={!!errors.quantity} helperText={errors.quantity?.message} {...register("quantity")} fullWidth />
              <TextField label="Цена за единицу (₽)" type="number" error={!!errors.price} helperText={errors.price?.message} {...register("price")} fullWidth />
              <TextField label="Минимальный остаток" type="number" error={!!errors.min_stock} helperText={errors.min_stock?.message} {...register("min_stock")} fullWidth />
              <TextField label="Поставщик" {...register("supplier")} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">{editingItem ? "Сохранить" : "Создать"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Списание запчасти"
        message={`Вы уверены, что хотите списать деталь ${itemToDelete?.name}?`}
        onConfirm={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Warehouse;
