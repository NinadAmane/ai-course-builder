// import { useEffect, useState } from "react";
// import axios from "axios";

// function App() {
//   const [message, setMessage] = useState("Loading...");

//   useEffect(() => {
//     // Fetch the message from our backend
//     axios
//       .get("http://localhost:5000/")
//       .then((res) => {
//         setMessage(res.data);
//       })
//       .catch((err) => {
//         console.error("Error fetching data:", err);
//         setMessage("Failed to connect to server");
//       });
//   }, []);

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
//       <div className="text-center">
//         <h1 className="text-4xl font-bold text-blue-500 mb-4">
//           AI Course Builder
//         </h1>
//         <p className="text-xl bg-gray-700 p-4 rounded-lg">
//           Server says:{" "}
//           <span className="font-semibold text-green-400">{message}</span>
//         </p>
//       </div>
//     </div>
//   );
// }

// export default App;

import HomePage from "./pages/HomePage";

function App() {
  return (
    <div className="min-h-screen">
      <HomePage />
    </div>
  );
}

export default App;
