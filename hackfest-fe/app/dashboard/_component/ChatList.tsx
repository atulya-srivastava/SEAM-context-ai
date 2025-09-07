// "use client";

// import { useState, useEffect } from "react";
// import { useAuth } from "@clerk/nextjs";

// export default function ChatList({ onSelectChat }) {
//   const [chats, setChats] = useState([]);
//   const { getToken } = useAuth();

//   useEffect(() => {
//     loadChats();
//   }, []);

//   const loadChats = async () => {
//     const token = await getToken();
//     const res = await fetch("http://localhost:3001/api/chats", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     setChats(data);
//   };

//   const handleChatClick = async (chatId: string) => {
//     const token = await getToken();
//     const res = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const data = await res.json();
//     onSelectChat(chatId, data.messages);
//   };

//   const handleNewChat = async () => {
//     const token = await getToken();
//     const res = await fetch("http://localhost:3001/api/chats", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ title: "New Chat" }),
//     });
//     const newChat = await res.json();
//     // Reload chats including the new one
//     await loadChats();
//     // Automatically select the new chat
//     handleChatClick(newChat.chat._id);
//   };

//   return (
//     <div className="w-64 bg-gray-900 p-4 overflow-y-auto">
//       <h2 className="text-lg font-bold mb-4 flex justify-between items-center">
//         Your Chats
//         <button
//           onClick={handleNewChat}
//           className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm"
//         >
//           + New
//         </button>
//       </h2>
//       <ul className="space-y-2">
//         {chats.map((chat) => (
//           <li
//             key={chat._id}
//             className="p-2 cursor-pointer rounded hover:bg-gray-700"
//             onClick={() => handleChatClick(chat._id)}
//           >
//             {chat.title || "New Chat"}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
