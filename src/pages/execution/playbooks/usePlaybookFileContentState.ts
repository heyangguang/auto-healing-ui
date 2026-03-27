import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { getFiles } from '@/services/auto-healing/git-repos';

const FILE_LOAD_ERROR_CONTENT = '// 无法加载文件内容';

type UsePlaybookFileContentStateOptions = {
    selectedPlaybook?: AutoHealing.Playbook;
};

export function usePlaybookFileContentState(options: UsePlaybookFileContentStateOptions) {
    const { selectedPlaybook } = options;
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [loadingFileContent, setLoadingFileContent] = useState(false);
    const fileContentRequestIdRef = useRef(0);

    const resetFileSelection = useCallback(() => {
        fileContentRequestIdRef.current += 1;
        setSelectedFilePath('');
        setFileContent('');
        setLoadingFileContent(false);
    }, []);

    const handleSelectFile = useCallback(async (filePath: string) => {
        if (!selectedPlaybook) {
            return;
        }

        const requestId = fileContentRequestIdRef.current + 1;
        fileContentRequestIdRef.current = requestId;
        setSelectedFilePath(filePath);
        setFileContent('');
        setLoadingFileContent(true);

        try {
            const response = await getFiles(selectedPlaybook.repository_id, filePath);
            if (fileContentRequestIdRef.current === requestId) {
                setFileContent(response.content || '');
            }
        } catch {
            if (fileContentRequestIdRef.current === requestId) {
                setFileContent(FILE_LOAD_ERROR_CONTENT);
                message.error('加载文件内容失败');
            }
        } finally {
            if (fileContentRequestIdRef.current === requestId) {
                setLoadingFileContent(false);
            }
        }
    }, [selectedPlaybook]);

    return {
        fileContent,
        handleSelectFile,
        loadingFileContent,
        resetFileSelection,
        selectedFilePath,
    };
}
