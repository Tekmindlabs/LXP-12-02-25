import { useState } from "react";
import { api } from "@/utils/api";
import { CurriculumNode, NodeType } from "@/types/curriculum";
import { Button } from "@/components/ui/button";
import { 
	Plus, 
	ChevronRight, 
	ChevronDown, 
	Book, 
	FileText, 
	ListTodo,
	Edit,
	Trash2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface TreeNodeProps {
	node: CurriculumNode;
	onSelect: (node: CurriculumNode) => void;
	selectedNodeId?: string;
	children?: CurriculumNode[];
	level: number;
}

const getNodeIcon = (type: NodeType) => {
	switch (type) {
		case 'CHAPTER':
			return <Book className="h-4 w-4 mr-2" />;
		case 'TOPIC':
			return <FileText className="h-4 w-4 mr-2" />;
		case 'SUBTOPIC':
			return <ListTodo className="h-4 w-4 mr-2" />;
	}
};

const getAddOptions = (nodeType: NodeType) => {
	switch (nodeType) {
		case 'CHAPTER':
			return [{ type: 'TOPIC' as NodeType, label: 'Add Topic' }];
		case 'TOPIC':
			return [{ type: 'SUBTOPIC' as NodeType, label: 'Add Subtopic' }];
		default:
			return [];
	}
};

const getFontSize = (type: NodeType) => {
	switch (type) {
		case 'CHAPTER':
			return 'text-base font-semibold';
		case 'TOPIC':
			return 'text-sm font-medium';
		case 'SUBTOPIC':
			return 'text-xs';
		default:
			return 'text-sm';
	}
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelect, selectedNodeId, children, level }) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const hasChildren = children && children.length > 0;
	const utils = api.useContext();
	const createNode = api.curriculum.createNode.useMutation({
		onSuccess: () => {
			utils.curriculum.getNodes.invalidate();
		}
	});

	const handleAddChild = async (type: NodeType) => {
		await createNode.mutateAsync({
			title: `New ${type.toLowerCase()}`,
			type,
			parentId: node.id,
			order: (children?.length || 0) + 1,
			subjectId: node.subjectId,
		});
	};

	const addOptions = getAddOptions(node.type);

	return (
		<div>
			<div 
				className={`
					group relative flex items-center rounded-sm
					${selectedNodeId === node.id ? 'bg-accent' : 'hover:bg-accent/50'}
					${node.type === 'CHAPTER' ? 'bg-muted/30' : ''}
				`}
				style={{ 
					paddingLeft: `${level * 1.5}rem`,
					marginBottom: '2px'
				}}
			>
				<div 
					className="flex-1 flex items-center cursor-pointer p-2"
					onClick={() => onSelect(node)}
				>
					<div className="flex items-center min-w-[24px]">
						{hasChildren && (
							<Button 
								variant="ghost" 
								size="sm" 
								className="p-0 h-4 w-4"
								onClick={(e) => {
									e.stopPropagation();
									setIsExpanded(!isExpanded);
								}}
							>
								{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
							</Button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{getNodeIcon(node.type)}
						<span className={`${getFontSize(node.type)}`}>{node.title}</span>
					</div>
				</div>

				<div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
					<Button 
						variant="ghost" 
						size="sm" 
						className="h-7 w-7 p-0 hover:bg-accent"
						onClick={() => onSelect(node)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					{addOptions.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button 
									variant="ghost" 
									size="sm" 
									className="h-7 w-7 p-0 hover:bg-accent"
								>
									<Plus className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-[160px]">
								{addOptions.map(({ type, label }) => (
									<DropdownMenuItem 
										key={type} 
										onClick={() => handleAddChild(type)}
										className="flex items-center gap-2"
									>
										{getNodeIcon(type)}
										<span>{label}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			{hasChildren && isExpanded && (
				<div 
					className="ml-4 pl-2 border-l border-border"
					style={{ marginLeft: `${level * 1.5 + 0.5}rem` }}
				>
					{children.map((child) => (
						<TreeNode
							key={child.id}
							node={child}
							onSelect={onSelect}
							selectedNodeId={selectedNodeId}
							children={child.children}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	);

};

interface CurriculumTreeProps {
	subjectId: string;
	onNodeSelect: (node: CurriculumNode) => void;
}

export const CurriculumTree: React.FC<CurriculumTreeProps> = ({
	subjectId,
	onNodeSelect,
}) => {
	const [selectedNodeId, setSelectedNodeId] = useState<string>();
	const { data: nodes, refetch } = api.curriculum.getNodes.useQuery({ subjectId });
	const createNode = api.curriculum.createNode.useMutation({
		onSuccess: () => refetch(),
	});

	const handleAddNode = async () => {
		await createNode.mutateAsync({
			title: "New Node",
			type: "CHAPTER",
			order: (nodes?.length || 0) + 1,
			subjectId,
		});
	};

	const handleNodeSelect = (node: CurriculumNode) => {
		setSelectedNodeId(node.id);
		onNodeSelect(node);
	};

	const organizeNodes = (nodes: CurriculumNode[] = []): CurriculumNode[] => {
		const nodeMap = new Map<string | null, CurriculumNode[]>();
		
		// Group nodes by parentId
		nodes.forEach(node => {
			const parentNodes = nodeMap.get(node.parentId) || [];
			parentNodes.push(node);
			nodeMap.set(node.parentId, parentNodes);
		});

		// Process nodes starting from top level (null parentId)
		const processLevel = (parentId: string | null): CurriculumNode[] => {
			const levelNodes = nodeMap.get(parentId) || [];
			return levelNodes
				.sort((a, b) => a.order - b.order)
				.map(node => ({
					...node,
					children: processLevel(node.id)
				}));
		};

		return processLevel(null);
	};

	const organizedNodes = organizeNodes(nodes);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm font-medium">Curriculum Structure</CardTitle>
			</CardHeader>

			<CardContent>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					{organizedNodes.map((node) => (
						<TreeNode
							key={node.id}
							node={node}
							onSelect={handleNodeSelect}
							selectedNodeId={selectedNodeId}
							children={node.children}
							level={0}
						/>
					))}
					{(!organizedNodes || organizedNodes.length === 0) && (
						<div className="p-4 text-center text-muted-foreground">
							<Button 
								variant="outline" 
								onClick={() => createNode.mutateAsync({
									title: "New Chapter",
									type: "CHAPTER",
									order: 1,
									subjectId,
								})}
							>
								<Plus className="h-4 w-4 mr-2" />
								Add First Chapter
							</Button>
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
};