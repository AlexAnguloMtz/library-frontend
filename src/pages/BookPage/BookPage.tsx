import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, IconButton, Skeleton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import './styles.css';
import { fromDtoToFormValues, type BookDetailsResponse } from '../../models/BookDetailsResponse';
import { useNavigate, useParams } from 'react-router-dom';
import type { BookOptionsResponse } from '../../models/BookOptionsResponse';
import bookService from '../../services/BookService';
import { Button } from '../../components/Button';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';
import authenticationHelper from '../../util/AuthenticationHelper';
import { CopyToClipboard } from '../../components/CopyToClipboard/CopyToClipboard';
import { AuthorCard, toAuthorCardModel } from '../../components/AuthorCard/AuthorCard';
import { BookFormModal, type BookFormData } from '../../components/BookFormModal/BookFormModal';
import { toUpdateDto } from '../../models/UpdateBookRequest';
import { DeleteBookModal, DeleteStatus, type DeleteState } from '../../components/DeleteBookModal/DeleteBookModal';
import type { ProblemDetailError } from '../../models/ProblemDetail';
import { NotFoundSurface } from '../../components/NotFoundSurface/NotFoundSurface';
import { HttpStatus } from '../../util/HttpStatus';

enum DataLoadStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error',
}

type BookDetailsState =
    | { status: DataLoadStatus.IDLE }
    | { status: DataLoadStatus.LOADING }
    | { status: DataLoadStatus.SUCCESS; book: BookDetailsResponse }
    | { status: DataLoadStatus.ERROR; error: ProblemDetailError };

type BookOptionsState =
    | { status: DataLoadStatus.IDLE }
    | { status: DataLoadStatus.LOADING }
    | { status: DataLoadStatus.SUCCESS; options: BookOptionsResponse }
    | { status: DataLoadStatus.ERROR; error: string };

enum BookPageTab {
    COPIES = 0,
}

const BookPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [bookDetailsState, setBookDetailsState] = useState<BookDetailsState>({ status: DataLoadStatus.IDLE });
    const [bookOptionsState, setBookOptionsState] = useState<BookOptionsState>({ status: DataLoadStatus.IDLE });
    const [activeTab, setActiveTab] = useState(BookPageTab.COPIES);
    const [auth, setAuth] = useState<AuthenticationResponse | null>(null);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteState, setDeleteState] = useState<DeleteState>({ status: DeleteStatus.Idle });

    const handleCloseUpdateModal = () => {
        setUpdateModalOpen(false);
    }

    const loadBookOptions = async (): Promise<void> => {
        setBookOptionsState({ status: DataLoadStatus.LOADING });
        try {
            const options = await bookService.getBookOptions();
            setBookOptionsState({ status: DataLoadStatus.SUCCESS, options });
        } catch (error) {
            setBookOptionsState({
                status: DataLoadStatus.ERROR,
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    };

    const loadBookData = async () => {
        if (!id) {
            navigate('/dashboard/books');
            return;
        }

        setBookDetailsState({ status: DataLoadStatus.LOADING });

        try {
            const book = await bookService.getBookById(id);
            setBookDetailsState({
                status: DataLoadStatus.SUCCESS,
                book
            });
        } catch (error) {
            setBookDetailsState({
                status: DataLoadStatus.ERROR,
                error: error as ProblemDetailError
            });
        }
    };

    const handleRetry = () => {
        loadBookData();
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        const auth = authenticationHelper.getAuthentication();
        setAuth(auth);
    }, []);

    useEffect(() => {
        if (id) {
            loadBookData();
        }
    }, []);

    useEffect(() => {
        loadBookOptions();
    }, []);

    const handleEditBookClick = () => {
        setUpdateModalOpen(true);
    }

    const handleDeleteBookClick = () => {
        setDeleteModalOpen(true);
    }

    const handleDeleteClose = () => {
        setDeleteModalOpen(false);
    }

    const handleDeleteConfirm = async () => {
        try {
            setDeleteState({ status: DeleteStatus.Deleting });
            await bookService.deleteById(id!);
            setDeleteState({ status: DeleteStatus.Deleted });
        } catch (error: any) {
            setDeleteState({
                status: DeleteStatus.Error,
                error: error.message || 'Error desconocido'
            });
        }
    }

    const getUpdateFormValues = async (): Promise<BookFormData> => {
        const bookDetails: BookDetailsResponse = await bookService.getBookById(id!);
        return fromDtoToFormValues(bookDetails);
    }

    const renderContent = () => {
        switch (bookDetailsState.status) {
            case DataLoadStatus.IDLE:
                return <div>Iniciando...</div>;

            case DataLoadStatus.LOADING:
                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Sección Superior - Skeleton */}
                        <Box sx={{
                            display: 'flex',
                            gap: 3,
                            mb: 4,
                            p: 3
                        }}>
                            {/* Caja Izquierda - Foto Skeleton */}
                            <Box sx={{
                                width: 240,
                                height: 274,
                                backgroundColor: '#f5f5f5',
                                borderRadius: 1
                            }}>
                                <Skeleton variant="rectangular" width="100%" height="100%" />
                            </Box>

                            {/* Caja Derecha - Información Skeleton */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Nombre y ID */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="text" width="60%" height={32} />
                                    <Skeleton variant="text" width="40%" height={20} />
                                </Box>

                                {/* Información de contacto */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Skeleton variant="text" width="70%" height={20} />
                                    <Skeleton variant="text" width="50%" height={20} />
                                </Box>

                                {/* Rol */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Skeleton variant="text" width="30%" height={20} />
                                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 3 }} />
                                </Box>

                                {/* Fecha de registro */}
                                <Skeleton variant="text" width="45%" height={20} />
                            </Box>
                        </Box>

                        {/* Tabs Skeleton */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Box sx={{ display: 'flex', gap: 3, px: 3 }}>
                                <Skeleton variant="text" width={80} height={40} />
                                <Skeleton variant="text" width={120} height={40} />
                                <Skeleton variant="text" width={100} height={40} />
                            </Box>
                        </Box>

                        {/* Contenido de tabs skeleton */}
                        <Box sx={{ px: 3 }}>
                            <Skeleton variant="text" width="100%" height={200} />
                        </Box>
                    </Box>
                );

            case DataLoadStatus.ERROR:
                if (bookDetailsState.error.status === HttpStatus.NOT_FOUND) {
                    return (
                        <NotFoundSurface onRetry={handleRetry} />
                    );
                }
                return (
                    <div>
                        <p>Error: {bookDetailsState.error.detail}</p>
                        <button onClick={handleRetry}>Reintentar</button>
                    </div>
                );

            case DataLoadStatus.SUCCESS:
                return (
                    <Box sx={{ width: '100%' }}>
                        {/* Sección Superior */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 3,
                                mb: 4,
                                p: 3,
                            }}
                        >
                            {/* Caja Izquierda - Foto */}
                            <Box
                                sx={{
                                    width: 240,
                                    height: 274,
                                    backgroundColor: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                }}
                            >
                                {bookDetailsState.status === 'success' && (
                                    <img
                                        src={(bookDetailsState.book.imageUrl)}
                                        alt="Foto de libro"
                                        style={{
                                            width: '70%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Caja Derecha - Información */}
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {/* Aquí va el contenido de texto del libro */}
                                <Typography sx={{ fontWeight: 'bold', margin: '0 0 14px 0' }} variant="h6">{bookDetailsState.book.title}</Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                    <Box sx={{ mt: 0 }}>
                                        <Typography sx={{ margin: ' 0 0 0', fontWeight: 'bold', fontSize: '1em' }} variant="h6">Detalles del libro</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 1 }}>
                                            <Typography variant="body2" sx={{ width: '100px' }}>
                                                ID:
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {bookDetailsState.book.id} <CopyToClipboard size='small' text={bookDetailsState.book.id} />
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 1 }}>
                                            <Typography variant="body2" sx={{ width: '100px' }}>
                                                ISBN:
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {bookDetailsState.book.isbn} <CopyToClipboard size='small' text={bookDetailsState.book.isbn} />
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 1 }}>
                                            <Typography variant="body2" sx={{ width: '100px' }}>
                                                Categoría:
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {bookDetailsState.book.category.name}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 5, mt: 1 }}>
                                            <Typography variant="body2" sx={{ width: '100px' }}>
                                                Año:
                                            </Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {bookDetailsState.book.year}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ width: '500px', maxHeight: '220px', overflowY: 'auto' }}>
                                        <Typography sx={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1em' }} variant="h6">Autores ({bookDetailsState.book.authors.length})</Typography>
                                        {bookDetailsState.book.authors.map((author) => (
                                            <AuthorCard
                                                key={author.id}
                                                author={toAuthorCardModel(author)}
                                                showRemoveButton={false}
                                                hoverStyles={false}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Sección Inferior - Pestañas */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs value={activeTab} onChange={handleTabChange}>
                                <Tab label="Copias" />
                            </Tabs>
                        </Box>

                        {/* Contenido de las pestañas */}
                        <Box sx={{ mt: 3, pb: 24, px: 3 }}>
                            {activeTab === BookPageTab.COPIES && <>copias...</>}
                        </Box>
                    </Box>
                );


            default:
                return null;
        }
    };

    return (
        <div className="book-page">
            {/* Header con botón de regreso y título */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                }}
            >
                <IconButton
                    onClick={handleGoBack}
                    size="small"
                    sx={{
                        color: 'black',
                        p: 0.5,
                    }}
                >
                    <ArrowBack />
                </IconButton>

                <Typography
                    variant="body2"
                    sx={{
                        color: 'black',
                        fontWeight: 500,
                    }}
                >
                    Libro
                </Typography>

                <div style={{ flexGrow: 1 }}></div>

                {bookDetailsState.status === DataLoadStatus.SUCCESS &&
                    auth && authenticationHelper.hasAnyPermission(auth, ['books:update']) && (
                        <Button
                            type="primary"
                            onClick={handleEditBookClick}
                            sx={{
                                fontSize: '0.75rem',
                                padding: '6px 12px',
                                minWidth: 'auto'
                            }}
                        >
                            Editar libro
                        </Button>
                    )}

                {bookDetailsState.status === DataLoadStatus.SUCCESS &&
                    auth && authenticationHelper.hasAnyPermission(auth, ['books:delete']) && (
                        <Button
                            type="error"
                            onClick={handleDeleteBookClick}
                            sx={{
                                fontSize: '0.75rem',
                                padding: '6px 12px',
                                minWidth: 'auto'
                            }}
                        >
                            Borrar libro
                        </Button>
                    )}
            </Box>

            {/* Contenido de la página */}
            {renderContent()}

            {/* Update Modal */}
            <BookFormModal
                open={updateModalOpen}
                onCloseModal={handleCloseUpdateModal}
                categories={bookOptionsState.status === DataLoadStatus.SUCCESS ? bookOptionsState.options.categories : []}
                initialImageSrc={bookDetailsState.status === DataLoadStatus.SUCCESS ? bookDetailsState.book.imageUrl : undefined}
                getInitialFormValues={getUpdateFormValues}
                save={(data: BookFormData, imageFile: File | null) => bookService.updateBook(id!, toUpdateDto(data, imageFile))}
                onSaveSuccess={loadBookData}
                successPrimaryActionLabel="OK"
                onSuccessPrimaryAction={() => { handleCloseUpdateModal(); }}
            />

            {/* Delete Modal */}
            <DeleteBookModal
                open={deleteModalOpen}
                bookToDelete={bookDetailsState.status === DataLoadStatus.SUCCESS ? bookDetailsState.book : null}
                onClose={handleDeleteClose}
                onDeleteConfirm={handleDeleteConfirm}
                deleteState={deleteState}
                successActionLabel="Volver al listado de libros"
                onSuccessAction={() => { navigate('/dashboard/books'); }}
                closable={deleteState.status !== DeleteStatus.Deleting && deleteState.status !== DeleteStatus.Deleted}
            />

        </div>
    );
};

export default BookPage;
