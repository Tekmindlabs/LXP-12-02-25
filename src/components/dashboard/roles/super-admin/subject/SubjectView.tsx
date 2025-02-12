import { useState } from "react";
import { api } from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurriculumManager } from "./curriculum/CurriculumManager";

interface SubjectViewProps {
	subjectId: string;
}

export const SubjectView: React.FC<SubjectViewProps> = ({ subjectId }) => {
	const { data: subject, isLoading } = api.subject.getById.useQuery(subjectId);

	if (isLoading) return <div>Loading...</div>;
	if (!subject) return <div>Subject not found</div>;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold tracking-tight">{subject.name}</h2>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Subject Details</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="curriculum">
						<TabsList>
							<TabsTrigger value="curriculum">Curriculum</TabsTrigger>
							<TabsTrigger value="details">Details</TabsTrigger>
							<TabsTrigger value="resources">Resources</TabsTrigger>
						</TabsList>

						<TabsContent value="curriculum">
							<CurriculumManager subjectId={subjectId} />
						</TabsContent>

						<TabsContent value="details">
							{/* Subject details content */}
						</TabsContent>

						<TabsContent value="resources">
							{/* Subject resources content */}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};