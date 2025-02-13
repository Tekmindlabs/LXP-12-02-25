import { JSONContent } from "novel";

export const defaultEditorContent: JSONContent = {
	type: 'doc',
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Start writing...'
				}
			]
		}
	]
};