import type { LoadedFile } from './blacklistRuleFormTypes';

export const findPlaybookById = (
    playbooks: AutoHealing.Playbook[],
    playbookId?: string | null,
) => playbooks.find((playbook) => playbook.id === playbookId);

export const buildLoadedFileContent = (files: LoadedFile[]) =>
    files
        .filter((file) => file.checked)
        .map((file) => `# --- ${file.path} ---\n${file.content}`)
        .join('\n\n');

export const formatLoadedFileSize = (size: number) =>
    size > 1024 ? `${(size / 1024).toFixed(1)}K` : `${size}B`;
