const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }

    console.log("MySQL connected successfully!");
});

const bcrypt = require("bcrypt");

// Register a new user
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (role !== "patient") {

        return res.status(403).json({
        message: "Only patient registration is allowed."
    });
}

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        db.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, role],
            (err, result) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "This email is already registered."
                        });
                    }

                    console.error(err);
                    return res.status(500).json({
                        message: "Registration failed."
                    });
                }

                res.status(201).json({
                    message: "Registration successful!",
                    userId: result.insertId
                });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
});

// Login an existing user
app.post("/api/login", (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({
            message: "Email, password and role are required."
        });
    }
    


    

    db.query(
        "SELECT user_id, name, email, password, role FROM users WHERE email = ? AND role = ?",
        [email, role],
        async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Login failed."
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email, password or role."
                });
            }

            try {
                const user = results[0];
                const passwordMatches = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatches) {
                    return res.status(401).json({
                        message: "Invalid email, password or role."
                    });
                }

                res.json({
                    message: "Login successful!",
                    user: {
                        userId: user.user_id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({
                    message: "Something went wrong."
                });
            }
        }
    );
});
// Get all registered doctors
console.log("DOCTORS ROUTE LOADED");
app.get("/api/check", (req, res) => {
    res.send("CHECK ROUTE WORKING");
});
app.get("/api/doctors", (req, res) => {
    db.query(
        "SELECT user_id, name FROM users WHERE role = 'doctor'",
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Could not load doctors."
                });
            }

            res.json(results);
        }
    );
});

// Book a new appointment
app.post("/api/appointments", (req, res) => {
    console.log("APPOINTMENT ROUTE HIT");
const { patient_id, doctor_id, appointment_date, appointment_time } = req.body;


if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({
        message: "All appointment fields are required."
    });
}

db.query(
    `INSERT INTO appointments
    (patient_id, doctor_id, appointment_date, appointment_time)
    VALUES (?, ?, ?, ?)`,
    [patient_id, doctor_id, appointment_date, appointment_time],
    (err, result) => {
        if (err) {
            console.error("Appointment error:", err);
            return res.status(500).json({
                message: "Could not book appointment."
            });
        }

        const appointmentId = result.insertId;
        console.log("Appointment created, generating token for ID:", appointmentId);

        db.query(
            `SELECT COALESCE(MAX(token_number), 0) + 1 AS nextToken
             FROM queue_tokens`,
            (tokenError, tokenResult) => {
                if (tokenError) {
                    console.error("Token number error:", tokenError);
                    return res.status(500).json({
                        message: "Appointment booked, but token generation failed."
                    });
                }

                const tokenNumber = tokenResult[0].nextToken;

                db.query(
                    `INSERT INTO queue_tokens
                     (appointment_id, token_number)
                     VALUES (?, ?)`,
                    [appointmentId, tokenNumber],
                    (insertError) => {
                        if (insertError) {
                            console.error("Token insert error:", insertError);
                            return res.status(500).json({
                                message: "Appointment booked, but token saving failed."
                            });
                        }

                        res.status(201).json({
                            message: "Appointment booked successfully!",
                            appointmentId: appointmentId,
                            tokenNumber: tokenNumber
                        });
                    }
                );
            }
        );
    }
);

});


app.get("/api/test", (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: "Database connected!",
            tables: results
        });
    });
});

const PORT = process.env.PORT || 3000;
app.get("/api/appointments/:patientId", (req, res) => {
const patientId = Number(req.params.patientId);


if (!Number.isInteger(patientId) || patientId <= 0) {
    return res.status(400).json({
        message: "Invalid patient ID."
    });
}

const sql = `
    SELECT
        a.appointment_id,
        d.name AS doctor_name,
        a.appointment_date,
        a.appointment_time,
        a.status
    FROM appointments a
    JOIN users d ON a.doctor_id = d.user_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
`;

db.query(sql, [patientId], (err, results) => {
    if (err) {
        console.error("Appointments error:", err);

        return res.status(500).json({
            message: "Could not load appointments."
        });
    }

    res.json(results);
});


});

app.get("/api/queue-token/:patientId", (req, res) => {
const patientId = req.params.patientId;

const sql = `
    SELECT
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status AS appointment_status,
        q.token_number,
        q.queue_status,
        u.name AS doctor_name
    FROM appointments a
    JOIN queue_tokens q
        ON a.appointment_id = q.appointment_id
    JOIN users u
        ON a.doctor_id = u.user_id
    WHERE a.patient_id = ?
    ORDER BY a.appointment_id DESC
`;

db.query(sql, [patientId], (err, results) => {
    if (err) {
        console.error("Queue token fetch error:", err);
        return res.status(500).json({
            message: "Could not fetch queue token."
        });
    }

    res.json(results);
});

});
app.get("/api/doctor/appointments/:doctorId", (req, res) => {
const doctorId = req.params.doctorId;

const sql = `
    SELECT
        a.appointment_id,
        p.name AS patient_name,
        a.appointment_date,
        a.appointment_time,
        a.status,
        q.token_number,
        q.queue_status
    FROM appointments a
    JOIN users p

        ON a.patient_id = p.user_id
    LEFT JOIN queue_tokens q
        ON a.appointment_id = q.appointment_id
    
`;

db.query(sql, [doctorId], (err, results) => {
    if (err) {
        console.error("Doctor appointments error:", err);
        return res.status(500).json({
            message: "Could not load doctor appointments."
        });
    }

    res.json(results);
});

});

app.get("/api/doctor/queue/:doctorId", (req, res) => {
const doctorId = req.params.doctorId;

const sql = `
    SELECT
        q.token_id,
        q.token_number,
        q.queue_status,
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        p.name AS patient_name
    FROM queue_tokens q
    JOIN appointments a
        ON q.appointment_id = a.appointment_id
    JOIN users p
        ON a.patient_id = p.user_id
    WHERE a.doctor_id = ?
      AND q.queue_status IN ('waiting', 'serving')
    ORDER BY
        CASE q.queue_status
            WHEN 'serving' THEN 1
            WHEN 'waiting' THEN 2
            ELSE 3
        END,
        q.token_number ASC
`;

db.query(sql, [doctorId], (err, results) => {
    if (err) {
        console.error("Doctor queue error:", err);
        return res.status(500).json({
            message: "Could not load patient queue."
        });
    }

    res.json(results);
});


});
app.put("/api/doctor/queue/:doctorId/no-show/:tokenId", (req, res) => {
const { doctorId, tokenId } = req.params;

const findQuery = `
    SELECT q.token_id, q.queue_status, a.appointment_id
    FROM queue_tokens q
    JOIN appointments a ON q.appointment_id = a.appointment_id
    WHERE q.token_id = ?
      AND a.doctor_id = ?
`;

db.query(findQuery, [tokenId, doctorId], (err, results) => {
    if (err) {
        return res.status(500).json({ message: "Database error." });
    }

    if (results.length === 0) {
        return res.status(404).json({ message: "Patient not found." });
    }

    const patient = results[0];

    if (!["waiting", "serving"].includes(patient.queue_status)) {
        return res.status(400).json({
            message: "This patient's queue status cannot be changed to No-Show."
        });
    }

    const updateQuery = `
        UPDATE queue_tokens
        SET queue_status = 'no_show'
        WHERE token_id = ?
    `;

    db.query(updateQuery, [tokenId], (updateErr) => {
        if (updateErr) {
            return res.status(500).json({
                message: "Could not update patient status."
            });
        }

        res.json({
            message: "Patient marked as No-Show successfully."
        });
    });
});
});
app.put("/api/doctor/queue/:doctorId/next", (req, res) => {
const doctorId = req.params.doctorId;

const checkServingSql = `
    SELECT q.token_id
    FROM queue_tokens q
    JOIN appointments a ON q.appointment_id = a.appointment_id
    WHERE a.doctor_id = ?
      AND q.queue_status = 'serving'
    LIMIT 1
`;

db.query(checkServingSql, [doctorId], (err, servingResults) => {
    if (err) {
        console.error("Check serving error:", err);
        return res.status(500).json({
            message: "Could not check current patient."
        });
    }

    if (servingResults.length > 0) {
        return res.status(409).json({
            message: "Complete the current check-up or mark the patient No-Show before calling the next patient."
        });
    }

    const nextPatientSql = `
        SELECT q.token_id
        FROM queue_tokens q
        JOIN appointments a ON q.appointment_id = a.appointment_id
        WHERE a.doctor_id = ?
          AND q.queue_status = 'waiting'
        ORDER BY a.appointment_date, a.appointment_time, q.token_number
        LIMIT 1
    `;

    db.query(nextPatientSql, [doctorId], (nextErr, results) => {
        if (nextErr) {
            console.error("Find next patient error:", nextErr);
            return res.status(500).json({
                message: "Could not find the next patient."
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "No waiting patients are available."
            });
        }

        const tokenId = results[0].token_id;

        const updateSql = `
            UPDATE queue_tokens
            SET queue_status = 'serving'
            WHERE token_id = ?
              AND queue_status = 'waiting'
        `;

        db.query(updateSql, [tokenId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error("Call next patient error:", updateErr);
                return res.status(500).json({
                    message: "Could not call the next patient."
                });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(409).json({
                    message: "Patient status changed. Please refresh the queue."
                });
            }

            res.json({
                message: "Next patient called successfully.",
                tokenId: tokenId
            });
        });
    });
});

});
app.put("/api/doctor/queue/:doctorId/complete/:tokenId", (req, res) => {
const { doctorId, tokenId } = req.params;

const findSql = `
    SELECT q.token_id, q.queue_status, a.appointment_id
    FROM queue_tokens q
    JOIN appointments a
        ON q.appointment_id = a.appointment_id
    WHERE q.token_id = ?
      AND a.doctor_id = ?
`;

db.query(findSql, [tokenId, doctorId], (err, results) => {
    if (err) {
        console.error("Find patient error:", err);
        return res.status(500).json({
            message: "Database error."
        });
    }

    if (results.length === 0) {
        return res.status(404).json({
            message: "Patient not found."
        });
    }

    const patient = results[0];

    if (patient.queue_status !== "serving") {
        return res.status(400).json({
            message: "Only the currently serving patient can be completed."
        });
    }

    const updateQueueSql = `
        UPDATE queue_tokens
        SET queue_status = 'completed'
        WHERE token_id = ?
          AND queue_status = 'serving'
    `;

    db.query(updateQueueSql, [tokenId], (updateErr, updateResult) => {
        if (updateErr) {
            console.error("Queue update error:", updateErr);
            return res.status(500).json({
                message: "Could not complete the check-up."
            });
        }

        if (updateResult.affectedRows === 0) {
            return res.status(409).json({
                message: "Patient status changed. Please refresh the queue."
            });
        }

        const updateAppointmentSql = `
            UPDATE appointments
            SET status = 'completed'
            WHERE appointment_id = ?
        `;

        db.query(
            updateAppointmentSql,
            [patient.appointment_id],
            (appointmentErr) => {
                if (appointmentErr) {
                    console.error("Appointment update error:", appointmentErr);
                    return res.status(500).json({
                        message: "Queue completed, but appointment status update failed."
                    });
                }

                res.json({
                    message: "Check-up completed successfully!"
                });
            }
        );
    });
});

});
// Admin: Get all patients
app.get("/api/admin/patients", (req, res) => {
    const sql = `
        SELECT user_id, name, email
        FROM users
        WHERE role = 'patient'
        ORDER BY user_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch patients."
            });
        }

        res.json(results);
    });
});
// Admin: Get all doctors
app.get("/api/admin/doctors", (req, res) => {
    const sql = `
        SELECT user_id, name, email
        FROM users
        WHERE role = 'doctor'
        ORDER BY user_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch doctors."
            });
        }

        res.json(results);
    });
});

// Admin: Get all appointments
app.get("/api/admin/appointments", (req, res) => {

    const sql = `
        SELECT
            a.appointment_id,
            p.name AS patient_name,
            d.name AS doctor_name,
            a.appointment_date,
            a.appointment_time,
            a.status
        FROM appointments a
        JOIN users p ON a.patient_id = p.user_id
        JOIN users d ON a.doctor_id = d.user_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch appointments."
            });
        }

        res.json(results);
    });
});
// Admin: Get all queue details
app.get("/api/admin/queue", (req, res) => {

    const sql = `
        SELECT
            q.token_id,
            q.token_number,
            q.queue_status,
            a.appointment_date,
            a.appointment_time,
            p.name AS patient_name,
            d.name AS doctor_name
        FROM queue_tokens q
        JOIN appointments a
            ON q.appointment_id = a.appointment_id
        JOIN users p
            ON a.patient_id = p.user_id
        JOIN users d
            ON a.doctor_id = d.user_id
        ORDER BY q.token_number ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch queue."
            });
        }

        res.json(results);
    });
});
// Admin: Dashboard Statistics
app.get("/api/admin/stats", (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users
             WHERE role = 'patient') AS totalPatients,

            (SELECT COUNT(*) FROM users
             WHERE role = 'doctor') AS totalDoctors,

            (SELECT COUNT(*) FROM appointments)
             AS totalAppointments,

            (SELECT COUNT(*) FROM queue_tokens
             WHERE queue_status = 'waiting') AS waitingPatients
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch dashboard statistics."
            });
        }

        res.json(results[0]);
    });
});
// Admin: Dashboard Statistics
app.get("/api/admin/stats", (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users
             WHERE role = 'patient') AS totalPatients,

            (SELECT COUNT(*) FROM users
             WHERE role = 'doctor') AS totalDoctors,

            (SELECT COUNT(*) FROM appointments)
             AS totalAppointments,

            (SELECT COUNT(*) FROM queue_tokens
             WHERE queue_status = 'waiting') AS waitingPatients
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch dashboard statistics."
            });
        }

        res.json(results[0]);
    });
});
// Admin: Dashboard Statistics
app.get("/api/admin/stats", (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users
             WHERE role = 'patient') AS totalPatients,

            (SELECT COUNT(*) FROM users
             WHERE role = 'doctor') AS totalDoctors,

            (SELECT COUNT(*) FROM appointments)
             AS totalAppointments,

            (SELECT COUNT(*) FROM queue_tokens
             WHERE queue_status = 'waiting') AS waitingPatients
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch dashboard statistics."
            });
        }

        res.json(results[0]);
    });
});
// Admin: Dashboard Statistics
app.get("/api/admin/stats", (req, res) => {

    const sql = `
        SELECT
            (SELECT COUNT(*) FROM users
             WHERE role = 'patient') AS totalPatients,

            (SELECT COUNT(*) FROM users
             WHERE role = 'doctor') AS totalDoctors,

            (SELECT COUNT(*) FROM appointments)
             AS totalAppointments,

            (SELECT COUNT(*) FROM queue_tokens
             WHERE queue_status = 'waiting') AS waitingPatients
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Failed to fetch dashboard statistics."
            });
        }

        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});