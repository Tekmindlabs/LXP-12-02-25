import { useState } from "react";
import { api } from "@/utils/api";
import { CurriculumNode } from "@/types/curriculum";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurriculumTree } from "./CurriculumTree";
import { NodeEditor } from "./NodeEditor";
import { ResourceManager } from "./ResourceManager";
import { ActivityManager } from "./ActivityManager";

export const CurriculumManager: React.FC<{ subjectId: string }> = ({ subjectId }) => {
	const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);

	return (
		<div className="grid grid-cols-12 gap-4">
			<div className="col-span-3 border-r p-4">
				<CurriculumTree 
					subjectId={subjectId}
					onNodeSelect={setSelectedNode}
				/>
			</div>
			
			<div className="col-span-9 p-4">
				{selectedNode ? (
					<Tabs defaultValue="content">
						<TabsList>
							<TabsTrigger value="content">Content</TabsTrigger>
							<TabsTrigger value="resources">Resources</TabsTrigger>
							<TabsTrigger value="activities">Activities</TabsTrigger>
						</TabsList>
						
						<TabsContent value="content">
							<NodeEditor node={selectedNode} />
						</TabsContent>
						
						<TabsContent value="resources">
							<ResourceManager nodeId={selectedNode.id} />
						</TabsContent>
						
						<TabsContent value="activities">
							<ActivityManager nodeId={selectedNode.id} />
						</TabsContent>
					</Tabs>
				) : (
					<div className="flex h-full items-center justify-center text-muted-foreground">
						Select a node from the curriculum tree to view or edit its content
					</div>
				)}
			</div>
		</div>
	);
};