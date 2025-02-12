import { useState } from "react";
import { api } from "@/utils/api";
import { CurriculumNode } from "@/types/curriculum";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface TreeNodeProps {
	node: CurriculumNode;
	onSelect: (node: CurriculumNode) => void;
	selectedNodeId?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onSelect, selectedNodeId }) => {
	return (
		<div 
			className={`cursor-pointer p-2 hover:bg-accent ${
				selectedNodeId === node.id ? "bg-accent" : ""
			}`}
			onClick={() => onSelect(node)}
		>
			<span className="text-sm font-medium">{node.title}</span>
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

	const organizeNodes = (nodes: CurriculumNode[] = []) => {
		const topLevel = nodes.filter(node => !node.parentId);
		return topLevel.sort((a, b) => a.order - b.order);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">Curriculum Structure</CardTitle>
				<Button variant="outline" size="sm" onClick={handleAddNode}>
					<Plus className="h-4 w-4" />
				</Button>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[calc(100vh-12rem)]">
					{nodes && organizeNodes(nodes).map((node) => (
						<TreeNode
							key={node.id}
							node={node}
							onSelect={handleNodeSelect}
							selectedNodeId={selectedNodeId}
						/>
					))}
				</ScrollArea>
			</CardContent>
		</Card>
	);
};