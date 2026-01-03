
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Loader2, Check, ChevronsUpDown, User, Search } from 'lucide-react';
import { cn } from 'src/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from 'src/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from 'src/components/ui/popover';
import './GenealogyTree.css';

interface AgentProfile {
    id: number;
    agent_code: string;
    fullname: string;
    surname: string;
    cadre: string;
    level?: string;
    cc?: string;
    introducer_code?: string;
    mobile?: string;
    email?: string;
    image_url?: string;
}

interface TreeNode extends AgentProfile {
    children?: TreeNode[];
    member_count?: number;
}

interface HierarchyResponse {
    agents: AgentProfile[];
    hierarchy?: TreeNode;
}

const MLMHierarchyView = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Agent Selection State
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [openAgentSelect, setOpenAgentSelect] = useState(false);
    const [agentSearch, setAgentSearch] = useState('');

    // Hierarchy Data
    const [treeData, setTreeData] = useState<TreeNode | null>(null);

    // Filter Logic for Combobox
    const filteredAgents = useMemo(() => {
        if (!agents) return [];
        let result = agents;
        if (agentSearch) {
            const lower = agentSearch.toLowerCase();
            result = agents.filter(p =>
                (p.fullname || '').toLowerCase().includes(lower) ||
                (p.surname || '').toLowerCase().includes(lower) ||
                String(p.agent_code || '').toLowerCase().includes(lower) ||
                String(p.cc || '').toLowerCase().includes(lower)
            );
        }
        return result.slice(0, 50);
    }, [agents, agentSearch]);

    // Initial Fetch (Agent List)
    const fetchAgents = async () => {
        setLoading(true);
        try {
            // Reusing the same endpoint as AgentTeamView since it provides the full list with cadres
            const response = await fetch(`${API_BASE_URL}/agent-team-view`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });
            if (response.ok) {
                const text = await response.text();
                const jsonStart = text.indexOf('{');
                if (jsonStart !== -1) {
                    const cleanText = text.substring(jsonStart);
                    const data: HierarchyResponse = JSON.parse(cleanText);
                    setAgents(data.agents || []);
                }
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Hierarchy
    const fetchHierarchy = async () => {
        if (!selectedAgentId) return;

        setLoading(true);
        setTreeData(null); // Reset current tree
        try {
            // Note: Assuming backend endpoint is /mlm-hierarchy-view or reuse logic
            // The user prompt mentioned creating a new view matching Blade template "Agents Hierarchy"
            // We'll try to fetch dedicated hierarchy data if the endpoint exists, 
            // otherwise we might need to construct it or assume the backend is ready as per plan.
            const query = new URLSearchParams({
                'filter[id]': selectedAgentId,
            });

            const response = await fetch(`${API_BASE_URL}/mlm-hierarchy-view?${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                }
            });

            if (response.ok) {
                const text = await response.text();
                const jsonStart = text.indexOf('{');
                if (jsonStart !== -1) {
                    const cleanText = text.substring(jsonStart);
                    const data = JSON.parse(cleanText);
                    // Depending on backend structure, we might need to map it
                    setTreeData(data.hierarchy || data.tree || null);
                }
            }
        } catch (error) {
            console.error("Error fetching hierarchy:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchAgents();
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchHierarchy();
    };

    // Recursive Tree Node Component
    const TreeNodeComponent = ({ node }: { node: TreeNode }) => {
        const [expanded, setExpanded] = useState(true);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <li>
                <div className="member-view-box" onClick={() => setExpanded(!expanded)}>
                    <div className="member-image hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center bg-white border rounded-lg shadow-sm p-2 transition-all">
                        <div className={`p-2 rounded-full mb-1 ${node.cadre === 'CMD' ? 'bg-slate-100 text-slate-800' :
                                node.cadre.includes('RMD') ? 'bg-violet-100 text-violet-800' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            <User className="h-6 w-6" />
                        </div>
                        <div className="member-details">
                            <h5 className="font-bold text-gray-800 text-sm whitespace-nowrap">{node.agent_code}</h5>
                            <span className="text-xs text-blue-600 font-semibold">{node.cadre}</span>
                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]" title={`${node.fullname} ${node.surname}`}>
                                {node.fullname}
                            </span>
                        </div>
                    </div>
                </div>
                {hasChildren && expanded && (
                    <ul className="active">
                        {node.children!.map((child) => (
                            <TreeNodeComponent key={child.id} node={child} />
                        ))}
                    </ul>
                )}
            </li>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-ld">Agents Hierarchy</h2>

            <Card className="shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle>Select Root Agent</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-grow max-w-xl">
                            <label className="text-sm font-medium text-gray-700">Agent</label>
                            <Popover open={openAgentSelect} onOpenChange={setOpenAgentSelect}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openAgentSelect}
                                        className="w-full justify-between"
                                    >
                                        <span className="truncate">
                                            {selectedAgentId
                                                ? agents.find((a) => a.id.toString() === selectedAgentId)?.fullname
                                                    ? `#${agents.find((a) => a.id.toString() === selectedAgentId)?.agent_code} - ${agents.find((a) => a.id.toString() === selectedAgentId)?.fullname}`
                                                    : "Select Agent"
                                                : "Select Agent"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search agent..."
                                            value={agentSearch}
                                            onValueChange={setAgentSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No agent found.</CommandEmpty>
                                            {Object.entries(
                                                filteredAgents.reduce((groups, agent) => {
                                                    const group = (agent.level || agent.cadre || 'Other');
                                                    if (!groups[group]) groups[group] = [];
                                                    groups[group].push(agent);
                                                    return groups;
                                                }, {} as Record<string, AgentProfile[]>)
                                            ).map(([groupName, groupAgents]) => (
                                                <CommandGroup key={groupName} heading={groupName}>
                                                    {groupAgents.map((a) => (
                                                        <CommandItem
                                                            key={a.id}
                                                            value={`${a.agent_code} ${a.fullname} ${a.surname}`}
                                                            className="text-sm"
                                                            onSelect={() => {
                                                                setSelectedAgentId(a.id.toString() === selectedAgentId ? "" : a.id.toString());
                                                                setOpenAgentSelect(false);
                                                                setAgentSearch('');
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedAgentId === a.id.toString() ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {a.agent_code} : {a.fullname} {a.surname}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            View Tree
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {treeData && (
                <Card className="shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="genealogy-body genealogy-scroll bg-gray-50/50 min-h-[500px]">
                            <div className="genealogy-tree">
                                <ul>
                                    <TreeNodeComponent node={treeData} />
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MLMHierarchyView;
