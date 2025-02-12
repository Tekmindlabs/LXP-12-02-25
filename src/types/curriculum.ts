export type NodeType = 'CHAPTER' | 'TOPIC' | 'SUBTOPIC';
export type ResourceType = 'READING' | 'VIDEO' | 'URL' | 'DOCUMENT';
export type ActivityType = 'QUIZ' | 'ASSIGNMENT' | 'DISCUSSION' | 'PROJECT';

export interface FileInfo {
	name: string;
	size: number;
	type: string;
	url?: string;
}

export interface QuizContent {
	questions: {
		question: string;
		options?: string[];
		correctAnswer?: string | number;
		points?: number;
	}[];
}

export interface AssignmentContent {
	instructions: string;
	dueDate?: Date;
	totalPoints?: number;
	rubric?: {
		criteria: string;
		points: number;
	}[];
}

export interface DiscussionContent {
	topic: string;
	guidelines?: string[];
	dueDate?: Date;
	minResponses?: number;
}

export interface ProjectContent {
	description: string;
	objectives?: string[];
	dueDate?: Date;
	deliverables?: string[];
	rubric?: {
		criteria: string;
		points: number;
	}[];
}

export type ActivityContent = 
	| QuizContent 
	| AssignmentContent 
	| DiscussionContent 
	| ProjectContent;

export interface CurriculumNode {
	id: string;
	title: string;
	description?: string;
	type: NodeType;
	parentId?: string;
	order: number;
	subjectId: string;
	resources: CurriculumResource[];
	activities: CurriculumActivity[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CurriculumResource {
	id: string;
	title: string;
	type: ResourceType;
	content: string;
	nodeId: string;
	fileInfo?: FileInfo;
	createdAt: Date;
	updatedAt: Date;
}

export interface CurriculumActivity {
	id: string;
	title: string;
	type: ActivityType;
	content: ActivityContent;
	isGraded: boolean;
	nodeId: string;
	createdAt: Date;
	updatedAt: Date;
}