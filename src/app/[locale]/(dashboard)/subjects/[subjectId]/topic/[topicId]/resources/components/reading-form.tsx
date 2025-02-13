"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AdvancedEditor } from "@/components/editor";
import { ReadingFormValues, readingFormSchema } from "../schema";

interface ReadingFormProps {
	topicId: string;
	onSuccess: () => void;
	initialData?: ReadingFormValues;
}

export const ReadingForm = ({ 
	topicId,
	onSuccess,
	initialData 
}: ReadingFormProps) => {
	const form = useForm<ReadingFormValues>({
		resolver: zodResolver(readingFormSchema),
		defaultValues: {
			title: initialData?.title || "",
			content: initialData?.content || "",
		}
	});

	const onSubmit = async (values: ReadingFormValues) => {
		try {
			// Handle form submission
			onSuccess();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Title</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Content</FormLabel>
							<FormControl>
								<AdvancedEditor
									initialContent={field.value}
									onUpdate={(content) => {
										field.onChange(content);
									}}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit">Save Reading</Button>
			</form>
		</Form>
	);
};