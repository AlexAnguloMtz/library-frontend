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

enum UserRole {
  Admin = 'admin',
  Librarian = 'librarian',
  User = 'user'
}

export function Login() {
  const navigate = useNavigate();
  const [loginState, setLoginState] = useState<LoginState>({ status: LoginStatus.Idle });
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
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
      const authentication: AuthenticationResponse = await authService.login({
        email: data.email,
        password: data.password
      });
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

  const credentialsForRole = (role: UserRole): LoginFormData | null => {
    if (!import.meta.env.DEV) {
      return null;
    }

    const credentials = {
      [UserRole.Admin]: {
        email: import.meta.env.VITE_DEV_ADMIN_EMAIL!,
        password: import.meta.env.VITE_DEV_ADMIN_PASSWORD!,
      },
      [UserRole.Librarian]: {
        email: import.meta.env.VITE_DEV_LIBRARIAN_EMAIL!,
        password: import.meta.env.VITE_DEV_LIBRARIAN_PASSWORD!,
      },
      [UserRole.User]: {
        email: import.meta.env.VITE_DEV_USER_EMAIL!,
        password: import.meta.env.VITE_DEV_USER_PASSWORD!,
      },
    } as const;

    return credentials[role];
  };

  const handleQuickLogin = (role: UserRole) => {
    const values: LoginFormData | null = credentialsForRole(role);
    if (values) {
      setValue('email', values.email);
      setValue('password', values.password);
    }
  };

  return (
    <Box className="login-container">

      {/* --- Dialog only visible in 'dev' mode --- */}
      {import.meta.env.DEV && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '25%',
            bgcolor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '0 0 8px 0',
            p: 2,
            zIndex: 9999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1, color: '#475569', fontWeight: 600 }}
          >
            Este cuadro sólo debe aparecer en modo DEMOSTRATIVO, nunca en PRODUCCIÓN
          </Typography>

          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => handleQuickLogin(UserRole.Admin)}
            sx={{ mb: 1, textTransform: 'none', width: '100%' }}
          >
            Ingresar como Administrador
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => handleQuickLogin(UserRole.Librarian)}
            sx={{ mb: 1, textTransform: 'none', width: '100%' }}
          >
            Ingresar como Bibliotecario
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => handleQuickLogin(UserRole.User)}
            sx={{ textTransform: 'none', width: '100%' }}
          >
            Ingresar como Usuario
          </Button>
        </Box>
      )}

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
              startIcon={loginState.status === LoginStatus.LoggingIn ? <CircularProgress size={20} /> : undefined}
            >
              {loginState.status === LoginStatus.LoggingIn ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
