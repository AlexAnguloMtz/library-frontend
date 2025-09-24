export const Button: React.FC<{ onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; className?: string; children: React.ReactNode; type: 'primary' | 'secondary' | 'error'; disabled?: boolean }> = ({ type, children, className, onClick, disabled = false }) => {
    return <button className={`btn btn-${type} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
};
