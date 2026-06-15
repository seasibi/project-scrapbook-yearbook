import YearbookShell from "@/components/YearbookShell";
import { getStudents, getYearbookPages } from "@/lib/data";

export default function Home() {
  const students = getStudents();
  const yearbookPages = getYearbookPages();

  return <YearbookShell students={students} yearbookPages={yearbookPages} />;
}
