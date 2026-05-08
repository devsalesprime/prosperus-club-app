const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// DOCX files are ZIP archives. Extract word/document.xml
const docxPath = path.join(__dirname, '..', 'PRD_Complementar_Prosperus_v2.1.docx');
const tempDir = path.join(__dirname, 'temp_docx');

// Create temp dir
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Use tar to extract (Windows 10+ has tar built-in that supports zip)
try {
    execSync(`tar -xf "${docxPath}" -C "${tempDir}" word/document.xml`, { stdio: 'pipe' });
    const xmlContent = fs.readFileSync(path.join(tempDir, 'word', 'document.xml'), 'utf8');
    
    // Strip XML tags, clean whitespace
    const text = xmlContent
        .replace(/<w:p[^>]*\/>/g, '\n')
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:tab\/>/g, '\t')
        .replace(/<[^>]+>/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n +/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    
    fs.writeFileSync(path.join(__dirname, 'prd_complementar.txt'), text, 'utf8');
    console.log('OK: ' + text.length + ' chars extracted');
    console.log('First 200 chars: ' + text.substring(0, 200));
} catch (e) {
    console.error('Error:', e.message);
}

// Cleanup
try {
    fs.rmSync(tempDir, { recursive: true });
} catch(e) {}
