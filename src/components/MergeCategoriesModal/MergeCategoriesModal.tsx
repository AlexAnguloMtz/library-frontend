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
import type { BookCategoryResponse } from '../../models/BookCategoryResponse';
import type { MergeBookCategoriesRequest } from '../../models/MergeBookCategoriesRequest';
import type { MergeBookCategoriesResponse } from '../../models/MergeBookCategoriesResponse';
import DeleteIcon from '@mui/icons-material/Delete';

export type CategoriesMergeState =
    | { type: "idle" }
    | { type: "merging" }
    | { type: "error"; message: string }
    | { type: "success", result: MergeBookCategoriesResponse };

enum CategoriesMergeStep {
    SelectResult,
    ConfirmMerge,
    ShowResult
}

interface MergeBookCategoriesModalProps {
    open: boolean;
    onClose: () => void;
    categories: BookCategoryResponse[];
    onConfirm: (request: MergeBookCategoriesRequest) => Promise<void>;
    state: CategoriesMergeState;
}

export default function MergeBookCategoriesModal({
    open,
    onClose,
    categories,
    onConfirm,
    state
}: MergeBookCategoriesModalProps) {
    const steps = ["Seleccionar categoría", "Confirmación", "Resultados"];
    const [activeStep, setActiveStep] = useState<CategoriesMergeStep>(CategoriesMergeStep.SelectResult);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [confirmationText, setConfirmationText] = useState("");

    const mergedCategoriesIds = categories
        .filter(cat => cat.id !== selectedCategoryId)
        .map(cat => cat.id);

    const isMerging = state.type === "merging";
    const error = state.type === "error" ? state.message : undefined;
    const success = state.type === "success";

    const targetCategory = categories.find(cat => cat.id === selectedCategoryId);

    const handleNext = () => setActiveStep(prev => (prev + 1) as CategoriesMergeStep);
    const handleBack = () => setActiveStep(prev => (prev - 1) as CategoriesMergeStep);

    const handleConfirm = async () => {
        if (selectedCategoryId) {
            await onConfirm({
                targetCategoryId: selectedCategoryId,
                mergedCategoriesIds: mergedCategoriesIds
            });
        }

    };

    const handleClose = () => {
        onClose();
        handleReset();
    }

    const handleReset = () => {
        setActiveStep(CategoriesMergeStep.SelectResult);
        setSelectedCategoryId(null);
        setConfirmationText("");
    };

    useEffect(() => {
        if (!open) handleReset();
    }, [open]);

    useEffect(() => {
        if (state.type === "success") {
            setActiveStep(CategoriesMergeStep.ShowResult);
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
                Combinar categorías
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

                {activeStep === CategoriesMergeStep.SelectResult && (
                    <StepSelectCategory
                        categories={categories}
                        selectedCategoryId={selectedCategoryId}
                        setSelectedCategoryId={setSelectedCategoryId}
                        disabled={isMerging}
                    />
                )}

                {activeStep === CategoriesMergeStep.ConfirmMerge && targetCategory && (
                    <StepConfirmMerge
                        categories={categories}
                        targetCategory={targetCategory}
                        selectedCategoryId={selectedCategoryId!}
                        confirmationText={confirmationText}
                        setConfirmationText={setConfirmationText}
                        state={state}
                    />
                )}

                {activeStep === CategoriesMergeStep.ShowResult && state.type === "success" && (
                    <StepResult
                        result={state.result}
                    />
                )}
            </DialogContent>

            <DialogActions style={{ flexDirection: "column", alignItems: "stretch" }}>
                {/* Mostrar error arriba de los botones en el paso 2 */}
                {activeStep === CategoriesMergeStep.ConfirmMerge && error && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {error}
                    </Alert>
                )}

                {activeStep === CategoriesMergeStep.SelectResult && (
                    <Button
                        onClick={handleNext}
                        disabled={!selectedCategoryId || isMerging}
                        variant="contained"
                    >
                        Siguiente
                    </Button>
                )}

                {activeStep === CategoriesMergeStep.ConfirmMerge && !success && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Button onClick={handleBack} disabled={isMerging}>Atrás</Button>
                        <Button
                            onClick={handleConfirm}
                            variant="contained"
                            disabled={confirmationText !== "COMBINAR-CATEGORIAS" || isMerging}
                            startIcon={isMerging ? <CircularProgress color="inherit" size={20} /> : null}
                        >
                            {isMerging ? "Combinando..." : "Confirmar"}
                        </Button>
                    </div>
                )}

                {activeStep === CategoriesMergeStep.ShowResult && success && (
                    <Button onClick={onClose} variant="contained">
                        Cerrar
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

/* ===========================
   Paso 1: Selección de categoría
=========================== */
interface StepSelectCategoryProps {
    categories: BookCategoryResponse[];
    selectedCategoryId: string | null;
    setSelectedCategoryId: (id: string) => void;
    disabled?: boolean;
}

const StepSelectCategory: React.FC<StepSelectCategoryProps> = ({
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    disabled
}) => (
    <Box>
        <Typography>Selecciona la categoría que será el resultado final. Las demás serán eliminadas.</Typography>
        <Box mt={2} display="flex" flexDirection="column" gap={1}>
            {categories.map(cat => (
                <FormControlLabel
                    key={cat.id}
                    control={
                        <Checkbox
                            checked={selectedCategoryId === cat.id}
                            onChange={() => setSelectedCategoryId(cat.id)}
                            disabled={disabled}
                        />
                    }
                    label={`${cat.name} (${cat.bookCount} libros)`}
                />
            ))}
        </Box>
    </Box>
);

/* ===========================
   Paso 2: Confirmación irreversible + resumen visual
=========================== */
interface StepConfirmMergeProps {
    categories: BookCategoryResponse[];
    targetCategory: BookCategoryResponse;
    selectedCategoryId: string;
    confirmationText: string;
    setConfirmationText: (text: string) => void;
    state: CategoriesMergeState;
}

const StepConfirmMerge: React.FC<StepConfirmMergeProps> = ({
    categories,
    targetCategory,
    selectedCategoryId,
    confirmationText,
    setConfirmationText,
    state
}) => {
    const isMerging = state.type === "merging";
    const categoriesToMerge = categories.filter(cat => cat.id !== selectedCategoryId);
    const totalMovedBooks = categoriesToMerge.reduce((acc, c) => acc + c.bookCount, 0);

    return (
        <Box>
            <Typography mb={1}>Se moverán <strong>{totalMovedBooks}</strong> libros a la categoría <strong>{targetCategory.name}</strong> y se eliminarán las otras categorías.</Typography>

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
                        <Typography variant="h6">{targetCategory.name}</Typography>
                    </Box>

                    <Box display="flex" alignItems="center" ml={2}>
                        <BookIcon style={{ marginRight: 4 }} />
                        <Typography>{targetCategory.bookCount} libros</Typography>
                    </Box>
                </div>

                {/* A eliminar */}
                {categoriesToMerge.map(cat => (
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
                Para confirmar, escribe <strong>COMBINAR-CATEGORIAS</strong> en el siguiente campo.
            </Alert>

            <TextField
                label="Escribe 'COMBINAR-CATEGORIAS'"
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
    result: MergeBookCategoriesResponse;
}
const StepResult: React.FC<StepResultProps> = ({ result }) => (
    <Paper elevation={0} sx={{ p: 3, maxWidth: 500 }}>
        <Box display="grid" gridTemplateColumns="50px 1fr" rowGap={1} alignItems="center">
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography>Se movieron <strong>{result.movedBooks}</strong> libros a <strong>{result.targetCategory.name}</strong>. Ahora tiene <strong>{result.targetCategory.bookCount}</strong> libros.</Typography>

            <DeleteIcon color="error" sx={{ mr: 1 }} />
            <Typography>Se eliminaron <strong>{result.deletedCategories}</strong> categorías.</Typography>


        </Box>
    </Paper>
);
