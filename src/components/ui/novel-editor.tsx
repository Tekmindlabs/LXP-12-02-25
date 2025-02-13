import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';

interface NovelEditorProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function NovelEditor({ value, onChange, className }: NovelEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Placeholder.configure({
				placeholder: 'Start writing...'
			}),
			Image,
			Link,
			TaskList,
			TaskItem,
			Underline,
			TextStyle
		],
		content: value,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		}
	});

	return (
		<div className={className}>
			<EditorContent editor={editor} />
		</div>
	);
}