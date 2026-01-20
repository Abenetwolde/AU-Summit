import { useCallback, useState, useRef, useEffect, DragEvent, useMemo } from 'react';
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
    MarkerType,
    ReactFlowProvider,
    useReactFlow,
    EdgeProps,
    BaseEdge,
    getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    RefreshCw,
    Plus,
    Workflow as WorkflowIcon,
    Settings,
    Trash2,
    Loader2,
    PanelLeftClose,
    PanelLeftOpen,
    Edit,
    GripVertical,
    X,
    GitBranch
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetWorkflowStepsQuery,
    useCreateWorkflowStepMutation,
    useUpdateWorkflowStepMutation,
    useDeleteWorkflowStepMutation,
    useBulkUpdateWorkflowStepsMutation,
    useGetRolesQuery,
    useGetFormsQuery,
    useGetEmailTemplatesQuery,
    WorkflowStep,
    BulkUpdateWorkflowStepsPayload
} from '@/store/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

// --- Custom Components ---

// Define specific data type for Node
interface StepNodeData extends Record<string, unknown> {
    label: string;
    key: string;
    dependencyType: string;
    dependsOn?: number[];
    requiredRole: string;
    isActive?: boolean;
    displayOrder?: number;
    description?: string;
    color?: string;
    formId?: number | null;
    emailStep?: boolean;
    targetAudience: 'LOCAL' | 'INTERNATIONAL';
    isExitStep: boolean;
    onEdit?: () => void;
}

const StepNode = ({ data: rawData, selected }: NodeProps) => {
    const data = rawData as StepNodeData;
    const getDependencyTypeColor = (type: string) => {
        switch (type) {
            case 'ALL': return 'border-l-blue-600 bg-blue-50/50';
            case 'ANY': return 'border-l-orange-500 bg-orange-50/50';
            case 'NONE': return 'border-l-slate-500 bg-white';
            default: return 'border-l-slate-500 bg-white';
        }
    };

    // const color = getDependencyTypeColor(data.dependencyType as string); // Unused
    const customStyle = data.color ? { borderLeftColor: data.color as string } : {};

    return (
        <div
            className={`
                px-4 py-3 rounded-lg bg-white border shadow-sm w-[280px] transition-all
                border-l-[6px] relative group
                ${selected ? 'ring-2 ring-blue-500/50 ring-offset-2 border-transparent' : 'border-slate-200'}
            `}
            style={customStyle}
        >
            <Handle type="target" position={Position.Top} className="!w-4 !h-2 !rounded-sm !bg-slate-400 !-top-1.5 transition-colors hover:!bg-blue-500" />

            <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg shrink-0 bg-slate-100/80 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <WorkflowIcon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-slate-900 truncate pr-2">{data.label as string}</div>
                        {data.onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); (data.onEdit as () => void)(); }}
                                className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-tight bg-slate-50 inline-block px-1 rounded border border-slate-100">
                        {data.key as string}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2 border-slate-50">
                <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-slate-600 bg-slate-50">
                        {data.requiredRole as string}
                    </Badge>
                    {data.dependencyType !== 'NONE' && (
                        <Badge variant="secondary" className="text-[9px] h-5 px-1.5 font-medium">
                            {data.dependencyType as string}
                        </Badge>
                    )}
                </div>
                {!!data.formId && <Badge className="h-4 px-1 text-[9px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Form</Badge>}
                <Badge variant="secondary" className={cn("h-4 px-1 text-[8px] border-0", data.isExitStep ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                    {data.isExitStep ? 'Exit' : 'Entry'}
                </Badge>
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-4 !h-2 !rounded-sm !bg-slate-400 !-bottom-1.5 transition-colors hover:!bg-blue-500" />
        </div>
    );
};

const CustomEdge = (props: EdgeProps) => {
    const [edgePath] = getBezierPath(props);
    return (
        <BaseEdge
            path={edgePath}
            {...props}
            style={{
                strokeWidth: 2,
                stroke: '#94a3b8',
                ...props.style
            }}
        />
    );
}

const nodeTypes = {
    step: StepNode,
    // Add simple placeholder Start/End if needed, but visually integrating them is better
};
const edgeTypes = {
    custom: CustomEdge
}

// --- Logic Helpers ---

const transformApiToNodes = (steps: WorkflowStep[], onEdit: (step: WorkflowStep) => void): { nodes: Node[], edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // 1. Separate Placed vs Unplaced
    // Convention: displayOrder > 0 means placed. 0 means sidebar.
    const placedSteps = steps.filter(s => s.displayOrder > 0).sort((a, b) => a.displayOrder - b.displayOrder);

    // 2. Simple Auto-Layout for Placed Steps (if needed) or use saved positions?
    // We don't save distinct X/Y, only order. So we must auto-layout.
    // Group by order to support parallel visualization (side-by-side).
    // If order 10 has 2 steps, put them side by side.

    // Group by displayOrder values (assuming standard increments like 10, 20)
    // Map placed steps to levels
    const levels = new Map<number, WorkflowStep[]>();
    placedSteps.forEach(s => {
        if (!levels.has(s.displayOrder)) levels.set(s.displayOrder, []);
        levels.get(s.displayOrder)!.push(s);
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);
    let currentY = 50;

    sortedLevels.forEach(order => {
        const rowSteps = levels.get(order)!;
        const ROW_WIDTH = rowSteps.length * 320; // 280 node + 40 gap
        const startX = 600 - (ROW_WIDTH / 2); // Center around x=600

        rowSteps.forEach((step, idx) => {
            nodes.push({
                id: step.id.toString(),
                type: 'step',
                position: { x: startX + (idx * 320), y: currentY },
                data: {
                    label: step.name,
                    key: step.key,
                    dependencyType: step.dependencyType,
                    dependsOn: step.dependsOn,
                    requiredRole: step.requiredRole,
                    isActive: step.isActive,
                    displayOrder: step.displayOrder,
                    description: step.description,
                    color: step.color,
                    formId: step.formId,
                    emailStep: step.emailStep,
                    targetAudience: step.targetAudience,
                    isExitStep: step.isExitStep,
                    originalStep: step,
                    onEdit: () => onEdit(step)
                }
            });
        });

        currentY += 180; // Vertical gap
    });

    // 3. Edges
    // Restore edges from `dependsOn`
    const createdEdges = new Set<string>();
    placedSteps.forEach(step => {
        if (step.dependsOn && step.dependsOn.length > 0) {
            step.dependsOn.forEach(depId => {
                // Find the source step in the current list by ID
                const sourceStep = placedSteps.find(s => s.id === depId);
                if (sourceStep) {
                    const edgeId = `e-${sourceStep.id}-${step.id}`;
                    edges.push({
                        id: edgeId,
                        source: sourceStep.id.toString(),
                        target: step.id.toString(),
                        type: 'custom',
                        animated: true,
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                    });
                    createdEdges.add(edgeId);
                }
            });
        }
    });

    return { nodes, edges };
};

const transformNodesToApi = (nodes: Node[], edges: Edge[], allStepsOriginal: WorkflowStep[]): BulkUpdateWorkflowStepsPayload => {
    // Sort nodes by Y position to determine "Logic Order" for calculating dependency types
    // Note: X position determines precedence in parallel processing if needed, but Y is flow direction.
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

    const steps = sortedNodes.map((node, index) => {
        // Find incoming edges for this node (target === node.id)
        const incomingEdges = edges.filter(e => e.target === node.id);
        const dependsOnIds = incomingEdges.map(e => e.source);

        // Map source IDs back to number IDs for dependsOn
        const dependsOn = dependsOnIds.map(sourceId => Number(sourceId)).filter(Boolean);

        // Keep existing ID for update
        const original = (node.data.originalStep as WorkflowStep) || allStepsOriginal.find(s => s.id === Number(node.id));

        return {
            id: original?.id || 0,
            // Preserve the displayOrder from node data - allow manual positioning
            displayOrder: (node.data.displayOrder as number) || (index + 1) * 10,
            // Deriving from edges ensures visual consistency
            dependsOn: dependsOn,
            // Use ANY as default, but allow override from node data if it was set explicitly
            dependencyType: (node.data.dependencyType as any) || 'ANY',
            emailStep: node.data.emailStep as boolean,
            // Pass through identity fields to ensure they are preserved or updated correctly
            isExitStep: !!node.data.isExitStep,
            targetAudience: node.data.targetAudience as any,
            formId: (node.data.formId as number | null) || null
        };
    });

    // Also include steps that are NOT on the canvas?
    // Logic: Bulk Update usually replaces. If we omit steps, do they get deleted or set to inactive?
    // The endpoint likely updates provided IDs. If we don't send Sidebar steps, they might lose their order or remain as is.
    // To be safe, we should probably send Sidebar steps with displayOrder: 0 to persist their "unplaced" state.
    // But transformNodesToApi usually only deals with Graph state.

    return { steps: steps as Partial<WorkflowStep>[] };
};

// --- Component ---

export function WorkflowBuilder() {
    return (
        <ReactFlowProvider>
            <WorkflowBuilderContent />
        </ReactFlowProvider>
    );
}

function WorkflowBuilderContent() {
    const { data: workflowSteps, isLoading: isStepsLoading, refetch } = useGetWorkflowStepsQuery();
    const [createStep, { isLoading: isCreating }] = useCreateWorkflowStepMutation();
    const [updateStep] = useUpdateWorkflowStepMutation();
    const [deleteStep] = useDeleteWorkflowStepMutation();
    const [bulkUpdate, { isLoading: isSaving }] = useBulkUpdateWorkflowStepsMutation();

    const { data: roles } = useGetRolesQuery();
    const { data: forms } = useGetFormsQuery();
    const { data: emailTemplatesData } = useGetEmailTemplatesQuery({ limit: 100 });
    const emailTemplates = emailTemplatesData?.templates || [];

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();

    // Ref to track latest nodes for callbacks
    const nodesRef = useRef<Node[]>(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<Partial<WorkflowStep>>({});

    // Filter State
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [selectedAudience, setSelectedAudience] = useState<'LOCAL' | 'INTERNATIONAL'>('INTERNATIONAL');
    const [selectedPhase, setSelectedPhase] = useState<'ENTRY' | 'EXIT'>('ENTRY');

    const filteredSteps = useMemo(() => {
        if (!workflowSteps) return [];
        return workflowSteps.filter(step => {
            // Filter by Form
            if (selectedFormId !== null && step.formId !== null && step.formId !== selectedFormId) return false;
            // Global steps (formId: null) are shown across all form contexts

            // Filter by Audience
            if (step.targetAudience !== selectedAudience) return false;

            // Filter by Phase
            const isExit = selectedPhase === 'EXIT';
            if (step.isExitStep !== isExit) return false;

            return true;
        });
    }, [workflowSteps, selectedFormId, selectedAudience, selectedPhase]);

    const handleEditClick = useCallback((step: WorkflowStep) => {
        const node = nodesRef.current.find(n => n.id === step.id.toString());
        if (node) {
            setCurrentStep({
                ...step,
                displayOrder: node.data.displayOrder as number,
                dependencyType: node.data.dependencyType as any,
                dependsOn: node.data.dependsOn as number[]
            });
        } else {
            setCurrentStep(step);
        }
        setIsEditOpen(true);
    }, []);

    // Load Data
    useEffect(() => {
        if (forms && forms.length > 0 && selectedFormId === null) {
            setSelectedFormId(forms[0].form_id);
        }
    }, [forms]);

    useEffect(() => {
        if (filteredSteps) {
            const { nodes: apiNodes, edges: apiEdges } = transformApiToNodes(filteredSteps, handleEditClick);
            setNodes(apiNodes);
            setEdges(apiEdges);
        }
    }, [filteredSteps, setNodes, setEdges, handleEditClick]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge({
                ...params,
                type: 'custom',
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
            }, eds));

            // Auto-set target node's dependencyType to ANY if it was NONE
            setNodes((nds) => nds.map(n => {
                if (n.id === params.target && (n.data.dependencyType === 'NONE' || !n.data.dependencyType)) {
                    return { ...n, data: { ...n.data, dependencyType: 'ANY' } };
                }
                return n;
            }));
        },
        [setEdges, setNodes],
    );

    const onNodeDragStop = useCallback(() => {
        setNodes((nds) => {
            const sorted = [...nds].sort((a, b) => a.position.y - b.position.y);
            const rows: Node[][] = [];
            if (sorted.length > 0) {
                let currentRow: Node[] = [sorted[0]];
                rows.push(currentRow);
                for (let i = 1; i < sorted.length; i++) {
                    const lastY = currentRow[currentRow.length - 1].position.y;
                    if (sorted[i].position.y - lastY < 60) {
                        currentRow.push(sorted[i]);
                    } else {
                        currentRow = [sorted[i]];
                        rows.push(currentRow);
                    }
                }
            }
            return nds.map((n) => {
                const rowIndex = rows.findIndex((row) => row.some((rn) => rn.id === n.id));
                const newOrder = (rowIndex + 1) * 10;
                return { ...n, data: { ...n.data, displayOrder: newOrder } };
            });
        });
    }, [setNodes]);

    const onDragStart = (event: DragEvent, step: WorkflowStep) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(step));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: DragEvent) => {
            event.preventDefault();
            const data = event.dataTransfer.getData('application/reactflow');
            if (!data) return;

            const step: WorkflowStep = JSON.parse(data);
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

            // Removing from sidebar logic is handled by "displayOrder changes" -> refresh/refetch
            // But immediate UI update:
            const newNode: Node = {
                id: step.id.toString(),
                type: 'step',
                position,
                data: {
                    label: step.name,
                    key: step.key,
                    dependencyType: step.dependencyType || 'ANY',
                    dependsOn: step.dependsOn,
                    requiredRole: step.requiredRole,
                    isActive: step.isActive,
                    displayOrder: ((workflowSteps || []).filter(s =>
                        s.formId === (step.formId || null) &&
                        s.targetAudience === (step.targetAudience || 'INTERNATIONAL') &&
                        s.isExitStep === (step.isExitStep || false)
                    ).reduce((max, s) => Math.max(max, s.displayOrder), 0) || 0) + 10,
                    description: step.description,
                    color: step.color,
                    formId: step.formId,
                    originalStep: step,
                    onEdit: () => handleEditClick(step)
                },
            };

            setNodes((nds) => {
                const updated = nds.concat(newNode);
                const sorted = [...updated].sort((a, b) => a.position.y - b.position.y);
                const rows: Node[][] = [];
                if (sorted.length > 0) {
                    let currentRow: Node[] = [sorted[0]];
                    rows.push(currentRow);
                    for (let i = 1; i < sorted.length; i++) {
                        const lastY = currentRow[currentRow.length - 1].position.y;
                        if (sorted[i].position.y - lastY < 60) {
                            currentRow.push(sorted[i]);
                        } else {
                            currentRow = [sorted[i]];
                            rows.push(currentRow);
                        }
                    }
                }
                return updated.map((n) => {
                    const rowIndex = rows.findIndex((row) => row.some((rn) => rn.id === n.id));
                    const newOrder = (rowIndex + 1) * 10;
                    return { ...n, data: { ...n.data, displayOrder: newOrder } };
                });
            });
            toast.success(`Placed ${step.name}. Link it to other steps.`);
        },
        [screenToFlowPosition, handleEditClick, setNodes, workflowSteps]
    );

    const handleCreate = async () => {
        try {
            await createStep({
                name: currentStep.name!,
                key: currentStep.key!,
                description: currentStep.description || '',
                requiredRole: currentStep.requiredRole!,
                formId: currentStep.formId || null,
                icon: '',
                color: currentStep.color || '#3b82f6',
                dependencyType: 'ANY', // Changed from NONE as per user request
                dependsOn: [],
                emailStep: currentStep.emailStep,
                targetAudience: currentStep.targetAudience as any || 'INTERNATIONAL',
                isExitStep: currentStep.isExitStep || false,
                emailTemplateId: currentStep.emailStep ? currentStep.emailTemplateId : undefined,
                branchCondition: currentStep.branchCondition || null,
                // Automatically assign next order within this context to make it appear on canvas
                displayOrder: ((workflowSteps || []).filter(s =>
                    s.formId === (currentStep.formId || null) &&
                    s.targetAudience === (currentStep.targetAudience || 'INTERNATIONAL') &&
                    s.isExitStep === (currentStep.isExitStep || false)
                ).reduce((max, s) => Math.max(max, s.displayOrder), 0) || 0) + 10
            }).unwrap();

            toast.success("Step created in Sidebar");
            setIsCreateOpen(false);
            setCurrentStep({});
            refetch();
        } catch (err: any) {
            toast.error("Error creating step");
        }
    };

    const handleUpdate = async () => {
        if (!currentStep.id) return;
        try {
            // 1. Update Node Data
            setNodes((nds) => nds.map((n) => {
                if (n.id === currentStep.id?.toString()) {
                    return { ...n, data: { ...n.data, ...currentStep, label: currentStep.name } };
                }
                return n;
            }));

            // 2. Synchronize Edges if dependsOn changed
            if (currentStep.dependsOn) {
                setEdges(eds => {
                    // Remove existing incoming edges for this node
                    const otherEdges = eds.filter(e => e.target !== currentStep.id?.toString());
                    // Add new edges for each dependency
                    const newEdges = currentStep.dependsOn!.map(depId => {
                        return {
                            id: `e-${depId}-${currentStep.id}`,
                            source: depId.toString(),
                            target: currentStep.id!.toString(),
                            type: 'custom',
                            animated: true,
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
                        };
                    });
                    return [...otherEdges, ...newEdges];
                });
            }

            // 3. API Call
            await updateStep({
                id: currentStep.id,
                data: {
                    name: currentStep.name,
                    description: currentStep.description,
                    requiredRole: currentStep.requiredRole,
                    formId: currentStep.formId,
                    color: currentStep.color,
                    dependencyType: currentStep.dependencyType as any,
                    emailStep: currentStep.emailStep,
                    emailTemplateId: currentStep.emailStep ? currentStep.emailTemplateId : undefined,
                    targetAudience: currentStep.targetAudience,
                    isExitStep: currentStep.isExitStep,
                    branchCondition: currentStep.branchCondition || null
                }
            }).unwrap();

            toast.success("Step updated and synced");
            setIsEditOpen(false);
            refetch();
        } catch (err) { toast.error("Update failed"); }
    };

    const handleDelete = async () => {
        if (!currentStep.id) return;
        if (!confirm("Delete this step?")) return;
        try {
            await deleteStep(currentStep.id).unwrap();
            toast.success("Step deleted");
            setIsEditOpen(false);
            refetch();
        } catch (err) { toast.error("Delete failed"); }
    };

    const handleSaveFlow = async () => {
        try {
            if (!workflowSteps) return;
            const payload = transformNodesToApi(nodes, edges, workflowSteps);

            // We also need to preserve sidebar steps (order 0) so they aren't lost if the bulk update replaces ALL.
            // Assuming bulk update expects only changed steps? Or all?
            // If API requires ALL steps to be present to not delete them, we must include sidebar steps.
            // If API patches, we are good. Let's assume we need to send ALL or at least the graphed ones.
            // User requirement: "keep in mind the updated data is send to the api as well".

            // To be safe, merge graphed steps with sidebar steps (preserved as displayOrder 0)
            const graphStepIds = new Set(payload.steps.map(s => s.id));
            const isExit = selectedPhase === 'EXIT';

            // CRITICAL FIX: Only reset steps that belong to the SAME Form, Audience, and Phase 
            // but are not on the canvas. This prevents Entry workflow saving from resetting Exit steps.
            const unplacedSteps = workflowSteps.filter(s =>
                !graphStepIds.has(s.id) &&
                s.formId === selectedFormId &&
                s.targetAudience === selectedAudience &&
                s.isExitStep === isExit
            ).map(s => ({
                id: s.id,
                displayOrder: 0,
                dependsOn: [],
                dependencyType: 'NONE' as const,
                isExitStep: s.isExitStep,
                targetAudience: s.targetAudience,
                formId: s.formId
            }));

            const fullPayload = { steps: [...payload.steps, ...unplacedSteps] };

            await bulkUpdate(fullPayload).unwrap();
            toast.success("Flow saved & Logic updated!");
            refetch();
        } catch (err) { toast.error("Save failed"); }
    };

    if (isStepsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-slate-400" /></div>;

    return (
        <div className="flex flex-col gap-6 p-1 h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Workflow Builder</h1>
                    <p className="text-sm text-muted-foreground">Manage and visualize accreditation and exit workflows.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4 p-4 bg-white border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                            <Label className="text-[10px] uppercase text-slate-500 font-bold px-1">Filter by Form</Label>
                            <Select value={selectedFormId?.toString() || ''} onValueChange={v => setSelectedFormId(Number(v))}>
                                <SelectTrigger className="h-9 bg-slate-50">
                                    <SelectValue placeholder="Select Form" />
                                </SelectTrigger>
                                <SelectContent>
                                    {forms?.map(f => <SelectItem key={f.form_id} value={f.form_id.toString()}>{f.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                            <Label className="text-[10px] uppercase text-slate-500 font-bold px-1">Audience</Label>
                            <Select value={selectedAudience} onValueChange={v => setSelectedAudience(v as any)}>
                                <SelectTrigger className="h-9 bg-slate-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOCAL">Local Only</SelectItem>
                                    <SelectItem value="INTERNATIONAL">International Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[150px]">
                            <Label className="text-[10px] uppercase text-slate-500 font-bold px-1">Phase</Label>
                            <Select value={selectedPhase} onValueChange={v => setSelectedPhase(v as any)}>
                                <SelectTrigger className="h-9 bg-slate-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ENTRY">Accreditation (Entry)</SelectItem>
                                    <SelectItem value="EXIT">Exited Workflow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2 self-end">
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 border-slate-200">
                            <RefreshCw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button size="sm" onClick={handleSaveFlow} disabled={isSaving} className="h-9 bg-slate-800 text-white hover:bg-slate-700">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Flow
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden bg-slate-50 rounded-xl border shadow-sm relative min-h-[600px]">
                {/* Sidebar */}
                <div className={cn("bg-white border-r flex flex-col transition-all duration-300 relative z-10", isSidebarOpen ? "w-80" : "w-0 overflow-hidden")}>
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                        <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">Unplaced Steps</span>
                        <Button size="sm" onClick={() => { setCurrentStep({ color: '#3b82f6', isActive: true, targetAudience: 'INTERNATIONAL', formId: selectedFormId, isExitStep: selectedPhase === 'EXIT' }); setIsCreateOpen(true); }} className="h-7 text-xs">
                            <Plus className="mr-1 h-3 w-3" /> New
                        </Button>
                    </div>
                    <ScrollArea className="p-3 bg-slate-50/30 flex-1">
                        <div className="space-y-2 ">
                            {filteredSteps?.map((step: WorkflowStep) => {
                                const isPlaced = nodes.some(n => n.id === step.id.toString());
                                return (
                                    <div
                                        key={step.id}
                                        draggable={!isPlaced}
                                        onDragStart={(e) => !isPlaced && onDragStart(e, step)}
                                        className={cn(
                                            "group flex flex-col gap-2 p-3 rounded-lg border border-slate-200 transition-all select-none",
                                            isPlaced
                                                ? "bg-slate-50 opacity-60 cursor-not-allowed grayscale"
                                                : "bg-white hover:border-blue-400 hover:shadow-md cursor-grab active:cursor-grabbing"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: step.color || '#3b82f6' }} />
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-900">{step.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{step.key}</div>
                                                </div>
                                            </div>
                                            {isPlaced ? (
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Placed</span>
                                            ) : (
                                                <GripVertical className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <Badge variant="outline" className="text-[9px] px-1 h-4 bg-slate-50">{step.requiredRole}</Badge>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleEditClick(step); }}>
                                                <Edit className="h-3 w-3 text-slate-400 hover:text-blue-500" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Canvas */}
                <div className="flex-1 h-full bg-slate-100/50">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDragStop={onNodeDragStop}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        className="bg-slate-50"
                        minZoom={0.2}
                        maxZoom={1.5}
                        defaultEdgeOptions={{ type: 'custom', animated: true }}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" />
                        <Controls className="bg-white border shadow-sm rounded-lg overflow-hidden m-4" />
                        <Panel position="top-right" className="bg-white/80 backdrop-blur p-2 rounded-lg border shadow-sm text-xs text-slate-500 font-medium">
                            Drag steps from sidebar • Connect output to input
                        </Panel>
                    </ReactFlow>
                </div>
            </div>

            <div className="mt-6 border-t pt-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold tracking-tight">Configuration Table</h2>
                    <p className="text-sm text-muted-foreground">Detailed view of all workflow steps. Edits here sync with the graph.</p>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[80px]">Order</TableHead>
                                <TableHead>Step Name</TableHead>
                                <TableHead>Form Scope</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Audience</TableHead>
                                <TableHead>Phase</TableHead>
                                <TableHead className="w-[150px]">Dep. Type</TableHead>
                                <TableHead>Depends On</TableHead>
                                <TableHead>Email Trigger</TableHead>
                                <TableHead>Template</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSteps?.map((step: WorkflowStep) => {
                                const stepIdStr = step.id.toString();
                                const isPlaced = nodes.some(n => n.id === stepIdStr);
                                const currentNode = nodes.find(n => n.id === stepIdStr);

                                // Get current state from node if placed, otherwise from API
                                const displayOrder = currentNode ? (currentNode.data.displayOrder as number) : step.displayOrder;
                                const depType = (currentNode ? (currentNode.data.dependencyType as string) : step.dependencyType) || 'ANY';
                                const dependsOn = isPlaced
                                    ? edges.filter(e => e.target === stepIdStr).map(e => {
                                        const src = nodes.find(n => n.id === e.source);
                                        return src?.data.key as string;
                                    }).filter(Boolean)
                                    : step.dependsOn;
                                const emailStep = currentNode ? (currentNode.data.emailStep as boolean) : (step as any).emailStep;
                                const emailTemplateId = currentNode ? (currentNode.data.emailTemplateId as number) : step.emailTemplateId;

                                const updateNodeData = (newData: any) => {
                                    if (!isPlaced) {
                                        toast.error("Place the step on the canvas first to edit its flow logic.");
                                        return;
                                    }
                                    setNodes(nds => nds.map(n => {
                                        // Handle specific logic for emailStep exclusivity
                                        if ('emailStep' in newData && newData.emailStep === true) {
                                            // If setting this to true, unset others with same formId
                                            const currentFormId = step.formId;
                                            // If we are looking at a different node
                                            if (n.id !== stepIdStr) {
                                                // Check if it shares scope (same formId or both global)
                                                const nodeFormId = n.data.formId;
                                                if (nodeFormId === currentFormId) {
                                                    return { ...n, data: { ...n.data, emailStep: false } };
                                                }
                                            }
                                        }

                                        if (n.id === stepIdStr) {
                                            return { ...n, data: { ...n.data, ...newData } };
                                        }
                                        return n;
                                    }));
                                };

                                return (
                                    <TableRow key={step.id}>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="h-8 w-16 text-xs p-1"
                                                value={displayOrder}
                                                onChange={e => updateNodeData({ displayOrder: Number(e.target.value) })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{step.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono">{step.key}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100/80">
                                                {step.formId ? forms?.find(f => f.form_id === step.formId)?.name : 'Global'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="text-[10px]">{step.requiredRole}</Badge></TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 bg-blue-50">{step.targetAudience}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] border-purple-200 text-purple-700 bg-purple-50")}>
                                                {step.isExitStep ? 'Exit' : 'Entry'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={depType}
                                                onValueChange={v => updateNodeData({ dependencyType: v })}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="NONE">NONE</SelectItem>
                                                    <SelectItem value="ALL">ALL</SelectItem>
                                                    <SelectItem value="ANY">ANY</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex flex-wrap gap-1 min-h-[24px]">
                                                    {dependsOn && dependsOn.length > 0 ? (
                                                        (dependsOn as any[]).map((d: any) => (
                                                            <Badge key={d} variant="secondary" className="bg-slate-100 text-[9px] flex items-center gap-1 h-5">
                                                                {d}
                                                                <button
                                                                    onClick={() => {
                                                                        const newDeps = (dependsOn as any[]).filter((k: any) => k !== d);
                                                                        updateNodeData({ dependsOn: newDeps });
                                                                        // Remove Edge: source is the dependency key's node.id, target is current step's id
                                                                        const sourceNode = nodes.find(n => n.data.key === d || n.id === d.toString());
                                                                        if (sourceNode) {
                                                                            setEdges(eds => eds.filter(e => !(e.source === sourceNode.id && e.target === stepIdStr)));
                                                                        }
                                                                    }}
                                                                    className="hover:text-destructive"
                                                                >
                                                                    <X className="h-2.5 w-2.5" />
                                                                </button>
                                                            </Badge>
                                                        ))
                                                    ) : <span className="text-[10px] text-slate-400 italic">No dependencies</span>}
                                                </div>
                                                <Select onValueChange={v => {
                                                    if (v === 'none') return;
                                                    if (!isPlaced) {
                                                        toast.error("Place the step on the canvas first.");
                                                        return;
                                                    }
                                                    if (!(dependsOn as any[]).includes(v)) {
                                                        const newDeps = [...(dependsOn as any[]), v];
                                                        const updates: any = { dependsOn: newDeps };
                                                        if (depType === 'NONE' || !depType) {
                                                            updates.dependencyType = 'ANY';
                                                        }
                                                        updateNodeData(updates);
                                                        // Add Edge: source is 'v' (key) which we map to source node id, target is stepIdStr
                                                        const sourceNode = nodes.find(n => n.data.key === v);
                                                        if (sourceNode) {
                                                            setEdges(eds => addEdge({
                                                                id: `e-${sourceNode.id}-${stepIdStr}`,
                                                                source: sourceNode.id,
                                                                target: stepIdStr,
                                                                type: 'custom',
                                                                animated: true,
                                                                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
                                                            }, eds));
                                                        }
                                                    }
                                                }}>
                                                    <SelectTrigger className="h-7 text-[10px] w-full max-w-[150px]">
                                                        <SelectValue placeholder="+ Add dep" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">Select dependency...</SelectItem>
                                                        {workflowSteps?.filter(s =>
                                                            s.id !== step.id &&
                                                            s.formId === step.formId &&
                                                            s.targetAudience === step.targetAudience &&
                                                            s.isExitStep === step.isExitStep
                                                        ).map(s => (
                                                            <SelectItem key={s.id} value={s.key} className="text-[10px]">{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                <Checkbox
                                                    checked={!!emailStep}
                                                    onCheckedChange={(checked) => updateNodeData({ emailStep: !!checked })}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={emailTemplateId?.toString() || 'none'}
                                                disabled={!emailStep}
                                                onValueChange={v => updateNodeData({ emailTemplateId: v === 'none' ? undefined : Number(v) })}
                                            >
                                                <SelectTrigger className="h-8 text-[10px] w-[140px]">
                                                    <SelectValue placeholder="Default" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Default Notification</SelectItem>
                                                    {emailTemplates?.map(t => (
                                                        <SelectItem key={t.id} value={t.id.toString()} className="text-[10px]">{t.templateName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {isPlaced ? <Badge className="bg-emerald-500 h-5 text-[9px]">Active</Badge> : <Badge variant="secondary" className="text-slate-500 h-5 text-[9px]">Unused</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(step)} className="h-8 w-8 p-0">
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Create New Step</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-6 pt-2 overflow-y-auto">
                        <div className="space-y-4 py-2 min-h-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input value={currentStep.name || ''} onChange={e => setCurrentStep({ ...currentStep, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Key *</Label>
                                    <Input value={currentStep.key || ''} onChange={e => setCurrentStep({ ...currentStep, key: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Scoped Form (Optional)</Label>
                                <Select value={currentStep.formId?.toString() || 'null'} onValueChange={v => setCurrentStep({ ...currentStep, formId: v === 'null' ? null : Number(v) })}>
                                    <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Select Form" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">Global (All Forms)</SelectItem>
                                        {forms?.map(f => <SelectItem key={f.form_id} value={f.form_id.toString()}>{f.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-slate-400">If Global, this step appears across all different portal forms.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Role *</Label>
                                <Select value={currentStep.requiredRole} onValueChange={v => setCurrentStep({ ...currentStep, requiredRole: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ICS">ICS</SelectItem>
                                        <SelectItem value="SECURITY_OFFICER">Security Officer</SelectItem>
                                        <SelectItem value="CUSTOM_OFFICER">Custom Officer</SelectItem>
                                        <SelectItem value="INSA_OFFICER">INSA Officer</SelectItem>
                                        <SelectItem value="MEDIA_LIAISON">Media Liaison</SelectItem>
                                        {roles?.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex gap-2">
                                    <Input type="color" className="w-12 p-0 border-0" value={currentStep.color || '#3b82f6'} onChange={e => setCurrentStep({ ...currentStep, color: e.target.value })} />
                                    <Input value={currentStep.color || ''} onChange={e => setCurrentStep({ ...currentStep, color: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-4 border p-3 rounded-md bg-slate-50">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="create-email-step"
                                        checked={!!currentStep.emailStep}
                                        onCheckedChange={(c) => setCurrentStep({ ...currentStep, emailStep: !!c })}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="create-email-step"
                                            className="text-sm font-medium leading-none"
                                        >
                                            Send Email Trigger
                                        </label>
                                    </div>
                                </div>
                                {currentStep.emailStep && (
                                    <div className="space-y-2 mt-2">
                                        <Label className="text-xs">Specific Email Template (Optional)</Label>
                                        <Select value={currentStep.emailTemplateId?.toString() || 'none'} onValueChange={v => setCurrentStep({ ...currentStep, emailTemplateId: v === 'none' ? undefined : Number(v) })}>
                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Default Approval Template" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Default Approval (System Default)</SelectItem>
                                                {emailTemplates?.map(t => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>{t.templateName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 italic">If not set, uses the standard approval email.</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Target Audience</Label>
                                    <Select value={currentStep.targetAudience} onValueChange={v => setCurrentStep({ ...currentStep, targetAudience: v as any })}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOCAL">Local Only</SelectItem>
                                            <SelectItem value="INTERNATIONAL">International Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phase</Label>
                                    <Select value={currentStep.isExitStep ? "true" : "false"} onValueChange={v => setCurrentStep({ ...currentStep, isExitStep: v === "true" })}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">Accreditation (Entry)</SelectItem>
                                            <SelectItem value="true">Exit Workflow (Exit)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Branching Condition */}
                            <div className="space-y-4 border p-3 rounded-md bg-emerald-50/30">
                                <Label className="text-emerald-800 font-bold flex items-center gap-2">
                                    <GitBranch className="h-4 w-4" /> Branching Condition (Optional)
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Field Name</Label>
                                        <Input
                                            placeholder="e.g. visa_type"
                                            value={currentStep.branchCondition?.field || ''}
                                            onChange={e => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, field: e.target.value }
                                            })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Operator</Label>
                                        <Select
                                            value={currentStep.branchCondition?.operator || 'eq'}
                                            onValueChange={v => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, operator: v }
                                            })}
                                        >
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="eq">Equals</SelectItem>
                                                <SelectItem value="neq">Not Equals</SelectItem>
                                                <SelectItem value="exists">Exists</SelectItem>
                                                <SelectItem value="not_exists">Not Exists</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {['eq', 'neq'].includes(currentStep.branchCondition?.operator || 'eq') && (
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Value</Label>
                                        <Input
                                            placeholder="e.g. e-visa"
                                            value={currentStep.branchCondition?.value || ''}
                                            onChange={e => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, value: e.target.value }
                                            })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-6 pt-2 border-t mt-auto">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal (Enhanced with Dependencies) */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Edit Step: {currentStep.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-6 pt-2 overflow-y-auto">
                        <div className="space-y-4 py-2 min-h-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={currentStep.name || ''} onChange={e => setCurrentStep({ ...currentStep, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Key (Read-only)</Label>
                                    <Input value={currentStep.key || ''} disabled className="bg-slate-50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={currentStep.description || ''} onChange={e => setCurrentStep({ ...currentStep, description: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Scoped Form (Optional)</Label>
                                <Select value={currentStep.formId?.toString() || "null"} onValueChange={v => setCurrentStep({ ...currentStep, formId: v === "null" ? null : Number(v) })}>
                                    <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Global" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="null">Global (All Forms)</SelectItem>
                                        {forms?.map(f => <SelectItem key={f.form_id} value={f.form_id.toString()}>{f.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={currentStep.requiredRole} onValueChange={v => setCurrentStep({ ...currentStep, requiredRole: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ICS">ICS</SelectItem>
                                            <SelectItem value="SECURITY_OFFICER">Security</SelectItem>
                                            <SelectItem value="CUSTOM_OFFICER">Customs</SelectItem>
                                            <SelectItem value="INSA_OFFICER">INSA</SelectItem>
                                            <SelectItem value="MEDIA_LIAISON">Media</SelectItem>
                                            {roles?.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Dependency Type</Label>
                                    <Select value={currentStep.dependencyType} onValueChange={v => setCurrentStep({ ...currentStep, dependencyType: v as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">ALL (Mandatory)</SelectItem>
                                            <SelectItem value="NONE">NONE (Start)</SelectItem>
                                            <SelectItem value="ANY">ANY (Optional)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Depends On</Label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-md bg-slate-50 min-h-[40px]">
                                    {currentStep.dependsOn && currentStep.dependsOn.length > 0 ? (
                                        currentStep.dependsOn.map(depId => {
                                            const depStep = workflowSteps?.find(s => s.id === depId);
                                            return (
                                                <Badge key={depId} variant="secondary" className="flex items-center gap-1">
                                                    {depStep?.name || depId}
                                                    <button
                                                        onClick={() => setCurrentStep({
                                                            ...currentStep,
                                                            dependsOn: currentStep.dependsOn?.filter(id => id !== depId)
                                                        })}
                                                        className="hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">No dependencies</span>
                                    )}
                                </div>
                                <Select onValueChange={v => {
                                    if (v === 'none') return;
                                    const depId = Number(v);
                                    if (!currentStep.dependsOn?.includes(depId)) {
                                        setCurrentStep({
                                            ...currentStep,
                                            dependsOn: [...(currentStep.dependsOn || []), depId]
                                        });
                                    }
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Add dependency..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Select a step...</SelectItem>
                                        {workflowSteps?.filter(s =>
                                            s.id !== currentStep.id &&
                                            s.formId === currentStep.formId &&
                                            s.targetAudience === currentStep.targetAudience &&
                                            s.isExitStep === currentStep.isExitStep
                                        ).map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.key})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Display Order</Label>
                                    <Input
                                        type="number"
                                        value={currentStep.displayOrder}
                                        onChange={e => setCurrentStep({ ...currentStep, displayOrder: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Audience</Label>
                                    <Select value={currentStep.targetAudience} onValueChange={v => setCurrentStep({ ...currentStep, targetAudience: v as any })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOCAL">Local Only</SelectItem>
                                            <SelectItem value="INTERNATIONAL">International Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phase</Label>
                                    <Select value={currentStep.isExitStep ? "true" : "false"} onValueChange={v => setCurrentStep({ ...currentStep, isExitStep: v === "true" })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">Accreditation (Entry)</SelectItem>
                                            <SelectItem value="true">Exit Workflow (Exit)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Branching Condition */}
                            <div className="space-y-4 border p-3 rounded-md bg-emerald-50/30">
                                <Label className="text-emerald-800 font-bold flex items-center gap-2">
                                    <GitBranch className="h-4 w-4" /> Branching Condition (Optional)
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Field Name</Label>
                                        <Input
                                            placeholder="e.g. visa_type"
                                            value={currentStep.branchCondition?.field || ''}
                                            onChange={e => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, field: e.target.value }
                                            })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Operator</Label>
                                        <Select
                                            value={currentStep.branchCondition?.operator || 'eq'}
                                            onValueChange={v => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, operator: v }
                                            })}
                                        >
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="eq">Equals</SelectItem>
                                                <SelectItem value="neq">Not Equals</SelectItem>
                                                <SelectItem value="exists">Exists</SelectItem>
                                                <SelectItem value="not_exists">Not Exists</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {['eq', 'neq'].includes(currentStep.branchCondition?.operator || 'eq') && (
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-slate-500">Value</Label>
                                        <Input
                                            placeholder="e.g. e-visa"
                                            value={currentStep.branchCondition?.value || ''}
                                            onChange={e => setCurrentStep({
                                                ...currentStep,
                                                branchCondition: { ...currentStep.branchCondition, value: e.target.value }
                                            })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 border p-3 rounded-md bg-slate-50 mt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-email-step"
                                        checked={!!currentStep.emailStep}
                                        onCheckedChange={(c) => setCurrentStep({ ...currentStep, emailStep: !!c })}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="edit-email-step"
                                            className="text-sm font-medium leading-none"
                                        >
                                            Send Email Trigger
                                        </label>
                                    </div>
                                </div>
                                {currentStep.emailStep && (
                                    <div className="space-y-2 mt-2">
                                        <Label className="text-xs">Specific Email Template (Optional)</Label>
                                        <Select value={currentStep.emailTemplateId?.toString() || 'none'} onValueChange={v => setCurrentStep({ ...currentStep, emailTemplateId: v === 'none' ? undefined : Number(v) })}>
                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Default Approval Template" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Default Approval (System Default)</SelectItem>
                                                {emailTemplates?.map(t => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>{t.templateName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-slate-400 italic">If not set, uses the standard approval email.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="p-6 pt-2 border-t mt-auto flex justify-between items-center sm:justify-between">
                        <Button variant="destructive" size="sm" onClick={handleDelete} className="px-3">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                        <Button onClick={handleUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default WorkflowBuilder;
