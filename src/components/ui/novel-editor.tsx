import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from 'lucide-react';
import { Button } from './button';

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
			Link.configure({
				openOnClick: false,
			}),
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

	if (!editor) {
		return null;
	}

	return (
		<div className={className}>
			{editor && (
				<BubbleMenu className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-md" editor={editor}>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleBold().run()}
						className={editor.isActive('bold') ? 'bg-muted' : ''}
					>
						<Bold className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleItalic().run()}
						className={editor.isActive('italic') ? 'bg-muted' : ''}
					>
						<Italic className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleUnderline().run()}
						className={editor.isActive('underline') ? 'bg-muted' : ''}
					>
						<UnderlineIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const url = window.prompt('Enter URL');
							if (url) {
								editor.chain().focus().setLink({ href: url }).run();
							}
						}}
						className={editor.isActive('link') ? 'bg-muted' : ''}
					>
						<LinkIcon className="h-4 w-4" />
					</Button>
				</BubbleMenu>
			)}
			<EditorContent editor={editor} />
		</div>
	);
}