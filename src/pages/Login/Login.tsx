import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon, Icons } from '../../components/Icon';
import './styles.css';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import authService from '../../services/AuthService';

// Zod schema
const loginSchema = z.object({
  email: z.string().min(1, 'El correo electrónico es requerido').email('El correo electrónico no es válido'),
  password: z.string().min(1, 'La contraseña es requerida').min(8, 'La contraseña debe tener al menos 8 caracteres')
});

type LoginFormData = z.infer<typeof loginSchema>;

enum LoginStatus {
  Idle = 'Idle',
  LoggingIn = 'LoggingIn',
  LoginError = 'LoginError',
  LoginSuccess = 'LoginSuccess'
}

type LoginState =
  | { status: LoginStatus.Idle }
  | { status: LoginStatus.LoggingIn }
  | { status: LoginStatus.LoginError; error: string }
  | { status: LoginStatus.LoginSuccess };

export function Login() {
  const navigate = useNavigate();
  const [loginState, setLoginState] = useState<LoginState>({ status: LoginStatus.Idle });
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' }
  });

  const handleTogglePasswordVisibility = () => setShowPassword(prev => !prev);

  const onSubmit = async (data: LoginFormData) => {
    setLoginState({ status: LoginStatus.LoggingIn });
    try {
      const authentication: AuthenticationResponse = await authService.login({ email: data.email, password: data.password });
      setLoginState({ status: LoginStatus.LoginSuccess });
      authenticationHelper.setAuthentication(authentication);
      navigate('/dashboard/books');
    } catch (error: any) {
      setLoginState({
        status: LoginStatus.LoginError,
        error: error.message || 'Error al iniciar sesión. Verifica tus credenciales.'
      });
    }
  };

  return (
    <Box className="login-container">
      <Card className="login-card">
        <CardContent className="login-card-content">
          <Box className="login-header">
            <Box className="login-icon-wrapper">
              <Icon name={Icons.book_open} className="login-icon" fillColor="#4F46E5" />
            </Box>
            <Typography variant="h4" component="h1" className="login-title">
              Sistema de Gestión de Biblioteca
            </Typography>
            <Typography variant="body2" className="login-subtitle">
              Inicie sesión para continuar
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} className="login-form">
            {loginState.status === LoginStatus.LoginError && (
              <Alert severity="error" className="login-error">
                {loginState.error}
              </Alert>
            )}

            {/* Email */}
            <Box className="login-field-container">
              <Typography variant="body2" className="login-field-label">
                Correo electrónico
              </Typography>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="email"
                    disabled={loginState.status === LoginStatus.LoggingIn}
                    autoComplete="email"
                    autoFocus
                    variant="outlined"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Box>

            {/* Password */}
            <Box className="login-field-container">
              <Typography variant="body2" className="login-field-label">
                Contraseña
              </Typography>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    disabled={loginState.status === LoginStatus.LoggingIn}
                    autoComplete="current-password"
                    variant="outlined"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                            disabled={loginState.status === LoginStatus.LoggingIn}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Box>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loginState.status === LoginStatus.LoggingIn}
              className="login-button"
              startIcon={(loginState.status === LoginStatus.LoggingIn) ? <CircularProgress size={20} /> : undefined}
            >
              {(loginState.status === LoginStatus.LoggingIn) ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
