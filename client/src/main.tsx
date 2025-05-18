import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <Helmet>
      <title>Student Task Tracker - Organize Your Academic Life</title>
      <meta 
        name="description" 
        content="Track your coursework, assignments, and study materials with our comprehensive student task tracking application. Manage tasks, take notes, and upload photos - all in one place."
      />
    </Helmet>
    <App />
  </HelmetProvider>
);
