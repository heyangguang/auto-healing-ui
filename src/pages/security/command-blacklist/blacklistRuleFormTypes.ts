import type { ReactNode } from 'react';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';

export interface LoadedFile {
    path: string;
    type: string;
    content: string;
    size: number;
    checked: boolean;
}

export interface SimulateResultLine {
    line: number;
    content: string;
    matched: boolean;
    file?: string;
}

export type SimulationMode = 'template' | 'manual';

export type MatchTypeOption = {
    value: CommandBlacklistRule['match_type'];
    label: string;
    desc: string;
    icon: ReactNode;
};
