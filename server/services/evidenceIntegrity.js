const crypto = require('crypto')
const fs = require('fs/promises')

const fingerprintFiles = async (files = []) => Promise.all(files.map(async (file) => {
  const content = await fs.readFile(file.path)
  return {
    hash: crypto.createHash('sha256').update(content).digest('hex'),
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  }
}))

const buildIntegrityResult = (files, duplicateReports = []) => {
  const fingerprints = files.map(({ hash, originalName, mimeType, size }) => ({
    hash,
    originalName,
    mimeType,
    size
  }))
  const duplicateCount = duplicateReports.length
  return {
    provider: 'server-sha256',
    riskLevel: duplicateCount > 0 ? 'high' : 'low',
    duplicateCount,
    flags: duplicateCount > 0 ? ['Evidence file matches an earlier report'] : [],
    fileHashes: fingerprints.map((file) => file.hash),
    fingerprints,
    checkedAt: new Date()
  }
}

module.exports = { fingerprintFiles, buildIntegrityResult }
