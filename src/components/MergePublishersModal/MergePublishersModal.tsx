import './styles.css';
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Checkbox,
    FormControlLabel,
    Alert,
    TextField,
    CircularProgress,
    IconButton,
    Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import BookIcon from "@mui/icons-material/Book";
import DeleteIcon from '@mui/icons-material/Delete';
import type { MergePublishersResponse } from '../../models/MergePublishersResponse';
import type { PublisherResponse } from '../../models/PublisherResponse';
import type { MergePublishersRequest } from '../../models/MergePublishersRequest';

export type MergeState =
    | { type: "idle" }
    | { type: "merging" }
    | { type: "error"; message: string }
    | { type: "success", result: MergePublishersResponse };

enum MergeStep {
    SelectResult,
    ConfirmMerge,
    ShowResult
}

interface MergePublishersModalProps {
    open: boolean;
    onClose: () => void;
    publishers: PublisherResponse[];
    onConfirm: (request: MergePublishersRequest) => Promise<void>;
    state: MergeState;
}

export default function MergePublishersModal({
    open,
    onClose,
    publishers,
    onConfirm,
    state
}: MergePublishersModalProps) {
    const steps = ["Seleccionar editorial", "Confirmación", "Resultados"];
    const [activeStep, setActiveStep] = useState<MergeStep>(MergeStep.SelectResult);
    const [selectedPublisherId, setSelectedPublisherId] = useState<string | null>(null);
    const [confirmationText, setConfirmationText] = useState("");

    const mergedPublishersIds = publishers
        .filter(pub => pub.id !== selectedPublisherId)
        .map(pub => pub.id);

    const isMerging = state.type === "merging";
    const error = state.type === "error" ? state.message : undefined;
    const success = state.type === "success";

    const targetPublisher = publishers.find(cat => cat.id === selectedPublisherId);

    const handleNext = () => setActiveStep(prev => (prev + 1) as MergeStep);
    const handleBack = () => setActiveStep(prev => (prev - 1) as MergeStep);

    const handleConfirm = async () => {
        if (selectedPublisherId) {
            await onConfirm({
                targetPublisherId: selectedPublisherId,
                mergedPublishersIds: mergedPublishersIds
            });
        }

    };

    const handleClose = () => {
        onClose();
        handleReset();
    }

    const handleReset = () => {
        setActiveStep(MergeStep.SelectResult);
        setSelectedPublisherId(null);
        setConfirmationText("");
    };

    useEffect(() => {
        if (!open) handleReset();
    }, [open]);

    useEffect(() => {
        if (state.type === "success") {
            setActiveStep(MergeStep.ShowResult);
        }
    }, [state.type]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                Combinar editoriales
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                    disabled={isMerging}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === MergeStep.SelectResult && (
                    <StepSelectPublisher
                        publishers={publishers}
                        selectedPublisherId={selectedPublisherId}
                        setSelectedPublisherId={setSelectedPublisherId}
                        disabled={isMerging}
                    />
                )}

                {activeStep === MergeStep.ConfirmMerge && targetPublisher && (
                    <StepConfirmMerge
                        publishers={publishers}
                        targetPublisher={targetPublisher}
                        selectedPublisherId={selectedPublisherId!}
                        confirmationText={confirmationText}
                        setConfirmationText={setConfirmationText}
                        state={state}
                    />
                )}

                {activeStep === MergeStep.ShowResult && state.type === "success" && (
                    <StepResult
                        result={state.result}
                    />
                )}
            </DialogContent>

            <DialogActions style={{ flexDirection: "column", alignItems: "stretch" }}>
                {/* Mostrar error arriba de los botones en el paso 2 */}
                {activeStep === MergeStep.ConfirmMerge && error && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                )}

                {activeStep === MergeStep.SelectResult && (
                    <Button
                        onClick={handleNext}
                        disabled={!selectedPublisherId || isMerging}
                        variant="contained"
                    >
                        Siguiente
                    </Button>
                )}

                {activeStep === MergeStep.ConfirmMerge && !success && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Button onClick={handleBack} disabled={isMerging}>Atrás</Button>
                        <Button
                            onClick={handleConfirm}
                            variant="contained"
                            disabled={confirmationText !== "COMBINAR-EDITORIALES" || isMerging}
                            startIcon={isMerging ? <CircularProgress color="inherit" size={20} /> : null}
                        >
                            {isMerging ? "Combinando..." : "Confirmar"}
                        </Button>
                    </div>
                )}

                {activeStep === MergeStep.ShowResult && success && (
                    <Button onClick={onClose} variant="contained">
                        Cerrar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

/* ===========================
   Paso 1: Selección de editorial
=========================== */
interface StepSelectPublisherProps {
    publishers: PublisherResponse[];
    selectedPublisherId: string | null;
    setSelectedPublisherId: (id: string) => void;
    disabled?: boolean;
}

const StepSelectPublisher: React.FC<StepSelectPublisherProps> = ({
    publishers,
    selectedPublisherId,
    setSelectedPublisherId,
    disabled
}) => (
    <Box>
        <Typography>Selecciona la editorial que será el resultado final. Las demás serán eliminadas.</Typography>
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
            {publishers.map(pub => (
                <FormControlLabel
                    key={pub.id}
                    control={
                        <Checkbox
                            checked={selectedPublisherId === pub.id}
                            onChange={() => setSelectedPublisherId(pub.id)}
                            disabled={disabled}
                        />
                    }
                    label={`${pub.name} (${pub.bookCount} libros)`}
                />
            ))}
        </Box>
    </Box>
);

/* ===========================
   Paso 2: Confirmación irreversible + resumen visual
=========================== */
interface StepConfirmMergeProps {
    publishers: PublisherResponse[];
    targetPublisher: PublisherResponse;
    selectedPublisherId: string;
    confirmationText: string;
    setConfirmationText: (text: string) => void;
    state: MergeState;
}

const StepConfirmMerge: React.FC<StepConfirmMergeProps> = ({
    publishers,
    targetPublisher,
    selectedPublisherId,
    confirmationText,
    setConfirmationText,
    state
}) => {
    const isMerging = state.type === "merging";
    const publishersToMerge = publishers.filter(pub => pub.id !== selectedPublisherId);
    const totalMovedBooks = publishersToMerge.reduce((acc, c) => acc + c.bookCount, 0);

    return (
        <Box>
            <Typography mb={1}>Se moverán <strong>{totalMovedBooks}</strong> libros a la editorial <strong>{targetPublisher.name}</strong> y se eliminarán las otras editoriales.</Typography>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Target */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: 8,
                    backgroundColor: "#d0f0c0",
                    borderRadius: 4
                }}>
                    <Box display="flex" alignItems="center" minWidth={180}>
                        <CheckCircleIcon style={{ marginRight: 8, color: "green" }} />
                        <Typography variant="h6">{targetPublisher.name}</Typography>
                    </Box>

                    <Box display="flex" alignItems="center" ml={2}>
                        <BookIcon style={{ marginRight: 4 }} />
                        <Typography>{targetPublisher.bookCount} libros</Typography>
                    </Box>
                </div>

                {/* A eliminar */}
                {publishersToMerge.map(cat => (
                    <div key={cat.id} style={{
                        display: "flex",
                        alignItems: "center",
                        padding: 8,
                        backgroundColor: "#f8d7da",
                        borderRadius: 4
                    }}>
                        <Box display="flex" alignItems="center" minWidth={180}>
                            <DeleteForeverIcon style={{ marginRight: 8, color: "red" }} />
                            <Typography variant="h6">{cat.name}</Typography>
                        </Box>

                        <Box display="flex" alignItems="center" ml={2}>
                            <BookIcon style={{ marginRight: 4 }} />
                            <Typography>{cat.bookCount} libros</Typography>
                        </Box>
                    </div>
                ))}

            </div>

            <Alert severity="warning" sx={{ my: 2 }}>
                Esta acción es <strong>permanente</strong> e <strong>irreversible</strong>.<br />
                Para confirmar, escribe <strong>COMBINAR-EDITORIALES</strong> en el siguiente campo.
            </Alert>

            <TextField
                label="Escribe 'COMBINAR-EDITORIALES'"
                value={confirmationText}
                onChange={e => setConfirmationText(e.target.value)}
                fullWidth
                disabled={isMerging}
            />
        </Box>
    );
};

/* ===========================
   Paso 3: Resultado final
=========================== */
interface StepResultProps {
    result: MergePublishersResponse;
}
const StepResult: React.FC<StepResultProps> = ({ result }) => (
    <Paper elevation={0} sx={{ p: 3, maxWidth: 500 }}>
        <Box display="grid" gridTemplateColumns="50px 1fr" rowGap={1} alignItems="center">
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography>Se movieron <strong>{result.movedBooks}</strong> libros a <strong>{result.targetPublisher.name}</strong>. Ahora tiene <strong>{result.targetPublisher.bookCount}</strong> libros.</Typography>

            <DeleteIcon color="error" sx={{ mr: 1 }} />
            <Typography>Se eliminaron <strong>{result.deletedPublishers}</strong> editoriales.</Typography>


        </Box>
    </Paper>
);
