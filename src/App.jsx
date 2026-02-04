import GameCanvas from "./components/GameCanvas";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <h2>Can the ball escape?</h2>
      <GameCanvas />
    </div>
  );
}
