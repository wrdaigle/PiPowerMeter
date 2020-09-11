import React from "react";
import AppProvider from "./context/AppProvider";

import { Grommet } from "grommet";
import PowerCharts from './components/PowerCharts';

import "./App.css";



function App() {

    return (
        <AppProvider>
            <Grommet full>
                <PowerCharts />
            </Grommet>
        </AppProvider>
    );
}

export default App;
