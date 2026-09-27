import { useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";


const API_URL = "http://127.0.0.1:5000";


function App() {

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [uploading, setUploading] = useState(false);


  // =============================
  // LOAD DEMO
  // =============================

  const loadDemo = async () => {

    try {

      setStatus("Loading demo log...");

      const response = await fetch(
        `${API_URL}/api/demo`
      );

      if (!response.ok) {
        throw new Error("Failed to load demo log");
      }

      const result = await response.json();

      setData(result);

      setJobId(null);

      setStatus(
        "Demo log analyzed successfully."
      );

    } catch (error) {

      setStatus(
        "Error: " + error.message
      );

    }

  };


  // =============================
  // FILE SELECT
  // =============================

  const handleFileChange = (event) => {

    const selectedFile =
      event.target.files[0];

    if (!selectedFile) {

      setFile(null);

      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".log")
    ) {

      setStatus(
        "Only .log files are allowed."
      );

      setFile(null);

      return;
    }

    setFile(selectedFile);

    setStatus(
      "File selected: " +
      selectedFile.name
    );

  };


  // =============================
  // UPLOAD LOG
  // =============================

  const uploadLog = async () => {

    if (!file) {

      setStatus(
        "Please select a .log file first."
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    try {

      setUploading(true);

      setData(null);

      setStatus(
        "Uploading log file..."
      );

      const response =
        await fetch(
          `${API_URL}/api/upload`,
          {
            method: "POST",
            body: formData
          }
        );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.message ||
          "Upload failed"
        );

      }

      if (result.jobId) {

        setJobId(
          result.jobId
        );

        setStatus(
          "Job queued. Checking status..."
        );

        checkJobStatus(
          result.jobId
        );

      }

    } catch (error) {

      setStatus(
        "Upload error: " +
        error.message
      );

      setUploading(false);

    }

  };


  // =============================
  // JOB STATUS
  // =============================

  const checkJobStatus = async (
    currentJobId
  ) => {

    try {

      const response =
        await fetch(
          `${API_URL}/api/job/${currentJobId}`
        );

      const result =
        await response.json();

      if (!response.ok) {

        throw new Error(
          result.message ||
          "Unable to check job status"
        );

      }

      if (
        result.status === "queued" ||
        result.status === "processing"
      ) {

        setStatus(
          "Job " +
          result.status +
          "..."
        );

        setTimeout(
          () => {
            checkJobStatus(
              currentJobId
            );
          },
          1000
        );

        return;
      }

      if (
        result.status === "completed"
      ) {

        setData(
          result.result
        );

        setStatus(
          "File analyzed successfully."
        );

        setUploading(false);

        return;
      }

      if (
        result.status === "failed"
      ) {

        setStatus(
          "Job failed: " +
          result.error
        );

        setUploading(false);

      }

    } catch (error) {

      setStatus(
        "Status error: " +
        error.message
      );

      setUploading(false);

    }

  };


  // =============================
  // EXPORT REPORT
  // =============================

  const exportReport = () => {

    if (!jobId) {

      setStatus(
        "Upload and analyze a log file first."
      );

      return;
    }

    window.open(
      `${API_URL}/api/export/${jobId}`,
      "_blank"
    );

  };


  // =============================
  // CHART DATA
  // =============================

  const chartData =
    data
      ? data.attacksPerHour.labels.map(
          (hour, index) => ({
            hour: hour,
            attacks:
              data.attacksPerHour.values[index]
          })
        )
      : [];


  // =============================
  // MAP DATA
  // =============================

  const publicAttackers =
    data &&
    data.attackers
      ? data.attackers.filter(
          (attacker) =>
            attacker.countryCode
        )
      : [];


  return (

    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <h1>
          LogLens
        </h1>

        <p>
          Security Log Analysis Dashboard
        </p>

      </header>


      <main style={styles.container}>


        {/* CONTROLS */}

        <section style={styles.controls}>

          <h2>
            Log File Analysis
          </h2>

          <button
            onClick={loadDemo}
            style={styles.demoButton}
          >
            Load Demo Log
          </button>


          <div style={styles.uploadArea}>

            <input
              type="file"
              accept=".log"
              onChange={
                handleFileChange
              }
            />

            <button
              onClick={uploadLog}
              disabled={uploading}
              style={styles.uploadButton}
            >
              {uploading
                ? "Analyzing..."
                : "Upload & Analyze Log"}
            </button>


            <button
              onClick={exportReport}
              disabled={!jobId}
              style={styles.exportButton}
            >
              Export Report
            </button>

          </div>


          <p style={styles.status}>
            {status}
          </p>


          {jobId && (

            <p style={styles.jobId}>
              Job ID: {jobId}
            </p>

          )}

        </section>



        {/* SUMMARY CARDS */}

        <div style={styles.cards}>

          <div style={styles.card}>

            <h3>
              Total Requests
            </h3>

            <strong>
              {data
                ? data.totalRequests
                : 0}
            </strong>

          </div>


          <div style={styles.card}>

            <h3>
              Total Attacks
            </h3>

            <strong>
              {data
                ? data.totalAttacks
                : 0}
            </strong>

          </div>


          <div style={styles.card}>

            <h3>
              Top Attacker
            </h3>

            <strong>
              {data
                ? data.topAttacker
                : "-"}
            </strong>

          </div>

        </div>



        {/* ATTACK TIMELINE */}

        <section style={styles.section}>

          <h2>
            Attacks per Hour
          </h2>


          {data ? (

            <ResponsiveContainer
              width="100%"
              height={350}
            >

              <LineChart
                data={chartData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="hour"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="attacks"
                  stroke="#2563eb"
                  strokeWidth={3}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <p>
              Load or upload a log file
              to view the attack timeline.
            </p>

          )}

        </section>



        {/* TOP ATTACKERS */}

        <section style={styles.section}>

          <h2>
            Top Attackers
          </h2>


          {data &&
          data.attackers &&
          data.attackers.length > 0 ? (

            <table style={styles.table}>

              <thead>

                <tr>

                  <th style={styles.th}>
                    IP Address
                  </th>

                  <th style={styles.th}>
                    Attacks
                  </th>

                  <th style={styles.th}>
                    Attack Type
                  </th>

                  <th style={styles.th}>
                    Country
                  </th>

                </tr>

              </thead>


              <tbody>

                {data.attackers.map(
                  (attacker, index) => (

                    <tr key={index}>

                      <td style={styles.td}>
                        {attacker.ip}
                      </td>

                      <td style={styles.td}>
                        {attacker.attacks}
                      </td>

                      <td style={styles.td}>
                        {attacker.type}
                      </td>

                      <td style={styles.td}>
                        {attacker.country ||
                          "Private/Unknown"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          ) : (

            <p>
              No attack data available.
            </p>

          )}

        </section>



        {/* GEOIP MAP */}

        <section style={styles.section}>

          <h2>
            GeoIP Attack Map
          </h2>

          <p style={styles.mapNote}>

            Public IP locations are displayed
            when GeoIP information is available.
            Private/local IP addresses are shown
            as Private/Unknown.

          </p>


          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={styles.map}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            {publicAttackers.map(
              (attacker, index) => (

                <CircleMarker
                  key={index}
                  center={[
                    20,
                    index * 20
                  ]}
                  radius={8}
                >

                  <Popup>

                    <strong>
                      IP Address:
                    </strong>{" "}
                    {attacker.ip}

                    <br />

                    <strong>
                      Country:
                    </strong>{" "}
                    {attacker.country}

                    <br />

                    <strong>
                      Attacks:
                    </strong>{" "}
                    {attacker.attacks}

                  </Popup>

                </CircleMarker>

              )
            )}

          </MapContainer>


          {data &&
          publicAttackers.length === 0 && (

            <p style={styles.noMapData}>

              No public IP GeoIP coordinates are
              available in the current demo log.

            </p>

          )}

        </section>


      </main>

    </div>

  );

}


// =============================
// STYLES
// =============================

const styles = {

  page: {

    minHeight: "100vh",

    background:
      "#f4f6f8",

    color:
      "#222",

    fontFamily:
      "Arial, sans-serif"

  },


  header: {

    background:
      "#1f2937",

    color:
      "white",

    padding:
      "25px"

  },


  container: {

    padding:
      "25px",

    maxWidth:
      "1200px",

    margin:
      "auto"

  },


  controls: {

    background:
      "white",

    padding:
      "20px",

    borderRadius:
      "10px",

    marginBottom:
      "25px",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)"

  },


  uploadArea: {

    marginTop:
      "15px"

  },


  demoButton: {

    padding:
      "10px 18px",

    border:
      "none",

    borderRadius:
      "6px",

    cursor:
      "pointer",

    background:
      "#2563eb",

    color:
      "white",

    marginRight:
      "10px"

  },


  uploadButton: {

    padding:
      "10px 18px",

    border:
      "none",

    borderRadius:
      "6px",

    cursor:
      "pointer",

    background:
      "#2563eb",

    color:
      "white",

    marginLeft:
      "10px"

  },


  exportButton: {

    padding:
      "10px 18px",

    border:
      "none",

    borderRadius:
      "6px",

    cursor:
      "pointer",

    background:
      "#16a34a",

    color:
      "white",

    marginLeft:
      "10px"

  },


  status: {

    marginTop:
      "15px",

    fontWeight:
      "bold"

  },


  jobId: {

    fontSize:
      "13px",

    color:
      "#555"

  },


  cards: {

    display:
      "flex",

    gap:
      "20px",

    flexWrap:
      "wrap"

  },


  card: {

    background:
      "white",

    padding:
      "20px",

    borderRadius:
      "10px",

    minWidth:
      "200px",

    flex:
      "1",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)"

  },


  section: {

    background:
      "white",

    marginTop:
      "25px",

    padding:
      "20px",

    borderRadius:
      "10px",

    boxShadow:
      "0 2px 8px rgba(0,0,0,0.08)"

  },


  table: {

    width:
      "100%",

    borderCollapse:
      "collapse"

  },


  th: {

    textAlign:
      "left",

    padding:
      "10px",

    borderBottom:
      "2px solid #ddd"

  },


  td: {

    padding:
      "10px",

    borderBottom:
      "1px solid #eee"

  },


  map: {

    height:
      "450px",

    width:
      "100%",

    borderRadius:
      "10px",

    marginTop:
      "15px"

  },


  mapNote: {

    color:
      "#555",

    fontSize:
      "14px"

  },


  noMapData: {

    marginTop:
      "15px",

    color:
      "#666",

    fontStyle:
      "italic"

  }

};


export default App;