export type ReportStatus = "Resolved" | "In review" | "Pending";

export type ReportItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  status: ReportStatus;
};

export const historyData: ReportItem[] = [
  {
    id: "1",
    title: "Broken streetlight",
    location: "Main Market Road",
    date: "12 Aug 2026",
    status: "Resolved",
  },
  {
    id: "2",
    title: "Drain blockage",
    location: "Near City Park",
    date: "09 Aug 2026",
    status: "In review",
  },
  {
    id: "3",
    title: "Garbage overflow",
    location: "Lakeside Lane",
    date: "05 Aug 2026",
    status: "Pending",
  },
];

export const getStatusStyle = (status: ReportStatus) => {
  switch (status) {
    case "Resolved":
      return { backgroundColor: "#E6F9F1", borderColor: "#38C98D" };
    case "In review":
      return { backgroundColor: "#FFF4D6", borderColor: "#F5B942" };
    default:
      return { backgroundColor: "#FDEBEC", borderColor: "#F26C6C" };
  }
};
