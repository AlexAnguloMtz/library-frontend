import React from 'react';
import './styles.css';
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { Icon, Icons } from '../Icon';
import type { CSSProperties } from '@mui/material';

export function SortableColumnHeader(props: {
    title: string;
    active?: boolean;
    order?: 'asc' | 'desc' | undefined;
    onClick?: () => void;
    nonSortable?: boolean;
    style?: CSSProperties;
    children?: React.ReactNode;
}) {
    const className = `sortable-column-header ${props.nonSortable ? 'non-sortable' : ''} ${props.order} ${props.active ? 'active' : ''}`;

    return (
        <th
            className={className}
            onClick={(_) => props.onClick ? props.onClick() : null}
            style={props.style}
        >
            <div className={`sortable-column-header-content ${props.children ? 'centered' : ''}`}>
                {props.children || props.title}
                {!props.nonSortable && !props.children && (
                    <>
                        <SyncAltIcon className='inactive-sort-icon' />
                        <Icon name={Icons.sort_asc} className='sort-icon asc' />
                        <Icon name={Icons.sort_desc} className='sort-icon desc' />
                    </>
                )}
            </div>
        </th>
    );
}
