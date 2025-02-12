import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { 
	QuizForm, 
	AssignmentForm, 
	ProjectForm 
} from './ActivityForms';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ActivityType, ActivityContent, QuizContent, AssignmentContent, ProjectContent } from "@/types/curriculum";
import { toast } from "@/hooks/use-toast";


// Type guards
const isQuizContent = (content: ActivityContent): content is QuizContent => {
	return 'questions' in content;
};

const isAssignmentContent = (content: ActivityContent): content is AssignmentContent => {
	return 'instructions' in content;
};

const isProjectContent = (content: ActivityContent): content is ProjectContent => {
	return 'description' in content;
};


interface ActivityFormProps {
	nodeId: string;
	onSuccess: () => void;
	onCancel: () => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ nodeId, onSuccess, onCancel }) => {
	const [title, setTitle] = useState("");
	const [type, setType] = useState<ActivityType>("QUIZ_MULTIPLE_CHOICE");
	const [isGraded, setIsGraded] = useState(false);
	const [content, setContent] = useState<ActivityContent>(() => {
		return { questions: [] };
	});


	useEffect(() => {
		switch (type) {
			case 'QUIZ_MULTIPLE_CHOICE':
			case 'QUIZ_DRAG_DROP':
			case 'QUIZ_FILL_BLANKS':
			case 'QUIZ_MEMORY':
			case 'QUIZ_TRUE_FALSE':
				setContent({ questions: [] });
				break;
			case 'CLASS_ASSIGNMENT':
			case 'CLASS_PROJECT':
				setContent({ instructions: '', totalPoints: 0 });
				break;
			case 'CLASS_PRESENTATION':
				setContent({ description: '', objectives: [] });
				break;
			default:
				setContent({ questions: [] });
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

		if (['QUIZ_MULTIPLE_CHOICE', 'QUIZ_DRAG_DROP', 'QUIZ_FILL_BLANKS', 'QUIZ_MEMORY', 'QUIZ_TRUE_FALSE'].includes(type)) {
			if (isQuizContent(content) && !content.questions.length) {
				isValid = false;
				errorMessage = 'Add at least one question';
			}
		} else if (['CLASS_ASSIGNMENT', 'CLASS_PROJECT'].includes(type)) {
			if (isAssignmentContent(content) && !content.instructions.trim()) {
				isValid = false;
				errorMessage = 'Instructions are required';
			}
		} else if (type === 'CLASS_PRESENTATION') {
			if (isProjectContent(content) && !content.description.trim()) {
				isValid = false;
				errorMessage = 'Description is required';
			}
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
					<SelectItem value="QUIZ_MULTIPLE_CHOICE">Multiple Choice Quiz</SelectItem>
					<SelectItem value="QUIZ_DRAG_DROP">Drag & Drop Quiz</SelectItem>
					<SelectItem value="QUIZ_FILL_BLANKS">Fill in the Blanks</SelectItem>
					<SelectItem value="QUIZ_MEMORY">Memory Quiz</SelectItem>
					<SelectItem value="QUIZ_TRUE_FALSE">True/False Quiz</SelectItem>
					<SelectItem value="CLASS_ASSIGNMENT">Assignment</SelectItem>
					<SelectItem value="CLASS_PROJECT">Project</SelectItem>
					<SelectItem value="CLASS_PRESENTATION">Presentation</SelectItem>
				  </SelectContent>
				</Select>
				{/* Render different content forms based on activity type */}
				{(type === 'QUIZ_MULTIPLE_CHOICE' || 
				  type === 'QUIZ_DRAG_DROP' || 
				  type === 'QUIZ_FILL_BLANKS' || 
				  type === 'QUIZ_MEMORY' || 
				  type === 'QUIZ_TRUE_FALSE') && (
				  <QuizForm 
					content={content as QuizContent} 
					onChange={(newContent) => setContent(newContent)} 
				  />
				)}
				{(type === 'CLASS_ASSIGNMENT' || type === 'CLASS_PROJECT') && (
				  <AssignmentForm 
					content={content as AssignmentContent} 
					onChange={(newContent) => setContent(newContent)} 
				  />
				)}
				{type === 'CLASS_PRESENTATION' && (
				  <ProjectForm 
					content={content as ProjectContent} 
					onChange={(newContent) => setContent(newContent)} 
				  />
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
					<Button onClick={handleSubmit} disabled={createActivity.status === 'pending'}>
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
						disabled={deleteActivity.status === 'pending'}
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