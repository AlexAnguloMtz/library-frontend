import { Button } from "../Button";

export function NotFoundSurface({ onRetry }: { onRetry: () => void }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0 0 0' }}>
                <div style={{ width: '400px' }}>
                    <img
                        src='/img/not_found.svg'
                        alt='not-found'
                        style={{ width: '100%' }} />
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <h5 style={{ fontSize: '20px', margin: '16px 0 10px 0' }}>No se encontró el recurso</h5>
                <Button onClick={onRetry} type='primary'>Reintentar</Button>
            </div>
        </div>
    );
}