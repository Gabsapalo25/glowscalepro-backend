// controllers/exportController.js
import { exportContactsByTag } from "../services/exportService.js";

export async function handleExportLeads(req, res) {
  const { tagId } = req.params;

  try {
    const csv = await exportContactsByTag(tagId);

    res.setHeader("Content-Disposition", `attachment; filename=leads-${tagId}.csv`);
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(csv);
  } catch (err) {
    console.error("❌ Erro ao exportar leads:", err.message);
    return res.status(500).json({ error: "Failed to export leads" });
  }
}
