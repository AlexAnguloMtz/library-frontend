import { Alert, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { Button } from "../Button";
import type { BookDetailsResponse } from "../../models/BookDetailsResponse";
import { AuthorCard, toAuthorCardModel } from "../AuthorCard/AuthorCard";
import { CopyToClipboard } from "../CopyToClipboard/CopyToClipboard";

export enum DeleteStatus {
    Idle = 'idle',
    Deleting = 'deleting',
    Deleted = 'deleted',
    Error = 'error'
}

export type DeleteState =
    | { status: DeleteStatus.Idle }
    | { status: DeleteStatus.Deleting }
    | { status: DeleteStatus.Deleted }
    | { status: DeleteStatus.Error, error: string };

export type DeleteBookModalProps = {
    open: boolean
    deleteState: DeleteState
    bookToDelete: BookDetailsResponse | null
    successActionLabel?: string
    closable?: boolean
    onClose: () => void
    onDeleteConfirm: () => void
    onSuccessAction?: () => void
}

export function DeleteBookModal({
    open,
    deleteState,
    bookToDelete,
    successActionLabel,
    closable = true,
    onClose,
    onDeleteConfirm,
    onSuccessAction
}: DeleteBookModalProps) {

    const handleClose = () => {
        if (closable) {
            onClose();
        }
    };

    const handleDeleteConfirm = () => {
        onDeleteConfirm();
    }

    const handleSuccessAction = () => {
        onSuccessAction?.();
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={closable ? handleClose : undefined}
            fullWidth
            maxWidth={'md'}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }
            }}
        >
            <DialogTitle sx={{
                textAlign: 'left',
                pb: 1,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1f2937'
            }}>
                {
                    deleteState.status === DeleteStatus.Deleted ? 'Libro eliminado' :
                        '¿Eliminar libro?'
                }
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 3 }}>
                {/* Alerts */}
                {deleteState.status === DeleteStatus.Deleted && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        ¡Libro eliminado exitosamente!
                    </Alert>
                )}
                {deleteState.status === DeleteStatus.Error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteState.error}
                    </Alert>
                )}

                {(deleteState.status !== DeleteStatus.Deleted) && bookToDelete && (
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                    }}>
                        <Box
                            component="img"
                            src={bookToDelete.imageUrl}
                            alt={"preview-" + bookToDelete.id}
                            sx={{
                                width: '50%',
                                height: '400px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                mb: 2
                            }}>
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '900px',
                        }}>
                            <Box sx={{ maxHeight: '400px', overflowY: 'auto', width: '100%' }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    width: '100%',
                                    padding: '0 20px',
                                }}>
                                    <Typography variant='h6' sx={{
                                        fontWeight: 600,
                                        color: '#1f2937',
                                        mb: 1
                                    }}>
                                        {bookToDelete.title}
                                    </Typography>
                                    <Typography sx={{
                                        fontWeight: 600,
                                    }}>
                                        {'Detalles del libro'}
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        py: 0.5,
                                        gap: 2
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 400,
                                            color: '#9ca3af',
                                            minWidth: '120px',
                                            textAlign: 'left'
                                        }}>
                                            ID:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            textAlign: 'right',
                                            flex: 1
                                        }}>
                                            {bookToDelete.id} <CopyToClipboard text={bookToDelete.id} />
                                        </Typography>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        py: 0.5,
                                        gap: 2
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 400,
                                            color: '#9ca3af',
                                            minWidth: '120px',
                                            textAlign: 'left'
                                        }}>
                                            ISBN:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            textAlign: 'right',
                                            flex: 1
                                        }}>
                                            {bookToDelete.isbn} <CopyToClipboard text={bookToDelete.isbn} />
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        py: 0.5,
                                        gap: 2
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 400,
                                            color: '#9ca3af',
                                            minWidth: '120px',
                                            textAlign: 'left'
                                        }}>
                                            Editorial:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            textAlign: 'right',
                                            flex: 1
                                        }}>
                                            {bookToDelete.publisher.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        py: 0.5,
                                        gap: 2
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 400,
                                            color: '#9ca3af',
                                            minWidth: '120px',
                                            textAlign: 'left'
                                        }}>
                                            Categoría:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            textAlign: 'right',
                                            flex: 1
                                        }}>
                                            {bookToDelete.category.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        py: 0.5,
                                        gap: 2
                                    }}>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 400,
                                            color: '#9ca3af',
                                            minWidth: '120px',
                                            textAlign: 'left'
                                        }}>
                                            Año:
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600,
                                            color: '#1f2937',
                                            textAlign: 'right',
                                            flex: 1
                                        }}>
                                            {bookToDelete.year}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                    width: '100%',
                                    padding: '0 20px',
                                    margin: '20px 0 0 0',
                                }}>
                                    <Typography sx={{
                                        fontWeight: 600,
                                    }}>
                                        Autores ({bookToDelete.authors.length})
                                    </Typography>
                                    {
                                        bookToDelete.authors.map((author, index) => (
                                            <AuthorCard
                                                key={index}
                                                author={toAuthorCardModel(author)}
                                                showRemoveButton={false}
                                                hoverStyles={false}
                                            />
                                        ))
                                    }
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{
                p: 3,
                pt: 1,
                gap: 0.5,
                justifyContent: 'flex-end'
            }}>
                {deleteState.status === DeleteStatus.Deleted ? (
                    <Button
                        type='primary'
                        onClick={handleSuccessAction}
                        className='small-button'
                    >
                        {successActionLabel || 'Cerrar'}
                    </Button>
                ) : (
                    <>
                        <Button
                            type='secondary'
                            onClick={handleClose}
                            className='small-button'
                            disabled={deleteState.status === DeleteStatus.Deleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type='error'
                            onClick={handleDeleteConfirm}
                            className='small-button'
                            disabled={deleteState.status === DeleteStatus.Deleting}
                        >
                            {deleteState.status === DeleteStatus.Deleting ? (
                                <>
                                    <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>

    );
}