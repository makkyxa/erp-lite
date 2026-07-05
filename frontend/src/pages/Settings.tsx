import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, Grid, TextField, Button, Stack, Snackbar, Alert } from "@mui/material";
import Breadcrumbs from "../components/Breadcrumbs";

export const Settings: React.FC = () => {
  const [orgName, setOrgName] = useState("ERP Lite Сервис");
  const [orgPhone, setOrgPhone] = useState("+7 (999) 123-45-67");
  const [orgEmail, setOrgEmail] = useState("support@crmlite.com");
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("settings_org_name");
    const savedPhone = localStorage.getItem("settings_org_phone");
    const savedEmail = localStorage.getItem("settings_org_email");
    if (savedName) setOrgName(savedName);
    if (savedPhone) setOrgPhone(savedPhone);
    if (savedEmail) setOrgEmail(savedEmail);
  }, []);

  const handleSave = () => {
    localStorage.setItem("settings_org_name", orgName);
    localStorage.setItem("settings_org_phone", orgPhone);
    localStorage.setItem("settings_org_email", orgEmail);
    setToastOpen(true);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  return (
    <Box>
      <Breadcrumbs items={[{ label: "Настройки" }]} />
      
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>Настройки системы</Typography>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3 }}>
          Параметры Сервисного Центра (ERP Lite)
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Название организации"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Контактный телефон"
              value={orgPhone}
              onChange={(e) => setOrgPhone(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Электронная почта поддержки"
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Валюта системы"
              defaultValue="Рубль (₽)"
              disabled
              fullWidth
            />
          </Grid>
        </Grid>
        
        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button variant="contained" onClick={handleSave}>Сохранить изменения</Button>
        </Stack>
      </Paper>

      <Snackbar 
        open={toastOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          Настройки успешно сохранены!
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default Settings;
