import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  TextField,
  Divider,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { api } from "../services/api";
import { Order, Comment, Photo, OrderStatus, OrderPriority, PhotoType, UserRole } from "../types";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import Breadcrumbs from "../components/Breadcrumbs";
import ConfirmDialog from "../components/ConfirmDialog";

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

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

  const getAllowedTransitions = (currentStatus?: OrderStatus): OrderStatus[] => {
    if (!currentStatus) return [];
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.WAITING_PARTS, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.WAITING_PARTS]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };
    return [currentStatus, ...(allowed[currentStatus] || [])];
  };

  const [commentText, setCommentText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [photoType, setPhotoType] = useState<PhotoType>(PhotoType.BEFORE);

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Comment delete state
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Query Order
  const { data: order, isLoading: isLoadingOrder } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/v1/orders/${id}`);
      return res.data;
    },
  });

  // Query Comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["order-comments", id],
    queryFn: async () => {
      const res = await api.get(`/v1/orders/${id}/comments`);
      return res.data;
    },
  });

  // Query Photos
  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["order-photos", id],
    queryFn: async () => {
      const res = await api.get(`/v1/orders/${id}/photos`);
      return res.data;
    },
  });

  // Mutation: Change status
  const statusMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) =>
      api.patch(`/v1/orders/${id}/status?status_in=${newStatus}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      showSuccess("Статус заказа успешно обновлен");
    },
    onError: (err: any) => {
      showError(err.response?.data?.detail || "Ошибка перехода статуса. Проверьте правила переходов.");
    },
  });

  // Mutation: Add comment
  const commentMutation = useMutation({
    mutationFn: (text: string) => api.post(`/v1/orders/${id}/comments`, { text, order_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-comments", id] });
      showSuccess("Комментарий добавлен");
      setCommentText("");
    },
    onError: () => showError("Ошибка добавления комментария"),
  });

  // Mutation: Edit comment
  const editCommentMutation = useMutation({
    mutationFn: (data: { id: string; text: string }) =>
      api.put(`/v1/comments/${data.id}`, { text: data.text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-comments", id] });
      showSuccess("Комментарий изменен");
      setEditingCommentId(null);
      setEditingCommentText("");
    },
    onError: () => showError("Ошибка изменения комментария"),
  });

  // Mutation: Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => api.delete(`/v1/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-comments", id] });
      showSuccess("Комментарий удален");
    },
    onError: () => showError("Ошибка удаления комментария"),
  });

  // Mutation: Upload photo
  const photoMutation = useMutation({
    mutationFn: (data: { file_path: string; description: string; photo_type: PhotoType }) =>
      api.post(`/v1/orders/${id}/photos`, { ...data, order_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-photos", id] });
      showSuccess("Фотоотчет добавлен");
      setPhotoUrl("");
      setPhotoDesc("");
    },
    onError: () => showError("Ошибка добавления фотографии"),
  });

  const onAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  const onStartEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const onSaveEditComment = (commentId: string) => {
    if (editingCommentText.trim() === "") return;
    editCommentMutation.mutate({ id: commentId, text: editingCommentText });
  };

  const onCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const onDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteCommentOpen(true);
  };

  const onAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;
    photoMutation.mutate({ file_path: photoUrl, description: photoDesc, photo_type: photoType });
  };

  if (isLoadingOrder) return <CircularProgress />;

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Заказ-наряды", path: "/orders" }, { label: order?.order_number || "Детали" }]} />

      <Paper sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            Заказ-наряд № {order?.order_number}
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Статус заказа</InputLabel>
            <Select
              value={order?.status || ""}
              label="Статус заказа"
              onChange={(e) => statusMutation.mutate(e.target.value as OrderStatus)}
              disabled={
                order?.status === OrderStatus.DELIVERED ||
                order?.status === OrderStatus.CANCELLED ||
                statusMutation.isPending
              }
            >
              {getAllowedTransitions(order?.status).map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Описание проблемы</Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>{order?.problem_description}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Результаты диагностики / ремонта</Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>{order?.repair_description || "Диагностика не завершена"}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="textSecondary">Приоритет</Typography>
            <Typography variant="body1" sx={{ mt: 0.5, fontWeight: "bold" }}>
              {order?.priority ? getPriorityLabel(order.priority) : ""}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        {/* Comments Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Рабочие заметки / комментарии</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2, maxHeight: 300 }}>
              {comments.length === 0 ? (
                <Typography color="textSecondary">Комментариев пока нет.</Typography>
              ) : (
                <List>
                  {comments.map((c) => {
                    const isAuthor = currentUser?.id === c.author_id;
                    const isAdmin = currentUser?.role === UserRole.ADMIN;
                    const isEditing = editingCommentId === c.id;
                    return (
                      <ListItem
                        key={c.id}
                        alignItems="flex-start"
                        sx={{ borderBottom: "1px solid #f1f5f9" }}
                        secondaryAction={
                          <Stack direction="row" spacing={0.5}>
                            {isEditing ? (
                              <>
                                <IconButton size="small" color="success" onClick={() => onSaveEditComment(c.id)}>
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="inherit" onClick={onCancelEditComment}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                {isAuthor && (
                                  <IconButton size="small" color="warning" onClick={() => onStartEditComment(c.id, c.text)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                )}
                                {(isAuthor || isAdmin) && (
                                  <IconButton size="small" color="error" onClick={() => onDeleteComment(c.id)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </>
                            )}
                          </Stack>
                        }
                      >
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            fullWidth
                            sx={{ mr: 6 }}
                          />
                        ) : (
                          <ListItemText
                            primary={c.text}
                            secondary={`Создан: ${new Date(c.created_at).toLocaleString("ru-RU")}`}
                          />
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            <form onSubmit={onAddComment}>
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="Добавить рабочую заметку..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button type="submit" variant="contained">Отправить</Button>
              </Stack>
            </form>
          </Paper>
        </Grid>

        {/* Photos Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: 3, minHeight: 400, display: "flex", flexDirection: "column" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>Фотоотчеты (До / После / Документы)</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2, maxHeight: 300 }}>
              {photos.length === 0 ? (
                <Typography color="textSecondary">Фотографии не добавлены.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {photos.map((p) => (
                    <Grid size={6} key={p.id}>
                      <Box sx={{ border: "1px solid #e2e8f0", p: 1, borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }} color="primary">
                          {p.photo_type}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {p.description || "Без описания"}
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: "break-all", mt: 0.5 }}>
                          {p.file_path}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>

            <form onSubmit={onAddPhoto}>
              <Stack spacing={1.5}>
                <TextField
                  placeholder="Ссылка на файл фотографии..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  placeholder="Описание фотографии..."
                  value={photoDesc}
                  onChange={(e) => setPhotoDesc(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select value={photoType} onChange={(e) => setPhotoType(e.target.value as PhotoType)}>
                      {Object.values(PhotoType).map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button type="submit" variant="contained" fullWidth>Прикрепить фото</Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteCommentOpen}
        title="Удаление комментария"
        message="Вы действительно хотите удалить этот комментарий?"
        onConfirm={() => {
          if (commentToDelete) {
            deleteCommentMutation.mutate(commentToDelete);
            setDeleteCommentOpen(false);
            setCommentToDelete(null);
          }
        }}
        onCancel={() => {
          setDeleteCommentOpen(false);
          setCommentToDelete(null);
        }}
      />
    </Box>
  );
};
export default OrderDetails;
