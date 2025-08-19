import { BrowserRouter} from "react-router-dom";
import * as React from "react";
import Layout from "./components/Layout";
function App() {
    return (
        <BrowserRouter>
            <Layout>
               <h1>Hello, world!</h1>
            </Layout>
        </BrowserRouter>
    )
}

export default App;