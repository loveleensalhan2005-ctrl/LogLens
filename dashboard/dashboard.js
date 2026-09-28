let attackChart = null;
let currentJobId = null;
let attackMap = null;


// =============================
// DISPLAY RESULTS
// =============================

function displayResults(data) {

    document.getElementById("totalRequests").textContent =
        data.totalRequests;

    document.getElementById("totalAttacks").textContent =
        data.totalAttacks;

    document.getElementById("topAttacker").textContent =
        data.topAttacker;

    createAttackersTable(
        data.attackers
    );

    createAttackChart(
        data.attacksPerHour
    );

    createGeoMap(
        data.attackers
    );

    document.getElementById(
        "exportButton"
    ).disabled = false;
}


// =============================
// LOAD DEMO LOG
// =============================

async function loadDemoLog() {

    const status =
        document.getElementById(
            "uploadStatus"
        );

    try {

        status.textContent =
            "Starting demo analysis...";

        document.getElementById(
            "exportButton"
        ).disabled = true;

        const response =
            await fetch(
                "/api/demo"
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Non-JSON demo response:",
                text
            );

            throw new Error(
                "Server returned an HTML/error page instead of JSON."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to start demo analysis."
            );
        }

        if (data.jobId) {

            currentJobId =
                data.jobId;

            status.textContent =
                "Demo job queued. Job ID: " +
                currentJobId;

            pollJobStatus(
                currentJobId
            );

            return;
        }

        // Fallback if server directly returns results
        displayResults(data);

        status.textContent =
            "Demo log analyzed successfully.";

    } catch (error) {

        console.error(
            "Demo Error:",
            error
        );

        status.textContent =
            "Unable to load demo log: " +
            error.message;
    }
}


// =============================
// UPLOAD LOG FILE
// =============================

async function uploadLogFile() {

    const fileInput =
        document.getElementById(
            "logFile"
        );

    const status =
        document.getElementById(
            "uploadStatus"
        );

    if (!fileInput.files.length) {

        status.textContent =
            "Please select a .log file first.";

        return;
    }

    const file =
        fileInput.files[0];

    if (
        !file.name
            .toLowerCase()
            .endsWith(".log")
    ) {

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

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Non-JSON server response:",
                text
            );

            throw new Error(
                "Server returned an HTML/error page instead of JSON."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Upload failed."
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

    } catch (error) {

        console.error(
            "Upload Error:",
            error
        );

        status.textContent =
            "Upload Error: " +
            error.message;
    }
}


// =============================
// POLL JOB STATUS
// =============================

async function pollJobStatus(
    jobId
) {

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

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Non-JSON job response:",
                text
            );

            throw new Error(
                "Server returned an HTML/error page."
            );
        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to check job status."
            );
        }


        // -------------------------
        // QUEUED / PROCESSING
        // -------------------------

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


        // -------------------------
        // COMPLETED
        // -------------------------

        if (
            data.status === "completed"
        ) {

            currentJobId =
                jobId;

            status.textContent =
                "Log analyzed successfully.";

            displayResults(
                data.result
            );

            return;
        }


        // -------------------------
        // FAILED
        // -------------------------

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

    } catch (error) {

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

            table.appendChild(
                row
            );
        }
    );

    container.appendChild(
        table
    );
}


// =============================
// ATTACK TIMELINE CHART
// =============================

function createAttackChart(
    attackData
) {

    const canvas =
        document.getElementById(
            "attackChart"
        );

    if (
        !canvas ||
        !attackData
    ) {

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
// GEOIP ATTACK MAP
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

    if (
        !container ||
        !mapElement
    ) {

        return;
    }

    if (attackMap) {

        attackMap.remove();

        attackMap = null;
    }

    attackMap =
        L.map(
            "attackMap"
        ).setView(
            [20, 0],
            2
        );

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
            .setLatLng(
                [20, 0]
            )
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

            if (
                !attacker.countryCode
            ) {

                privateIpCount++;
            }
        }
    );


    if (
        privateIpCount > 0
    ) {

        L.popup()
            .setLatLng(
                [20, 0]
            )
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