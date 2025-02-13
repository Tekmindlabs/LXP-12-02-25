import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import FontSize from '@tiptap/extension-font-size';
import Highlight from '@tiptap/extension-highlight';

import { Button } from './button';
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Link as LinkIcon,
	List,
	ListOrdered,
	Code,
	Quote,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Heading1,
	Heading2,
	Palette,
	Type,
	Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	placeholder?: string;
	minHeight?: string;
	showBubbleMenu?: boolean;
}

export function RichTextEditor({ 
	value, 
	onChange, 
	className = '', 
	placeholder = 'Start writing...',
	minHeight = '200px',
	showBubbleMenu = true
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: {},
				orderedList: {},
				codeBlock: {},
				blockquote: {},
				heading: {
					levels: [1, 2]
				}
			}),
			Placeholder.configure({
				placeholder
			}),
			Image,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-primary underline decoration-primary'
				}
			}),
			TaskList,
			TaskItem,
			Underline,
			TextStyle,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Color,
			FontFamily,
			FontSize,
			Highlight.configure({
				multicolor: true,
			}),
		],
		content: value,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none prose-headings:font-bold prose-p:my-2 prose-a:text-primary',
			},
			handlePaste: (view, event) => {
				if (event.clipboardData?.files?.length) {
					// Prevent default paste behavior for files
					event.preventDefault();
					return true;
				}
				return false;
			},
			handleDrop: (view, event) => {
				if (event.dataTransfer?.files?.length) {
					event.preventDefault();
					return true;
				}
				return false;
			},
			handleKeyDown: (view, event) => {
				// Handle keyboard shortcuts
				if (event.key === 'Tab') {
					event.preventDefault();
					return true;
				}
				return false;
			}
		}
	});

	if (!editor) {
		return null;
	}

	return (
		<div className="relative isolate">
			{showBubbleMenu && (
				<BubbleMenu 
					editor={editor} 
					className="flex items-center gap-1 rounded-md border bg-white p-1 shadow-md flex-wrap z-[100]"
					tippyOptions={{ duration: 100, zIndex: 100 }}
				>
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

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						className={editor.isActive('bulletList') ? 'bg-muted' : ''}
					>
						<List className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						className={editor.isActive('orderedList') ? 'bg-muted' : ''}
					>
						<ListOrdered className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
					>
						<Code className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						className={editor.isActive('blockquote') ? 'bg-muted' : ''}
					>
						<Quote className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().setTextAlign('left').run()}
						className={editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
					>
						<AlignLeft className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().setTextAlign('center').run()}
						className={editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}
					>
						<AlignCenter className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().setTextAlign('right').run()}
						className={editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
					>
						<AlignRight className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
						className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
					>
						<Heading1 className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
					>
						<Heading2 className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const color = window.prompt('Enter color (hex, rgb, or name)');
							if (color) {
								editor.chain().focus().setColor(color).run();
							}
						}}
						className={editor.isActive('textStyle') ? 'bg-muted' : ''}
					>
						<Palette className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const color = window.prompt('Enter highlight color');
							if (color) {
								editor.chain().focus().setHighlight({ color }).run();
							}
						}}
						className={editor.isActive('highlight') ? 'bg-muted' : ''}
					>
						<Highlighter className="h-4 w-4" />
					</Button>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const size = window.prompt('Enter font size (e.g., 12px, 1.5em)');
							if (size) {
								editor.chain().focus().setFontSize(size).run();
							}
						}}
						className={editor.isActive('fontSize') ? 'bg-muted' : ''}
					>
						<Type className="h-4 w-4" />
					</Button>
				</BubbleMenu>
			)}

			<EditorContent 
				editor={editor} 
				className={`prose max-w-none ${className}`}
				style={{ minHeight }}
			/>
		</div>
	);
}