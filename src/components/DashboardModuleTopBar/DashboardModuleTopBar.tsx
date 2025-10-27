import './styles.css'
import { Button } from '../Button';
import { Icon, Icons } from '../Icon';
import authenticationHelper from '../../util/AuthenticationHelper';
import type { AuthenticationResponse } from '../../models/AuthenticationResponse';

export const DashboardModuleTopBar = ({ title, onExportClick, showCreateNew = true, onNewClick = () => { }, selectedCount, isExporting, auth, exportPermission, newPermission, additionalActions }: {
    title: string;
    showCreateNew?: boolean;
    onExportClick: () => void | Promise<void>;
    onNewClick?: () => void;
    selectedCount?: number;
    isExporting?: boolean;
    auth?: AuthenticationResponse | null;
    exportPermission?: string;
    newPermission?: string;
    additionalActions?: React.ReactNode;
}) => {
    return (
        <div className='dashboard-module-top-bar'>
            <h1 className='dashboard-module-top-bar-title'>{title}</h1>
            <div className='dashboard-module-top-bar-actions'>
                {additionalActions}
                {(!exportPermission || (auth && authenticationHelper.hasAnyPermission(auth, [exportPermission]))) && (
                    <Button
                        onClick={onExportClick}
                        className='dashboard-module-top-bar-action'
                        type='secondary'
                        disabled={(!selectedCount || selectedCount === 0) || isExporting}
                    >
                        <div className='dashboard-module-top-bar-action-icon-container'>
                            <Icon name={Icons.export} />
                        </div>
                        <span className='dashboard-module-top-bar-action-text'>
                            {isExporting ? 'Exportando...' : (selectedCount && selectedCount > 0 ? `Exportar (${selectedCount})` : 'Exportar')}
                        </span>
                    </Button>
                )}
                {(!newPermission || (auth && authenticationHelper.hasAnyPermission(auth, [newPermission]))) && (
                    (showCreateNew === true &&
                        (
                            <Button onClick={onNewClick} className='dashboard-module-top-bar-action' type='primary'>
                                <div className='dashboard-module-top-bar-action-icon-container'>
                                    <Icon name={Icons.add} />
                                </div>
                                <span className='dashboard-module-top-bar-action-text'>Nuevo</span>
                            </Button>
                        ))
                )}
            </div>
        </div>
    );
};
