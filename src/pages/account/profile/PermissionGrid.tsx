import React, { useMemo } from 'react';
import { PERMISSION_MODULE_META } from '@/constants/permissionDicts';
import { groupPermissions } from './profileHelpers';

type PermissionGridProps = {
    permissions: string[];
};

const PermissionGrid: React.FC<PermissionGridProps> = ({ permissions }) => {
    const groupedPermissions = useMemo(() => {
        return Object.entries(groupPermissions(permissions)).sort((left, right) => right[1].length - left[1].length);
    }, [permissions]);

    return (
        <div className="perm-grid">
            {groupedPermissions.map(([module, actions]) => {
                const meta = PERMISSION_MODULE_META[module] || { label: module, color: '#8c8c8c' };
                return (
                    <div key={module} className="perm-grid-card">
                        <div className="perm-grid-header">
                            <span className="perm-module-dot" style={{ background: meta.color }} />
                            <span className="perm-grid-label">{meta.label}</span>
                            <span className="perm-module-count">{actions.length}</span>
                        </div>
                        <div className="perm-grid-body">
                            {actions.sort().map((action) => (
                                <span key={action} className="perm-chip">{action}</span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PermissionGrid;
