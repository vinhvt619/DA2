// src/Components/RichText/Editor.jsx
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import MenuBar from "./MenuBar";
import "./styles.scss"; // Ensure styles are imported for ProseMirror

function Editor({ content = "", onChange, className = "" }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      onChange && onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[150px] p-4",
      },
    },
  });

  if (editor && content !== editor.getHTML()) {
    if (editor.getText() === "" && content !== "<p></p>" && content !== "") {
      editor.commands.setContent(content);
    }
  }

  return (
    <div
      className={`border border-gray-300 rounded-lg my-5 mb-8 bg-white shadow-sm overflow-hidden flex flex-col w-full ${className}`}
    >
      {editor && <MenuBar editor={editor} />}

      {editor && (
        <BubbleMenu
          editor={editor}
          className="bg-white shadow-lg border border-gray-200 rounded-lg p-1 flex gap-1"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={
              editor.isActive("bold")
                ? "p-1 bg-gray-200 rounded text-black"
                : "p-1 hover:bg-gray-100 rounded text-gray-600"
            }
            type="button"
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={
              editor.isActive("italic")
                ? "p-1 bg-gray-200 rounded text-black"
                : "p-1 hover:bg-gray-100 rounded text-gray-600"
            }
            type="button"
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={
              editor.isActive("strike")
                ? "p-1 bg-gray-200 rounded text-black"
                : "p-1 hover:bg-gray-100 rounded text-gray-600"
            }
            type="button"
          >
            Strike
          </button>
        </BubbleMenu>
      )}

      <div className="flex-1 overflow-y-auto cursor-text bg-gray-50">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default Editor;
