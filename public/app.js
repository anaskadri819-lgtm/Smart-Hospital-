const registerButton = document.getElementById("registerButton");
const registerScreen = document.getElementById("registerScreen");
const registerForm = document.getElementById("registerForm");
const registerBackButton = document.getElementById("registerBackButton");
const registerMessage = document.getElementById("registerMessage");
// Patient Dashboard elements
const patientDashboard = document.getElementById("patientDashboard");
const patientName = document.getElementById("patientName");
const logoutButton = document.getElementById("logoutButton");
// Appointment Screen elements
const appointmentScreen = document.getElementById("appointmentScreen");
const appointmentForm = document.getElementById("appointmentForm");
const appointmentBackButton = document.getElementById("appointmentBackButton");
const appointmentMessage = document.getElementById("appointmentMessage");
const doctorSelect = document.getElementById("doctorSelect");
const appointmentDate = document.getElementById("appointmentDate");
const appointmentTime = document.getElementById("appointmentTime");

const bookAppointmentButton = document.getElementById("bookAppointmentButton");
const roleScreen = document.getElementById("roleScreen");
const loginScreen = document.getElementById("loginScreen");
const loginTitle = document.getElementById("loginTitle");
const loginForm = document.getElementById("loginForm");
const backButton = document.getElementById("backButton");
const message = document.getElementById("message");

let selectedRole = "";
let loggedInUser = null;
document.querySelectorAll(".role-card").forEach(function (button) {
    button.addEventListener("click", function () {
        selectedRole = button.dataset.role;

        loginTitle.textContent =
            selectedRole.charAt(0).toUpperCase() +
            selectedRole.slice(1) +
            " Login";

        roleScreen.hidden = true;
        loginScreen.hidden = false;
        message.textContent = "";
        registerButton.hidden = selectedRole !== "patient";
    });
});

backButton.addEventListener("click", function () {
    loginScreen.hidden = true;
    roleScreen.hidden = false;
    loginForm.reset();
    message.textContent = "";
});

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Please wait...";
    message.style.color = "#64748b";

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password,
                role: selectedRole
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.message || "Login failed.";
            message.style.color = "#dc2626";
            return;
        }

       if (data.user.role === "patient") {
        loggedInUser = {
    ...data.user,
    userId: data.user.userId || data.user.user_id
};
    patientName.textContent = data.user.name;

    roleScreen.hidden = true;
    loginScreen.hidden = true;
    registerScreen.hidden = true;
    patientDashboard.hidden = false;
} 
else if (data.user.role === "doctor") {
loggedInUser = {
...data.user,
userId: data.user.userId || data.user.user_id
};

document.getElementById("doctorName").textContent = data.user.name;

roleScreen.hidden = true;
loginScreen.hidden = true;
registerScreen.hidden = true;
patientDashboard.hidden = true;
document.getElementById("doctorDashboard").hidden = false;

}

else if (data.user.role === "admin") {

    loggedInUser = {
        ...data.user,
        userId: data.user.userId || data.user.user_id
    };

    document.getElementById("adminName").textContent = data.user.name;

    roleScreen.hidden = true;
    loginScreen.hidden = true;
    registerScreen.hidden = true;
    patientDashboard.hidden = true;
    document.getElementById("doctorDashboard").hidden = true;
    document.getElementById("adminDashboard").hidden = false;
    loadAdminStats();
}
    } catch (error) {
        message.textContent =
            "Server se connection nahi ho raha. Please try again.";

        message.style.color = "#dc2626";
    }
});
// Open registration form
registerButton.addEventListener("click", function () {
    loginScreen.hidden = true;
    registerScreen.hidden = false;

    registerMessage.textContent = "";
    registerForm.reset();
});

// Return to login screen
registerBackButton.addEventListener("click", function () {
    registerScreen.hidden = true;
    loginScreen.hidden = false;

    registerForm.reset();
    registerMessage.textContent = "";
});
// Register a new user
registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    registerMessage.textContent = "Creating account...";
    registerMessage.style.color = "#64748b";

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password,
                role: selectedRole
            })
        });

        const data = await response.json();

        if (!response.ok) {
            registerMessage.textContent =
                data.message || "Registration failed.";
            registerMessage.style.color = "#dc2626";
            return;
        }

        registerMessage.textContent =
            "Account created successfully! You can now log in.";
        registerMessage.style.color = "#15803d";

        registerForm.reset();

    } catch (error) {
        registerMessage.textContent =
            "Server connection failed. Please try again.";
        registerMessage.style.color = "#dc2626";
    }
});
// Patient Logout
logoutButton.addEventListener("click", function () {
patientDashboard.hidden = true;
roleScreen.hidden = false;
loginScreen.hidden = true;
registerScreen.hidden = true;

loginForm.reset();
registerForm.reset();

message.textContent = "";
registerMessage.textContent = "";

});
// Open Appointment Screen
bookAppointmentButton.addEventListener("click", function () {
    patientDashboard.hidden = true;
    appointmentScreen.hidden = false;

    appointmentMessage.textContent = "";
    appointmentForm.reset();
});

// Return to Patient Dashboard
appointmentBackButton.addEventListener("click", function () {
    appointmentScreen.hidden = true;
    patientDashboard.hidden = false;

    appointmentMessage.textContent = "";
});
// Load registered doctors
async function loadDoctors() {
    try {
        const response = await fetch("/api/doctors");
        const doctors = await response.json();

        doctorSelect.innerHTML = '<option value="">Select a doctor</option>';

        doctors.forEach(function (doctor) {
            const option = document.createElement("option");
            option.value = doctor.user_id;
            option.textContent = doctor.name;
            doctorSelect.appendChild(option);
        });
    } catch (error) {
        appointmentMessage.textContent = "Could not load doctors.";
        appointmentMessage.style.color = "#dc2626";
    }
}

// Load doctors when opening appointment screen
bookAppointmentButton.addEventListener("click", loadDoctors);

// Submit appointment form
appointmentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!loggedInUser || !loggedInUser.userId) {
        appointmentMessage.textContent = "Please log in again.";
        appointmentMessage.style.color = "#dc2626";
        return;
    }

    const doctorId = doctorSelect.value;
    const date = appointmentDate.value;
    const time = appointmentTime.value;

    if (!doctorId || !date || !time) {
        appointmentMessage.textContent = "Please fill all fields.";
        appointmentMessage.style.color = "#dc2626";
        return;
    }

    try {
        const response = await fetch("/api/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                patient_id: loggedInUser.userId,
                doctor_id: Number(doctorId),
                appointment_date: date,
                appointment_time: time
            })
        });

        const data = await response.json();

        if (!response.ok) {
            appointmentMessage.textContent =
                data.message || "Appointment booking failed.";
            appointmentMessage.style.color = "#dc2626";
            return;
        }

        appointmentMessage.textContent =
            "Appointment booked successfully!";
        appointmentMessage.style.color = "#15803d";

        appointmentForm.reset();
        loadDoctors();

    } catch (error) {
        appointmentMessage.textContent =
            "Server connection failed. Please try again.";
        appointmentMessage.style.color = "#dc2626";
    }
});

const myAppointmentsButton = document.getElementById("myAppointmentsButton");
const myAppointmentsScreen = document.getElementById("myAppointmentsScreen");
const appointmentsList = document.getElementById("appointmentsList");
const appointmentsBackButton = document.getElementById("appointmentsBackButton");

myAppointmentsButton.addEventListener("click", async function () {
if (!loggedInUser || !loggedInUser.userId) {
alert("Please log in again.");
return;
}


patientDashboard.hidden = true;
myAppointmentsScreen.hidden = false;
appointmentsList.textContent = "Loading appointments...";

try {
    const response = await fetch(
        "/api/appointments/" + loggedInUser.userId
    );

    const appointments = await response.json();

console.log("Appointments response:", appointments);

if (!response.ok) {
    appointmentsList.textContent =
        "Could not load appointments.";
    return;
}

if (!Array.isArray(appointments)) {
    appointmentsList.textContent =
        "Invalid appointments data received.";
    return;
}

    if (appointments.length === 0) {
        appointmentsList.textContent =
            "You have no appointments yet.";
        return;
    }

    appointmentsList.replaceChildren();

    appointments.forEach(function (appointment) {
        const card = document.createElement("div");
        card.className = "dashboard-card";

        const heading = document.createElement("h3");
        heading.textContent = "Appointment #" +
            appointment.appointment_id;

        const doctor = document.createElement("p");
        doctor.textContent = "Doctor: " + appointment.doctor_name;

        const date = document.createElement("p");
        date.textContent = "Date: " +
            String(appointment.appointment_date).slice(0, 10);

        const time = document.createElement("p");
        time.textContent = "Time: " + appointment.appointment_time;

        const status = document.createElement("p");
        status.textContent = "Status: " + appointment.status;

        card.append(heading, doctor, date, time, status);
        appointmentsList.appendChild(card);
    });
} catch (error) {
    appointmentsList.textContent =
        "Server connection failed. Please try again.";
}


});

appointmentsBackButton.addEventListener("click", function () {
myAppointmentsScreen.hidden = true;
patientDashboard.hidden = false;
});
const queueTokenButton = document.getElementById("queueTokenButton");
const queueTokenScreen = document.getElementById("queueTokenScreen");
const queueTokenDetails = document.getElementById("queueTokenDetails");
const queueTokenBackButton = document.getElementById("queueTokenBackButton");

queueTokenButton.addEventListener("click", async function () {
if (!loggedInUser || !loggedInUser.userId) {
alert("Please log in again.");
return;
}


patientDashboard.hidden = true;
queueTokenScreen.hidden = false;
queueTokenDetails.textContent = "Loading your queue token...";

try {
    const response = await fetch(
        "/api/queue-token/" + loggedInUser.userId
    );

    const tokens = await response.json();

    if (!response.ok) {
        queueTokenDetails.textContent =
            "Could not load your queue token.";
        return;
    }

    if (!Array.isArray(tokens) || tokens.length === 0) {
        queueTokenDetails.textContent =
            "No queue token found. Please book an appointment first.";
        return;
    }

    queueTokenDetails.replaceChildren();

    tokens.forEach(function (token) {
        const card = document.createElement("div");
        card.className = "token-card";

        const heading = document.createElement("h2");
        heading.textContent = "Token Number: " + token.token_number;

        const doctor = document.createElement("p");
        doctor.textContent = "Doctor: " + token.doctor_name;

        const date = document.createElement("p");
        date.textContent =
            "Date: " + String(token.appointment_date).slice(0, 10);

        const time = document.createElement("p");
        time.textContent = "Time: " + token.appointment_time;

        const status = document.createElement("p");
        status.textContent = "Queue Status: " + token.queue_status;

        card.append(heading, doctor, date, time, status);
        queueTokenDetails.appendChild(card);
    });
} catch (error) {
    console.error("Queue token error:", error);
    queueTokenDetails.textContent =
        "Server connection failed. Please try again.";
}

});

queueTokenBackButton.addEventListener("click", function () {
queueTokenScreen.hidden = true;
patientDashboard.hidden = false;
});
const doctorAppointmentsButton = document.getElementById("doctorAppointmentsButton");
const doctorAppointmentsScreen = document.getElementById("doctorAppointmentsScreen");
const doctorAppointmentsList = document.getElementById("doctorAppointmentsList");
const doctorAppointmentsBackButton = document.getElementById("doctorAppointmentsBackButton");

doctorAppointmentsButton.addEventListener("click", async function () {
if (!loggedInUser || !loggedInUser.userId) {
alert("Please log in again.");
return;
}

patientDashboard.hidden = true;
document.getElementById("doctorDashboard").hidden = true;
doctorAppointmentsScreen.hidden = false;
doctorAppointmentsList.textContent = "Loading appointments...";

try {
    const response = await fetch(
        "/api/doctor/appointments/" + loggedInUser.userId
    );

    const appointments = await response.json();

    if (!response.ok) {
        doctorAppointmentsList.textContent = "Could not load appointments.";
        return;
    }

    if (!Array.isArray(appointments) || appointments.length === 0) {
        doctorAppointmentsList.textContent = "No appointments found.";
        return;
    }

    doctorAppointmentsList.replaceChildren();

    appointments.forEach(function (appointment) {
        const card = document.createElement("div");
        card.className = "dashboard-card";

        const heading = document.createElement("h3");
        heading.textContent = "Appointment #" + appointment.appointment_id;

        const patient = document.createElement("p");
        patient.textContent = "Patient: " + appointment.patient_name;

        const date = document.createElement("p");
        date.textContent = "Date: " + String(appointment.appointment_date).slice(0, 10);

        const time = document.createElement("p");
        time.textContent = "Time: " + appointment.appointment_time;

        const status = document.createElement("p");
        status.textContent = "Appointment Status: " + appointment.status;

        const token = document.createElement("p");
        token.textContent = "Token Number: " +
            (appointment.token_number ?? "Not generated");

        const queueStatus = document.createElement("p");
        queueStatus.textContent = "Queue Status: " +
            (appointment.queue_status ?? "Not available");

        card.append(heading, patient, date, time, status, token, queueStatus);
        doctorAppointmentsList.appendChild(card);
    });
} catch (error) {
    console.error("Doctor appointments error:", error);
    doctorAppointmentsList.textContent =
        "Server connection failed. Please try again.";
}

});

doctorAppointmentsBackButton.addEventListener("click", function () {
doctorAppointmentsScreen.hidden = true;
document.getElementById("doctorDashboard").hidden = false;
});

const doctorQueueButton = document.getElementById("doctorQueueButton");
const doctorQueueScreen = document.getElementById("doctorQueueScreen");
const doctorQueueList = document.getElementById("doctorQueueList");
const doctorQueueBackButton = document.getElementById("doctorQueueBackButton");
const queueMessage = document.getElementById("queueMessage");
const callNextPatientButton = document.getElementById("callNextPatientButton");

async function loadDoctorQueue() {
if (!loggedInUser || !loggedInUser.userId) {
doctorQueueList.textContent = "Please log in again.";
return;
}


doctorQueueList.textContent = "Loading patient queue...";

try {
    const response = await fetch(
        "/api/doctor/queue/" + loggedInUser.userId
    );

    const patients = await response.json();

    if (!response.ok) {
        doctorQueueList.textContent = "Could not load patient queue.";
        return;
    }

    doctorQueueList.replaceChildren();

    if (!Array.isArray(patients) || patients.length === 0) {
        doctorQueueList.textContent = "No patients are currently waiting.";
        return;
    }

    patients.forEach(function (patient) {
        const card = document.createElement("div");
        card.className = "dashboard-card";

        const heading = document.createElement("h3");
        heading.textContent = "Token #" + patient.token_number;

        const name = document.createElement("p");
        name.textContent = "Patient: " + patient.patient_name;

        const date = document.createElement("p");
        date.textContent =
            "Date: " + String(patient.appointment_date).slice(0, 10);

        const time = document.createElement("p");
        time.textContent = "Time: " + patient.appointment_time;

        const status = document.createElement("p");
        status.textContent = "Queue Status: " + patient.queue_status;

        card.append(heading, name, date, time, status);
        if (patient.queue_status === "serving") {
    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "login-button";
    completeButton.textContent = "Complete Check-up";

    completeButton.addEventListener("click", async function () {
        const confirmed = confirm(
            "Kya " + patient.patient_name + " ka check-up complete ho gaya hai?"
        );

        if (!confirmed) return;

        completeButton.disabled = true;
        queueMessage.textContent = "Completing check-up...";

        try {
            const response = await fetch(
                "/api/doctor/queue/" +
                loggedInUser.userId +
                "/complete/" +
                patient.token_id,
                { method: "PUT" }
            );

            const result = await response.json();

            if (!response.ok) {
                queueMessage.textContent =
                    result.message || "Check-up complete nahi hua.";
                return;
            }

            queueMessage.textContent = result.message;
            await loadDoctorQueue();
        } catch (error) {
            console.error("Complete check-up error:", error);
            queueMessage.textContent =
                "Server connection failed. Please try again.";
        } finally {
            completeButton.disabled = false;
        }
    });

    card.appendChild(completeButton);
}

        if (
            patient.queue_status === "waiting" ||
            patient.queue_status === "serving"
        ) {
            const noShowButton = document.createElement("button");
            noShowButton.type = "button";
            noShowButton.className = "back-button";
            noShowButton.textContent = "Mark No-Show";

            noShowButton.addEventListener("click", async function () {
                const confirmed = confirm(
                    "Kya aap " + patient.patient_name +
                    " ko No-Show mark karna chahte hain?"
                );

                if (!confirmed) return;

                try {
                    const response = await fetch(
                        "/api/doctor/queue/" +
                        loggedInUser.userId +
                        "/no-show/" +
                        patient.token_id,
                        { method: "PUT" }
                    );

                    const result = await response.json();

                    if (!response.ok) {
                        alert(result.message || "Status update nahi hua.");
                        return;
                    }

                    queueMessage.textContent =
                        patient.patient_name + " marked as No-Show.";

                    await loadDoctorQueue();
                } catch (error) {
                    console.error("No-Show error:", error);
                    alert("Server connection failed. Please try again.");
                }
            });

            card.appendChild(noShowButton);
        }

        doctorQueueList.appendChild(card);
    });
} catch (error) {
    console.error("Doctor queue error:", error);
    doctorQueueList.textContent =
        "Server connection failed. Please try again.";
}

}

doctorQueueButton.addEventListener("click", async function () {
document.getElementById("doctorDashboard").hidden = true;
doctorQueueScreen.hidden = false;
queueMessage.textContent = "";
await loadDoctorQueue();
});

doctorQueueBackButton.addEventListener("click", function () {
doctorQueueScreen.hidden = true;
document.getElementById("doctorDashboard").hidden = false;
});

callNextPatientButton.addEventListener("click", async function () {
callNextPatientButton.disabled = true;
queueMessage.textContent = "Calling next patient...";

try {
    const response = await fetch(
        "/api/doctor/queue/" + loggedInUser.userId + "/next",
        { method: "PUT" }
    );

    const result = await response.json();

    if (!response.ok) {
        queueMessage.textContent = result.message || "Could not call next patient.";
        return;
    }

    queueMessage.textContent = result.message;
    await loadDoctorQueue();
} catch (error) {
    console.error("Call next patient error:", error);
    queueMessage.textContent = "Server connection failed. Please try again.";
} finally {
    callNextPatientButton.disabled = false;
}
});
// Admin: Load Patients
// Admin: Load Patients with Search

let allPatients = [];

const patientSearch = document.getElementById("patientSearch");
const adminPatientsList = document.getElementById("adminPatientsList");

// Display Patients
function displayPatients(patients) {
    adminPatientsList.replaceChildren();

    if (patients.length === 0) {
        adminPatientsList.textContent = "No patients found.";
        return;
    }

    patients.forEach(function (patient) {
        const card = document.createElement("div");
        card.className = "dashboard-card";

        const heading = document.createElement("h3");
        heading.textContent = patient.name;

        const id = document.createElement("p");
        id.textContent = "Patient ID: " + patient.user_id;

        const email = document.createElement("p");
        email.textContent = "Email: " + patient.email;

        card.append(heading, id, email);
        adminPatientsList.appendChild(card);
    });
}

// Load Patients
document.getElementById("managePatientsButton")
.addEventListener("click", async function () {

    document.getElementById("adminDashboard").hidden = true;
    document.getElementById("adminPatientsScreen").hidden = false;

    adminPatientsList.textContent = "Loading patients...";
    patientSearch.value = "";

    try {
        const response = await fetch("/api/admin/patients");
        const patients = await response.json();

        if (!response.ok || !Array.isArray(patients)) {
            throw new Error("Failed to load patients.");
        }

        allPatients = patients;
        displayPatients(allPatients);

    } catch (error) {
        console.error("Patient loading error:", error);
        adminPatientsList.textContent = "Unable to load patients.";
    }
});

// Search Patients
patientSearch.addEventListener("input", function () {

    const searchValue = patientSearch.value.toLowerCase().trim();

    const filteredPatients = allPatients.filter(function (patient) {

        const name = String(patient.name || "").toLowerCase();
        const email = String(patient.email || "").toLowerCase();

        return name.includes(searchValue) || email.includes(searchValue);
    });

    displayPatients(filteredPatients);
});

// Back to Admin Dashboard
document.getElementById("adminPatientsBackButton")
.addEventListener("click", function () {

    document.getElementById("adminPatientsScreen").hidden = true;
    document.getElementById("adminDashboard").hidden = false;

});

// Back to Admin Dashboard
document.getElementById("adminPatientsBackButton")
.addEventListener("click", function () {
    document.getElementById("adminPatientsScreen").hidden = true;
    document.getElementById("adminDashboard").hidden = false;
});
// Admin: Load Doctors
document.getElementById("manageDoctorsButton")
.addEventListener("click", async function () {

    document.getElementById("adminDashboard").hidden = true;

    const screen = document.getElementById("adminDoctorsScreen");
    const list = document.getElementById("adminDoctorsList");

    screen.hidden = false;
    list.innerHTML = "<p>Loading doctors...</p>";

    try {
        const response = await fetch("/api/admin/doctors");
        const doctors = await response.json();

        if (!response.ok) {
            throw new Error("Failed to load doctors.");
        }

        if (doctors.length === 0) {
            list.innerHTML = "<p>No doctors registered.</p>";
            return;
        }

        list.innerHTML = doctors.map(doctor => `
            <div class="dashboard-card">
                <h3>${doctor.name}</h3>
                <p>Doctor ID: ${doctor.user_id}</p>
                <p>Email: ${doctor.email}</p>
            </div>
        `).join("");

    } catch (error) {
        list.innerHTML = "<p>Unable to load doctors.</p>";
    }
});

// Back to Admin Dashboard
document.getElementById("adminDoctorsBackButton")
.addEventListener("click", function () {
    document.getElementById("adminDoctorsScreen").hidden = true;
    document.getElementById("adminDashboard").hidden = false;
});
// Admin: Load Appointments
document.getElementById("manageAppointmentsButton")
.addEventListener("click", async function () {

    document.getElementById("adminDashboard").hidden = true;

    const screen = document.getElementById("adminAppointmentsScreen");
    const list = document.getElementById("adminAppointmentsList");

    screen.hidden = false;
    list.innerHTML = "<p>Loading appointments...</p>";

    try {
        const response = await fetch("/api/admin/appointments");
        const appointments = await response.json();

        if (!response.ok) {
            throw new Error("Failed to load appointments.");
        }

        if (appointments.length === 0) {
            list.innerHTML = "<p>No appointments found.</p>";
            return;
        }

        list.innerHTML = appointments.map(a => `
            <div class="dashboard-card">
                <h3>Appointment #${a.appointment_id}</h3>
                <p>Patient: ${a.patient_name}</p>
                <p>Doctor: ${a.doctor_name}</p>
                <p>Date: ${a.appointment_date}</p>
                <p>Time: ${a.appointment_time}</p>
                <p>Status: ${a.status}</p>
            </div>
        `).join("");

    } catch (error) {
        list.innerHTML = "<p>Unable to load appointments.</p>";
    }
});

// Back to Admin Dashboard
document.getElementById("adminAppointmentsBackButton")
.addEventListener("click", function () {
    document.getElementById("adminAppointmentsScreen").hidden = true;
    document.getElementById("adminDashboard").hidden = false;
});
// Admin: Load Queue
document.getElementById("manageQueueButton")
.addEventListener("click", async function () {

    document.getElementById("adminDashboard").hidden = true;

    const screen = document.getElementById("adminQueueScreen");
    const list = document.getElementById("adminQueueList");

    screen.hidden = false;
    list.innerHTML = "<p>Loading queue...</p>";

    try {
        const response = await fetch("/api/admin/queue");
        const queue = await response.json();

        if (!response.ok) {
            throw new Error("Failed to load queue.");
        }

        if (queue.length === 0) {
            list.innerHTML = "<p>No queue records found.</p>";
            return;
        }

        list.innerHTML = queue.map(item => `
            <div class="dashboard-card">
                <h3>Token #${item.token_number}</h3>
                <p>Patient: ${item.patient_name}</p>
                <p>Doctor: ${item.doctor_name}</p>
                <p>Date: ${item.appointment_date}</p>
                <p>Time: ${item.appointment_time}</p>
                <p>Status: ${item.queue_status}</p>
            </div>
        `).join("");

    } catch (error) {
        list.innerHTML = "<p>Unable to load queue.</p>";
    }
});

// Back to Admin Dashboard
document.getElementById("adminQueueBackButton")
.addEventListener("click", function () {
    document.getElementById("adminQueueScreen").hidden = true;
    document.getElementById("adminDashboard").hidden = false;
});
// Admin Logout
document.getElementById("adminLogoutButton")
.addEventListener("click", function () {

    loggedInUser = null;

    document.getElementById("adminDashboard").hidden = true;

    document.getElementById("adminPatientsScreen").hidden = true;
    document.getElementById("adminDoctorsScreen").hidden = true;
    document.getElementById("adminAppointmentsScreen").hidden = true;
    document.getElementById("adminQueueScreen").hidden = true;

    document.getElementById("loginScreen").hidden = true;
    document.getElementById("registerScreen").hidden = true;

    document.getElementById("roleScreen").hidden = false;

    document.getElementById("loginForm").reset();
});
// Doctor Logout
document.getElementById("doctorLogoutButton")
.addEventListener("click", function () {

    loggedInUser = null;

    document.getElementById("doctorDashboard").hidden = true;
    document.getElementById("doctorAppointmentsScreen").hidden = true;
    document.getElementById("doctorQueueScreen").hidden = true;

    document.getElementById("loginScreen").hidden = true;
    document.getElementById("registerScreen").hidden = true;

    document.getElementById("roleScreen").hidden = false;

    document.getElementById("loginForm").reset();
});
async function loadAdminStats() {
    try {
        const response = await fetch("/api/admin/stats");
        const stats = await response.json();

        if (!response.ok) {
            throw new Error("Failed to load stats");
        }

        document.getElementById("totalPatients").textContent = stats.totalPatients;
        document.getElementById("totalDoctors").textContent = stats.totalDoctors;
        document.getElementById("totalAppointments").textContent = stats.totalAppointments;
        document.getElementById("waitingPatients").textContent = stats.waitingPatients;

    } catch (error) {
        console.error("Admin stats error:", error);
    }
}
// Open Add Doctor Form
document.getElementById("addDoctorButton")
.addEventListener("click", function () {

    document.getElementById("adminDashboard").hidden = true;

    document.getElementById("adminDoctorsScreen").hidden = false;

    document.getElementById("addDoctorFormContainer").hidden = false;

});