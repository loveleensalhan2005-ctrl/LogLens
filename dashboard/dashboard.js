let attackChart = null;
let currentJobId = null;
let attackMap = null;


// =============================
// SHOW FINAL ANALYSIS RESULT
// =============================

function displayResults(data) {

    document.getElementById("totalRequests").textContent =
        data.totalRequests;

    document.getElementById("totalAttacks").textContent =
        data.totalAttacks;

    document.getElementById("topAttacker").textContent =
        data.topAttacker;

    createAttackersTable(data.attackers);

    createAttackChart(data.attacksPerHour);

    createGeoMap(data.attackers);

    document.getElementById(
        "exportButton"
    ).disabled = false;
}


// =============================
// LOAD DEMO LOG
// =============================

async function loadDemoLog() {

    try {

        const response =
            await fetch("/api/demo");

        if (!response.ok) {

            throw new Error(
                "Failed to load demo log"
            );
        }

        const data =
            await response.json();

        displayResults(data);

        document.getElementById(
            "uploadStatus"
        ).textContent =
            "Demo log analyzed successfully.";

    }

    catch (error) {

        console.error(
            "LogLens Error:",
            error
        );

        document.getElementById(
            "uploadStatus"
        ).textContent =
            "Unable to load demo log.";
    }
}


// =============================
// UPLOAD LOG FILE
// =============================

async function uploadLogFile() {

    const fileInput =
        document.getElementById("logFile");

    const status =
        document.getElementById("uploadStatus");


    if (!fileInput.files.length) {

        status.textContent =
            "Please select a .log file first.";

        return;
    }


    const file =
        fileInput.files[0];


    if (!file.name.toLowerCase().endsWith(".log")) {

        status.textContent =
            "Only .log files are allowed.";

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    status.textContent =
        "Uploading log file...";


    document.getElementById(
        "exportButton"
    ).disabled = true;


    try {

        const response =
            await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Upload failed"
            );
        }


        if (data.jobId) {

            currentJobId =
                data.jobId;

            status.textContent =
                "Job queued. Job ID: " +
                currentJobId;

            pollJobStatus(
                currentJobId
            );

            return;
        }


        displayResults(data);

        status.textContent =
            "File analyzed successfully.";

    }

    catch (error) {

        console.error(
            "Upload Error:",
            error
        );

        status.textContent =
            "Error: " +
            error.message;
    }
}


// =============================
// CHECK JOB STATUS
// =============================

async function pollJobStatus(jobId) {

    const status =
        document.getElementById(
            "uploadStatus"
        );


    try {

        const response =
            await fetch(
                "/api/job/" +
                jobId
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to check job status"
            );
        }


        if (
            data.status === "queued" ||
            data.status === "processing"
        ) {

            status.textContent =
                "Job " +
                data.status +
                "...";

            setTimeout(
                function () {

                    pollJobStatus(
                        jobId
                    );

                },
                1000
            );

            return;
        }


        if (
            data.status === "completed"
        ) {

            currentJobId =
                jobId;

            status.textContent =
                "File analyzed successfully.";

            displayResults(
                data.result
            );

            return;
        }


        if (
            data.status === "failed"
        ) {

            status.textContent =
                "Job failed: " +
                data.error;

            document.getElementById(
                "exportButton"
            ).disabled = true;

            return;
        }

    }

    catch (error) {

        console.error(
            "Job Status Error:",
            error
        );

        status.textContent =
            "Error checking job status: " +
            error.message;
    }
}


// =============================
// EXPORT REPORT
// =============================

function exportReport() {

    if (!currentJobId) {

        document.getElementById(
            "uploadStatus"
        ).textContent =
            "Please upload and analyze a log file first.";

        return;
    }


    window.location.href =
        "/api/export/" +
        currentJobId;
}


// =============================
// TOP ATTACKERS TABLE
// =============================

function createAttackersTable(
    attackers
) {

    const container =
        document.getElementById(
            "topAttackers"
        );


    container.innerHTML = "";


    if (
        !attackers ||
        attackers.length === 0
    ) {

        container.innerHTML =
            "<p>No attacks detected.</p>";

        return;
    }


    const table =
        document.createElement(
            "table"
        );


    table.style.width =
        "100%";

    table.style.borderCollapse =
        "collapse";


    table.innerHTML = `

        <tr>

            <th style="text-align:left; padding:10px;">
                IP Address
            </th>

            <th style="text-align:left; padding:10px;">
                Attacks
            </th>

            <th style="text-align:left; padding:10px;">
                Attack Type
            </th>

            <th style="text-align:left; padding:10px;">
                Country
            </th>

        </tr>

    `;


    attackers.forEach(
        attacker => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td style="padding:10px;">
                    ${attacker.ip}
                </td>

                <td style="padding:10px;">
                    ${attacker.attacks}
                </td>

                <td style="padding:10px;">
                    ${attacker.type}
                </td>

                <td style="padding:10px;">
                    ${
                        attacker.country ||
                        "Private/Unknown"
                    }
                </td>

            `;


            table.appendChild(row);

        }
    );


    container.appendChild(table);
}


// =============================
// ATTACKS PER HOUR CHART
// =============================

function createAttackChart(
    attackData
) {

    const canvas =
        document.getElementById(
            "attackChart"
        );


    if (!canvas || !attackData) {
        return;
    }


    if (attackChart) {

        attackChart.destroy();

    }


    attackChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels:
                        attackData.labels,

                    datasets: [

                        {

                            label:
                                "Attacks per Hour",

                            data:
                                attackData.values,

                            tension:
                                0.3,

                            fill:
                                false

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                stepSize:
                                    1

                            }

                        }

                    }

                }

            }
        );
}


// =============================
// GEO MAP
// =============================

function createGeoMap(
    attackers
) {

    const container =
        document.getElementById(
            "geoMap"
        );

    const mapElement =
        document.getElementById(
            "attackMap"
        );


    if (!container || !mapElement) {
        return;
    }


    // Remove previous map
    if (attackMap) {

        attackMap.remove();

        attackMap = null;
    }


    // Create Leaflet map
    attackMap =
        L.map(
            "attackMap"
        ).setView(
            [20, 0],
            2
        );


    // OpenStreetMap tiles
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(
        attackMap
    );


    if (
        !attackers ||
        attackers.length === 0
    ) {

        L.popup()
            .setLatLng([20, 0])
            .setContent(
                "No attacking IP addresses detected."
            )
            .openOn(
                attackMap
            );

        return;
    }


    let privateIpCount = 0;


    attackers.forEach(
        attacker => {

            /*
             * Private IP addresses such as
             * 192.168.x.x do not have a
             * public geographic location.
             */

            if (
                !attacker.countryCode
            ) {

                privateIpCount++;

                return;
            }

            /*
             * Country coordinates are not
             * currently supplied by the backend.
             * Therefore no fake location is shown.
             */

        }
    );


    // Informative map message
    if (privateIpCount > 0) {

        L.popup()
            .setLatLng([20, 0])
            .setContent(
                "<strong>GeoIP Information</strong><br>" +
                privateIpCount +
                " private/local IP address(es) " +
                "cannot be assigned a public geographic location."
            )
            .openOn(
                attackMap
            );
    }
}