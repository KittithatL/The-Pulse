// src/App.jsx
import Dashboard from "./pages/Dashboard"; //  Dashboard
// import Register from "./pages/Register"; // (คอมเมนต์ตัวเก่าไว้ก่อน)

function App() {
  return (
    <div>
      {/* 2. เรียกใช้ Dashboard ตรงนี้แทน */}
      <Dashboard />
    </div>
  );
}

export default App;