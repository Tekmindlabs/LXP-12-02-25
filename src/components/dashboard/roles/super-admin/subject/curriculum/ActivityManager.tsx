import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { 
	QuizForm, 
	AssignmentForm, 
	DiscussionForm, 
	ProjectForm 
} from './ActivityForms';
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
import { ActivityType, ActivityContent } from "@/types/curriculum";
import { toast } from "@/hooks/use-toast";

interface ActivityFormProps {
	nodeId: string;
	onSuccess: () => void;
	onCancel: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ nodeId, onSuccess, onCancel }) => {
	const [title, setTitle] = useState("");
	const [type, setType] = useState<ActivityType>("QUIZ");
	const [isGraded, setIsGraded] = useState(false);
	const [content, setContent] = useState<ActivityContent>(() => {
		switch (type) {
			case 'QUIZ':
				return { questions: [] };
			case 'ASSIGNMENT':
				return { instructions: '', totalPoints: 0 };
			case 'DISCUSSION':
				return { topic: '', guidelines: [] };
			case 'PROJECT':
				return { description: '', objectives: [] };
			default:
				return { questions: [] };
		}
	});

	useEffect(() => {
		switch (type) {
			case 'QUIZ':
				setContent({ questions: [] });
				break;
			case 'ASSIGNMENT':
				setContent({ instructions: '', totalPoints: 0 });
				break;
			case 'DISCUSSION':
				setContent({ topic: '', guidelines: [] });
				break;
			case 'PROJECT':
				setContent({ description: '', objectives: [] });
				break;
		}
	}, [type]);

	const createActivity = api.curriculum.createActivity.useMutation({
		onSuccess: () => {
			toast({
				title: "Activity created",
				description: "The activity has been created successfully."
			});
			onSuccess();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive"
			});
		}
	});

	const handleSubmit = async () => {
		if (!title.trim()) {
			toast({
				title: "Error",
				description: "Title is required",
				variant: "destructive"
			});
			return;
		}

		// Validate content based on type
		let isValid = true;
		let errorMessage = '';

		switch (type) {
			case 'QUIZ':
				if (!content.questions.length) {
					isValid = false;
					errorMessage = 'Add at least one question';
				}
				break;
			case 'ASSIGNMENT':
				if (!content.instructions.trim()) {
					isValid = false;
					errorMessage = 'Instructions are required';
				}
				break;
			case 'DISCUSSION':
				if (!content.topic.trim()) {
					isValid = false;
					errorMessage = 'Topic is required';
				}
				break;
			case 'PROJECT':
				if (!content.description.trim()) {
					isValid = false;
					errorMessage = 'Description is required';
				}
				break;
		}

		if (!isValid) {
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive"
			});
			return;
		}

		try {
			await createActivity.mutateAsync({
				title,
				type,
				content,
				isGraded,
				nodeId,
			});
		} catch (error) {
			console.error("Failed to create activity:", error);
		}
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
					<SelectItem value="QUIZ">Quiz</SelectItem>
					<SelectItem value="ASSIGNMENT">Assignment</SelectItem>
					<SelectItem value="DISCUSSION">Discussion</SelectItem>
					<SelectItem value="PROJECT">Project</SelectItem>
				  </SelectContent>
				</Select>
				{/* Render different content forms based on activity type */}
				{type === 'QUIZ' && (
				  <QuizForm content={content} onChange={setContent} />
				)}
				{type === 'ASSIGNMENT' && (
				  <AssignmentForm content={content} onChange={setContent} />
				)}
				{type === 'DISCUSSION' && (
				  <DiscussionForm content={content} onChange={setContent} />
				)}
				{type === 'PROJECT' && (
				  <ProjectForm content={content} onChange={setContent} />
				)}
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
	const { data: activities, isLoading, refetch } = api.curriculum.getActivities.useQuery(
		{ nodeId },
		{ enabled: !!nodeId }
	);

	const deleteActivity = api.curriculum.deleteActivity.useMutation({
		onSuccess: () => {
			toast({
				title: "Activity deleted",
				description: "The activity has been deleted successfully."
			});
			refetch();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive"
			});
		}
	});

	const handleDelete = async (id: string) => {
		if (window.confirm("Are you sure you want to delete this activity?")) {
			await deleteActivity.mutateAsync(id);
		}
	};

	if (isLoading) {
		return <div>Loading activities...</div>;
	}

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
				{activities?.map((activity) => (
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
						disabled={deleteActivity.isLoading}
					  >
						<Trash2 className="h-4 w-4" />
					  </Button>
					</CardHeader>
				  </Card>
				))}

			</div>
		</div>
	);
};