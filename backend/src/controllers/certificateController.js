import Certificate from "../models/Certificate.js";
import ClubMembership from "../models/ClubMembership.js";
import StudentProfile from "../models/StudentProfile.js";
import Attendance from "../models/Attendance.js";
import PDFDocument from "pdfkit";


import fs from "fs";
import path from "path";

// ======================================================
// STUDENT DOWNLOAD CERTIFICATE
// GET /api/certificates/student/download
// ======================================================

// ======================================================
// STUDENT DOWNLOAD CERTIFICATE
// GET /api/certificates/student/download
// ======================================================

export const downloadStudentCertificate = async (
  req,
  res
) => {
  try {
    // ==================================================
    // CHECK ROLE
    // ==================================================

    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message:
          "Only students can download certificates",
      });
    }

    // ==================================================
    // FIND STUDENT
    // ==================================================

    const student = await StudentProfile.findOne({
      userId: req.userId,
    })
      .populate("userId", "name email")
      .populate("departmentId", "name code");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // ==================================================
    // FIND CONFIRMED MEMBERSHIP
    // ==================================================

    const membership =
      await ClubMembership.findOne({
        studentId: student._id,
        status: "CONFIRMED",
      }).populate(
        "clubId",
        "name code type"
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Confirmed club membership not found",
      });
    }

    // ==================================================
    // FIND APPROVED CERTIFICATE
    // ==================================================

    const certificate =
      await Certificate.findOne({
        studentId: student._id,
        clubId: membership.clubId._id,
        status: {
          $in: ["APPROVED", "ISSUED"],
        },
      }).populate(
        "clubId",
        "name code type"
      );

    if (!certificate) {
      return res.status(403).json({
        success: false,
        message:
          "Certificate has not been approved by the Club In-charge",
      });
    }

    // ==================================================
    // ATTENDANCE
    // INFORMATION ONLY
    // ==================================================

    const attendanceRecords =
      await Attendance.find({
        clubId: membership.clubId._id,
        studentId: student._id,
        attendanceDate: {
          $gte:
            membership.joinedAt ||
            membership.createdAt,

          ...(membership.leftAt
            ? {
                $lte: membership.leftAt,
              }
            : {}),
        },
      }).select("status");

    const totalClasses =
      attendanceRecords.length;

    const attendedClasses =
      attendanceRecords.filter(
        (record) =>
          record.status === "PRESENT"
      ).length;

    const attendancePercentage =
      totalClasses > 0
        ? Number(
            (
              (attendedClasses /
                totalClasses) *
              100
            ).toFixed(2)
          )
        : 0;

    certificate.attendancePercentage =
      attendancePercentage;

    // ==================================================
    // LOGO PATHS
    // ==================================================

    const collegeLogoPath = path.join(
      process.cwd(),
      "public",
      "logo.jpg"
    );

    const platinumLogoPath = path.join(
      process.cwd(),
      "public",
      "logo2.png"
    );

    const karnatakaEmblemPath =
      path.join(
        process.cwd(),
        "public",
        "karnataka-emblem.png"
      );

    // ==================================================
    // STUDENT PHOTO
    // ==================================================

    let studentPhotoBuffer = null;

    const studentPhoto =
      student.photoUrl ||
      student.userId?.profilePhoto ||
      null;

    if (studentPhoto) {
      try {
        const photoResponse =
          await fetch(studentPhoto);

        if (photoResponse.ok) {
          const arrayBuffer =
            await photoResponse.arrayBuffer();

          studentPhotoBuffer =
            Buffer.from(arrayBuffer);
        }
      } catch (photoError) {
        console.error(
          "Student photo download failed:",
          photoError.message
        );
      }
    }

    // ==================================================
    // COLORS
    // ==================================================
const GREEN = "#176B3A";
    const NAVY = "#142B4A";
    const DARK_NAVY = "#0B1F36";
    const GOLD = "#B8860B";
    const LIGHT_GOLD = "#D6B45A";
    const MAROON = "#8B1E2D";
    const TEXT = "#25354A";
    const LIGHT_GREY = "#F7F8FA";

    // ==================================================
    // LANDSCAPE A4
    // ==================================================

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Certificate-${certificate.certificateNumber}.pdf"`
    );

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    doc.pipe(res);

    // ==================================================
    // PAGE SIZE
    // ==================================================

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // ==================================================
    // BACKGROUND
    // ==================================================

    doc
      .rect(
        0,
        0,
        pageWidth,
        pageHeight
      )
      .fill("#FFFFFF");

    // ==================================================
    // DECORATIVE TOP LEFT / BOTTOM RIGHT
    // ==================================================

    doc
      .fillColor(NAVY)
      .moveTo(0, 0)
      .lineTo(155, 0)
      .lineTo(45, 28)
      .lineTo(0, 28)
      .closePath()
      .fill();

    doc
      .fillColor(GOLD)
      .moveTo(0, 28)
      .lineTo(55, 28)
      .lineTo(175, 0)
      .lineTo(145, 0)
      .closePath()
      .fill();

    doc
      .fillColor(NAVY)
      .moveTo(pageWidth, pageHeight)
      .lineTo(pageWidth - 155, pageHeight)
      .lineTo(pageWidth - 45, pageHeight - 28)
      .lineTo(pageWidth, pageHeight - 28)
      .closePath()
      .fill();

    doc
      .fillColor(GOLD)
      .moveTo(pageWidth, pageHeight - 28)
      .lineTo(pageWidth - 55, pageHeight - 28)
      .lineTo(pageWidth - 175, pageHeight)
      .lineTo(pageWidth - 145, pageHeight)
      .closePath()
      .fill();

    // ==================================================
    // OUTER BORDER
    // ==================================================

    doc
      .lineWidth(2.5)
      .strokeColor(GOLD)
      .roundedRect(
        18,
        18,
        pageWidth - 36,
        pageHeight - 36,
        3
      )
      .stroke();

    // ==================================================
    // INNER BORDER
    // ==================================================

    doc
      .lineWidth(0.8)
      .strokeColor(NAVY)
      .roundedRect(
        28,
        28,
        pageWidth - 56,
        pageHeight - 56,
        2
      )
      .stroke();

    // ==================================================
    // CORNER CROSS DECORATIONS
    // ==================================================

    const crossSize = 12;

    const cornerPoints = [
      [38, 38],
      [pageWidth - 38, 38],
      [38, pageHeight - 38],
      [pageWidth - 38, pageHeight - 38],
    ];

    cornerPoints.forEach(([x, y]) => {
      doc
        .lineWidth(1.5)
        .strokeColor(GOLD)
        .moveTo(
          x - crossSize,
          y
        )
        .lineTo(
          x + crossSize,
          y
        )
        .moveTo(
          x,
          y - crossSize
        )
        .lineTo(
          x,
          y + crossSize
        )
        .stroke();
    });

    // ==================================================
    // TOP LOGOS
    // ==================================================

    if (
      fs.existsSync(collegeLogoPath)
    ) {
      doc.image(
        collegeLogoPath,
        55,
        45,
        {
          fit: [90, 85],
          align: "center",
          valign: "center",
        }
      );
    }

    if (
      fs.existsSync(platinumLogoPath)
    ) {
      doc.image(
        platinumLogoPath,
        pageWidth - 145,
        45,
        {
          fit: [90, 85],
          align: "center",
          valign: "center",
        }
      );
    }

    if (
      fs.existsSync(karnatakaEmblemPath)
    ) {
      doc.image(
        karnatakaEmblemPath,
        pageWidth / 2 - 28,
        37,
        {
          fit: [56, 52],
          align: "center",
          valign: "center",
        }
      );
    }

    // ==================================================
    // GOVERNMENT HEADING
    // ==================================================

    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(16)
      .text(
        "GOVERNMENT OF KARNATAKA",
        150,
        39,
        {
          width: pageWidth - 300,
          align: "center",
        }
      );

    doc
      .fontSize(11)
      .text(
        "DEPARTMENT OF TECHNICAL EDUCATION",
        150,
        59,
        {
          width: pageWidth - 300,
          align: "center",
        }
      );

    // ==================================================
    // COLLEGE NAME
    // ==================================================

    doc
      .fillColor(MAROON)
      .font("Times-Bold")
      .fontSize(16)
      .text(
        "KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU",
        140,
        78,
        {
          width: pageWidth - 280,
          align: "center",
        }
      );

    doc
      .fillColor(NAVY)
      .font("Times-Roman")
      .fontSize(9)
      .text(
        "(An Autonomous Institution under AICTE, New Delhi)",
        150,
        98,
        {
          width: pageWidth - 300,
          align: "center",
        }
      );

    doc
      .fontSize(9)
      .text(
        "Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka",
        150,
        113,
        {
          width: pageWidth - 300,
          align: "center",
        }
      );

    // ==================================================
    // DECORATIVE DIVIDER
    // ==================================================

    doc
      .lineWidth(1)
      .strokeColor(GOLD)
      .moveTo(285, 132)
      .lineTo(pageWidth - 285, 132)
      .stroke();

    // Center ornament
    // ==================================================
// DECORATIVE GOLD DIVIDER
// ==================================================

doc
  .lineWidth(1)
  .strokeColor(GOLD);

// Left line
doc
  .moveTo(285, 132)
  .lineTo(pageWidth / 2 - 18, 132)
  .stroke();

// Right line
doc
  .moveTo(pageWidth / 2 + 18, 132)
  .lineTo(pageWidth - 285, 132)
  .stroke();

// ==================================================
// CENTER DIAMOND ORNAMENT
// ==================================================

const centerX = pageWidth / 2;
const centerY = 132;

// Main diamond
doc
  .fillColor(GOLD)
  .moveTo(centerX, centerY - 6)
  .lineTo(centerX + 7, centerY)
  .lineTo(centerX, centerY + 6)
  .lineTo(centerX - 7, centerY)
  .closePath()
  .fill();

// Small left diamond
doc
  .fillColor(GOLD)
  .moveTo(centerX - 15, centerY)
  .lineTo(centerX - 10, centerY - 4)
  .lineTo(centerX - 5, centerY)
  .lineTo(centerX - 10, centerY + 4)
  .closePath()
  .fill();

// Small right diamond
doc
  .fillColor(GOLD)
  .moveTo(centerX + 15, centerY)
  .lineTo(centerX + 10, centerY - 4)
  .lineTo(centerX + 5, centerY)
  .lineTo(centerX + 10, centerY + 4)
  .closePath()
  .fill();

    // ==================================================
    // CERTIFICATE TITLE
    // ==================================================

    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(36)
      .text(
        "CERTIFICATE",
        100,
        142,
        {
          width: pageWidth - 200,
          align: "center",
        }
      );

    doc
      .fillColor(GOLD)
      .font("Times-Bold")
      .fontSize(13)
      .text(
        "OF CLUB PARTICIPATION",
        100,
        183,
        {
          width: pageWidth - 200,
          align: "center",
        }
      );

    // ==================================================
    // GOLD TITLE LINE
    // ==================================================

    doc
      .lineWidth(1)
      .strokeColor(LIGHT_GOLD)
      .moveTo(390, 202)
      .lineTo(pageWidth - 390, 202)
      .stroke();

    // ==================================================
    // STUDENT PHOTO
    // ==================================================

    if (studentPhotoBuffer) {
      const photoX = 58;
      const photoY = 220;
      const photoWidth = 112;
      const photoHeight = 130;

      // Outer gold frame
      doc
        .lineWidth(2)
        .strokeColor(GOLD)
        .roundedRect(
          photoX - 5,
          photoY - 5,
          photoWidth + 10,
          photoHeight + 10,
          7
        )
        .stroke();

      // Inner frame
      doc
        .lineWidth(1)
        .strokeColor(NAVY)
        .roundedRect(
          photoX - 2,
          photoY - 2,
          photoWidth + 4,
          photoHeight + 4,
          5
        )
        .stroke();

      try {
        doc.image(
          studentPhotoBuffer,
          photoX,
          photoY,
          {
            fit: [
              photoWidth,
              photoHeight,
            ],
            align: "center",
            valign: "center",
          }
        );
      } catch (photoError) {
        console.error(
          "Unable to place student photo:",
          photoError.message
        );
      }
    }

    // ==================================================
    // STUDENT INFORMATION
    // ==================================================

    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(9)
      .text(
        `Register No.: ${student.registerNumber || "-"}`,
        58,
        363,
        {
          width: 145,
          align: "left",
        }
      );

    doc
      .font("Times-Roman")
      .fontSize(8)
      .text(
        `Department: ${
          student.departmentId?.name || "-"
        }`,
        58,
        380,
        {
          width: 145,
          align: "left",
        }
      );

    // ==================================================
    // MAIN CONTENT
    // ==================================================

    const contentX = 190;
    const contentWidth =
      pageWidth - 390;

    doc
      .fillColor(TEXT)
      .font("Times-Roman")
      .fontSize(12)
      .text(
        "This is to certify that",
        contentX,
        220,
        {
          width: contentWidth,
          align: "center",
        }
      );

    // Student name
    doc
  .fillColor(MAROON)
  .font("Times-Bold")
  .fontSize(25)
  .text(
    student.userId?.name?.toUpperCase() ||
      "STUDENT",
    contentX,
    246,
    {
      width: contentWidth,
      align: "center",
    }
  );

    // Participation text
    doc
      .fillColor(TEXT)
      .font("Times-Roman")
      .fontSize(12)
      .text(
        "has successfully participated in the activities of",
        contentX,
        285,
        {
          width: contentWidth,
          align: "center",
        }
      );

    // Club
    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(20)
      .text(
        membership.clubId?.name ||
          "Club",
        contentX,
        310,
        {
          width: contentWidth,
          align: "center",
        }
      );

    if (membership.clubId?.code) {
      doc
        .fillColor(GOLD)
        .font("Times-Bold")
        .fontSize(10)
        .text(
          `(${membership.clubId.code})`,
          contentX,
          337,
          {
            width: contentWidth,
            align: "center",
          }
        );
    }

    // Academic year
    doc
      .fillColor(TEXT)
      .font("Times-Roman")
      .fontSize(11)
      .text(
        `during the academic year ${certificate.academicStartYear} – ${certificate.academicEndYear}.`,
        contentX,
        360,
        {
          width: contentWidth,
          align: "center",
        }
      );

    // Appreciation
    doc
      .font("Times-Italic")
      .fontSize(10)
      .text(
        "We appreciate the student's commitment, enthusiasm and",
        contentX,
        390,
        {
          width: contentWidth,
          align: "center",
        }
      );

    doc
      .text(
        "valuable contribution towards the club and the institution.",
        contentX,
        405,
        {
          width: contentWidth,
          align: "center",
        }
      );

    // ==================================================
    // RIGHT SIDE PARTICIPATION SEAL
    // ==================================================

    const sealX = pageWidth - 112;
    const sealY = 285;
    const sealRadius = 48;

    // Outer circle
    doc
      .lineWidth(2)
      .strokeColor(GOLD)
      .circle(
        sealX,
        sealY,
        sealRadius
      )
      .stroke();

    // Inner circle
    doc
      .lineWidth(1)
      .strokeColor(LIGHT_GOLD)
      .circle(
        sealX,
        sealY,
        sealRadius - 7
      )
      .stroke();

    // Small stars
  doc
  .fillColor(GOLD);

const drawStar = (cx, cy, outerRadius, innerRadius) => {
  const points = 5;
  const angle = -Math.PI / 2;

  doc.moveTo(
    cx + Math.cos(angle) * outerRadius,
    cy + Math.sin(angle) * outerRadius
  );

  for (let i = 1; i < points * 2; i++) {
    const radius =
      i % 2 === 0
        ? outerRadius
        : innerRadius;

    const currentAngle =
      angle + (Math.PI / points) * i;

    doc.lineTo(
      cx +
        Math.cos(currentAngle) * radius,
      cy +
        Math.sin(currentAngle) * radius
    );
  }

  doc.closePath();
  doc.fill();
};

drawStar(
  sealX - 18,
  sealY - 22,
  5,
  2
);

drawStar(
  sealX,
  sealY - 22,
  5,
  2
);

drawStar(
  sealX + 18,
  sealY - 22,
  5,
  2
);

    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(10)
      .text(
        "CLUB",
        sealX - 32,
        sealY - 7,
        {
          width: 64,
          align: "center",
        }
      );

    doc
      .fontSize(8.5)
      .text(
        "PARTICIPATION",
        sealX - 35,
        sealY + 6,
        {
          width: 70,
          align: "center",
        }
      );

    doc
      .fillColor(GOLD)
      .fontSize(8)
      .text(
        "KPT MANGALURU",
        sealX - 35,
        sealY + 21,
        {
          width: 70,
          align: "center",
        }
      );

    // ==================================================
    // FOOTER INFORMATION
    // ==================================================

    const footerY =
      pageHeight - 135;

    doc
      .fillColor(TEXT)
      .font("Times-Roman")
      .fontSize(8.5)
      .text(
        `Date of Issue: ${new Date().toLocaleDateString(
          "en-IN"
        )}`,
        55,
        footerY,
        {
          width: 250,
          align: "left",
        }
      );

    doc
      .text(
        `Certificate No.: ${certificate.certificateNumber}`,
        55,
        footerY + 15,
        {
          width: 300,
          align: "left",
        }
      );

    doc
      .text(
        "Place: Mangaluru",
        pageWidth - 250,
        footerY,
        {
          width: 190,
          align: "right",
        }
      );

    // ==================================================
    // SIGNATURES
    // THREE SIGNATURES
    // ==================================================

    const signatureY =
      pageHeight - 67;

    // -----------------------------------------------
    // Club In-charge
    // -----------------------------------------------

    doc
      .lineWidth(1)
      .strokeColor(NAVY)
      .moveTo(55, signatureY)
      .lineTo(225, signatureY)
      .stroke();

    doc
      .fillColor(NAVY)
      .font("Times-Bold")
      .fontSize(9)
      .text(
        "Club In-charge",
        55,
        signatureY + 5,
        {
          width: 170,
          align: "center",
        }
      );

    // -----------------------------------------------
    // Head of Department
    // -----------------------------------------------

    doc
      .moveTo(
        pageWidth / 2 - 85,
        signatureY
      )
      .lineTo(
        pageWidth / 2 + 85,
        signatureY
      )
      .stroke();

    doc
      .text(
        "Head of Department",
        pageWidth / 2 - 85,
        signatureY + 5,
        {
          width: 170,
          align: "center",
        }
      );

    // -----------------------------------------------
    // Principal
    // -----------------------------------------------

    doc
      .moveTo(
        pageWidth - 225,
        signatureY
      )
      .lineTo(
        pageWidth - 55,
        signatureY
      )
      .stroke();

    doc
      .fillColor(MAROON)
      .font("Times-Bold")
      .text(
        "Principal",
        pageWidth - 225,
        signatureY + 5,
        {
          width: 170,
          align: "center",
        }
      );

    // ==================================================
    // BOTTOM MOTTO
    // ==================================================

 

    doc
      .fillColor(GREEN)
      .font("Times-Bold")
      .fontSize(7)
      .text(
        "TECHNICAL EDUCATION FOR A BRIGHTER TOMORROW",
        250,
        pageHeight - 37,
        {
          width: pageWidth - 500,
          align: "center",
        }
      );

    // ==================================================
    // MARK CERTIFICATE AS ISSUED
    // ==================================================

    certificate.attendancePercentage =
      attendancePercentage;

    if (certificate.status === "APPROVED") {
      certificate.status = "ISSUED";
      certificate.issuedAt = new Date();
    }

    await certificate.save();

    // ==================================================
    // FINISH PDF
    // ==================================================

    doc.end();

  } catch (error) {
    console.error(
      "Download certificate error:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to generate certificate",
      });
    }
  }
};

export const getClubCertificateStudents = async (req, res) => {
  try {
    if (req.user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message: "Only Club In-charge can access certificates",
      });
    }

    const clubId = req.user.clubId;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "No club assigned to this user",
      });
    }

    // Get all confirmed members of this club
    const memberships = await ClubMembership.find({
      clubId,
      status: "CONFIRMED",
    })
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email phone profilePhoto",
          },
          {
            path: "departmentId",
            select: "name code",
          },
        ],
      })
      .sort({ createdAt: 1 });

    const students = [];

    for (const membership of memberships) {
      const student = membership.studentId;

      if (!student) {
        continue;
      }

      // ==================================================
      // ATTENDANCE
      // Attendance is ONLY displayed.
      // It does NOT decide certificate permission.
      // ==================================================

      const attendanceRecords = await Attendance.find({
        clubId,
        studentId: student._id,
        attendanceDate: {
          $gte: membership.joinedAt || membership.createdAt,
          ...(membership.leftAt
            ? { $lte: membership.leftAt }
            : {}),
        },
      }).select("status");

      const totalClasses = attendanceRecords.length;

      const attendedClasses = attendanceRecords.filter(
        (record) => record.status === "PRESENT"
      ).length;

      const attendancePercentage =
        totalClasses > 0
          ? Number(
              ((attendedClasses / totalClasses) * 100).toFixed(2)
            )
          : 0;

      // ==================================================
      // CERTIFICATE
      // Create certificate record for EVERY confirmed
      // student if it does not already exist.
      // ==================================================

      let certificate = await Certificate.findOne({
        studentId: student._id,
        clubId,
      });

      if (!certificate) {
        const currentYear = new Date().getFullYear();

        const certificateNumber =
          `KPT-${currentYear}-${Date.now()}-${Math.floor(
            Math.random() * 10000
          )}`;

        certificate = await Certificate.create({
          studentId: student._id,
          clubId: clubId,
          certificateNumber,
          academicStartYear: currentYear,
          academicEndYear: currentYear + 1,
          attendancePercentage,
          status: "ELIGIBLE",
        });
      } else {
        // Keep attendance information updated
        certificate.attendancePercentage =
          attendancePercentage;

        await certificate.save();
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      students.push({
        studentId: student._id,

        name:
          student.userId?.name || "Unknown",

        email:
          student.userId?.email || "",

        registerNumber:
          student.registerNumber || "",

        phone:
          student.phone ||
          student.userId?.phone ||
          "",

        profilePhoto:
          student.photoUrl ||
          student.userId?.profilePhoto ||
          null,

        department:
          student.departmentId?.name || "",

        departmentCode:
          student.departmentId?.code || "",

        // Attendance is information only
        attendedClasses,
        totalClasses,
        attendancePercentage,

        // Certificate information
        certificateId: certificate._id,

        certificateNumber:
          certificate.certificateNumber,

        certificateStatus:
          certificate.status,

        approvedAt:
          certificate.approvedAt || null,
      });
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });

  } catch (error) {
    console.error(
      "Get club certificate students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load certificate students",
    });
  }
};

// ======================================================
// CLUB IN-CHARGE APPROVES CERTIFICATE
// PUT /api/certificates/:certificateId/approve
// ======================================================

export const approveCertificate = async (req, res) => {
  try {
    if (req.user.role !== "CLUB_INCHARGE") {
      return res.status(403).json({
        success: false,
        message:
          "Only Club In-charge can approve certificates",
      });
    }

    const { certificateId } = req.params;

    const certificate =
      await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // --------------------------------------------------
    // Security: certificate must belong to this club
    // --------------------------------------------------

    if (
      String(certificate.clubId) !==
      String(req.user.clubId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot approve this certificate",
      });
    }

    // --------------------------------------------------
    // Only ELIGIBLE certificates can be approved
    // --------------------------------------------------

    if (certificate.status !== "ELIGIBLE") {
      return res.status(400).json({
        success: false,
        message:
          `Certificate cannot be approved in ${certificate.status} status`,
      });
    }

    certificate.status = "APPROVED";
    certificate.approvedBy = req.userId;
    certificate.approvedAt = new Date();

    await certificate.save();

    return res.status(200).json({
      success: true,
      message:
        "Certificate approved successfully",
      certificate: {
        id: certificate._id,
        certificateNumber:
          certificate.certificateNumber,
        status: certificate.status,
        approvedAt:
          certificate.approvedAt,
      },
    });

  } catch (error) {
    console.error(
      "Approve certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve certificate",
    });
  }
};


// ======================================================
// STUDENT
// GET /api/certificates/student
// ======================================================

export const getStudentCertificate = async (req, res) => {
  try {
    if (req.user.role !== "STUDENT") {
      return res.status(403).json({
        success: false,
        message:
          "Only students can access this certificate",
      });
    }

    const student =
      await StudentProfile.findOne({
        userId: req.userId,
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found",
      });
    }

    const membership =
      await ClubMembership.findOne({
        studentId: student._id,
        status: "CONFIRMED",
      })
        .populate("clubId", "name code type");

    if (!membership) {
      return res.status(200).json({
        success: true,
        certificate: null,
        message:
          "You do not have a confirmed club membership",
      });
    }

    const certificate =
      await Certificate.findOne({
        studentId: student._id,
        clubId: membership.clubId._id,
      }).populate(
        "clubId",
        "name code type"
      );

    if (!certificate) {
      return res.status(200).json({
        success: true,
        certificate: null,
        eligible: false,
        message:
          "You are not yet eligible for a certificate",
      });
    }

    return res.status(200).json({
      success: true,
      eligible:
        certificate.status !== "REJECTED",

      certificate: {
        id: certificate._id,

        certificateNumber:
          certificate.certificateNumber,

        club:
          certificate.clubId,

        academicStartYear:
          certificate.academicStartYear,

        academicEndYear:
          certificate.academicEndYear,

        attendancePercentage:
          certificate.attendancePercentage,

        status:
          certificate.status,

        approvedAt:
          certificate.approvedAt,

        issuedAt:
          certificate.issuedAt,

        certificateUrl:
          certificate.certificateUrl,
      },
    });

  } catch (error) {
    console.error(
      "Get student certificate error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load certificate",
    });
  }
};

