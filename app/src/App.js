import React, { useEffect, useState } from "react";
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
import { Grommet, Box, Grid, Select } from "grommet";

import "./App.css";

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
const endTimeUTC = moment();
const startTimeUTC = moment().subtract(12, "hours");

const minPower = 5;

function App() {
  const [data, set_data] = useState(null);
  const [selectedCircuit, set_selectedCircuit] = useState(null);

  useEffect(() => {
    if (data) return;
    fetch("/config")
      .then((response) => {
        return response.json();
      })
      .then((configJson) => {
        let circuits = configJson.Circuits;
        circuits.forEach((c) => {
          c.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
        });
        const allPromises = circuits.map((circuit) => {
          return fetch(
            "/power?circuitId=" +
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
                c.P = c.P.map(rec=>Math.abs(rec))
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
                rec[circuit.Name] = results2[circuit_i].P[rec_i];
              });
            });
            set_data({ circuits: circuits, data: out });
          });
        });
      });
  }, []);

  if (!data) return null;

  const startTime = moment(data.data[0].time);
  const endTime = moment(data.data[data.data.length - 1].time);
  const ticks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tick) =>
    startTime.clone().startOf("hour").add(tick, "hours").valueOf()
  );
  
  return (
    <Grommet full>
      <Grid fill rows={["1/2", "1//2"]}>
        <Box fill>
          <ResponsiveContainer>
            <AreaChart
              data={data.data}
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
                domain={[startTime.valueOf(), endTime.valueOf()]}
                tickFormatter={(time) => moment(time).format("ha")}
                ticks={ticks}
              />
              <YAxis />
              {data.circuits
                .filter((c) => c.IsMain === 1)
                .map((circuit) => {
                  return (
                    <Area type="monotone" dataKey={circuit.Name} dot={false} />
                  );
                })}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
        <Box fill>
          <ResponsiveContainer>
            <LineChart
              data={data.data}
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
                domain={[startTime.valueOf(), endTime.valueOf()]}
                tickFormatter={(time) => moment(time).format("ha")}
                ticks={ticks}
              />
              <YAxis
                type="number"
                domain={[
                  'dataMin',
                  selectedCircuit
                    ? data.circuits.find(
                        (circuit) => circuit.Name === selectedCircuit
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
                formatter={(value)=> {
                    console.debug(value)
                  if (value===selectedCircuit){
                      return <b>{value}</b>
                  }
                  return value;
                }}
              />
              {data.circuits
                .filter((c) => c.maxPower > minPower && c.IsMain === 0)
                .map((circuit) => {
                  return (
                    <Line
                      type="monotone"
                      dataKey={circuit.Name}
                      stroke={!selectedCircuit || circuit.Name === selectedCircuit ? circuit.color : 'lightgrey'}
                      strokeWidth={circuit.Name === selectedCircuit ? 3 : 1}
                      dot={false}
                      onClick={(e) => console.debug(e, circuit.Name)}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Grid>
    </Grommet>
  );
}

export default App;
