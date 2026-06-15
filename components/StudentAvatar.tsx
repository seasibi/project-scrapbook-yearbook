"use client";

import { useState } from "react";
import type { Student } from "@/types";

const EXTS = ["jpg", "JPG", "jpeg", "JPEG", "png", "PNG", "webp"];

function Placeholder({ student, size }: { student: Student; size: number }) {
  const initial = student.fullName.charAt(0).toUpperCase();
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`Portrait of ${student.fullName}`}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <rect width="100" height="100" fill={student.color} opacity="0.18" />
      <circle cx="50" cy="38" r="17" fill={student.color} opacity="0.55" />
      <path
        d="M18 92c4-20 16-30 32-30s28 10 32 30z"
        fill={student.color}
        opacity="0.55"
      />
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="22"
        fontStyle="italic"
        fill="var(--ink, #2a1f14)"
        opacity="0.85"
      >
        {initial}
      </text>
    </svg>
  );
}

/**
 * Shows the student's graduation photo from /portraits/<id>.<ext> if present,
 * tries jpg, JPG, jpeg, JPEG, png, PNG, webp in order, then falls back to SVG.
 */
export default function StudentAvatar({
  student,
  size = 120,
}: {
  student: Student;
  size?: number;
}) {
  const [extIndex, setExtIndex] = useState(0);

  if (extIndex >= EXTS.length) return <Placeholder student={student} size={size} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/portraits/${student.id}.${EXTS[extIndex]}`}
      alt={`Portrait of ${student.fullName}`}
      width={size}
      height={size}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
      onError={() => setExtIndex((i) => i + 1)}
    />
  );
}
