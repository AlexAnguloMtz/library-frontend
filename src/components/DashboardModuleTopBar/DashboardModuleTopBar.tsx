import './styles.css'
import { Button } from '../Button';
import { Icon, Icons } from '../Icon';

export const DashboardModuleTopBar = ({ title, onExportClick, onNewClick }: {
    title: string;
    onExportClick: () => void;
    onNewClick: () => void;
}) => {
    return (
        <div className='dashboard-module-top-bar'>
            <h1 className='dashboard-module-top-bar-title'>{title}</h1>
            <div className='dashboard-module-top-bar-actions'>
                <Button onClick={onExportClick} className='dashboard-module-top-bar-action' type='secondary'>
                    <div className='dashboard-module-top-bar-action-icon-container'>
                        <Icon name={Icons.export} />
                    </div>
                    <span className='dashboard-module-top-bar-action-text'>Exportar</span>
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
