import React, { useReducer, useEffect } from "react";
import AppContext from "./appContext";
import { appReducer, actions } from "./appReducer";
import moment from "moment";
import randomColor from 'randomcolor';

const initialState = {
    powerData: null,
    chartSettings: {
        spanTitle:'12 hours',
        timeSpan: 12,
        timeSpanUnits: "hours",
        tickSpacing: 1,
        tickSpacingUnits: "hours",
    },
};

const serverRoot = window.location.hostname === 'localhost'?'http://192.168.4.32:3000':'';

const AppProvider = (props) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    useEffect(() => {
        if (!state.powerData) setPowerData();
    }, []);

    const endTimeUTC = moment();
    const startTimeUTC = moment().subtract(
        state.chartSettings.timeSpan,
        state.chartSettings.timeSpanUnits
    );

    const setPowerData = () => {
        fetch(serverRoot+"/config")
            .then((response) => {
                return response.json();
            })
            .then((configJson) => {
                let circuits = configJson.Circuits;
                circuits.forEach((c) => {
                    c.color = randomColor();
                });
                const allPromises = circuits.map((circuit) => {
                    return fetch(
                        serverRoot+"/power?circuitId=" +
                            circuit.id.toString() +
                            "&start=" +
                            startTimeUTC.format("x") +
                            "&end=" +
                            endTimeUTC.format("x") +
                            "&groupBy=None&offset=-06:00"
                    );
                });
                Promise.all(allPromises).then((results) => {
                    const allPromises2 = results.map((result) => {
                        return result.json();
                    });
                    Promise.all(allPromises2).then((results2) => {
                        //assume everything is a load -- this helps account for the fact that some of my hall sensors are backwards
                        results2.forEach((c) => {
                            c.P = c.P.map((rec) => Math.abs(rec));
                        });
                        results2.forEach((c, i) => {
                            circuits[i].maxPower = Math.max(...c.P);
                        });
                        const out = results2[0].ts.map((item) => {
                            let t = {};
                            circuits.forEach((c) => {
                                t.time = item * 1000;
                            });
                            return t;
                        });
                        out.forEach((rec, rec_i) => {
                            circuits.forEach((circuit, circuit_i) => {
                                rec[circuit.Name] =
                                    results2[circuit_i].P[rec_i];
                            });
                        });
                        dispatch({
                            type: actions.SET_POWER_DATA,
                            to: { circuits: circuits, data: out },
                        });
                    });
                });
            });
    };

    const setChartSettings = (spanTitle) => {
        switch (spanTitle) {
            case "1 hour":
                dispatch({
                    type: actions.SET_CHART_SETTINGS,
                    to: {
                        spanTitle:'1 hour',
                        timeSpan: 1,
                        timeSpanUnits: "hours",
                        tickSpacing: 15,
                        tickSpacingUnits: "minutes",
                    },
                });
                break;
            case "12 hours":
                dispatch({
                    type: actions.SET_CHART_SETTINGS,
                    to: {
                        spanTitle:'12 hours',
                        timeSpan: 12,
                        timeSpanUnits: "hours",
                        tickSpacing: 1,
                        tickSpacingUnits: "hours",
                    },
                });
                break;
            case "24 hours":
                dispatch({
                    type: actions.SET_CHART_SETTINGS,
                    to: {
                        spanTitle:'24 hours',
                        timeSpan: 24,
                        timeSpanUnits: "hours",
                        tickSpacing: 1,
                        tickSpacingUnits: "hours",
                    },
                });
                break;
            case "1 week":
                dispatch({
                    type: actions.SET_CHART_SETTINGS,
                    to: {
                        spanTitle:'1 week',
                        timeSpan: 1,
                        timeSpanUnits: "weeks",
                        tickSpacing: 1,
                        tickSpacingUnits: "days",
                    },
                });
                break;
            default:
                break;
        }
    };

    return (
        <AppContext.Provider
            value={{
                powerData: state.powerData,
                setPowerData,
                chartSettings: state.chartSettings,
                setChartSettings,
            }}
        >
            {props.children}
        </AppContext.Provider>
    );
};

export default AppProvider;
