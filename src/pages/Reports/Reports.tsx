import React, { useState } from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import * as blobHelpers from '../../util/BlobHelpers';
import reportsService from "../../services/ReportsService";

type DownloadState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string };

const Reports: React.FC = () => {
    const [downloadState, setDownloadState] = useState<DownloadState>({ status: "idle" });

    const handleDownload = async () => {
        if (downloadState.status === "loading") return;

        setDownloadState({ status: "loading" });

        try {
            const blob: Blob = await reportsService.getBookLoansReport();
            blobHelpers.downloadBlob(blob, "reporte_libros.pdf");
            setDownloadState({ status: "idle" });
        } catch (err: any) {
            setDownloadState({
                status: "error",
                error: err.message || "No se pudo descargar el reporte. Intenta nuevamente."
            });
        }
    };

    return (
        <>
            <h1 className='dashboard-module-top-bar-title'>{'Reportes'}</h1>
            <Box
                onClick={handleDownload}
                sx={{
                    maxWidth: 400,
                    margin: "auto",
                    mt: 8,
                    pt: 10,
                    px: 6,
                    pb: 6,
                    border: '2px dashed',
                    borderColor: downloadState.status === "error" ? 'error.main' : 'primary.main',
                    borderRadius: 2,
                    textAlign: 'center',
                    cursor: downloadState.status === "loading" ? 'not-allowed' : 'pointer',
                    color: downloadState.status === "error" ? 'error.main' : 'primary.main',
                    backgroundColor: downloadState.status === "loading" ? 'action.disabledBackground' : 'transparent',
                    transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
                    userSelect: 'none',
                    position: 'relative',
                    '&:hover': {
                        backgroundColor:
                            downloadState.status === "idle" ? 'primary.light' : 'transparent',
                        color: downloadState.status === "idle" ? 'primary.dark' : undefined,
                    },
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && downloadState.status !== "loading") {
                        e.preventDefault();
                        handleDownload();
                    }
                }}
                aria-label="Descargar reporte de libros"
                aria-disabled={downloadState.status === "loading"}
            >
                {downloadState.status === "loading" ? (
                    <CircularProgress color="primary" size={48} sx={{ mb: 1 }} />
                ) : (
                    <DownloadIcon sx={{ fontSize: 48, mb: 1 }} />
                )}
                <Typography variant="h6" component="div" fontWeight="medium" mb={1}>
                    📄 Descargar Reporte de Libros
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Haz clic aquí para descargar el reporte en formato PDF
                </Typography>
                {downloadState.status === "error" && (
                    <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
                        {downloadState.error}
                    </Alert>
                )}
            </Box>
        </>
    );
};

export default Reports;
