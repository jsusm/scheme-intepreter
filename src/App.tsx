import { Debug } from "./components/Debug";
import { Demo } from "./components/Demo";

function App() {
  if (window.location.pathname === "/debug") {
    return <Debug />;
  }
  return <Demo />;
}

export default App;
