export function formatIST(value) {
  if (!value) return "";
  let iso = String(value).replace(/(\.\d{3})\d+/, "$1");
  if (!/Z|[+-]\d{2}:?\d{2}$/.test(iso)) iso += "Z";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
