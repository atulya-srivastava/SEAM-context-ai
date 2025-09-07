// "use client";

// import { useState } from "react";
// import { useAuth } from "@clerk/nextjs";

// export default function MessageInput({ chatId, onMessageSent }) {
//   const [text, setText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { getToken } = useAuth();

//   const sendMessage = async () => {
//     if (!text.trim()) return;
//     setLoading(true);

//     const token = await getToken();
//     try {
//       const res = await fetch("http://localhost:3001/api/github/ask", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ question: text, chatId }),
//       });

//       const data = await res.json();
//       if (!data) throw new Error("No response from server");

//       onMessageSent(data.chatId, text, data.summary); // user + bot
//       setText("");
//     } catch (err) {
//       console.error("Failed to send message:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-4 bg-gray-900 flex gap-2">
//       <input
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         className="flex-1 p-2 rounded bg-gray-800 text-white"
//         placeholder="Type your message..."
//         disabled={loading}
//       />
//       <button
//         onClick={sendMessage}
//         className="bg-blue-600 p-2 rounded disabled:bg-blue-400"
//         disabled={loading || !text.trim()}
//       >
//         Send
//       </button>
//     </div>
//   );
// }
