import React from 'react';
import { FileTextOutlined, FolderOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { GitRepoFileNode, GitRepoFilesResponse } from '@/services/auto-healing/git-repos';

export type PlaybookImportItem = {
    file: string;
    name: string;
    config_mode: 'auto' | 'enhanced';
};

type ImportTreeNode = {
    children: Map<string, ImportTreeNode>;
    name: string;
    path: string;
    type: 'directory' | 'file';
};

function flattenGitRepoNodes(nodes: GitRepoFileNode[]): GitRepoFileNode[] {
    return nodes.flatMap((node) => node.children?.length
        ? [node, ...flattenGitRepoNodes(node.children)]
        : [node]);
}

function ensureImportTreeDirectory(
    root: Map<string, ImportTreeNode>,
    pathSegments: string[],
) {
    let currentChildren = root;
    let currentPath = '';
    pathSegments.forEach((segment) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        const existing = currentChildren.get(currentPath);
        if (existing) {
            currentChildren = existing.children;
            return;
        }
        const directoryNode: ImportTreeNode = {
            children: new Map<string, ImportTreeNode>(),
            name: segment,
            path: currentPath,
            type: 'directory',
        };
        currentChildren.set(currentPath, directoryNode);
        currentChildren = directoryNode.children;
    });
    return currentChildren;
}

function buildTreeMap(nodes: GitRepoFileNode[]) {
    const root = new Map<string, ImportTreeNode>();
    flattenGitRepoNodes(nodes).forEach((node) => {
        const parts = node.path.split('/').filter(Boolean);
        if (parts.length === 0) {
            return;
        }
        const parentChildren = ensureImportTreeDirectory(root, node.type === 'directory' ? parts.slice(0, -1) : parts.slice(0, -1));
        const path = parts.join('/');
        const existing = parentChildren.get(path);
        parentChildren.set(path, {
            children: existing?.children || new Map<string, ImportTreeNode>(),
            name: node.name || parts[parts.length - 1],
            path,
            type: node.type,
        });
    });
    return root;
}

function toDataNodes(tree: Map<string, ImportTreeNode>): DataNode[] {
    const nodes = [...tree.values()].sort((left, right) => {
        const leftIsDir = left.type === 'directory';
        const rightIsDir = right.type === 'directory';
        if (leftIsDir !== rightIsDir) return leftIsDir ? -1 : 1;
        return left.name.localeCompare(right.name);
    });

    return nodes.map((node) => {
        const isDirectory = node.type === 'directory';
        const isValidFile = /\.ya?ml$/i.test(node.name);
        return {
            key: node.path,
            title: <span style={{ fontSize: 13 }}>{node.name}</span>,
            icon: isDirectory
                ? <FolderOutlined style={{ color: '#faad14' }} />
                : isValidFile
                    ? <FileTextOutlined style={{ color: '#1890ff' }} />
                    : <FileTextOutlined style={{ color: '#d9d9d9' }} />,
            isLeaf: !isDirectory,
            children: node.children.size > 0 ? toDataNodes(node.children) : undefined,
            checkable: !isDirectory && isValidFile,
            selectable: false,
            disabled: !isDirectory && !isValidFile,
        };
    });
}

export function buildImportFileTree(nodes: NonNullable<GitRepoFilesResponse['files']>): DataNode[] {
    return toDataNodes(buildTreeMap(nodes));
}

export function collectDirKeys(nodes: DataNode[]): string[] {
    return nodes.flatMap((node) => node.children?.length ? [node.key as string, ...collectDirKeys(node.children)] : []);
}

export function buildPlaybookImportItems(files: string[], previousItems: PlaybookImportItem[]) {
    const existing = new Map(previousItems.map((item) => [item.file, item]));
    return files.map((file) => existing.get(file) || {
        file,
        name: file.replace(/\.ya?ml$/i, '').replace(/\//g, '-'),
        config_mode: 'auto' as const,
    });
}
