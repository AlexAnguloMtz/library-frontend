import type { JSX } from 'react';
import './styless.css';
import { Box, Dialog, DialogTitle, Typography, Button as MuiButton, DialogContent, Stepper, Step, StepLabel, Alert, DialogActions, CircularProgress } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Controller } from 'react-hook-form';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Button } from '../Button';
import type { CreateBookResponse } from '../../models/CreateBookResponse';

export enum BookFormModalStep {
    Form = 0,
    Confirmation = 1
}

const bookFormSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    year: z.number().min(1, 'El año es requerido'),
    isbn: z.string().min(1, 'El ISBN es requerido'),
    authorIds: z.array(z.string()).min(1, 'Al menos un autor es requerido'),
    category: z.string().min(1, 'La categoría es requerida'),
});

type BookFormData = z.infer<typeof bookFormSchema>;

const categories = [
  { value: '1', label: 'Novela' },
  { value: '2', label: 'Poema' },
  { value: '3', label: 'Ensayo' },
  { value: '4', label: 'Cuento' },
  { value: '5', label: 'Poesía' },
];

export const BookFormModal = ({
    open,
    activeStep,
    onCloseModal,
    saving,
    saved,
    imagePreview,
    handleImageUpload,
    handleRemoveImage,
    form,
    onSubmit,
    handleNext,
    handleBack,
    handleCloseModal,
    handleViewSavedBook,
    imageFile,
    saveError,
    savedBook,
}: {
    open: boolean;
    activeStep: BookFormModalStep;
    onCloseModal: () => void;
    saving: boolean;
    saved: boolean;
    imagePreview: string | null;
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: () => void;
    form: UseFormReturn<BookFormData>;
    onSubmit: (data: BookFormData) => void;
    handleNext: () => void;
    handleBack: () => void;
    handleCloseModal: () => void;
    handleViewSavedBook: () => void;
    imageFile: File | null;
    saveError: string | null;
    savedBook: CreateBookResponse | null;
}): JSX.Element => {
    return (
        <Dialog 
        open={open} 
        onClose={saving ? undefined : onCloseModal}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown={saving}
        PaperProps={{
          sx: { maxHeight: '90vh', overflow: 'auto' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {activeStep === BookFormModalStep.Form ? 'Crear Libro' : 
               saved ? 'Libro creado' : 
               'Confirmar creación de libro'}
            </Typography>
            <MuiButton onClick={onCloseModal} disabled={saving} sx={{ minWidth: 'auto', p: 1 }}>
              ✕
            </MuiButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Formulario</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirmación</StepLabel>
            </Step>
          </Stepper>

          {activeStep === BookFormModalStep.Form && (
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
                         width: '100%',
                         height: '300px',
                         objectFit: 'cover',
                         borderRadius: '8px',
                         mb: 2
                       }}
                     />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button type="secondary" onClick={handleRemoveImage}>
                        Borrar
                      </Button>
                      <Button type="primary" onClick={() => document.getElementById('image-upload')?.click()}>
                        Cambiar
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

              {/* Sección derecha - Formulario */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                 {/* Información Básica */}
                 <Box>
                   <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                     Información Básica
                   </Typography>
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
                             disabled={saving}
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
                             disabled={saving}
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
                             disabled={saving}
                             inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 4 }}
                             onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                           />
                         )}
                       />
                       <Controller
                         name="category"
                         control={form.control}
                         render={({ field }) => (
                           <FormControl fullWidth size="small" error={!!form.formState.errors.category}>
                             <InputLabel>Categoría</InputLabel>
                             <Select
                               {...field}
                               label="Categoría"
                               disabled={saving}
                             >
                               {categories.map((category) => (
                                 <MenuItem key={category.value} value={category.value}>
                                   {category.label}
                                 </MenuItem>
                               ))}
                             </Select>
                             {form.formState.errors.category && (
                               <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                 {form.formState.errors.category.message}
                               </Typography>
                             )}
                           </FormControl>
                         )}
                       />
                       
                     </Box>
                   </Box>
                 </Box>

                
              </Box>
            </Box>
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
                      width: '100%',
                      height: '300px',
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
                  Confirmar creación de usuario
                </Typography>
                
                {/* Información Básica */}
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Información Básica
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
                        {form.getValues('category') || 'No especificado'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

        </DialogContent>

        {/* Alerts arriba de las actions */}
        {(saveError || savedBook) && (
          <Box sx={{ px: 3, pb: 1 }}>
            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}
            {savedBook && (
              <Alert severity="success" sx={{ mb: 2 }}>
                ¡Libro creado exitosamente! ID: {savedBook.id}
              </Alert>
            )}
          </Box>
        )}

         <DialogActions sx={{ p: 3 }}>
           {activeStep === 0 ? (
             <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
               <Button type="secondary" onClick={handleCloseModal} disabled={saving}>
                 Cancelar
               </Button>
               <Button 
                 type="primary" 
                 onClick={handleNext}
                 disabled={!form.formState.isValid || saving || !imageFile}
               >
                 Siguiente
               </Button>
             </Box>
           ) : (
             <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
               {!savedBook ? (
                 <>
                   <Button type="secondary" onClick={handleBack} disabled={saving}>
                     Atrás
                   </Button>
                   <Box sx={{ display: 'flex', gap: 1 }}>
                     <Button type="secondary" onClick={handleCloseModal} disabled={saving}>
                       Cancelar
                     </Button>
                     <Button 
                       type="primary" 
                       onClick={form.handleSubmit(onSubmit)}
                       disabled={saving}
                     >
                       {saving ? (
                         <>
                           <CircularProgress size={16} sx={{ color: 'white', mr: 1 }} />
                           Guardando...
                         </>
                       ) : (
                         'Guardar Libro'
                       )}
                     </Button>
                   </Box>
                 </>
               ) : (
                 <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
                   <Button type="secondary" onClick={handleCloseModal}>
                     Cerrar
                   </Button>
                   <Button type="primary" onClick={handleViewSavedBook}>
                     Ver Libro
                   </Button>
                 </Box>
               )}
             </Box>
           )}
         </DialogActions>
      </Dialog>
    );
};
