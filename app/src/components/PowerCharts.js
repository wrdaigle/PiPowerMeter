import React, { useState, useContext } from "react";
import appContext from "../context/appContext";
import {
    Area,
    AreaChart,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import moment from "moment";
import { Box, Grid, Select } from "grommet";

const minPower = 5;

function PowerCharts() {
    // const [data, set_data] = useState(null);
    const { powerData, chartSettings, setChartSettings } = useContext(appContext);
    const [selectedCircuit, set_selectedCircuit] = useState(null);

    if (!powerData) return null;

    const startTime = moment(powerData.data[0].time);
    const endTime = moment(powerData.data[powerData.data.length - 1].time);
    const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tick) =>
        startTime.clone().startOf("hour").add(tick, "hours").valueOf()
    );

    return (
        <Grid fill rows={["auto", "flex"]}>
            <Select options={['1 hour', '12 hours', '24 hours','1 week']} value={chartSettings.spanTitle} onChange={({value})=>setChartSettings(value)} />
            <Grid fill rows={["1/2", "1//2"]}>
                <Box fill>
                    <ResponsiveContainer>
                        <AreaChart
                            data={powerData.data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                scale="time"
                                type="number"
                                domain={[
                                    startTime.valueOf(),
                                    endTime.valueOf(),
                                ]}
                                tickFormatter={(time) =>
                                    moment(time).format("ha")
                                }
                                ticks={ticks}
                            />
                            <YAxis />
                            {powerData.circuits
                                .filter((c) => c.IsMain === 1)
                                .map((circuit) => {
                                    return (
                                        <Area
                                            type="monotone"
                                            dataKey={circuit.Name}
                                            dot={false}
                                        />
                                    );
                                })}
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>
                <Box fill>
                    <ResponsiveContainer>
                        <LineChart
                            data={powerData.data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="time"
                                scale="time"
                                type="number"
                                domain={[
                                    startTime.valueOf(),
                                    endTime.valueOf(),
                                ]}
                                tickFormatter={(time) =>
                                    moment(time).format("ha")
                                }
                                ticks={ticks}
                            />
                            <YAxis
                                type="number"
                                domain={[
                                    "dataMin",
                                    selectedCircuit
                                        ? powerData.circuits.find(
                                              (circuit) =>
                                                  circuit.Name ===
                                                  selectedCircuit
                                          ).maxPower
                                        : "dataMax",
                                ]}
                                allowDataOverflow
                            />

                            <Legend
                                onClick={(item) => {
                                    console.debug(item);
                                    set_selectedCircuit(item.value);
                                }}
                                formatter={(value) => {
                                    console.debug(value);
                                    if (value === selectedCircuit) {
                                        return <b>{value}</b>;
                                    }
                                    return value;
                                }}
                            />
                            {powerData.circuits
                                .filter(
                                    (c) =>
                                        c.maxPower > minPower && c.IsMain === 0
                                )
                                .map((circuit) => {
                                    return (
                                        <Line
                                            type="monotone"
                                            dataKey={circuit.Name}
                                            stroke={
                                                !selectedCircuit ||
                                                circuit.Name === selectedCircuit
                                                    ? circuit.color
                                                    : "lightgrey"
                                            }
                                            strokeWidth={
                                                circuit.Name === selectedCircuit
                                                    ? 3
                                                    : 1
                                            }
                                            dot={false}
                                            onClick={(e) =>
                                                console.debug(e, circuit.Name)
                                            }
                                        />
                                    );
                                })}
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Grid>
        </Grid>
    );
}

export default PowerCharts;
