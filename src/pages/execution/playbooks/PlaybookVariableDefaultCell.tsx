import React from 'react';
import { Input, InputNumber, Select } from 'antd';
import PlaybookEnumDefaultEditor from './PlaybookEnumDefaultEditor';
import PlaybookListDefaultEditor from './PlaybookListDefaultEditor';
import PlaybookObjectDefaultEditor from './PlaybookObjectDefaultEditor';
import {
    normalizeVariableEditorType,
    parseDefaultValue,
    replaceVariable,
} from './playbookVariableHelpers';

type PlaybookVariableDefaultCellProps = {
    canManage: boolean;
    editedVariables: AutoHealing.PlaybookVariable[];
    onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
    variable: AutoHealing.PlaybookVariable;
};

const PlaybookVariableDefaultCell: React.FC<PlaybookVariableDefaultCellProps> = ({
    canManage,
    editedVariables,
    onAutoSave,
    variable,
}) => {
    const parsedDefault = parseDefaultValue(variable.default);
    const editorType = normalizeVariableEditorType(variable.type);

    const saveDefault = (nextValue: unknown) => {
        onAutoSave(replaceVariable(editedVariables, variable.name, { default: nextValue }));
    };

    if (editorType === 'number') {
        return (
            <InputNumber
                key={`${variable.name}-default`}
                variant="borderless"
                defaultValue={parsedDefault ? Number(parsedDefault) : undefined}
                placeholder="数字"
                disabled={!canManage}
                style={{ width: '100%' }}
                onBlur={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue !== parsedDefault) saveDefault(nextValue);
                }}
            />
        );
    }

    if (editorType === 'boolean') {
        return (
            <Select
                variant="borderless"
                value={parsedDefault === 'true' ? 'true' : parsedDefault === 'false' ? 'false' : undefined}
                placeholder="选择"
                disabled={!canManage}
                style={{ width: '100%' }}
                allowClear
                onChange={(nextValue) => saveDefault(nextValue)}
                options={[
                    { value: 'true', label: 'true' },
                    { value: 'false', label: 'false' },
                ]}
            />
        );
    }

    if (editorType === 'enum') {
        return (
            <PlaybookEnumDefaultEditor
                canManage={canManage}
                currentDefault={parsedDefault}
                editedVariables={editedVariables}
                onAutoSave={onAutoSave}
                saveDefault={saveDefault}
                key={`${variable.name}-enum-${parsedDefault}-${(variable.enum || []).join('|')}`}
                variable={variable}
            />
        );
    }

    if (editorType === 'list') {
        return (
            <PlaybookListDefaultEditor
                canManage={canManage}
                editedVariables={editedVariables}
                onAutoSave={onAutoSave}
                parsedDefault={parsedDefault}
                saveDefault={saveDefault}
                variable={variable}
            />
        );
    }

    if (editorType === 'object') {
        return (
            <PlaybookObjectDefaultEditor
                canManage={canManage}
                editedVariables={editedVariables}
                onAutoSave={onAutoSave}
                parsedDefault={parsedDefault}
                saveDefault={saveDefault}
                variable={variable}
            />
        );
    }

    return (
        <Input
            key={`${variable.name}-default`}
            variant="borderless"
            defaultValue={parsedDefault}
            placeholder="-"
            disabled={!canManage}
            style={{ width: '100%' }}
            onBlur={(event) => {
                if (event.target.value !== parsedDefault) saveDefault(event.target.value);
            }}
            onPressEnter={(event) => (event.target as HTMLInputElement).blur()}
        />
    );
};

export default PlaybookVariableDefaultCell;
