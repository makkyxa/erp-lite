import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";

const loginSchema = zod.object({
  username: zod.string().min(1, "Имя пользователя обязательно"),
  password: zod.string().min(6, "Пароль должен быть не менее 6 символов"),
});

type LoginFormData = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("password", data.password);

      const response = await api.post("/v1/auth/login", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const { access_token, refresh_token } = response.data;

      const userProfileResponse = await api.get("/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      login(access_token, refresh_token, userProfileResponse.data);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Ошибка входа. Проверьте правильность логина и пароля."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={4} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: "bold" }}>
            ERP Lite
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Авторизация в системе автосервиса
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            margin="normal"
            fullWidth
            label="Имя пользователя"
            autoFocus
            error={!!errors.username}
            helperText={errors.username?.message}
            {...register("username")}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Пароль"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 1, borderRadius: 2 }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Войти"}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};
export default Login;
