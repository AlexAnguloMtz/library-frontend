import { useEffect, useState, type JSX } from 'react';
import './styles.css';
import { Dialog, DialogTitle, Button as MuiButton, DialogContent, Stepper, Step, StepLabel, Alert, DialogActions, CircularProgress, Autocomplete } from '@mui/material';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { TextField } from '@mui/material';
import { Button } from '../Button';
import type { BookDetailsResponse } from '../../models/BookDetailsResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import type { OptionResponse } from '../../models/OptionResponse';
import { Controller } from "react-hook-form";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import authorService from '../../services/AuthorService';
import type { PaginationResponse } from '../../models/PaginationResponse';
import type { AuthorPreview } from '../../models/AuthorPreview';
import { AuthorCard, toAuthorCardModel, type AuthorCardModel } from '../AuthorCard/AuthorCard';

type InitialValuesState =
  { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; values: BookFormData }
  | { status: 'error'; error: string };

const MAX_AUTHORS: number = 10;

type SaveBookState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; response: BookDetailsResponse }
  | { status: 'error'; error: string };

enum BookFormModalStep {
  Form = 0,
  Confirmation = 1
}



const authorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  country: z.string(),
  dateOfBirth: z.string(),
  bookCount: z.number(),
});

const currentYear = new Date().getFullYear();

const bookFormSchema = z.object({
  title: z.string()
    .min(1, 'El título es requerido')
    .max(150, 'El título no puede tener más de 150 caracteres'),
  year:
    z.string().regex(/^\d{1,4}$/, 'Año inválido')
      .refine((val) => {
        const yearNum = parseInt(val, 10);
        return yearNum >= 1 && yearNum <= currentYear;
      }, `El año debe estar entre 1 y ${currentYear}`),
  isbn: z.string().refine(isValidIsbn, { message: "ISBN inválido" }),
  authors: z.array(authorSchema)
    .min(1, 'Al menos un autor es requerido')
    .max(MAX_AUTHORS, `No puede tener más de ${MAX_AUTHORS} autores`),
  categoryId: z.string()
    .min(1, 'La categoría es requerida'),
  publisherId: z.string()
    .min(1, 'La editorial es requerida'),
});

export type BookFormData = z.infer<typeof bookFormSchema>;

const DEFAULT_INITIAL_VALUES: BookFormData = {
  title: '',
  year: '',
  isbn: '',
  authors: [],
  categoryId: '',
  publisherId: '',
};

export const BookFormModal = ({
  open,
  onCloseModal,
  categories,
  publishers,
  getInitialFormValues = () => Promise.resolve(DEFAULT_INITIAL_VALUES),
  save,
  initialImageSrc = null,
  onSaveSuccess = () => { },
  onSuccessPrimaryAction = (_: BookDetailsResponse): void => { },
  successPrimaryActionLabel = "Ver libro",
}: {
  open: boolean;
  onCloseModal: () => void;
  categories: OptionResponse[];
  publishers: OptionResponse[];
  getInitialFormValues?: () => Promise<BookFormData>;
  save: (data: BookFormData, imageFile: File | null) => Promise<BookDetailsResponse>;
  initialImageSrc?: string | null;
  onSaveSuccess?: () => void;
  onSuccessPrimaryAction?: (book: BookDetailsResponse) => void;
  successPrimaryActionLabel?: string;
}): JSX.Element => {

  const [saveBookState, setSaveBookState] = useState<SaveBookState>({ status: 'idle' });
  const [activeStep, setActiveStep] = useState(BookFormModalStep.Form);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchedAuthors, setSearchedAuthors] = useState<AuthorCardModel[]>([]);
  const [addingAuthor, setAddingAuthor] = useState(false);
  const [initialValuesState, setInitialValuesState] = useState<InitialValuesState>({ status: 'idle' });
  const [canContinue, setCanContinue] = useState(false);

  const form = useForm<BookFormData>({
    resolver: zodResolver(bookFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: DEFAULT_INITIAL_VALUES,
  });

  useEffect(() => {
    if (initialImageSrc && open === true) {
      setImagePreview(initialImageSrc);
    }
  }, [open, initialImageSrc]);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    }
  }, [open]);

  useEffect(() => {
    if (initialValuesState.status === 'success') {
      form.reset(initialValuesState.values);
    }
  }, [initialValuesState]);

  useEffect(() => {
    const isValid = form.formState.isValid;
    const hasImage = initialImageSrc !== null || !!imageFile;
    const hasAuthors = form.getValues('authors').length > 0;
    setCanContinue(isValid && hasImage && hasAuthors);
  }, [form.formState.isValid, imageFile]);

  const fetchInitialData = async () => {
    try {
      setInitialValuesState({ status: 'loading' });
      const initialValues = await getInitialFormValues();
      setInitialValuesState({ status: 'success', values: initialValues });
    } catch (error) {
      setInitialValuesState({ status: 'error', error: 'Error al cargar' });
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSuccessPrimaryAction = () => {
    handleCloseModal();
    if (saveBookState.status === 'saved') {
      onSuccessPrimaryAction(saveBookState.response);
    }
  };

  const handleCloseModal = () => {
    onCloseModal();
    form.reset();
    setActiveStep(BookFormModalStep.Form);
    setSaveBookState({ status: 'idle' });
    setAddingAuthor(false);
    setSearchedAuthors([]);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    setSaveBookState({ status: 'saving' });
    try {
      const response = await save(form.getValues(), imageFile);
      setSaveBookState({ status: 'saved', response: response });
      onSaveSuccess();
    } catch (error: any) {
      setSaveBookState({ status: 'error', error: error.message || 'Error al crear el libro' });
    }
  };

  const handleAddAuthor = (author: AuthorCardModel) => {
    const alreadySelected: boolean = form.getValues('authors').some((a) => a.id === author.id);
    if (alreadySelected) {
      return;
    }
    form.setValue('authors', [...form.getValues('authors'), author], { shouldValidate: true });
  };

  const handleRemoveAuthor = (author: AuthorCardModel) => {
    form.setValue('authors', form.getValues('authors').filter((a) => a.id !== author.id), { shouldValidate: true });
  };

  const searchAuthors = async (search: string) => {
    try {
      const response: PaginationResponse<AuthorPreview> = await authorService.getAuthorPreviews({ search }, { page: 0, size: 15 });
      setSearchedAuthors(response.items.map(toAuthorCardModel));
    } catch (error: any) {
      // Fail silently
      setSearchedAuthors([]);
    }
  };

  function handleGoBack(): void {
    setSaveBookState({ status: 'idle' });
    setActiveStep(BookFormModalStep.Form);
  }

  function handleRetryLoadInitialValues(e: any): void {
    e.preventDefault();
    fetchInitialData();
  }

  if (initialValuesState.status === 'loading' || initialValuesState.status === 'idle') {
    return (
      <Dialog
        open={open}
        onClose={handleCloseModal}
      >
        <CircularProgress size={24} sx={{ color: 'primary.main', m: 3 }} />
      </Dialog>
    );
  }

  if (initialValuesState.status === 'error') {
    return (
      <Dialog
        open={open}
        onClose={handleCloseModal}
      >
        <DialogTitle>Error al cargar</DialogTitle>
        <DialogContent>
          <Alert severity="error">{initialValuesState.error}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRetryLoadInitialValues} type={'error'}>
            Reintentar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={saveBookState.status === 'saving' ? undefined : handleCloseModal}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={saveBookState.status === 'saving'}
      PaperProps={{
        sx: { maxHeight: '90vh', overflow: 'auto' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {activeStep === BookFormModalStep.Form ? 'Libro' :
              saveBookState.status === 'saved' ? 'Libro guardado' :
                'Confirmar datos de libro'}
          </Typography>
          <MuiButton onClick={handleCloseModal} disabled={saveBookState.status === 'saving'} sx={{ minWidth: 'auto', p: 1 }}>
            ✕
          </MuiButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingBottom: '160px' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Formulario</StepLabel>
          </Step>
          <Step>
            <StepLabel>Confirmación</StepLabel>
          </Step>
        </Stepper>

        {activeStep === BookFormModalStep.Form && (
          <>
            <Alert sx={{ mb: 2 }} severity="info">Los autores deben elegirse en orden de importancia. El orden de los autores es relevante para las búsquedas y los filtros.</Alert>
            <Box sx={{ display: 'flex', gap: 3, minHeight: '400px' }}>
              {/* Sección izquierda - Imagen */}
              <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {!imagePreview ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: '300px',
                      border: '2px dashed #d1d5db',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: '#4F46E5',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Subir imagen
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click para seleccionar
                    </Typography>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', textAlign: 'center' }}>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{
                        width: '80%',
                        height: '360px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        mb: 2
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button type="primary" onClick={() => document.getElementById('image-upload')?.click()}>
                        Cambiar foto
                      </Button>
                    </Box>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Datos del libro</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Controller
                        name="title"
                        control={form.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Título"
                            variant="outlined"
                            size="small"
                            fullWidth
                            error={!!form.formState.errors.title}
                            helperText={form.formState.errors.title?.message}
                            disabled={saveBookState.status === 'saving'}
                          />
                        )}
                      />
                      <Controller
                        name="isbn"
                        control={form.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="ISBN"
                            variant="outlined"
                            size="small"
                            fullWidth
                            error={!!form.formState.errors.isbn}
                            helperText={form.formState.errors.isbn?.message}
                            disabled={saveBookState.status === 'saving'}
                          />
                        )}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Controller
                        name="year"
                        control={form.control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Año"
                            variant="outlined"
                            size="small"
                            fullWidth
                            error={!!form.formState.errors.year}
                            helperText={form.formState.errors.year?.message}
                            disabled={saveBookState.status === 'saving'}
                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 4 }}
                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                          />
                        )}
                      />
                      <Controller
                        name="categoryId"
                        control={form.control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small" error={!!form.formState.errors.categoryId}>
                            <InputLabel>Categoría</InputLabel>
                            <Select
                              {...field}
                              label="Categoría"
                              disabled={saveBookState.status === 'saving'}
                            >
                              {categories.map((category) => (
                                <MenuItem key={category.value} value={category.value}>
                                  {category.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {form.formState.errors.categoryId && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {form.formState.errors.categoryId.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                    <Box>
                      <Controller
                        name="publisherId"
                        control={form.control}
                        render={({ field }) => (
                          <FormControl fullWidth size="small" error={!!form.formState.errors.publisherId}>
                            <InputLabel>Editorial</InputLabel>
                            <Select
                              {...field}
                              label="Editorial"
                              disabled={saveBookState.status === 'saving'}
                            >
                              {publishers.map((publisher) => (
                                <MenuItem key={publisher.value} value={publisher.value}>
                                  {publisher.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {form.formState.errors.publisherId && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                {form.formState.errors.publisherId.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Autores ({form.getValues('authors').length})</Typography>
                  <Box>
                    <AuthorMultiSelect
                      values={form.watch('authors')}
                      onNewSelected={(author) => handleAddAuthor(author)}
                      onRemove={(author) => handleRemoveAuthor(author)}
                      options={searchedAuthors.filter(author => !form.getValues('authors').some(a => a.id === author.id))}
                      onSearchOptions={(search: string) => { searchAuthors(search) }}
                      addingAuthor={addingAuthor}
                      setAddingAuthor={(addingAuthor: boolean) => setAddingAuthor(addingAuthor)}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </>
        )}

        {activeStep === BookFormModalStep.Confirmation && (
          <Box sx={{ display: 'flex', gap: 3, minHeight: '400px' }}>
            {/* Sección izquierda - Imagen preview */}
            <Box sx={{ width: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {imagePreview ? (
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: '80%',
                    height: '360px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    mb: 2
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '300px',
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#f8fafc'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Sin imagen
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Sección derecha - Resumen de datos */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>
                Confirmar datos de libro
              </Typography>

              {/* Información Básica */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Datos del libro
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Título:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {form.getValues('title') || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      ISBN:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {form.getValues('isbn') || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Año:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {form.getValues('year') || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Categoría:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {categories.find(c => c.value === form.getValues('categoryId'))?.label || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                      Editorial:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {publishers.find(p => p.value === form.getValues('publisherId'))?.label || 'No especificado'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Autores ({form.getValues('authors').length})
                </Typography>
                <Box>
                  {form.getValues('authors').map(author => {
                    return <AuthorCard
                      key={author.id}
                      author={author}
                      showRemoveButton={false}
                      hoverStyles={false}
                    />
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        )}

      </DialogContent>

      {/* Alerts arriba de las actions */}
      {(saveBookState.status === 'error' || saveBookState.status === 'saved') && (
        <Box sx={{ px: 3, pb: 1 }}>
          {saveBookState.status === 'error' && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveBookState.error}
            </Alert>
          )}
          {saveBookState.status === 'saved' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Libro guardado exitosamente! ID: {saveBookState.response.id}
            </Alert>
          )}
        </Box>
      )}

      <DialogActions sx={{ p: 3 }}>
        {activeStep === BookFormModalStep.Form ? (
          <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
            <Button type="secondary" onClick={handleCloseModal} disabled={saveBookState.status === 'saving'}>
              Cancelar
            </Button>
            <Button
              type="primary"
              onClick={() => setActiveStep(BookFormModalStep.Confirmation)}
              disabled={!canContinue}
            >
              Siguiente
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>

              {activeStep === BookFormModalStep.Confirmation ? (
                <>
                  {
                    saveBookState.status !== 'saved' &&
                    <Button type="secondary" onClick={handleGoBack} disabled={saveBookState.status === 'saving'}>
                      Atrás
                    </Button>
                  }

                  <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>

                    {
                      saveBookState.status !== 'saved' &&
                      <Button type="secondary" onClick={handleCloseModal} disabled={saveBookState.status === 'saving'}>
                        Cancelar
                      </Button>
                    }
                    {
                      saveBookState.status !== 'saved' && <Button
                        type="primary"
                        onClick={handleSubmit}
                        disabled={saveBookState.status === 'saving'}
                      >
                        {saveBookState.status === 'saving' ? (
                          <>
                            <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Libro'
                        )}
                      </Button>
                    }
                    {
                      saveBookState.status === 'saved' &&
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button type="secondary" onClick={handleCloseModal}>
                          Cerrar
                        </Button>
                        <Button type="primary" onClick={handleSuccessPrimaryAction}>
                          {successPrimaryActionLabel}
                        </Button>
                      </Box>
                    }
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                  <Button type="secondary" onClick={handleCloseModal}>
                    Cerrar
                  </Button>
                  <Button type="primary" onClick={handleSuccessPrimaryAction}>
                    Ver Libro
                  </Button>
                </Box>
              )}
            </Box>
          </>

        )}
      </DialogActions>
    </Dialog>
  );
};

function isValidIsbn(isbn: string): boolean {
  return /^\d+$/.test(isbn) && isbn.length >= 10 && isbn.length <= 13;
}

function AuthorMultiSelect({
  values,
  onNewSelected,
  onRemove,
  addingAuthor,
  setAddingAuthor,
  options,
  onSearchOptions,
}:
  {
    values: AuthorCardModel[];
    onNewSelected: (author: AuthorCardModel) => void;
    onRemove: (author: AuthorCardModel) => void;
    addingAuthor: boolean;
    setAddingAuthor: (addingAuthor: boolean) => void;
    options: AuthorCardModel[];
    onSearchOptions: (search: string) => void;
  }
) {
  return (
    <>
      <Box>
        {values.map((author) => (
          <AuthorCard
            key={author.id}
            author={author}
            onRemove={() => {
              onRemove(author);
            }}
            showRemoveButton={true}
            hoverStyles={false}
          />
        ))}
      </Box>
      <Box sx={{ height: '10px', overflow: 'auto' }}>
      </Box>
      <Box>
        {addingAuthor ? (
          <Box>
            <Autocomplete
              multiple={false}
              options={options}
              getOptionLabel={(author: AuthorCardModel) => formatReversedName(author)}
              renderInput={(params) => <TextField {...params} label="Autor" />}
              renderOption={(props, option: AuthorCardModel) => (
                <li {...props} key={option.id} style={{ padding: 0, display: 'flex', alignItems: 'center' }}>
                  <AuthorCard
                    key={option.id}
                    author={option}
                    showRemoveButton={false}

                  />
                </li>
              )}
              onChange={(_, value) => {
                if (value) {
                  onNewSelected(value);
                  setAddingAuthor(false);
                }
              }}
              filterSelectedOptions
              onOpen={() => {
                onSearchOptions("");
              }}
              onInputChange={(_, value) => {
                onSearchOptions(value || '');
              }}
            />
            <Box>
              <Button sx={{ width: '100%', marginTop: 10 }} type="secondary" onClick={() => setAddingAuthor(false)}>Cancelar</Button>
            </Box>
          </Box>
        ) : (
          (values.length < MAX_AUTHORS) && (
            <AddAuthorBox onClick={() => {
              setAddingAuthor(true);
            }} />
          )
        )}
      </Box>
    </>
  );
}

function formatReversedName(author: AuthorCardModel): string {
  return `${author.lastName}, ${author.firstName}`;
}

export function AddAuthorBox({ onClick }: { onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        border: "2px dashed",
        borderColor: "primary.light",
        borderRadius: 2,
        bgcolor: "primary.lighter",
        color: "primary.main",
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: "primary.light",
          borderColor: "primary.main",
          color: "common.white",
        },
        minWidth: 200,
        minHeight: 60,
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: 600 }}>
        + Agregar autor
      </Typography>
    </Box>
  );
}