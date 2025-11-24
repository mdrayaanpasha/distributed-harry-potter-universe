import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/home";


export default function app(){
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
    </Router>
  )
}