import { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { defaultEditorContent } from "./default-content";

interface NovelEditorProps {
	defaultValue?: string;
	onUpdate?: (editor: Editor | null) => void;
}

export const NovelEditor: React.FC<NovelEditorProps> = ({
	defaultValue,
	onUpdate
}) => {
	const editor = useEditor({
		extensions: [StarterKit],
		content: defaultValue || defaultEditorContent,
		onUpdate: ({ editor }) => {
			onUpdate?.(editor);
		},
		editorProps: {
			attributes: {
				class: "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full"
			}
		}
	});

	useEffect(() => {
		if (defaultValue && editor) {
			editor.commands.setContent(defaultValue);
		}
	}, [defaultValue, editor]);

	return (
		<div className="relative w-full min-h-[500px] max-w-screen-lg border-stone-200 bg-white sm:mb-[calc(20vh)] rounded-lg border">
			<EditorContent 
				editor={editor} 
				className="relative min-h-[500px] w-full max-w-screen-lg sm:mb-[calc(20vh)] p-4"
			/>
		</div>

	);
};
