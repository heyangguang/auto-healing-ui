export interface SSEConnection {
  close: () => void;
}

export type AuthenticatedSSECallbacks = {
  onOpen?: () => void;
  onEvent?: (event: string, payload: unknown) => void;
  onError?: (error: Error) => void;
};

export type NodeStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'partial'
  | 'failed'
  | 'error'
  | 'skipped'
  | 'waiting_approval';

export interface SSENodeStartData {
  node_id: string;
  node_name: string;
  node_type: string;
  status: string;
}

export interface SSENodeLogData {
  node_id: string;
  level: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SSENodeCompleteData {
  node_id: string;
  node_name: string;
  node_type: string;
  status: string;
  message?: string;
  input?: Record<string, unknown>;
  process?: string[];
  output?: Record<string, unknown>;
  output_handle?: string;
}

export interface SSEFlowCompleteData {
  success: boolean;
  message: string;
  status?: string;
}

export interface DryRunSSECallbacks {
  onFlowStart?: (flowId: string, flowName: string) => void;
  onNodeStart?: (data: SSENodeStartData) => void;
  onNodeLog?: (data: SSENodeLogData) => void;
  onNodeComplete?: (data: SSENodeCompleteData) => void;
  onFlowComplete?: (data: SSEFlowCompleteData) => void;
  onError?: (error: Error) => void;
}

export interface DryRunStreamRequest {
  mock_incident: unknown;
  from_node_id?: string;
  context?: Record<string, unknown>;
  mock_approvals?: Record<string, 'approved' | 'rejected'>;
}
