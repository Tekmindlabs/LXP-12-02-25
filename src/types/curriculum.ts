import { z } from "zod";

export const CurriculumNodeType = z.enum(["CHAPTER", "TOPIC", "SUBTOPIC"]);
export type CurriculumNodeType = z.infer<typeof CurriculumNodeType>;

export const CurriculumResourceType = z.enum(["READING", "VIDEO", "URL", "DOCUMENT"]);
export type CurriculumResourceType = z.infer<typeof CurriculumResourceType>;

export const curriculumNodeSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().optional(),
	type: CurriculumNodeType,
	parentId: z.string().optional(),
	order: z.number(),
	subjectId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const curriculumResourceSchema = z.object({
	id: z.string(),
	title: z.string(),
	type: CurriculumResourceType,
	content: z.string(),
	nodeId: z.string(),
	fileInfo: z.record(z.any()).optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const curriculumActivitySchema = z.object({
	id: z.string(),
	title: z.string(),
	type: z.string(),
	content: z.record(z.any()),
	isGraded: z.boolean(),
	nodeId: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type CurriculumNode = z.infer<typeof curriculumNodeSchema>;
export type CurriculumResource = z.infer<typeof curriculumResourceSchema>;
export type CurriculumActivity = z.infer<typeof curriculumActivitySchema>;