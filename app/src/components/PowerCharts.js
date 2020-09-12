import React, { useState, useCallback, useContext, useEffect } from "react";
import appContext from "../context/appContext";
import debounce from "lodash/debounce";

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
import { Box, Grid, RangeSelector } from "grommet";

const minPower = 5;

function PowerCharts() {
    const { powerData } = useContext(appContext);
    const [selectedCircuit, set_selectedCircuit] = useState(null);
    const [chartRange, set_chartRange] = useState(null);
    const [zoomRange, set_zoomRange] = useState(null);
    const [sliderRange, set_sliderRange] = useState(null);
    const [ticks, set_ticks] = useState([]);

    useEffect(() => {
        if (!powerData) return;
        const startTime = moment(powerData.data[0].time);
        const endTime = moment(powerData.data[powerData.data.length - 1].time);
        set_chartRange([startTime, endTime]);
        set_zoomRange([startTime.valueOf(), endTime.valueOf()]);
        set_sliderRange([startTime.valueOf(), endTime.valueOf()]);
    }, [powerData]);

    useEffect(() => {
        if (!powerData) return;
        let ticks = [chartRange[0].clone().endOf("hour")];
        while (true) {
            const previousTick = ticks[ticks.length - 1];
            const nextTick = previousTick.clone().add(1, "hours");
            if (nextTick.diff(chartRange[1]) < 0) {
                ticks.push(nextTick);
            } else {
                break;
            }
        }
        set_ticks(ticks.map((tick) => tick.valueOf()));
    }, [zoomRange]);

    const debouncedSetZoomRange = useCallback(
        debounce((nextValue) => set_zoomRange(nextValue), 100),
        [] // will be created only once initially
    );

    if (!powerData || !zoomRange) return null;

    return (
        <Grid fill rows={["5fr", "1fr"]}>
            <Grid fill rows={["2fr", "3fr"]}>
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
                                domain={zoomRange}
                                tickFormatter={(time) =>
                                    moment(time).format("ha")
                                }
                                ticks={ticks}
                                allowDataOverflow
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
                                domain={zoomRange}
                                tickFormatter={(time) =>
                                    moment(time).format("ha")
                                }
                                ticks={ticks}
                                allowDataOverflow
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
            <Box margin="10px">
                <RangeSelector
                    direction="horizontal"
                    invert={false}
                    min={chartRange[0].valueOf()}
                    max={chartRange[1].valueOf()}
                    size="full"
                    round="small"
                    values={sliderRange}
                    onChange={(values) => {
                        debouncedSetZoomRange(values);
                        set_sliderRange(values);
                    }}
                    height="50px"
                />
            </Box>
        </Grid>
    );
}

export default PowerCharts;
