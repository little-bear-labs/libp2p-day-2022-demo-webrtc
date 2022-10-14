import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { work } from "./p2p";

function App() {
  const [errMsg, setErrMsg] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  useEffect(() => {
    work()
      .then((l: any) => setResultMsg(l))
      .catch((e) => setErrMsg(e.message));
  }, []);

  return (
    <div>
      <div className="App">Running the app...</div>
      <div>Error: {errMsg}</div>
      <div>Result: {resultMsg}</div>
    </div>
  );
}

export default App;
