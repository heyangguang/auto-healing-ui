import React from 'react';

export type PlaybookOverviewField = {
    key: string;
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
};

function PlaybookOverviewFieldRow(props: { field: PlaybookOverviewField }) {
    const { field } = props;

    return (
        <div className={`pb-overview-field${field.fullWidth ? ' pb-overview-field-full' : ''}`}>
            <div className="pb-overview-field-label">{field.label}</div>
            <div className="pb-overview-field-value">{field.value}</div>
        </div>
    );
}

export default function PlaybookOverviewFieldGrid(props: { fields: PlaybookOverviewField[] }) {
    const { fields } = props;

    return (
        <div className="pb-overview-field-grid">
            {fields.map((field) => <PlaybookOverviewFieldRow key={field.key} field={field} />)}
        </div>
    );
}
