import { useCallback, useState, useRef, useMemo } from 'react';
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
    Play,
    RotateCcw,
    AlertCircle,
    Search,
    Building2,
    ShieldCheck,
    Globe,
    Newspaper,
    Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

// --- Types ---

type OrganizationType = 'Media' | 'Embassy' | 'NGO' | 'IO' | 'Gov' | 'Security';

interface Organization {
    id: string;
    code: string;
    name: string;
    type: OrganizationType;
}

// --- Mock Data ---

const MOCK_ORGS: Organization[] = [
    { id: 'ema', code: 'EMA', name: 'Ethiopian Media Authority', type: 'Gov' },
    { id: 'ics', code: 'ICS', name: 'Immigration & Citizenship Service', type: 'Security' },
    { id: 'niss', code: 'NISS', name: 'National Intelligence Security Service', type: 'Security' },
    { id: 'insa', code: 'INSA', name: 'Information Network Security Administrator', type: 'Security' },
    { id: 'au', code: 'AU', name: 'African Union', type: 'IO' },
    { id: 'customs', code: 'CUSTOMS', name: 'Custom Commission', type: 'Gov' },
    { id: 'mofa', code: 'MOFA', name: 'Ministry of Foreign Affairs', type: 'Gov' },
];

const getOrgStyle = (type: OrganizationType) => {
    switch (type) {
        case 'Media': return { border: 'border-l-4 border-l-blue-500', icon: Newspaper, bg: 'bg-blue-50' };
        case 'Security': return { border: 'border-l-4 border-l-red-500', icon: ShieldCheck, bg: 'bg-red-50' };
        case 'IO': return { border: 'border-l-4 border-l-purple-500', icon: Globe, bg: 'bg-purple-50' };
        case 'Gov': return { border: 'border-l-4 border-l-green-500', icon: Building2, bg: 'bg-green-50' };
        default: return { border: 'border-l-4 border-l-gray-500', icon: Briefcase, bg: 'bg-gray-50' };
    }
};

// --- Custom Nodes ---

const OrganizationNode = ({ data, selected }: NodeProps) => {
    const style = getOrgStyle(data.orgType as OrganizationType);
    const Icon = style.icon;

    return (
        <div className={`
            px-4 py-3 rounded-md bg-white border shadow-sm w-[240px] transition-all
            ${style.border}
            ${selected ? 'ring-2 ring-primary border-transparent' : 'border-gray-200'}
        `}>
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground" />

            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-md ${style.bg} shrink-0`}>
                    <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                    <div className="font-bold text-sm leading-tight text-gray-900">{data.label as string}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{data.orgType as string}</div>
                </div>
            </div>
            {data.description && (
                <div className="mt-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100 italic truncate">
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
    organization: OrganizationNode,
    start: StartNode,
    end: EndNode
};

// --- Initial State ---

const initialNodes: Node[] = [
    { id: 'start', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Start' } },
    {
        id: 'node-1',
        type: 'organization',
        position: { x: 200, y: 100 },
        data: { label: 'Ethiopian Media Authority', orgCode: 'EMA', orgType: 'Gov', description: 'Initial eligibility check' }
    },
    { id: 'end', type: 'end', position: { x: 250, y: 500 }, data: { label: 'Publish Badge' } },
];

const initialEdges: Edge[] = [
    { id: 'e-start-1', source: 'start', target: 'node-1', animated: true, type: 'smoothstep' },
];

// --- Main Component ---

export function WorkflowBuilder() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [searchQuery, setSearchQuery] = useState('');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Filter sidebar organizations
    const filteredOrgs = MOCK_ORGS.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.code.toLowerCase().includes(searchQuery.toLowerCase())
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

    const onDragStart = (event: React.DragEvent, org: Organization) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(org));
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

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (!type) return;

            const org: Organization = JSON.parse(type);

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `node-${Date.now()}`,
                type: 'organization',
                position,
                data: {
                    label: org.name,
                    orgCode: org.code,
                    orgType: org.type,
                    description: 'Verify applicant details'
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    const handleSave = () => {
        // Build adjacency list for topological analysis
        const adjacency: Record<string, string[]> = {};
        const inDegree: Record<string, number> = {};

        nodes.forEach(node => {
            adjacency[node.id] = [];
            inDegree[node.id] = 0;
        });

        edges.forEach(edge => {
            if (adjacency[edge.source]) {
                adjacency[edge.source].push(edge.target);
            }
            if (inDegree[edge.target] !== undefined) {
                inDegree[edge.target]++;
            }
        });

        // Identify Parallel Groups
        // Simple heuristic: If multiple nodes share the same parent(s), they might be parallel.
        // Or if they are on the same 'rank'.
        // For the requested JSON format, let's look at dependencies.

        const generatedSteps = nodes
            .filter(n => n.type === 'organization') // Only organization steps count for the payload
            .map(node => {
                const dependencies = edges
                    .filter(e => e.target === node.id)
                    .map(e => {
                        const sourceNode = nodes.find(n => n.id === e.source);
                        // If source is start node, dependsOn is empty
                        if (sourceNode?.type === 'start') return null;
                        return sourceNode?.id; // Use raw ID or a mapped Step ID? 
                        // The user example uses "step-1", "step-2". 
                        // We will use the node.id as stepId for consistency
                    })
                    .filter(Boolean) as string[];

                // Determine parallel group
                // If this node shares the same exact dependencies as another node, they are parallel
                let parallelGroupId: string | null = null;
                const siblings = nodes.filter(other =>
                    other.id !== node.id &&
                    other.type === 'organization' &&
                    isDependencyEqual(other.id, node.id, edges)
                );

                if (siblings.length > 0) {
                    const groupIds = [node.id, ...siblings.map(s => s.id)].sort();
                    parallelGroupId = `group-${groupIds.join('-')}`;
                    // Hash or simplify this ID in real app
                    parallelGroupId = `parallel-${groupIds[0]}`;
                }

                // Determine Order (Topo sort would be better, but Y position is a simple proxy for UI builders)
                const order = Math.floor(node.position.y / 100) + 1;

                return {
                    stepId: node.id,
                    organizationCode: node.data.orgCode,
                    order: order,
                    dependsOn: dependencies,
                    parallelGroupId: parallelGroupId,
                    description: node.data.description
                };
            });

        // Log to console as requested
        const payload = {
            workflowId: "accreditation_v1",
            steps: generatedSteps
        };

        console.log("Workflow Saved - API Payload:", JSON.stringify(payload, null, 2));
        toast.success("Workflow saved! Check console for API payload.");
    };

    const isDependencyEqual = (nodeA: string, nodeB: string, allEdges: Edge[]) => {
        const depsA = allEdges.filter(e => e.target === nodeA).map(e => e.source).sort().join(',');
        const depsB = allEdges.filter(e => e.target === nodeB).map(e => e.source).sort().join(',');
        return depsA === depsB && depsA.length > 0;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-center mb-4 px-1">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
                    <p className="text-sm text-muted-foreground">Drag organizations to define the accreditation process flow.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setNodes(initialNodes); setEdges(initialEdges); }}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Workflow
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-[320px] bg-white border rounded-xl flex flex-col shadow-sm">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold mb-2">Organizations</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 bg-gray-50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredOrgs.map(org => {
                            const style = getOrgStyle(org.type);
                            const Icon = style.icon;

                            return (
                                <Card
                                    key={org.id}
                                    className={`p-3 cursor-move hover:shadow-md transition-all border group ${style.bg}`}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, org)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-1.5 rounded-md shadow-sm border border-black/5">
                                            <Icon className="h-4 w-4 text-gray-700" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm group-hover:text-primary transition-colors">{org.name}</div>
                                            <div className="text-xs text-muted-foreground">{org.type}</div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredOrgs.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No organizations found.
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 border-t text-xs text-muted-foreground">
                        <AlertCircle className="h-4 w-4 inline mr-1 mb-0.5" />
                        Drag companies onto the canvas. Connect nodes to define sequential or parallel paths.
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
                            Nodes: {nodes.length} | Edges: {edges.length}
                        </Panel>
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

// Ensure the default export is present if required by the router, or named used elsewhere
export default WorkflowBuilder;
