import { useCallback, useState, useRef, useEffect } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    BackgroundVariant,
    Panel,
    Handle,
    Position,
    NodeProps,
    Node,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Save,
    RotateCcw,
    AlertCircle,
    Search,
    Loader2,
    RefreshCw,
    AlertTriangle,
    Plus,
    Workflow as WorkflowIcon
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetWorkflowConfigsQuery,
    useBulkUpdateWorkflowConfigsMutation,
    WorkflowConfig,
    BulkUpdateWorkflowPayload
} from '@/store/services/api';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// --- Custom Nodes ---

const StepNode = ({ data, selected }: NodeProps) => {
    const getDependencyTypeColor = (type: string) => {
        switch (type) {
            case 'ALL': return 'border-l-blue-500 bg-blue-50';
            case 'ANY': return 'border-l-green-500 bg-green-50';
            case 'NONE': return 'border-l-gray-500 bg-gray-50';
            default: return 'border-l-purple-500 bg-purple-50';
        }
    };

    const color = getDependencyTypeColor(data.dependencyType as string);

    return (
        <div className={`
            px-4 py-3 rounded-md bg-white border shadow-sm w-[240px] transition-all
            border-l-4 ${color}
            ${selected ? 'ring-2 ring-primary border-transparent' : 'border-gray-200'}
        `}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground" />

            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md shrink-0 ${color}`}>
                    <WorkflowIcon className="h-5 w-5 text-gray-700" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight text-gray-900">{data.label as string}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {data.dependencyType as string} {data.dependsOn && (data.dependsOn as string[]).length > 0 ? `(${(data.dependsOn as string[]).length} deps)` : ''}
                    </div>
                </div>
            </div>
            {data.description && (
                <div className="mt-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100 italic line-clamp-2">
                    {data.description as string}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-muted-foreground" />
        </div>
    );
};

const StartNode = ({ data }: NodeProps) => (
    <div className="px-6 py-2 rounded-full bg-green-50 border-2 border-green-500 text-green-700 font-bold shadow-sm text-sm text-center min-w-[120px]">
        {data.label as string}
        <Handle type="source" position={Position.Bottom} className="!bg-green-600" />
    </div>
);

const EndNode = ({ data }: NodeProps) => (
    <div className="px-6 py-2 rounded-full bg-slate-800 border-2 border-slate-900 text-white font-bold shadow-sm text-sm text-center min-w-[120px]">
        <Handle type="target" position={Position.Top} className="!bg-slate-900" />
        {data.label as string}
    </div>
);

const nodeTypes = {
    step: StepNode,
    start: StartNode,
    end: EndNode
};

// --- Helper Functions ---

const transformApiToNodes = (configs: WorkflowConfig[]): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add start node
    nodes.push({ id: 'start', type: 'start', position: { x: 400, y: 0 }, data: { label: 'Start' } });

    // Sort configs by order
    const sortedConfigs = [...configs].sort((a, b) => a.order - b.order);

    // Group steps by their dependencies to identify parallel steps
    const dependencyGroups: Map<string, WorkflowConfig[]> = new Map();

    sortedConfigs.forEach((config) => {
        // Create a copy of the array before sorting to avoid read-only error
        const depsKey = [...config.dependsOn].sort().join(',');
        if (!dependencyGroups.has(depsKey)) {
            dependencyGroups.set(depsKey, []);
        }
        dependencyGroups.get(depsKey)!.push(config);
    });

    // Calculate positions for each group
    let currentY = 100;
    const nodePositions: Map<string, { x: number, y: number }> = new Map();

    dependencyGroups.forEach((group, depsKey) => {
        const groupSize = group.length;
        const totalWidth = groupSize * 280; // 240px node + 40px gap
        const startX = 400 - (totalWidth / 2) + 120; // Center the group

        group.forEach((config, index) => {
            const x = startX + (index * 280);
            nodePositions.set(config.step, { x, y: currentY });
        });

        currentY += 150; // Move to next row
    });

    // Create nodes from workflow configs
    sortedConfigs.forEach((config) => {
        const position = nodePositions.get(config.step) || { x: 400, y: 100 };

        nodes.push({
            id: config.step,
            type: 'step',
            position,
            data: {
                label: config.step,
                step: config.step,
                dependencyType: config.dependencyType,
                dependsOn: config.dependsOn,
                requiredPermission: config.requiredPermission,
                isActive: config.isActive,
                order: config.order,
                description: config.description
            }
        });
    });

    // Add end node
    nodes.push({
        id: 'end',
        type: 'end',
        position: { x: 400, y: currentY },
        data: { label: 'Publish Badge' }
    });

    // Create edges for ONLY immediate consecutive steps based on order
    // This creates a cleaner flow showing step-by-step progression
    const createdEdges = new Set<string>();

    // Sort by order to determine sequence
    const orderedSteps = [...sortedConfigs].sort((a, b) => a.order - b.order);

    // Connect START to first step(s) (lowest order)
    const firstOrder = orderedSteps[0]?.order || 0;
    const firstSteps = orderedSteps.filter(s => s.order === firstOrder);

    firstSteps.forEach(step => {
        const edgeId = `e-start-${step.step}`;
        if (!createdEdges.has(edgeId)) {
            edges.push({
                id: edgeId,
                source: 'start',
                target: step.step,
                animated: true,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed }
            });
            createdEdges.add(edgeId);
        }
    });

    // Connect each step to the next step(s) in order (immediate next level only)
    for (let i = 0; i < orderedSteps.length; i++) {
        const currentStep = orderedSteps[i];
        const currentOrder = currentStep.order;

        // Find the next order level
        const nextOrder = orderedSteps.find(s => s.order > currentOrder)?.order;

        if (nextOrder !== undefined) {
            // Get all steps at the next order level
            const nextSteps = orderedSteps.filter(s => s.order === nextOrder);

            // Connect current step to all steps at the immediate next level
            nextSteps.forEach(nextStep => {
                const edgeId = `e-${currentStep.step}-${nextStep.step}`;
                if (!createdEdges.has(edgeId)) {
                    edges.push({
                        id: edgeId,
                        source: currentStep.step,
                        target: nextStep.step,
                        animated: true,
                        type: 'smoothstep',
                        markerEnd: { type: MarkerType.ArrowClosed }
                    });
                    createdEdges.add(edgeId);
                }
            });
        } else {
            // This is a last step, connect to END
            const edgeId = `e-${currentStep.step}-end`;
            if (!createdEdges.has(edgeId)) {
                edges.push({
                    id: edgeId,
                    source: currentStep.step,
                    target: 'end',
                    animated: true,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed }
                });
                createdEdges.add(edgeId);
            }
        }
    }

    return { nodes, edges };
};

const transformNodesToApi = (nodes: Node[], edges: Edge[]): BulkUpdateWorkflowPayload => {
    const configurations = nodes
        .filter(n => n.type === 'step' && n.data.step)
        .map(node => {
            // Get ONLY direct dependencies from edges
            const dependencies = edges
                .filter(e => e.target === node.id)
                .map(e => {
                    const sourceNode = nodes.find(n => n.id === e.source);
                    if (sourceNode?.type === 'start' || sourceNode?.type === 'end') return null;
                    return e.source;
                })
                .filter(Boolean) as string[];

            return {
                step: node.data.step as string,
                dependencyType: (node.data.dependencyType as 'ALL' | 'ANY' | 'NONE') || 'ALL',
                dependsOn: dependencies,
                requiredPermission: (node.data.requiredPermission as string) || '',
                isActive: (node.data.isActive as boolean) ?? true,
                order: (node.data.order as number) || Math.floor(node.position.y / 100),
                description: (node.data.description as string) || ''
            };
        });

    return { configurations };
};

// --- Main Component ---

export function WorkflowBuilder() {
    const { data: workflowConfigs, isLoading, error, refetch } = useGetWorkflowConfigsQuery();
    const [bulkUpdate, { isLoading: isSaving }] = useBulkUpdateWorkflowConfigsMutation();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCircularWarning, setShowCircularWarning] = useState(false);
    const [circularDeps, setCircularDeps] = useState<string[]>([]);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Initialize nodes and edges from API data
    useEffect(() => {
        if (workflowConfigs && workflowConfigs.length > 0) {
            const { nodes: apiNodes, edges: apiEdges } = transformApiToNodes(workflowConfigs);
            setNodes(apiNodes);
            setEdges(apiEdges);
        }
    }, [workflowConfigs, setNodes, setEdges]);

    // Filter available steps (from API)
    const availableSteps = workflowConfigs || [];
    const filteredSteps = availableSteps.filter(step =>
        step.step.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
        }, eds)),
        [setEdges],
    );

    const onDragStart = (event: React.DragEvent, step: WorkflowConfig) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(step));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const step: WorkflowConfig = JSON.parse(type);

            // Check if step already exists in the workflow
            const existingNode = nodes.find(n => n.id === step.step);
            if (existingNode) {
                toast.error(`Step "${step.step}" is already in the workflow`);
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: step.step,
                type: 'step',
                position,
                data: {
                    label: step.step,
                    step: step.step,
                    dependencyType: step.dependencyType,
                    dependsOn: [],
                    requiredPermission: step.requiredPermission,
                    isActive: step.isActive,
                    order: Math.floor(position.y / 100),
                    description: step.description
                },
            };

            setNodes((nds) => nds.concat(newNode));
            toast.success(`Added "${step.step}" to workflow`);
        },
        [reactFlowInstance, setNodes, nodes],
    );

    const handleSave = async () => {
        try {
            const payload = transformNodesToApi(nodes, edges);

            const result = await bulkUpdate(payload).unwrap();

            if (result.data.validation.hasCircularDependencies) {
                setCircularDeps(result.data.validation.circularDependencies);
                setShowCircularWarning(true);
                toast.warning('Workflow saved with circular dependencies detected');
            } else {
                toast.success('Workflow saved successfully!');
            }

            // Refetch to get updated data
            refetch();
        } catch (err: any) {
            console.error('Failed to save workflow:', err);
            toast.error(err?.data?.message || 'Failed to save workflow');
        }
    };

    const handleReset = () => {
        if (workflowConfigs) {
            const { nodes: apiNodes, edges: apiEdges } = transformApiToNodes(workflowConfigs);
            setNodes(apiNodes);
            setEdges(apiEdges);
            toast.info('Workflow reset to saved state');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading workflow configuration...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
                    <p className="text-destructive font-medium mb-2">Failed to load workflow configuration</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {(error as any)?.data?.message || 'An error occurred'}
                    </p>
                    <Button onClick={() => refetch()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-center mb-4 px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
                    <p className="text-sm text-muted-foreground">Drag workflow steps to define the accreditation process flow.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Workflow
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-[320px] bg-white border rounded-xl flex flex-col shadow-sm">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold mb-2">Available Steps</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search steps..."
                                className="pl-9 bg-gray-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredSteps.map(step => {
                            const isInWorkflow = nodes.some(n => n.id === step.step);
                            const getDependencyTypeColor = (type: string) => {
                                switch (type) {
                                    case 'ALL': return 'bg-blue-50 border-blue-200';
                                    case 'ANY': return 'bg-green-50 border-green-200';
                                    case 'NONE': return 'bg-gray-50 border-gray-200';
                                    default: return 'bg-purple-50 border-purple-200';
                                }
                            };

                            return (
                                <Card
                                    key={step.id}
                                    className={`p-3 transition-all border group ${getDependencyTypeColor(step.dependencyType)} ${isInWorkflow
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-move hover:shadow-md'
                                        }`}
                                    draggable={!isInWorkflow}
                                    onDragStart={(e) => !isInWorkflow && onDragStart(e, step)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white p-1.5 rounded-md shadow-sm border border-black/5">
                                            <WorkflowIcon className="h-4 w-4 text-gray-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                                {step.step}
                                                {isInWorkflow && <span className="ml-2 text-xs text-muted-foreground">(In workflow)</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {step.description}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Type: <span className="font-medium">{step.dependencyType}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredSteps.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No steps found.
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 border-t text-xs text-muted-foreground">
                        <AlertCircle className="h-4 w-4 inline mr-1 mb-0.5" />
                        Drag steps onto the canvas. Connect nodes to define dependencies.
                    </div>
                </aside>

                {/* Canvas */}
                <div className="flex-1 h-full bg-slate-50 border rounded-xl overflow-hidden shadow-sm relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-slate-50"
                    >
                        <Controls className="bg-white border shadow-sm rounded-md overflow-hidden" />
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                        <Panel position="top-right" className="bg-white/90 p-2 rounded-lg border shadow-sm text-xs font-mono">
                            Steps: {nodes.filter(n => n.type === 'step').length} | Connections: {edges.length}
                        </Panel>
                    </ReactFlow>
                </div>
            </div>

            {/* Circular Dependency Warning Dialog */}
            <Dialog open={showCircularWarning} onOpenChange={setShowCircularWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Circular Dependencies Detected
                        </DialogTitle>
                        <DialogDescription>
                            The workflow has been saved, but circular dependencies were detected in the following steps:
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <ul className="list-disc list-inside space-y-1">
                            {circularDeps.map((dep, idx) => (
                                <li key={idx} className="text-sm text-yellow-800">{dep}</li>
                            ))}
                        </ul>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Please review and fix these circular dependencies to ensure proper workflow execution.
                    </p>
                    <Button onClick={() => setShowCircularWarning(false)}>
                        Close
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default WorkflowBuilder;
