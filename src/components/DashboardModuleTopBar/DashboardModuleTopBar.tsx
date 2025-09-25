import './styles.css'
import { Button } from '../Button';
import { Icon, Icons } from '../Icon';

export const DashboardModuleTopBar = ({ title, onExportClick, onNewClick, selectedCount, isExporting }: {
    title: string;
    onExportClick: () => void | Promise<void>;
    onNewClick: () => void;
    selectedCount?: number;
    isExporting?: boolean;
}) => {
    return (
        <div className='dashboard-module-top-bar'>
            <h1 className='dashboard-module-top-bar-title'>{title}</h1>
            <div className='dashboard-module-top-bar-actions'>
                <Button 
                    onClick={onExportClick} 
                    className='dashboard-module-top-bar-action' 
                    type='secondary'
                    disabled={(!selectedCount || selectedCount === 0) || isExporting}
                    loading={isExporting}
                >
                    <div className='dashboard-module-top-bar-action-icon-container'>
                        <Icon name={Icons.export} />
                    </div>
                    <span className='dashboard-module-top-bar-action-text'>
                        {isExporting ? 'Exportando...' : (selectedCount && selectedCount > 0 ? `Exportar (${selectedCount})` : 'Exportar')}
                    </span>
                </Button>
                <Button onClick={onNewClick} className='dashboard-module-top-bar-action' type='primary'>
                    <div className='dashboard-module-top-bar-action-icon-container'>
                        <Icon name={Icons.add} />
                    </div>
                    <span className='dashboard-module-top-bar-action-text'>Nuevo</span>
                </Button>
            </div>
        </div>
    );
};
