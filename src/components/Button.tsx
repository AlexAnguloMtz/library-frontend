export const Button: React.FC<{ onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; className?: string; children: React.ReactNode; type: 'primary' | 'secondary' }> = ({ type, children, className, onClick }) => {
    return <button className={`btn btn-${type} ${className}`} onClick={onClick}>{children}</button>;
};
