'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { SubjectList } from "./SubjectList";
import { SubjectForm } from "./SubjectForm";
import { CurriculumManager } from "./curriculum/CurriculumManager";

interface SearchFilters {
	search: string;
	classGroupIds?: string[];  // Updated to match router input type
	teacherId?: string;
	status?: Status;
}

export const SubjectManagement = () => {
	const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'list' | 'curriculum'>('list');
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
		classGroupIds: [],
	});

	const { data: subjects, isLoading } = api.subject.searchSubjects.useQuery(filters);
	const { data: classGroups } = api.classGroup.getAllClassGroups.useQuery();
	const { data: teachers } = api.subject.getAvailableTeachers.useQuery();


	const handleCreate = () => {
		setSelectedSubjectId(null);
		setIsFormOpen(true);
	};

	const handleEdit = (id: string) => {
		setSelectedSubjectId(id);
		setIsFormOpen(true);
	};

	const handleFormSuccess = () => {
		setIsFormOpen(false);
		setSelectedSubjectId(null);
	};

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Subject Management</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<Tabs value={activeTab} onValueChange={(value) => {
						setActiveTab(value as 'list' | 'curriculum');
						if (value === 'list') setSelectedSubjectId(null);
					}}>
						<div className="flex items-center justify-between mb-4">
							<TabsList>
								<TabsTrigger value="list">Subjects</TabsTrigger>
								<TabsTrigger value="curriculum">Curriculum</TabsTrigger>
							</TabsList>
							{activeTab === 'list' && (
								<Button onClick={handleCreate}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Create Subject
								</Button>
							)}
						</div>

						<TabsContent value="list">
							<div className="space-y-4">
								<div className="flex space-x-4">
									<Input
										placeholder="Search subjects..."
										value={filters.search}
										onChange={(e) => setFilters({ ...filters, search: e.target.value })}
										className="max-w-sm"
									/>
									<Select
										value={filters.classGroupIds?.[0] || "ALL"}
										onValueChange={(value) => setFilters({ 
											...filters, 
											classGroupIds: value === "ALL" ? [] : [value] 
										})}
									>
										<SelectTrigger className="w-[200px]">
											<SelectValue placeholder="Filter by Class Group" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">All Class Groups</SelectItem>
											{classGroups?.map((group) => (
												<SelectItem key={group.id} value={group.id}>
													{group.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={filters.teacherId || "ALL"}
										onValueChange={(value) => setFilters({ ...filters, teacherId: value === "ALL" ? undefined : value })}
									>
										<SelectTrigger className="w-[200px]">
											<SelectValue placeholder="Filter by Teacher" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">All Teachers</SelectItem>
											{teachers?.map((teacher) => (
												<SelectItem key={teacher.id} value={teacher.id}>
													{teacher.user.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={filters.status || "ALL"}
										onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? undefined : value as Status })}
									>
										<SelectTrigger className="w-[180px]">
											<SelectValue placeholder="Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="ALL">All Status</SelectItem>
											{Object.values(Status).map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								
								<SubjectList 
									subjects={subjects?.map(subject => ({
										...subject,
										classGroups: subject.classGroups.map(group => ({
											name: group.name,
											program: {
												name: group.program.name || ''
											}
										}))
									})) || []}
									onSelect={(id) => {
										setSelectedSubjectId(id);
										setActiveTab('curriculum');
									}}
								/>
								
								<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
									<SubjectForm 
										selectedSubject={subjects?.find(s => s.id === selectedSubjectId)}
										classGroups={classGroups || []}
										teachers={teachers || []}
										onSuccess={handleFormSuccess}
									/>
								</Dialog>
							</div>
						</TabsContent>

						<TabsContent value="curriculum">
							{selectedSubjectId && (
								<CurriculumManager subjectId={selectedSubjectId} />
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>

	);
};