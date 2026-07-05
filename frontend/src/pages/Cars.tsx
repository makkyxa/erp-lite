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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { api } from "../services/api";
import { Car, Customer, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const carSchema = zod.object({
  customer_id: zod.string().min(1, "Клиент обязателен"),
  brand: zod.string().min(1, "Марка обязательна"),
  model: zod.string().min(1, "Модель обязательна"),
  year: zod.coerce.number().min(1900, "Некорректный год").max(new Date().getFullYear() + 1),
  vin: zod.string().min(17, "VIN должен состоять из 17 символов").max(17, "VIN должен состоять из 17 символов"),
  license_plate: zod.string().min(1, "Госномер обязателен"),
  mileage: zod.coerce.number().nonnegative(),
});

type CarFormData = zod.infer<typeof carSchema>;

export const Cars: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);

  const isWriteAllowed = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CarFormData>({
    resolver: zodResolver(carSchema),
  });

  // Query Cars
  const { data: cars = [], isLoading } = useQuery<Car[]>({
    queryKey: ["cars", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/cars?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  // Query Customers list for selector
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["all-customers-list"],
    queryFn: async () => {
      const res = await api.get("/v1/customers?limit=200");
      return res.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CarFormData) => api.post("/v1/cars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      showSuccess("Автомобиль успешно добавлен");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при добавлении автомобиля"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CarFormData & { id: string }) => api.put(`/v1/cars/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      showSuccess("Автомобиль успешно обновлен");
      setIsFormOpen(false);
      setEditingCar(null);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при обновлении автомобиля"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/cars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      showSuccess("Автомобиль успешно удален");
      setDeleteConfirmOpen(false);
      setCarToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Нельзя удалить автомобиль с историей ремонтов"),
  });

  const handleOpenCreate = () => {
    setEditingCar(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (car: Car) => {
    setEditingCar(car);
    setValue("customer_id", car.customer_id);
    setValue("brand", car.brand);
    setValue("model", car.model);
    setValue("year", car.year);
    setValue("vin", car.vin);
    setValue("license_plate", car.license_plate);
    setValue("mileage", car.mileage);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: CarFormData) => {
    if (editingCar) {
      updateMutation.mutate({ ...data, id: editingCar.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredCars = cars.filter(
    (c) =>
      c.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vin.includes(searchTerm) ||
      c.license_plate.includes(searchTerm)
  );

  const columns = [
    { id: "brand", label: "Марка" },
    { id: "model", label: "Модель" },
    { id: "year", label: "Год выпуска" },
    { id: "license_plate", label: "Госномер" },
    { id: "vin", label: "VIN" },
    {
      id: "actions",
      label: "Действия",
      render: (row: Car) => (
        <Stack direction="row" spacing={1}>
          {isWriteAllowed && (
            <>
              <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => { setCarToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
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
      <Breadcrumbs items={[{ label: "Автомобили" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Реестр автомобилей</Typography>
        {isWriteAllowed && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Добавить автомобиль
          </Button>
        )}
      </Stack>

      <TextField
        placeholder="Поиск по марке, модели, VIN или госномеру..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredCars}
        count={filteredCars.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {/* Car Dialog */}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCar ? "Редактировать автомобиль" : "Добавить автомобиль"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="Владелец (Клиент)"
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
              <TextField label="Марка" error={!!errors.brand} helperText={errors.brand?.message} {...register("brand")} fullWidth />
              <TextField label="Модель" error={!!errors.model} helperText={errors.model?.message} {...register("model")} fullWidth />
              <TextField label="Год выпуска" type="number" error={!!errors.year} helperText={errors.year?.message} {...register("year")} fullWidth />
              <TextField label="VIN" error={!!errors.vin} helperText={errors.vin?.message} {...register("vin")} fullWidth />
              <TextField label="Госномер" error={!!errors.license_plate} helperText={errors.license_plate?.message} {...register("license_plate")} fullWidth />
              <TextField label="Пробег (км)" type="number" error={!!errors.mileage} helperText={errors.mileage?.message} {...register("mileage")} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">{editingCar ? "Сохранить" : "Создать"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление авто"
        message={`Вы уверены, что хотите удалить автомобиль ${carToDelete?.brand} ${carToDelete?.model}?`}
        onConfirm={() => carToDelete && deleteMutation.mutate(carToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Cars;
