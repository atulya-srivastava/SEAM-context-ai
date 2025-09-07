// "use client";

// import { marked } from "marked";
// import DOMPurify from "dompurify";

// const renderMarkdown = (text: string) => DOMPurify.sanitize(marked(text || ""));

// export default function ChatWindow({ chatId, messages }) {
//   return (
//     <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-gray-900">
//       {messages.map((m) => (
//         <div
//           key={m._id || Math.random()}
//           className={`p-4 rounded-lg ${
//             m.role === "user" ? "bg-blue-700 self-end" : "bg-gray-800 self-start"
//           }`}
//         >
//           <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
//         </div>
//       ))}
//     </div>
//   );
// }
