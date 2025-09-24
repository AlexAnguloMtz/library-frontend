// src/layouts/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    AppBar,
    Toolbar,
    CssBaseline,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { Icon, Icons } from './Icon';
import authenticationHelper from '../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../models/AuthenticationResponse';

const drawerWidth = 194;

const DashboardLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const authentication = authenticationHelper.getAuthentication();
        if (!authentication) {
            setAuth(null);
            navigate('/login');
        } else {
            setAuth(authentication);
        }
    }, []);

    if (auth === null) {
        return null;
    }

    const toggleDrawer = () => setMobileOpen(!mobileOpen);

    const handleLogout = () => {
        authenticationHelper.logout();
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ width: drawerWidth, bgcolor: '#3834a4', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Close button solo visible en mobile */}
            <Toolbar sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end' }}>
                <IconButton onClick={toggleDrawer}>
                    <CloseIcon sx={{ color: 'white' }} />
                </IconButton>
            </Toolbar>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '20px 12px', color: 'white' }}>
                <Icon name={Icons.book_open} />
                <h3 style={{ fontSize: '0.85em' }}>
                    Sistema Biblioteca
                </h3>
            </div>

            <div style={{ width: '96%', height: '1px', margin: '0px auto 8px auto', backgroundColor: '#D8BCE3' }}>
            </div>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <List sx={{ flexGrow: 1 }}>
                    {[
                        { text: 'Usuarios', icon: <PeopleAltOutlinedIcon />, path: '/dashboard/users', permission: 'users:read' },
                    ].filter((item) => {
                        return !item.permission || authenticationHelper.hasAnyPermission(auth, [item.permission]);
                    }).map((item) => {
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <ListItem
                                key={item.text}
                                component={Link}
                                to={item.path}
                                sx={{
                                    color: 'white',
                                    mb: 0.5,
                                    borderRadius: 1,
                                    px: 2,
                                    transition: 'all 0.2s',
                                    ...(isActive && {
                                        bgcolor: 'rgba(255,255,255,0.2)',
                                    }),
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        transform: 'translateX(3px)',
                                    },
                                    textDecoration: 'none',
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', fontSize: '0.9em', minWidth: '32px' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { fontSize: '0.9em' } }} />
                            </ListItem>
                        );
                    })}
                </List>

                {/* Logout button at the bottom */}
                <List sx={{ mt: 'auto' }}>
                    <ListItem
                        onClick={handleLogout}
                        sx={{
                            color: 'white',
                            mb: 0.5,
                            borderRadius: 1,
                            px: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                                transform: 'translateX(3px)',
                            },
                            textDecoration: 'none',
                        }}
                    >
                        <ListItemIcon sx={{ color: 'inherit', fontSize: '0.9em', minWidth: '32px' }}>
                            <Icon name={Icons.logout} />
                        </ListItemIcon>
                        <ListItemText primary="Cerrar Sesión" sx={{ '& .MuiListItemText-primary': { fontSize: '0.9em' } }} />
                    </ListItem>
                </List>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* Sidebar Desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        top: 0,
                        height: '100vh',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>

            {/* Sidebar Mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={toggleDrawer}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#3834a4' },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Contenido principal */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* AppBar solo mobile */}
                <AppBar position="fixed" sx={{ display: { xs: 'block', md: 'none' }, bgcolor: 'white' }}>
                    <Toolbar>
                        <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>

                {/* Toolbar para spacing solo mobile */}
                <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />

                {/* Contenido inyectable */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 1,
                        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
                        ml: { md: `${drawerWidth}px` },
                    }}
                >
                    <Outlet />
                </Box>

            </Box>
        </Box>
    );
};

export default DashboardLayout;
