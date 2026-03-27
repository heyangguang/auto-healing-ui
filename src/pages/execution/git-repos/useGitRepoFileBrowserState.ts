import { message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useCallback, useRef, useState } from 'react';
import { getFiles } from '@/services/auto-healing/git-repos';
import { buildGitFileTreeData, getErrorMessage } from './gitRepoListMeta';

const FILE_LOAD_ERROR_CONTENT = '// 无法加载文件内容';

export function useGitRepoFileBrowserState() {
    const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
    const [fileTree, setFileTree] = useState<DataNode[]>([]);
    const [fileContent, setFileContent] = useState('');
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const fileTreeRequestIdRef = useRef(0);
    const fileContentRequestIdRef = useRef(0);

    const resetFileBrowserData = useCallback(() => {
        setFileTree([]);
        setFileContent('');
        setSelectedFilePath('');
        setLoadingFiles(false);
        setLoadingContent(false);
    }, []);

    const invalidateFileRequests = useCallback(() => {
        fileTreeRequestIdRef.current += 1;
        fileContentRequestIdRef.current += 1;
    }, []);

    const loadFileTree = useCallback(async (id: string) => {
        const requestId = fileTreeRequestIdRef.current + 1;
        fileTreeRequestIdRef.current = requestId;
        fileContentRequestIdRef.current += 1;
        setLoadingFiles(true);
        setFileTree([]);
        setFileContent('');
        setSelectedFilePath('');
        try {
            const response = await getFiles(id);
            if (fileTreeRequestIdRef.current === requestId) {
                setFileTree(buildGitFileTreeData(response.files || []));
            }
        } catch (error) {
            if (fileTreeRequestIdRef.current === requestId) {
                message.error(getErrorMessage(error, '加载仓库文件树失败'));
            }
        } finally {
            if (fileTreeRequestIdRef.current === requestId) {
                setLoadingFiles(false);
            }
        }
    }, []);

    const loadFileContent = useCallback(async (id: string, path: string) => {
        const requestId = fileContentRequestIdRef.current + 1;
        fileContentRequestIdRef.current = requestId;
        setLoadingContent(true);
        setSelectedFilePath(path);
        setFileContent('');
        try {
            const response = await getFiles(id, path);
            if (fileContentRequestIdRef.current === requestId) {
                setFileContent(response.content || '');
            }
        } catch (error) {
            if (fileContentRequestIdRef.current === requestId) {
                setFileContent(FILE_LOAD_ERROR_CONTENT);
                message.error(getErrorMessage(error, '加载文件内容失败'));
            }
        } finally {
            if (fileContentRequestIdRef.current === requestId) {
                setLoadingContent(false);
            }
        }
    }, []);

    const openFileBrowser = useCallback((repoId: string) => {
        invalidateFileRequests();
        resetFileBrowserData();
        setFileBrowserOpen(true);
        void loadFileTree(repoId);
    }, [invalidateFileRequests, loadFileTree, resetFileBrowserData]);

    const closeFileBrowser = useCallback(() => {
        invalidateFileRequests();
        setFileBrowserOpen(false);
        resetFileBrowserData();
    }, [invalidateFileRequests, resetFileBrowserData]);

    return {
        closeFileBrowser,
        fileBrowserOpen,
        fileContent,
        fileTree,
        loadingContent,
        loadingFiles,
        loadFileContent,
        loadFileTree,
        openFileBrowser,
        selectedFilePath,
    };
}
