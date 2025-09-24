import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, IconButton, TextField } from '@mui/material';
import { ContentCopy, ArrowBack } from '@mui/icons-material';
import './styles.css';
import userService from '../../services/UserService';
import type { FullUser } from '../../models/FullUser';
import { Button } from '../../components/Button';

enum UserPageStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    ERROR = 'error',
    SUCCESS = 'success'
}

type UserPageState = 
    | { status: UserPageStatus.IDLE }
    | { status: UserPageStatus.LOADING }
    | { status: UserPageStatus.ERROR; error: string }
    | { status: UserPageStatus.SUCCESS; user: FullUser };

const UserPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [state, setState] = useState<UserPageState>({ status: UserPageStatus.IDLE });
    const [activeTab, setActiveTab] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    const loadUser = async () => {
        if (!id) {
            navigate('/dashboard/users');
            return;
        }

        setState({ status: UserPageStatus.LOADING });
        
        try {
            const user = await userService.getFullUserById(id);
            setState({ status: UserPageStatus.SUCCESS, user });
        } catch (error) {
            setState({ 
                status: UserPageStatus.ERROR, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
            });
        }
    };

    const handleRetry = () => {
        loadUser();
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCopyId = () => {
        if (state.status === UserPageStatus.SUCCESS) {
            navigator.clipboard.writeText(state.user.id);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        loadUser();
    }, []);

    const renderContent = () => {
        switch (state.status) {
            case UserPageStatus.IDLE:
                return <div>Iniciando...</div>;
            
            case UserPageStatus.LOADING:
                return <div>Cargando usuario...</div>;
            
            case UserPageStatus.ERROR:
                return (
                    <div>
                        <p>Error: {state.error}</p>
                        <button onClick={handleRetry}>Reintentar</button>
                    </div>
                );
            
            case UserPageStatus.SUCCESS:
                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Sección Superior */}
                        <Box sx={{ 
                            display: 'flex', 
                            gap: 3, 
                            mb: 4,
                            p: 3
                        }}>
                            {/* Caja Izquierda - Foto */}
                            <Box sx={{ 
                                width: 280, 
                                height: 250,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {state.user.profilePictureUrl ? (
                                    <img 
                                        src={state.user.profilePictureUrl} 
                                        alt="Foto de perfil"
                                        style={{ 
                                            width: '100%', 
                                            height: '100%', 
                                            objectFit: 'cover' 
                                        }}
                                    />
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Sin foto
                                    </Typography>
                                )}
                            </Box>

                            {/* Caja Derecha - Información */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                                    {state.user.firstName} {state.user.lastName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        ID: {state.user.id}
                                    </Typography>
                                    <IconButton 
                                        size="small" 
                                        onClick={handleCopyId}
                                        sx={{ ml: 1 }}
                                    >
                                        <ContentCopy fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>

                        {/* Sección Inferior - Pestañas */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab label="Préstamos" />
                                <Tab label="Datos personales" />
                                <Tab label="Cuenta" />
                            </Tabs>
                        </Box>

                        {/* Contenido de las pestañas */}
                        <Box sx={{ mt: 3, pb: 24 }}>
                            {activeTab === 0 && (
                                <Typography>Contenido de Préstamos</Typography>
                            )}
                            {activeTab === 1 && (
                                <Box>
                                    {/* Información Básica */}
                                    <Box sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                Información Básica
                                            </Typography>
                                            {isEditing ? (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button type="secondary" onClick={() => setIsEditing(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="primary" onClick={() => {}}>
                                                        Guardar
                                                    </Button>
                                                </Box>
                                            ) : (
                                                <Button type="primary" onClick={() => setIsEditing(true)}>
                                                    Editar
                                                </Button>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Nombre:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.firstName}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.firstName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Apellido:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.lastName}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.lastName}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Teléfono:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.phone}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.phone}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Domicilio */}
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                            Domicilio
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Estado:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.address.state}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.state}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Ciudad:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.address.city}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.city}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Calle y número:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.address.address}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.address}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Colonia:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.address.district}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.district}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                    Código Postal:
                                                </Typography>
                                                {isEditing ? (
                                                    <TextField
                                                        value={state.user.address.zipCode}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            width: 300,
                                                            '& .MuiOutlinedInput-root': {
                                                                fontSize: '0.875rem'
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {state.user.address.zipCode}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                            {activeTab === 2 && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Información de Cuenta
                                        </Typography>
                                        {isEditing ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button type="secondary" onClick={() => setIsEditing(false)}>
                                                    Cancelar
                                                </Button>
                                                <Button type="primary" onClick={() => {}}>
                                                    Guardar
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Button type="primary" onClick={() => setIsEditing(true)}>
                                                Editar
                                            </Button>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                ID:
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {state.user.id}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Email:
                                            </Typography>
                                            {isEditing ? (
                                                <TextField
                                                    value={state.user.email}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {state.user.email}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Rol:
                                            </Typography>
                                            {isEditing ? (
                                                <TextField
                                                    value={state.user.roles.map(role => role.name).join(', ')}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {state.user.roles.map(role => role.name).join(', ')}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                                                Miembro desde:
                                            </Typography>
                                            {isEditing ? (
                                                <TextField
                                                    value={new Date(state.user.registrationDate).toLocaleDateString()}
                                                    variant="outlined"
                                                    size="small"
                                                    sx={{ 
                                                        width: 300,
                                                        '& .MuiOutlinedInput-root': {
                                                            fontSize: '0.875rem'
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {new Date(state.user.registrationDate).toLocaleDateString()}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className='user-page'>
            {/* Header con botón de regreso y título */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 3 
            }}>
                <IconButton
                    onClick={handleGoBack}
                    size="small"
                    sx={{ 
                        color: 'black',
                        p: 0.5
                    }}
                >
                    <ArrowBack />
                </IconButton>
                <Typography 
                    variant="body2" 
                    sx={{ 
                        color: 'black',
                        fontWeight: 500
                    }}
                >
                    Usuario
                </Typography>
            </Box>
            
            {renderContent()}
        </div>
    );
};

export default UserPage;
