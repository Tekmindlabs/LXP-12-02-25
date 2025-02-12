import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CurriculumNodeType, CurriculumResourceType } from "@/types/curriculum";

export const curriculumRouter = createTRPCRouter({
	// Node operations
	getNodes: protectedProcedure
		.input(z.object({
			subjectId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.curriculumNode.findMany({
				where: { subjectId: input.subjectId },
				include: {
					resources: true,
					activities: true
				},
				orderBy: { order: 'asc' }
			});
		}),

	createNode: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional(),
			type: z.enum(["CHAPTER", "TOPIC", "SUBTOPIC"]),
			parentId: z.string().optional(),
			order: z.number(),
			subjectId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumNode.create({
				data: input,
				include: {
					resources: true,
					activities: true
				}
			});
		}),

	updateNode: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			type: z.enum(["CHAPTER", "TOPIC", "SUBTOPIC"]).optional(),
			parentId: z.string().optional(),
			order: z.number().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.curriculumNode.update({
				where: { id },
				data,
				include: {
					resources: true,
					activities: true
				}
			});
		}),

	deleteNode: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumNode.delete({
				where: { id: input }
			});
		}),

	// Resource operations
	createResource: protectedProcedure
		.input(z.object({
			title: z.string(),
			type: z.enum(["READING", "VIDEO", "URL", "DOCUMENT"]),
			content: z.string(),
			nodeId: z.string(),
			fileInfo: z.record(z.any()).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumResource.create({
				data: input
			});
		}),

	updateResource: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			type: z.enum(["READING", "VIDEO", "URL", "DOCUMENT"]).optional(),
			content: z.string().optional(),
			fileInfo: z.record(z.any()).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.curriculumResource.update({
				where: { id },
				data
			});
		}),

	deleteResource: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumResource.delete({
				where: { id: input }
			});
		}),

	// Activity operations
	createActivity: protectedProcedure
		.input(z.object({
			title: z.string(),
			type: z.string(),
			content: z.record(z.any()),
			isGraded: z.boolean(),
			nodeId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumActivity.create({
				data: input
			});
		}),

	updateActivity: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			type: z.string().optional(),
			content: z.record(z.any()).optional(),
			isGraded: z.boolean().optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.curriculumActivity.update({
				where: { id },
				data
			});
		}),

	deleteActivity: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.curriculumActivity.delete({
				where: { id: input }
			});
		})
});