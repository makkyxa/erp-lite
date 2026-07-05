import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h1" color="primary" sx={{ mb: 2, fontWeight: "bold" }}>
          404
        </Typography>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium" }}>
          Страница не найдена
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Извините, запрашиваемый адрес отсутствует или был перемещен.
        </Typography>
        <Button variant="contained" size="large" onClick={() => navigate("/")}>
          Вернуться на главную
        </Button>
      </Box>
    </Container>
  );
};
export default NotFound;
