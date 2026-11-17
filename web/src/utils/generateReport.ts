import * as XLSX from "xlsx";

export const downloadReport = async (data: any) => {
	try {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

		const excelBuffer = XLSX.write(workbook, {
			bookType: "xlsx",
			type: "array",
		});
		const blob = new Blob([excelBuffer], {
			type: "application/octet-stream",
		});

		const url = window.URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "report.xlsx";
		document.body.appendChild(a);
		a.click();

		// Clean up
		a.remove();
		window.URL.revokeObjectURL(url);
	} catch (error) {
		console.error("Error downloading the report:", error);
	}
};
