import React, { useEffect, useState } from "react";
import {
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
import { Grommet, Box, Grid, TextInput } from "grommet";

import "./App.css";

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
const endTimeUTC = moment();
const startTimeUTC = moment().subtract(12, "hours");


function App() {
  const [data, set_data] = useState(null);
  const [minTickGap, set_minTickGap] = useState(1000);

  useEffect(() => {
    if (data) return;
    fetch("/config")
      .then((response) => {
        return response.json();
      })
      .then((configJson) => {
        const circuits = configJson.Circuits;
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

  return (
    <Grommet full>
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
              tickFormatter={(time) => moment(time).format("HH:mm")}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tick) =>
                startTime.clone().startOf("hour").add(tick, "hours").valueOf()
              )}
            />
            <YAxis />

            <Legend />
            {data.circuits.map((circuit) => {
              return (
                <Line
                  type="monotone"
                  dataKey={circuit.Name}
                  stroke={
                    "#" + Math.floor(Math.random() * 16777215).toString(16)
                  }
                  dot={false}
                  onClick={(e) => console.debug(e, circuit.Name)}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Grommet>
  );
}

// function getData(flavor, params) {
//     let url = getLambdaEndpoint() + "?flavor=" + flavor;
//     return new Promise(function(resolve, reject) {
//         fetch(url, {
//             method: "post",
//             body: JSON.stringify(params)
//         })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.message || data.message == "Internal server error") {
//                     try {
//                         throw new Error("Error running lambda("+flavor+").");
//                     } catch (e) {
//                         console.error(e.name + ": " + e.message);
//                         reject(Error(e.name + ": " + e.message));
//                     }
//                 }
//                 else {
//                     resolve(data.data);
//                 }
//             })
//             .catch(error => {
//                 try {
//                     throw new Error("Error running lambda("+flavor+").");
//                 } catch (e) {
//                     console.error(e.name + ": " + e.message);
//                     reject(Error(e.name + ": " + e.message));
//                 }
//             });;
//     });
// }

export default App;
