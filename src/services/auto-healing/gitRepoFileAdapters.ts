export interface GitRepoFileNode {
    path: string;
    name: string;
    type: 'directory' | 'file';
    children?: GitRepoFileNode[];
}

export interface GitRepoFilesResponse {
    files?: GitRepoFileNode[];
    path?: string;
    content?: string;
}

type GitRepoTreeDraft = Omit<GitRepoFileNode, 'children'> & {
    childrenMap?: Map<string, GitRepoTreeDraft>;
};

function compareGitRepoFileNodes(left: GitRepoFileNode, right: GitRepoFileNode) {
    if (left.type !== right.type) {
        return left.type === 'directory' ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
}

function finalizeGitRepoTree(nodes: GitRepoTreeDraft[]): GitRepoFileNode[] {
    return nodes
        .map((node) => {
            if (!node.childrenMap || node.childrenMap.size === 0) {
                return {
                    name: node.name,
                    path: node.path,
                    type: node.type,
                };
            }
            return {
                children: finalizeGitRepoTree(Array.from(node.childrenMap.values())),
                name: node.name,
                path: node.path,
                type: node.type,
            };
        })
        .sort(compareGitRepoFileNodes);
}

function buildGitRepoFileTree(paths: string[]): GitRepoFileNode[] {
    const root = new Map<string, GitRepoTreeDraft>();

    paths.forEach((fullPath) => {
        const segments = fullPath.split('/').filter(Boolean);
        let current = root;
        let currentPath = '';

        segments.forEach((segment, index) => {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            const isLeaf = index === segments.length - 1;
            let node = current.get(segment);

            if (!node) {
                node = {
                    childrenMap: isLeaf ? undefined : new Map<string, GitRepoTreeDraft>(),
                    name: segment,
                    path: currentPath,
                    type: isLeaf ? 'file' : 'directory',
                };
                current.set(segment, node);
            }

            if (!isLeaf) {
                node.type = 'directory';
                node.childrenMap = node.childrenMap || new Map<string, GitRepoTreeDraft>();
                current = node.childrenMap;
            }
        });
    });

    return finalizeGitRepoTree(Array.from(root.values()));
}

export function normalizeGitRepoFileTreePayload(payload: unknown): GitRepoFileNode[] {
    if (Array.isArray(payload)) {
        if (payload.every((item) => typeof item === 'string')) {
            return buildGitRepoFileTree(payload as string[]);
        }
        return payload as GitRepoFileNode[];
    }
    if (typeof payload === 'object' && payload !== null) {
        const maybePayload = payload as GitRepoFilesResponse;
        return maybePayload.files || [];
    }
    return [];
}

export function normalizeGitRepoFileContentPayload(payload: unknown, fallbackPath: string) {
    if (typeof payload === 'object' && payload !== null && !Array.isArray(payload)) {
        const maybePayload = payload as GitRepoFilesResponse;
        return {
            content: maybePayload.content || '',
            path: maybePayload.path || fallbackPath,
        };
    }
    return {
        content: '',
        path: fallbackPath,
    };
}
