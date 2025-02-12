import { useState } from "react";
import { api } from "@/utils/api";
import { CurriculumNode, CurriculumNodeType } from "@/types/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NodeEditorProps {
	node: CurriculumNode;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node }) => {
	const [title, setTitle] = useState(node.title);
	const [description, setDescription] = useState(node.description || "");
	const [type, setType] = useState<CurriculumNodeType>(node.type);

	const updateNode = api.curriculum.updateNode.useMutation();

	const handleSave = async () => {
		await updateNode.mutateAsync({
			id: node.id,
			title,
			description,
			type,
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Edit Node</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<label className="text-sm font-medium">Title</label>
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Enter node title"
					/>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Type</label>
					<Select value={type} onValueChange={(value) => setType(value as CurriculumNodeType)}>
						<SelectTrigger>
							<SelectValue placeholder="Select node type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="CHAPTER">Chapter</SelectItem>
							<SelectItem value="TOPIC">Topic</SelectItem>
							<SelectItem value="SUBTOPIC">Subtopic</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium">Description</label>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Enter node description"
						rows={4}
					/>
				</div>

				<Button 
					onClick={handleSave} 
					disabled={updateNode.isLoading}
					className="w-full"
				>
					Save Changes
				</Button>
			</CardContent>
		</Card>
	);
};