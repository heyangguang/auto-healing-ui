import React, { useMemo } from 'react';
import PlaybookFileContentPane from './PlaybookFileContentPane';
import PlaybookFileListPane from './PlaybookFileListPane';

type DirectoryGroups = Record<string, AutoHealing.PlaybookFile[]>;

type PlaybookFilesPanelProps = {
    fileContent: string;
    loadingFileContent: boolean;
    onSelectFile: (filePath: string) => void;
    playbookFiles: AutoHealing.PlaybookFile[];
    selectedFilePath: string;
};

const groupFilesByDirectory = (files: AutoHealing.PlaybookFile[]): DirectoryGroups => (
    files.reduce<DirectoryGroups>((groups, file) => {
        const parts = file.path.split('/');
        const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
        if (!groups[directory]) {
            groups[directory] = [];
        }
        groups[directory].push(file);
        return groups;
    }, {})
);

export default function PlaybookFilesPanel(props: PlaybookFilesPanelProps) {
    const { fileContent, loadingFileContent, onSelectFile, playbookFiles, selectedFilePath } = props;
    const fileGroups = useMemo(() => groupFilesByDirectory(playbookFiles), [playbookFiles]);
    const directories = useMemo(() => Object.keys(fileGroups).sort(), [fileGroups]);

    return (
        <div style={{ padding: 24, display: 'flex', gap: 16, height: '100%', boxSizing: 'border-box' }}>
            <PlaybookFileListPane fileGroups={fileGroups} directories={directories} onSelectFile={onSelectFile} playbookFiles={playbookFiles} selectedFilePath={selectedFilePath} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <PlaybookFileContentPane fileContent={fileContent} loadingFileContent={loadingFileContent} selectedFilePath={selectedFilePath} />
            </div>
        </div>
    );
}
