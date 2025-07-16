// controllers/exportController.js
import { exportLeadsByTag } from "../services/exportService.js";
import logger from "../utils/logger.js";

export async function handleExportLeads(req, res) {
  const { tagId } = req.params;

  if (!tagId || isNaN(tagId)) {
    logger.warn("⚠️ ID da tag inválido para exportação:", tagId);
    return res.status(400).json({ error: "Invalid tag ID" });
  }

  try {
    const csv = await exportLeadsByTag(tagId);

    res.setHeader("Content-Disposition", `attachment; filename=leads-${tagId}.csv`);
    res.setHeader("Content-Type", "text/csv");
    logger.info(`📦 Leads exportados com sucesso para tag ID ${tagId}`);
    return res.status(200).send(csv);
  } catch (err) {
    logger.error("❌ Erro ao exportar leads:", err.message);
    return res.status(500).json({ error: "Failed to export leads" });
  }
}
