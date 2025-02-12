import { useState } from "react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ActivityType } from "@prisma/client";

interface ActivityFormProps {
	nodeId: string;
	onSuccess: () => void;
	onCancel: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ nodeId, onSuccess, onCancel }) => {
	const [title, setTitle] = useState("");
	const [type, setType] = useState<ActivityType>("QUIZ_MULTIPLE_CHOICE");
	const [content, setContent] = useState("");
	const [isGraded, setIsGraded] = useState(false);

	const createActivity = api.curriculum.createActivity.useMutation({
		onSuccess: () => {
			onSuccess();
			setTitle("");
			setType("QUIZ_MULTIPLE_CHOICE");
			setContent("");
			setIsGraded(false);
		},
	});

	const handleSubmit = async () => {
		await createActivity.mutateAsync({
			title,
			type,
			content: { data: content },
			isGraded,
			nodeId,
		});
	};

	return (
		<Card>
			<CardContent className="space-y-4 pt-4">
				<Input
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Activity title"
				/>
				<Select value={type} onValueChange={(value) => setType(value as ActivityType)}>
					<SelectTrigger>
						<SelectValue placeholder="Select activity type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="QUIZ_MULTIPLE_CHOICE">Multiple Choice Quiz</SelectItem>
						<SelectItem value="QUIZ_DRAG_DROP">Drag and Drop Quiz</SelectItem>
						<SelectItem value="QUIZ_FILL_BLANKS">Fill in the Blanks</SelectItem>
						<SelectItem value="CLASS_ASSIGNMENT">Assignment</SelectItem>
						<SelectItem value="CLASS_PROJECT">Project</SelectItem>
					</SelectContent>
				</Select>
				<Textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Activity content"
					rows={4}
				/>
				<div className="flex items-center space-x-2">
					<Switch
						checked={isGraded}
						onCheckedChange={setIsGraded}
					/>
					<label>Graded Activity</label>
				</div>
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={onCancel}>Cancel</Button>
					<Button onClick={handleSubmit} disabled={createActivity.isLoading}>
						Add Activity
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

interface ActivityManagerProps {
	nodeId: string;
}

export const ActivityManager: React.FC<ActivityManagerProps> = ({ nodeId }) => {
	const [showForm, setShowForm] = useState(false);
	const { data: nodes, refetch } = api.curriculum.getNodes.useQuery({ 
		subjectId: nodeId 
	});
	const deleteActivity = api.curriculum.deleteActivity.useMutation({
		onSuccess: () => refetch(),
	});

	const handleDelete = async (id: string) => {
		await deleteActivity.mutateAsync(id);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Learning Activities</h3>
				<Button onClick={() => setShowForm(true)} disabled={showForm}>
					<Plus className="h-4 w-4 mr-2" />
					Add Activity
				</Button>
			</div>

			{showForm && (
				<ActivityForm
					nodeId={nodeId}
					onSuccess={() => {
						setShowForm(false);
						refetch();
					}}
					onCancel={() => setShowForm(false)}
				/>
			)}

			<div className="grid grid-cols-2 gap-4">
				{nodes?.map((node) =>
					node.activities.map((activity) => (
						<Card key={activity.id}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div>
									<CardTitle className="text-sm font-medium">
										{activity.title}
									</CardTitle>
									<CardDescription className="text-xs">
										{activity.type} {activity.isGraded && "• Graded"}
									</CardDescription>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleDelete(activity.id)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</CardHeader>
						</Card>
					))
				)}
			</div>
		</div>
	);
};