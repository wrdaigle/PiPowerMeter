import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import moment from 'moment'
import "./App.css";

Date.prototype.addHours = function (h) {
  this.setTime(this.getTime() + h * 60 * 60 * 1000);
  return this;
};
const endTime = new Date();
const startTime = new Date();
startTime.addHours(-12);
console.debug(startTime.getTime().toString(),endTime.getTime().toString())

function App() {
  const [data, set_data] = useState(null);

  useEffect(() => {
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
              startTime.getTime().toString() +
              "&end=" +
              endTime.getTime().toString() +
              "&groupBy=None&offset=-06:00"
          );
        });
        Promise.all(allPromises).then((results) => {
          const allPromises2 = results.map((result) => {
            return result.json();
          });
          Promise.all(allPromises2).then((results2) => {
            console.debug(results2);
            const out = results2[0].ts.map((item) => {
              let t = {};
              circuits.forEach((c) => {
                t.time = item;
              });
              return t;
            });
            out.forEach((rec, rec_i) => {
              circuits.forEach((circuit, circuit_i) => {
                rec[circuit.Name] = results2[circuit_i].P[rec_i];
              });
            });
            console.debug(out);
            set_data({ circuits: circuits, data: out });
          });
        });
      });
  }, []);

  if (!data) return null;
  return (
    <LineChart
      width={1200}
      height={1000}
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
        domain={["auto", "auto"]}
        tickFormatter={timeStr => moment(timeStr).format('HH:mm')}
      />
      <YAxis />

      <Legend />
      {data.circuits.map((circuit) => {
        return (
          <Line
            type="monotone"
            dataKey={circuit.Name}
            stroke={"#" + Math.floor(Math.random() * 16777215).toString(16)}
            dot={false}
            onClick={(e) => console.debug(e,circuit.Name)}
          />
        );
      })}
      {/* <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" /> */}
    </LineChart>
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
