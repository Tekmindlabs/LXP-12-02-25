import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Youtube } from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Mathematics } from '@aarkue/tiptap-math-extension'
import { Video } from '@fourwaves/tiptap-extension-video'
import { ResizableImage } from 'tiptap-extension-resize-image'

interface AdvancedEditorProps {
	initialContent?: string;
	onUpdate?: (content: string) => void;
	onSave?: (content: string) => void;
	readOnly?: boolean;
}

const uploadFn = async (file: File): Promise<string> => {
	try {
		const formData = new FormData();
		formData.append('file', file);
		
		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		
		if (!response.ok) throw new Error('Upload failed');
		
		const data = await response.json();
		return data.url;
	} catch (error) {
		console.error('Upload error:', error);
		throw error;
	}
};

export const AdvancedEditor = ({ 
	initialContent = '', 
	onUpdate,
	onSave,
	readOnly = false 
}: AdvancedEditorProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit,
			ResizableImage.configure({
				uploadFn,
				defaultSize: 300,
			}),
			Placeholder.configure({
				placeholder: 'Start writing...',
			}),
			Color,
			TextStyle,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Underline,
			Youtube.configure({
				inline: false,
			}),
			Table.configure({
				resizable: true,
			}),
			TableRow,
			TableHeader,
			TableCell,
			Mathematics,
			Video,
		],
		content: initialContent,
		editable: !readOnly,
		onUpdate: ({ editor }) => {
			onUpdate?.(editor.getHTML());
		},
		editorProps: {
			handleDOMEvents: {
				keydown: (view, event) => {
					if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
						event.preventDefault();
						onSave?.(editor?.getHTML() || '');
						return true;
					}
					return false;
				},
			},
			handlePaste: (view, event) => {
				if (!event.clipboardData) return false;
				const files = Array.from(event.clipboardData.files);
				
				if (files.length === 0) return false;
				
				event.preventDefault();
				
				files.forEach(async (file) => {
					if (file.type.startsWith('image/')) {
						try {
							const url = await uploadFn(file);
							editor?.commands.setImage({ src: url });
						} catch (error) {
							console.error('Failed to upload pasted image:', error);
						}
					}
				});
				
				return true;
			},
			handleDrop: (view, event, _slice, moved) => {
				if (!event.dataTransfer || moved) return false;
				
				const files = Array.from(event.dataTransfer.files);
				
				if (files.length === 0) return false;
				
				event.preventDefault();
				
				files.forEach(async (file) => {
					if (file.type.startsWith('image/')) {
						try {
							const url = await uploadFn(file);
							editor?.commands.setImage({ src: url });
						} catch (error) {
							console.error('Failed to upload dropped image:', error);
						}
					}
				});
				
				return true;
			},
		},
	});

	return (
		<div className="w-full min-h-[200px] border rounded-lg">
			<EditorContent 
				editor={editor} 
				className="prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full p-4"
			/>
		</div>
	);
};