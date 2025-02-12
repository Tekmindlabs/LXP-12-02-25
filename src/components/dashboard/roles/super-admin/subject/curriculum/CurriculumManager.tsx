import { useState } from "react";
import { api } from "@/utils/api";
import { CurriculumNode } from "@/types/curriculum";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurriculumTree } from "./CurriculumTree";
import { NodeEditor } from "./NodeEditor";
import { ResourceManager } from "./ResourceManager";
import { ActivityManager } from "./ActivityManager";
import { LuChevronLeft } from "react-icons/lu";

export const CurriculumManager: React.FC<{ subjectId: string }> = ({ subjectId }) => {
	const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
	const [activeView, setActiveView] = useState<'content' | 'resources' | 'activities'>('content');
	const [showNodeEditor, setShowNodeEditor] = useState(false);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const { data: nodes } = api.curriculum.getNodes.useQuery({ subjectId });

	const handleNodeSelect = (node: CurriculumNode) => {
		setSelectedNode(node);
		setIsSheetOpen(false); // Close sheet first
		// Only show editor if it's a new selection
		if (node.id !== selectedNode?.id) {
			setShowNodeEditor(true);
		}
	};

	const handleSheetOpenChange = (open: boolean) => {
		setIsSheetOpen(open);
		// If sheet is being closed and we have a selected node, ensure content is visible
		if (!open && selectedNode) {
			setShowNodeEditor(false);
		}
	};

	const renderContent = () => {
		if (!nodes || nodes.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center h-[400px] text-center">
					<p className="text-muted-foreground mb-4">
						Start building your curriculum by adding your first chapter.
					</p>
				</div>
			);
		}

		if (!selectedNode) {
			return (
				<div className="flex h-full items-center justify-center text-muted-foreground p-4 text-center">
					Select a chapter or topic from the curriculum tree to view or edit its content
				</div>
			);
		}

		switch (activeView) {
			case 'content':
				return <NodeEditor node={selectedNode} />;
			case 'resources':
				return <ResourceManager nodeId={selectedNode.id} />;
			case 'activities':
				return <ActivityManager nodeId={selectedNode.id} />;
		}
	};

	return (
		<div className="flex flex-col lg:flex-row min-h-[calc(100vh-10rem)]">
			<div className="lg:hidden w-full mb-4 px-4">
				<Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
					<SheetTrigger asChild>
						<Button variant="outline" className="w-full">
							View Curriculum Tree
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0">
						<div className="h-full overflow-auto">
							<CurriculumTree 
								subjectId={subjectId}
								onNodeSelect={handleNodeSelect}
							/>
						</div>
					</SheetContent>
				</Sheet>
			</div>

			<div className="hidden lg:block w-80 border-r min-h-full overflow-auto">
				<CurriculumTree 
					subjectId={subjectId}
					onNodeSelect={handleNodeSelect}
				/>
			</div>

			<div className="flex-1 px-4 lg:px-6">
				{selectedNode && !showNodeEditor && (
					<div className="space-y-4">
						<div className="flex items-center gap-2 border-b pb-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSelectedNode(null)}
								className="lg:hidden"
							>
								<LuChevronLeft className="h-4 w-4" />
							</Button>
							<h2 className="text-lg font-semibold">{selectedNode.title}</h2>
						</div>

						<div className="flex gap-2 border-b pb-4 overflow-x-auto">
							<Button
								variant={activeView === 'content' ? 'secondary' : 'ghost'}
								onClick={() => setActiveView('content')}
								size="sm"
							>
								Content
							</Button>
							<Button
								variant={activeView === 'resources' ? 'secondary' : 'ghost'}
								onClick={() => setActiveView('resources')}
								size="sm"
							>
								Resources
							</Button>
							<Button
								variant={activeView === 'activities' ? 'secondary' : 'ghost'}
								onClick={() => setActiveView('activities')}
								size="sm"
							>
								Activities
							</Button>
						</div>

						<div className="min-h-[400px]">
							{activeView === 'resources' && <ResourceManager nodeId={selectedNode.id} />}
							{activeView === 'activities' && <ActivityManager nodeId={selectedNode.id} />}
						</div>
					</div>
				)}

				{!selectedNode && (
					<div className="flex h-[400px] items-center justify-center text-muted-foreground p-4 text-center">
						{renderContent()}
					</div>
				)}
			</div>

			<Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>
				<DialogContent className="max-w-2xl">
					{selectedNode && <NodeEditor 
						node={selectedNode} 
						onClose={() => setShowNodeEditor(false)}
					/>}
				</DialogContent>
			</Dialog>
		</div>
	);
};