// // import React from "react";
// // import { Link } from "react-router-dom";  // Import Link from react-router-dom

// // const HomePage = () => {
// //   return (
// //     <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
// //       <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to the Emergency Alert System</h1>

// //       {/* Buttons for navigating to Sign In and Sign Up */}
// //       <div className="flex gap-4">
// //         <Link 
// //           to="/signin" 
// //           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
// //           Sign In
// //         </Link>

// //         <Link 
// //           to="/signup" 
// //           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
// //           Sign Up
// //         </Link>
// //       </div>
// //     </div>
// //   );
// // };

// // export default HomePage;


// import React from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../AuthContext";

// const HomePage = () => {
//   const { user } = useAuth();

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
//       <h1 className="text-3xl font-bold text-gray-900 mb-8">
//         Welcome to the Emergency Alert System
//       </h1>

//       {user ? (
//         <Link
//           to="/contacts"
//           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           Go to Dashboard
//         </Link>
//       ) : (
//         <div className="flex gap-4">
//           <Link
//             to="/signin"
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Sign In
//           </Link>
//           <Link
//             to="/signup"
//             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//           >
//             Sign Up
//           </Link>
//         </div>
//       )}
//     </div>
//   );
// };

// export default HomePage;
