export interface VariableInputProps {
    variable: AutoHealing.PlaybookVariable;
    value: AutoHealing.JsonValue | undefined;
    onChange: (val: AutoHealing.JsonValue | undefined) => void;
    disabled?: boolean;
    size?: 'small' | 'middle' | 'large';
}

export interface ListInputProps {
    variable: AutoHealing.PlaybookVariable;
    value: AutoHealing.JsonValue | undefined;
    onChange: (val: string[]) => void;
}

export interface ObjectInputProps {
    variable: AutoHealing.PlaybookVariable;
    value: AutoHealing.JsonValue | undefined;
    onChange: (val: AutoHealing.JsonObject) => void;
}
