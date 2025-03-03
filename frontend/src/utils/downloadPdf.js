export async function downloadPDF(finalReport) {
    try {
      const response = await fetch("http://localhost:8000/api/generate_pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_report: finalReport }), 
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }
  
      // Get PDF as a Blob
      const pdfBlob = await response.blob();
  
      // Create a URL for the blob
      const url = window.URL.createObjectURL(pdfBlob);
  
      // Create a link element, set it to download the Blob
      const link = document.createElement("a");
      link.href = url;
      link.download = "final_report.pdf";
      document.body.appendChild(link);
      link.click();
  
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  }
  