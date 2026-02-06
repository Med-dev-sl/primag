import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export async function exportReportToPDF(elementId: string, filename: string = "financial-report.pdf") {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("Report content not found");
    return;
  }

  toast.info("Generating PDF...");

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    let position = 0;
    let heightLeft = scaledHeight;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = -(scaledHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    toast.success("PDF downloaded successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF");
  }
}
