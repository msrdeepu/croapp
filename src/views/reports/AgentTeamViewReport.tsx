import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { API_BASE_URL } from 'src/config';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Loader2, Check, ChevronsUpDown, User, Users } from 'lucide-react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from 'src/components/ui/accordion';

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
}

interface TeamData {
    apms: AgentProfile[];
    pms: AgentProfile[];
    spms: AgentProfile[];
    dos: AgentProfile[];
    sdos: AgentProfile[];
    mds: AgentProfile[];
    smds: AgentProfile[];
    rmds: AgentProfile[];
    cmds: AgentProfile[];
}

interface APIResponse {
    agents: AgentProfile[];
    selected_agent?: AgentProfile;
    team_data?: TeamData;
}

const AgentTeamViewReport = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
    const [teamData, setTeamData] = useState<TeamData | null>(null);

    // Filter states
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');

    // Combobox states
    const [openAgentSelect, setOpenAgentSelect] = useState(false);
    const [agentSearch, setAgentSearch] = useState('');

    // Filtered lists for manual limiting
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

    const fetchAgents = async () => {
        setLoading(true);
        try {
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
                    try {
                        const data: APIResponse = JSON.parse(cleanText);
                        setAgents(data.agents);
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        if (!selectedAgentId) return;

        setLoading(true);
        try {
            const query = new URLSearchParams({
                'filter[id]': selectedAgentId,
            });

            const response = await fetch(`${API_BASE_URL}/agent-team-view?${query}`, {
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
                    try {
                        const data: APIResponse = JSON.parse(cleanText);
                        setSelectedAgent(data.selected_agent || null);
                        setTeamData(data.team_data || null);
                    } catch (e) {
                        console.error("JSON Parse error", e, text);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAgents();
        }
    }, [token]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReport();
    };

    // Helper to render a team table section
    const renderTeamSection = (title: string, list: AgentProfile[] | undefined, colorClass: string, value: string) => {
        // Filter out the selected agent from the list to prevent self-inclusion (e.g. appearing in CMD list)
        const filteredList = list?.filter(agent => agent.agent_code !== selectedAgent?.agent_code);

        if (!filteredList || filteredList.length === 0) return null;

        return (
            <AccordionItem value={value} className="border shadow-sm rounded-lg overflow-hidden bg-white">
                <AccordionTrigger className={cn(colorClass, "text-white px-6 py-4 hover:no-underline hover:text-white/90")}>
                    <div className="flex items-center w-full pr-4">
                        <span className="text-base font-medium flex items-center">
                            {title}
                        </span>
                        <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm font-bold">
                            {filteredList.length}
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                                <tr>
                                    <th className="px-6 py-3">Code</th>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Introducer</th>
                                    <th className="px-6 py-3">Mobile</th>
                                    <th className="px-6 py-3">Email</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredList.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{m.agent_code}</td>
                                        <td className="px-6 py-3 text-gray-800">{m.fullname} {m.surname}</td>
                                        <td className="px-6 py-3 text-gray-600">{m.introducer_code}</td>
                                        <td className="px-6 py-3 text-gray-600">{m.mobile || 'NA'}</td>
                                        <td className="px-6 py-3 text-gray-600">{m.email || 'NA'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </AccordionContent>
            </AccordionItem>
        );
    };

    // Helper to render summary count card
    const renderSummaryCard = (label: string, subLabel: string, count: number, bgClass: string, icon: React.ReactNode) => {
        if (count === 0) return null;
        return (
            <Card className="shadow-sm border-0">
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={cn("p-3 rounded-full text-white", bgClass)}>
                            {icon}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-800">{label}</h4>
                            <p className="text-xs text-gray-500">{subLabel}</p>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-700">
                        {count}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <Card className="shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg font-semibold text-gray-800">Agent Level Team Plan</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 flex flex-col md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Select Agent</label>
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
                                                    const group = (agent.level || 'Other') + 's';
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
                                                            {a.agent_code} # {a.cc || a.level || a.cadre} : {a.fullname} {a.surname}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            View Team
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {selectedAgent && (
                <div className="flex justify-center">
                    <Card className="bg-amber-50 border-amber-200 shadow-md w-full max-w-lg text-center">
                        <CardContent className="py-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-600 mb-3">
                                <User className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-medium text-amber-800">
                                Cadre: {selectedAgent.cc || selectedAgent.level || selectedAgent.cadre}
                            </h4>
                            <h3 className="text-xl font-bold text-gray-900 mt-1">
                                {selectedAgent.fullname} {selectedAgent.surname} - {selectedAgent.agent_code}
                            </h3>
                            <p className="text-gray-600 mt-2">
                                Introducer #: <span className="font-medium">{selectedAgent.introducer_code}</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {teamData && (
                <div className="space-y-6">
                    {/* Summary Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {renderSummaryCard("RMD", "Regional Marketing Director", teamData.rmds?.length || 0, "bg-emerald-500", <User />)}
                        {renderSummaryCard("SMD", "Senior Marketing Director", teamData.smds?.length || 0, "bg-emerald-500", <User />)}
                        {renderSummaryCard("MD", "Marketing Director", teamData.mds?.length || 0, "bg-cyan-500", <User />)}

                        {renderSummaryCard("SDO", "Senior Development Officer", teamData.sdos?.length || 0, "bg-amber-500", <Users />)}
                        {renderSummaryCard("DO", "Development Officer", teamData.dos?.length || 0, "bg-amber-500", <Users />)}

                        {renderSummaryCard("SPM", "Senior Project Manager", teamData.spms?.length || 0, "bg-red-500", <Users />)}
                        {renderSummaryCard("PM", "Project Manager", teamData.pms?.length || 0, "bg-red-500", <Users />)}
                        {renderSummaryCard("APM", "Asst. Project Manager", teamData.apms?.length || 0, "bg-red-500", <Users />)}
                    </div>

                    {/* Detailed Tables */}
                    <Accordion type="multiple" className="space-y-4">
                        {renderTeamSection("Regional Marketing Directors (RMD)", teamData.rmds, "bg-violet-600", "rmds")}
                        {renderTeamSection("Senior Marketing Directors (SMD)", teamData.smds, "bg-indigo-600", "smds")}
                        {renderTeamSection("Marketing Directors (MD)", teamData.mds, "bg-blue-500", "mds")}
                        {renderTeamSection("Senior Development Officers (SDO)", teamData.sdos, "bg-sky-500", "sdos")}
                        {renderTeamSection("Development Officers (DO)", teamData.dos, "bg-teal-500", "dos")}
                        {renderTeamSection("Senior Project Managers (SPM)", teamData.spms, "bg-emerald-500", "spms")}
                        {renderTeamSection("Project Managers (PM)", teamData.pms, "bg-green-500", "pms")}
                        {renderTeamSection("Assistant Project Managers (APM)", teamData.apms, "bg-lime-600", "apms")}
                        {renderTeamSection("Chief Marketing Directors (CMD)", teamData.cmds, "bg-slate-700", "cmds")}
                    </Accordion>
                </div>
            )}
        </div>
    );
};

export default AgentTeamViewReport;
