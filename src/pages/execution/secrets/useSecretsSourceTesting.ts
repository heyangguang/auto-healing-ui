import { message } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { testSecretsQuery } from '@/services/auto-healing/secrets';
import { getErrorMessage } from '../git-repos/gitRepoListMeta';

type TestResults = {
    success_count: number;
    fail_count: number;
    results: AutoHealing.TestQueryBatchResult[];
};

export function useSecretsSourceTesting(triggerRefresh: () => void) {
    const [testingId, setTestingId] = useState<string>();
    const [testQueryModalOpen, setTestQueryModalOpen] = useState(false);
    const [testQuerySource, setTestQuerySource] = useState<AutoHealing.SecretsSource | null>(null);
    const [selectedTestHostIps, setSelectedTestHostIps] = useState<string[]>([]);
    const [selectedTestHosts, setSelectedTestHosts] = useState<AutoHealing.CMDBItem[]>([]);
    const [testResultModalOpen, setTestResultModalOpen] = useState(false);
    const [testResults, setTestResults] = useState<TestResults | null>(null);
    const testRequestIdRef = useRef(0);

    const handleOpenTestQuery = useCallback((source: AutoHealing.SecretsSource) => {
        testRequestIdRef.current += 1;
        setTestQuerySource(source);
        setSelectedTestHostIps([]);
        setSelectedTestHosts([]);
        setTestQueryModalOpen(true);
    }, []);

    const closeTestQueryModal = useCallback(() => {
        testRequestIdRef.current += 1;
        setTestingId(undefined);
        setTestQueryModalOpen(false);
    }, []);

    const closeTestResultModal = useCallback(() => {
        setTestResultModalOpen(false);
        setTestResults(null);
    }, []);

    const handleTestQuery = useCallback(async () => {
        if (!testQuerySource) return;
        if (selectedTestHostIps.length === 0) {
            message.error('请先选择要测试的主机');
            return;
        }

        const requestId = testRequestIdRef.current + 1;
        testRequestIdRef.current = requestId;
        const sourceId = testQuerySource.id;
        setTestingId(testQuerySource.id);
        try {
            const hosts = selectedTestHostIps.map((ip) => {
                const host = selectedTestHosts.find((item) => item.ip_address === ip);
                return { hostname: host?.hostname || ip, ip_address: ip };
            });
            const response = await testSecretsQuery(sourceId, { hosts });
            if (testRequestIdRef.current !== requestId || testQuerySource?.id !== sourceId) {
                return;
            }
            setTestQueryModalOpen(false);
            setTestResults(response);
            setTestResultModalOpen(true);
            triggerRefresh();
        } catch (error) {
            if (testRequestIdRef.current === requestId) {
                message.error(getErrorMessage(error, '测试密钥源失败'));
            }
        } finally {
            if (testRequestIdRef.current === requestId) {
                setTestingId(undefined);
            }
        }
    }, [selectedTestHostIps, selectedTestHosts, testQuerySource, triggerRefresh]);

    return {
        closeTestQueryModal,
        closeTestResultModal,
        handleOpenTestQuery,
        handleTestQuery,
        selectedTestHostIps,
        setSelectedTestHostIps,
        setSelectedTestHosts,
        testQueryModalOpen,
        testQuerySource,
        testResultModalOpen,
        testResults,
        testingId,
    };
}
