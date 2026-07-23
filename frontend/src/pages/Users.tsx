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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { api } from "../services/api";
import { User, UserRole } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Breadcrumbs from "../components/Breadcrumbs";

const userCreateSchema = zod.object({
  username: zod.string().min(1, "Логин обязателен"),
  email: zod.string().email("Некорректный email"),
  full_name: zod.string().optional(),
  password: zod.string().optional().or(zod.literal("")),
  role: zod.nativeEnum(UserRole),
});

type UserCreateFormData = zod.infer<typeof userCreateSchema>;

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users", page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get(`/v1/users?skip=${page * rowsPerPage}&limit=${rowsPerPage}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: UserCreateFormData) => api.post("/v1/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Сотрудник успешно добавлен");
      setIsFormOpen(false);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка создания сотрудника"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserCreateFormData & { id: string }) =>
      api.put(`/v1/users/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Данные сотрудника успешно обновлены");
      setIsFormOpen(false);
      setEditingUser(null);
      reset();
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка обновления сотрудника"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/v1/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("Сотрудник успешно удален");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (err: any) => showError(err.response?.data?.detail || "Ошибка при удалении сотрудника"),
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    reset();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setValue("username", user.username);
    setValue("email", user.email);
    setValue("full_name", user.full_name || "");
    setValue("role", user.role);
    setValue("password", "");
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: UserCreateFormData) => {
    if (!editingUser && (!data.password || data.password.length < 6)) {
      showError("Пароль должен быть не менее 6 символов при создании нового сотрудника");
      return;
    }
    if (data.password && data.password.length > 0 && data.password.length < 6) {
      showError("Пароль должен быть не менее 6 символов");
      return;
    }

    const payload = { ...data };
    if (!payload.password) {
      delete payload.password;
    }

    if (editingUser) {
      updateMutation.mutate({ ...payload, id: editingUser.id });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Администратор";
      case UserRole.MANAGER: return "Менеджер";
      case UserRole.ENGINEER: return "Инженер";
      default: return role;
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const columns = [
    { id: "username", label: "Логин" },
    { id: "full_name", label: "ФИО" },
    { id: "email", label: "Email" },
    {
      id: "role",
      label: "Роль",
      render: (row: User) => <Chip label={getRoleLabel(row.role)} size="small" variant="outlined" />,
    },
    {
      id: "is_active",
      label: "Статус",
      render: (row: User) => (
        <Chip label={row.is_active ? "Активен" : "Заблокирован"} color={row.is_active ? "success" : "default"} size="small" />
      ),
    },
    {
      id: "actions",
      label: "Действия",
      render: (row: User) => (
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => handleOpenEdit(row)} color="warning" size="small">
            <EditIcon />
          </IconButton>
          {currentUser?.id !== row.id && (
            <IconButton onClick={() => { setUserToDelete(row); setDeleteConfirmOpen(true); }} color="error" size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Сотрудники" }]} />
      
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>Управление сотрудниками</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Добавить сотрудника
        </Button>
      </Stack>

      <TextField
        placeholder="Поиск по логину или ФИО..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ mb: 3, backgroundColor: "#ffffff" }}
      />

      <DataTable
        columns={columns}
        rows={filteredUsers}
        count={filteredUsers.length}
        page={page}
        rowsPerPage={rowsPerPage}
        isLoading={isLoading}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />

      {}
      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingUser ? "Редактировать сотрудника" : "Добавить сотрудника"}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Логин / Имя пользователя" error={!!errors.username} helperText={errors.username?.message} {...register("username")} fullWidth />
              <TextField label="ФИО сотрудника" error={!!errors.full_name} helperText={errors.full_name?.message} {...register("full_name")} fullWidth />
              <TextField label="Электронная почта (Email)" error={!!errors.email} helperText={errors.email?.message} {...register("email")} fullWidth />
              <TextField label="Пароль" type="password" error={!!errors.password} helperText={errors.password?.message} {...register("password")} fullWidth />
              <TextField
                select
                label="Роль доступа"
                defaultValue={UserRole.ENGINEER}
                {...register("role")}
                fullWidth
              >
                {Object.values(UserRole).map((r) => (
                  <MenuItem key={r} value={r}>
                    {getRoleLabel(r)}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsFormOpen(false)} color="inherit">Отмена</Button>
            <Button type="submit" variant="contained">{editingUser ? "Сохранить" : "Создать"}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Удаление учетной записи"
        message={`Вы уверены, что хотите удалить сотрудника ${userToDelete?.full_name || userToDelete?.username}?`}
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
export default Users;
