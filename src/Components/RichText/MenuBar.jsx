import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  H1Icon,
  ListBulletIcon,
  QueueListIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CodeBracketIcon
} from "@heroicons/react/24/outline";

function MenuBar({ editor }) {
  if (!editor) {
    return null;
  }

  const items = [
    {
      icon: <BoldIcon className="w-5 h-5" />,
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      icon: <ItalicIcon className="w-5 h-5" />,
      title: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      icon: <StrikethroughIcon className="w-5 h-5" />,
      title: "Strike",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      type: "divider",
    },
    {
      label: "H1",
      title: "Heading 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: () => editor.isActive("heading", { level: 1 }),
    },
    {
      label: "H2",
      title: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      type: "divider",
    },
    {
      icon: <ListBulletIcon className="w-5 h-5" />,
      title: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      icon: <QueueListIcon className="w-5 h-5" />, // Using QueueList for Ordered List representation
      title: "Ordered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    {
      icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />,
      title: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
    {
      icon: <CodeBracketIcon className="w-5 h-5" />,
      title: "Code",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive("code"),
    },
    {
      type: "divider",
    },
    {
      icon: <ArrowUturnLeftIcon className="w-5 h-5" />,
      title: "Undo",
      action: () => editor.chain().focus().undo().run(),
      disabled: () => !editor.can().undo(),
    },
    {
      icon: <ArrowUturnRightIcon className="w-5 h-5" />,
      title: "Redo",
      action: () => editor.chain().focus().redo().run(),
      disabled: () => !editor.can().redo(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {items.map((item, index) => {
        if (item.type === "divider") {
          return <div key={index} className="w-[1px] h-6 bg-gray-300 mx-1" />;
        }

        const isActive = item.isActive ? item.isActive() : false;
        const disabled = item.disabled ? item.disabled() : false;

        return (
          <button
            key={index}
            onClick={item.action}
            disabled={disabled}
            title={item.title}
            className={`
              p-1.5 rounded transition-colors duration-200
              ${isActive ? "bg-gray-200 text-black shadow-sm" : "text-gray-600 hover:bg-gray-200 hover:text-black"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${item.label ? "font-bold text-sm px-2" : ""}
            `}
            type="button"
          >
            {item.icon ? item.icon : item.label}
          </button>
        );
      })}
    </div>
  );
}

export default MenuBar;
